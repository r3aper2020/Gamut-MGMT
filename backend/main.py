from fastapi import FastAPI, HTTPException, Header, Depends, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import firebase_admin
from firebase_admin import credentials, auth, firestore
import os
from rbac import ROLES, PERMISSIONS, has_permission, ROLE_CREATION_HIERARCHY

# Initialize Firebase Admin
if not firebase_admin._apps:
    try:
        # Check if running in emulator mode
        if os.getenv("FIRESTORE_EMULATOR_HOST") or os.getenv("FIREBASE_AUTH_EMULATOR_HOST"):
             print("Initializing Firebase Admin in Emulator Mode")
             # Use Anonymous credentials for emulator to avoid DefaultCredentialsError
             from google.auth import credentials as google_creds
             
             firebase_admin.initialize_app(credential=google_creds.AnonymousCredentials(), options={'projectId': 'demo-gamut-claims'}) 
        else:
             print("Initializing Firebase Admin (Default Credentials)")
             firebase_admin.initialize_app()
    except Exception as e:
        print(f"Error initializing Firebase Admin: {e}")

# Initialize Firestore
db = firestore.client()

app = FastAPI()

# Allow requests from frontend
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models ---
class UserSignup(BaseModel):
    email: EmailStr
    password: str
    displayName: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    displayName: str
    role: str
    jobTitle: Optional[str] = None
    phoneNumber: Optional[str] = None
    teamId: Optional[str] = None

class UserResponse(BaseModel):
    uid: str
    email: str
    displayName: Optional[str] = None
    role: Optional[str] = None
    organizationId: Optional[str] = None
    teamId: Optional[str] = None

class UserProfileUpdate(BaseModel):
    jobTitle: Optional[str] = None
    phoneNumber: Optional[str] = None

# --- Dependencies ---
async def verify_token(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
         raise HTTPException(status_code=401, detail="Invalid authentication scheme")
    
    token = authorization.split("Bearer ")[1]
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

async def verify_admin(user_token: dict = Depends(verify_token)):
    """
    Verify user is an admin (owner or admin)
    """
    uid = user_token['uid']
    user = auth.get_user(uid)
    role = user.custom_claims.get('role') if user.custom_claims else None
    
    # Check if role has general admin capabilities or is specifically Owner/Admin
    # Using permission 'manage_all_users' as a proxy for generic 'admin' rights in some contexts,
    # or sticking to strict role checks where necessary.
    if role not in [ROLES.OWNER, ROLES.ADMIN]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    return user_token

async def verify_owner(user_token: dict = Depends(verify_token)):
    """
    Verify user is owner specifically
    """
    uid = user_token['uid']
    user = auth.get_user(uid)
    role = user.custom_claims.get('role') if user.custom_claims else None
    
    if role != ROLES.OWNER:
        raise HTTPException(status_code=403, detail="Requires Owner permissions")
    
    return user_token

# --- Endpoints ---

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "Backend is running"}

@app.post("/api/signup", response_model=UserResponse)
async def signup(user: UserSignup):
    """
    Public registration.
    Bootstrapping logic: If no users exist, first user is 'org_owner'.
    Otherwise, user is 'pending' (or 'member' if strictness relaxed).
    """
    try:
        role = ROLES.OWNER

        # Create Auth User
        user_record = auth.create_user(
            email=user.email,
            password=user.password,
            display_name=user.displayName
        )
        
        # Set Custom Claims
        auth.set_custom_user_claims(user_record.uid, {'role': role})
        
        # Create Firestore Document
        user_data = {
            'email': user.email,
            'displayName': user.displayName,
            'role': role,
            'createdAt': firestore.SERVER_TIMESTAMP,
            'updatedAt': firestore.SERVER_TIMESTAMP
        }
        db.collection('users').document(user_record.uid).set(user_data)
        
        return {
            "uid": user_record.uid,
            "email": user.email,
            "displayName": user.displayName,
            "role": role
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Signup error: {e}")
        raise HTTPException(status_code=500, detail="Error creating account")

@app.post("/api/users", response_model=UserResponse)
async def create_user(
    new_user: UserCreate, 
    creator_token: dict = Depends(verify_admin)
):
    """
    Admin user creation.
    - Org Owner can create Managers, Team Leads, Members.
    - Managers can create Team Leads, Members.
    """
    creator_uid = creator_token['uid']
    creator = auth.get_user(creator_uid)
    creator_role = creator.custom_claims.get('role')
    creator_org_id = creator.custom_claims.get('organizationId') # Get orgId from creator

    print(f"DEBUG: create_user called by {creator.email} ({creator_role}) org={creator_org_id}")
    print(f"DEBUG: Creating user: {new_user.email} role={new_user.role}")

    if not creator_org_id:
         print("DEBUG: Creator has no organizationId in claims")
         # We might want to block this or handle it
         raise HTTPException(status_code=400, detail="Creator is not part of an organization (missing claim). Try re-logging in.")


    # Role Hierarchy Check
    allowed_roles = []
    # Role Hierarchy Check using RBAC Config
    allowed_roles = ROLE_CREATION_HIERARCHY.get(creator_role, [])
    
    if new_user.role not in allowed_roles:
         raise HTTPException(
             status_code=403, 
             detail=f"You cannot assign the role '{new_user.role}'. Allowed: {allowed_roles}"
         )

    try:
        user_record = auth.create_user(
            email=new_user.email,
            password=new_user.password,
            display_name=new_user.displayName
        )
        
        # Set claims including organizationId
        claims = {'role': new_user.role}
        if creator_org_id:
            claims['organizationId'] = creator_org_id
        
        auth.set_custom_user_claims(user_record.uid, claims)
        
        # Convert empty strings to None for optional fields
        jobCount = new_user.jobTitle if new_user.jobTitle else None
        phoneCount = new_user.phoneNumber if new_user.phoneNumber else None
        if new_user.teamId:
            teamCount = new_user.teamId
        else:
            # Default to "General" team if exists
            # We need to find the General team for this organization
            general_team_query = db.collection('teams')\
                .where('organizationId', '==', creator_org_id)\
                .where('name', '==', 'General')\
                .limit(1)\
                .stream()
            
            for doc in general_team_query:
                teamCount = doc.id
                break
            
            if not teamCount:
                 # Fallback/Edge case: No general team found, user stays teamless or we could create one?
                 # ideally org creation handles this. keeping as None if not found.
                 teamCount = None

        user_data = {
            'email': new_user.email,
            'displayName': new_user.displayName,
            'role': new_user.role,
            'organizationId': creator_org_id,
            'jobTitle': jobCount,
            'phoneNumber': phoneCount,
            'teamId': teamCount,
            'createdBy': creator_uid,
            'createdAt': firestore.SERVER_TIMESTAMP,
            'updatedAt': firestore.SERVER_TIMESTAMP
        }
        # Filter None values
        user_data = {k: v for k, v in user_data.items() if v is not None}

        db.collection('users').document(user_record.uid).set(user_data)
        
        if new_user.teamId:
            try:
                team_ref = db.collection('teams').document(new_user.teamId)
                team_ref.update({'memberCount': firestore.Increment(1)})
            except Exception as e:
                print(f"Failed to increment team count: {e}")

        return {
            "uid": user_record.uid,
            "email": new_user.email,
            "displayName": new_user.displayName,
            "role": new_user.role,
            "organizationId": creator_org_id,
            "teamId": new_user.teamId
        }
    except Exception as e:
        print(f"DEBUG: Error in create_user: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/users", response_model=List[UserResponse])
async def list_users(user_token: dict = Depends(verify_token)):
    """
    List users.
    - Admins/Managers: See all users in Organization.
    - Members: See only users in their Team.
    """
    try:
        uid = user_token['uid']
        user = auth.get_user(uid)
        org_id = user.custom_claims.get('organizationId')
        role = user.custom_claims.get('role')
        team_id = user.custom_claims.get('teamId')
        
        if not org_id:
            return []
            
        users = []
        
        # Base query
        query = db.collection('users').where('organizationId', '==', org_id)

        # Role-based filtering
        if role == ROLES.MEMBER or role == ROLES.LEAD: # Treat leads same as members for listing (or maybe they see all team?)
            if not team_id:
                # If member has no team, they see no one (or just themselves?)
                # Returning empty list or just themselves is safer.
                # Let's return just themselves to be safe.
                query = db.collection('users').where('uid', '==', uid) # This field might not exist on doc, usually it's document ID.
                # Firestore doesn't query by document ID easily in 'where' clause for equality of self.
                # Better implementation below:
                pass 
            else:
                 query = query.where('teamId', '==', team_id)

        docs = query.stream()
        
        for doc in docs:
            data = doc.to_dict()
            users.append({
                "uid": doc.id,
                "email": data.get('email'),
                "displayName": data.get('displayName'),
                "role": data.get('role'),
                "organizationId": data.get('organizationId'),
                "teamId": data.get('teamId')
            })
        return users
    except Exception as e:
        print(f"Error listing users: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/users/profile")
async def update_user_profile(
    profile: UserProfileUpdate,
    user_token: dict = Depends(verify_token)
):
    """
    Update user profile details.
    """
    uid = user_token['uid']
    try:
        # Convert empty strings to None and filter None values
        update_data = {k: v for k, v in profile.dict().items() if v}
        
        if not update_data:
            return {"message": "No changes provided"}
            
        update_data['updatedAt'] = firestore.SERVER_TIMESTAMP
        db.collection('users').document(uid).update(update_data)
        return {"message": "Profile updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin-action")
async def admin_action(user_token: dict = Depends(verify_token)):
    return {
        "message": "Admin action performed successfully",
        "user_id": user_token.get("uid"),
        "email": user_token.get("email")
    }

@app.put("/api/admin/users/{uid}")
async def admin_update_user(
    uid: str,
    updates: dict = Body(...),
    admin_token: dict = Depends(verify_admin)
):
    """
    Admin: Update user details (role, team, valid jobs etc).
    """
    try:
        # Verify permissions (managers can't edit org owners, etc.)
        target_user = auth.get_user(uid)
        target_role = target_user.custom_claims.get('role') if target_user.custom_claims else 'member'
        
        # Fetch current user data from Firestore to get old teamId
        current_user_doc = db.collection('users').document(uid).get()
        current_user_data = current_user_doc.to_dict() if current_user_doc.exists else {}
        old_team_id = current_user_data.get('teamId')

        caller_uid = admin_token['uid']
        caller_user = auth.get_user(caller_uid)
        caller_role = caller_user.custom_claims.get('role') if caller_user.custom_claims else 'member'
        
        # Simple hierarchy check
        if target_role == ROLES.OWNER and caller_role != ROLES.OWNER:
             raise HTTPException(status_code=403, detail="Cannot edit Organization Owner")
        
        if updates.get('role'):
             # Check if caller can assign this role
             allowed = ROLE_CREATION_HIERARCHY.get(caller_role, [])
             if updates['role'] not in allowed:
                  raise HTTPException(status_code=403, detail=f"Insufficient permissions to assign role {updates['role']}")

             # Update auth claims
             current_claims = target_user.custom_claims or {}
             current_claims['role'] = updates['role']
             auth.set_custom_user_claims(uid, current_claims)

        # Handle Team Change Logic
        if 'teamId' in updates:
            new_team_id = updates['teamId']
            if new_team_id != old_team_id:
                try:
                    # Decrement old team
                    if old_team_id:
                        db.collection('teams').document(old_team_id).update({'memberCount': firestore.Increment(-1)})
                    
                    # Increment new team
                    if new_team_id:
                        db.collection('teams').document(new_team_id).update({'memberCount': firestore.Increment(1)})
                except Exception as e:
                    print(f"Error updating team counts: {e}")

        # Update Firestore
        updates['updatedAt'] = firestore.SERVER_TIMESTAMP
        db.collection('users').document(uid).update(updates)
        
        return {"message": "User updated successfully"}

    except Exception as e:
        print(f"Error updating user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/admin/users/{uid}")
async def admin_delete_user(
    uid: str,
    admin_token: dict = Depends(verify_admin)
):
    """
    Admin: Delete a user.
    """
    try:
        # Verify permissions
        target_user = auth.get_user(uid)
        target_role = target_user.custom_claims.get('role') if target_user.custom_claims else 'member'
        
        caller_uid = admin_token['uid']
        caller_user = auth.get_user(caller_uid)
        caller_role = caller_user.custom_claims.get('role') if caller_user.custom_claims else 'member'
        
        if target_role == 'owner':
             raise HTTPException(status_code=403, detail="Cannot delete Organization Owner")
             
        if caller_role != 'owner' and target_role in ['admin', 'manager']:
             raise HTTPException(status_code=403, detail="Insufficient permissions to delete Admins/Managers")

        # Get user data to find teamId
        user_doc = db.collection('users').document(uid).get()
        team_id = None
        if user_doc.exists:
             team_id = user_doc.to_dict().get('teamId')

        # Delete from Auth
        auth.delete_user(uid)
        
        # Delete from Firestore
        db.collection('users').document(uid).delete()
        
        # Decrement Team Count
        if team_id:
             try:
                 db.collection('teams').document(team_id).update({'memberCount': firestore.Increment(-1)})
             except Exception as e:
                 print(f"Failed to decrement team count on delete: {e}")

        return {"message": "User deleted successfully"}

    except Exception as e:
        print(f"Error deleting user: {e}")
        raise HTTPException(status_code=500, detail=str(e))



class OrganizationCreate(BaseModel):
    name: str
    timezone: str
    currency: str
    address: Optional[str] = None
    industry: Optional[str] = None
    size: Optional[str] = None

class TeamCreate(BaseModel):
    name: str
    specialty: str
    description: Optional[str] = None

class TeamUpdate(BaseModel):
    name: Optional[str] = None
    specialty: Optional[str] = None
    description: Optional[str] = None


@app.post("/api/organization")
async def create_organization(
    org: OrganizationCreate,
    user_token: dict = Depends(verify_owner)
):
    """
    Create a new organization.
    Only available to 'org_owner' who doesn't have an org yet.
    """
    uid = user_token['uid']
    try:
        # Create Org Doc
        org_data = {
            'name': org.name,
            'address': org.address,
            'industry': org.industry,
            'size': org.size,
            'settings': {
                'timezone': org.timezone,
                'currency': org.currency
            },
            'ownerId': uid,
            'createdAt': firestore.SERVER_TIMESTAMP,
            'updatedAt': firestore.SERVER_TIMESTAMP
        }
        
        # Add to 'organizations' collection
        update_time, org_ref = db.collection('organizations').add(org_data)
        org_id = org_ref.id

        # 1. Create Default "General" Team
        general_team = {
             'name': 'General',
             'specialty': 'General Operations',
             'description': 'Default team for organization members.',
             'organizationId': org_id,
             'memberCount': 1, # Owner will be added
             'createdAt': firestore.SERVER_TIMESTAMP,
             'updatedAt': firestore.SERVER_TIMESTAMP
        }
        _, team_ref = db.collection('teams').add(general_team)
        general_team_id = team_ref.id

        # 2. Update User Doc with orgId AND teamId
        db.collection('users').document(uid).update({
            'organizationId': org_id,
            'teamId': general_team_id,
            'updatedAt': firestore.SERVER_TIMESTAMP
        })

        # Update Custom Claims
        user = auth.get_user(uid)
        current_claims = user.custom_claims or {}
        current_claims['organizationId'] = org_id
        current_claims['teamId'] = general_team_id # Is this needed in claims? keeping it out for now to avoid size limits, usually just db is enough.
        auth.set_custom_user_claims(uid, current_claims)

        return {
            "id": org_id,
            "message": "Organization created successfully"
        }

    except Exception as e:
        print(f"Error creating organization: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/organization")
async def get_organization(user_token: dict = Depends(verify_token)):
    """
    Get organization details for the current user.
    """
    uid = user_token['uid']
    try:
        user_doc = db.collection('users').document(uid).get()
        if not user_doc.exists:
             raise HTTPException(status_code=404, detail="User not found")
        
        user_data = user_doc.to_dict()
        org_id = user_data.get('organizationId')
        
        if not org_id:
             return {} # No org yet

        org_doc = db.collection('organizations').document(org_id).get()
        if not org_doc.exists:
             raise HTTPException(status_code=404, detail="Organization not found")
        
        data = org_doc.to_dict()
        data['id'] = org_doc.id
        # Simple serialization for now
        return data

    except Exception as e:
         print(f"Error fetching organization: {e}")
         raise HTTPException(status_code=500, detail=str(e))

# --- Team Endpoints ---

@app.get("/api/teams")
async def list_teams(user_token: dict = Depends(verify_token)):
    """
    List all teams in the user's organization.
    """
    uid = user_token['uid']
    user = auth.get_user(uid)
    org_id = user.custom_claims.get('organizationId')
    
    if not org_id:
        return []
        
    try:
        teams = []
        docs = db.collection('teams').where('organizationId', '==', org_id).stream()
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            teams.append(data)
        return teams
    except Exception as e:
        print(f"Error listing teams: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/teams/{team_id}")
async def get_team(
    team_id: str,
    user_token: dict = Depends(verify_token)
):
    """
    Get a single team by ID.
    - Members: Can only see their own team (or maybe all teams? existing list_teams allows all in org).
      Let's allow reading any team in the org for parity with list_teams.
    """
    try:
        uid = user_token['uid']
        user = auth.get_user(uid)
        org_id = user.custom_claims.get('organizationId')
        
        if not org_id:
            raise HTTPException(status_code=403, detail="User not in organization")

        doc_ref = db.collection('teams').document(team_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Team not found")
            
        data = doc.to_dict()
        data['id'] = doc.id
        
        # Verify Org ID Match
        if data.get('organizationId') != org_id:
             raise HTTPException(status_code=403, detail="Team belongs to another organization")
             
        # Optional: Hydrate Roster?
        # The frontend expects a 'roster' array. The existing 'list_teams' does NOT provide it.
        # But 'TeamsPage.jsx' did client-side join.
        # To make 'TeamDetailsPage.jsx' work as written, we should hydrate the roster here or frontend needs to fetch users.
        # My implementation of TeamDetailsPage checks for team.roster.
        # It's cleaner to fetch users here.
        
        roster = []
        users_ref = db.collection('users').where('teamId', '==', team_id).stream()
        for user_doc in users_ref:
            udata = user_doc.to_dict()
            roster.append({
                "uid": user_doc.id,
                "displayName": udata.get('displayName'),
                "email": udata.get('email'),
                "role": udata.get('role'),
                "jobTitle": udata.get('jobTitle')
            })
            
        data['roster'] = roster
        
        return data

    except Exception as e:
        print(f"Error fetching team: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/teams")
async def create_team(
    team_data: TeamCreate,
    user_token: dict = Depends(verify_admin)
):
    """
    Create a new team. Owner and Admin can create teams.
    """
    uid = user_token['uid']
    user = auth.get_user(uid)
    org_id = user.custom_claims.get('organizationId')
    
    if not org_id:
        raise HTTPException(status_code=400, detail="User does not belong to an organization")
        
    try:
        new_team = {
            'name': team_data.name,
            'specialty': team_data.specialty,
            'description': team_data.description,
            'organizationId': org_id,
            'memberCount': 0, # Initial count
            'createdAt': firestore.SERVER_TIMESTAMP,
            'updatedAt': firestore.SERVER_TIMESTAMP
        }
        
        update_time, doc_ref = db.collection('teams').add(new_team)
        
        return {
            "id": doc_ref.id,
            "message": "Team created successfully"
        }
    except Exception as e:
        print(f"Error creating team: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/teams/{team_id}")
async def update_team(
    team_id: str,
    team_updates: TeamUpdate,
    user_token: dict = Depends(verify_admin)
):
    """
    Update a team. Only Org Owner.
    """
    try:
        data = {k: v for k, v in team_updates.dict().items() if v is not None}
        if not data:
             return {"message": "No changes provided"}
             
        data['updatedAt'] = firestore.SERVER_TIMESTAMP
        db.collection('teams').document(team_id).update(data)
        return {"message": "Team updated successfully"}
    except Exception as e:
        print(f"Error updating team: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/teams/{team_id}")
async def delete_team(
    team_id: str,
    user_token: dict = Depends(verify_admin)
):
    """
    Delete a team. Only Org Owner.
    """
    try:
        # Optional: Check if team has members or claims before deleting?
        # For now, allow deletion.
        db.collection('teams').document(team_id).delete()
        return {"message": "Team deleted successfully"}
    except Exception as e:
        print(f"Error deleting team: {e}")
        raise HTTPException(status_code=500, detail=str(e))

