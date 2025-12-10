from fastapi import FastAPI, HTTPException, Header, Depends, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import firebase_admin
from firebase_admin import credentials, auth, firestore
import os

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
    Verify user is an admin (org_owner or manager_admin)
    """
    uid = user_token['uid']
    user = auth.get_user(uid)
    role = user.custom_claims.get('role') if user.custom_claims else None
    
    if role not in ['org_owner', 'manager_admin']:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    return user_token

async def verify_org_owner(user_token: dict = Depends(verify_token)):
    """
    Verify user is org_owner specifically
    """
    uid = user_token['uid']
    user = auth.get_user(uid)
    role = user.custom_claims.get('role') if user.custom_claims else None
    
    if role != 'org_owner':
        raise HTTPException(status_code=403, detail="Requires Org Owner permissions")
    
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
        role = 'org_owner'

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

    # Role Hierarchy Check
    allowed_roles = []
    if creator_role == 'org_owner':
        allowed_roles = ['manager_admin', 'manager', 'team_lead', 'member', 'team_member'] # Expanded roles
    elif creator_role == 'manager_admin':
        allowed_roles = ['team_lead', 'member', 'team_member']
    
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
        teamCount = new_user.teamId if new_user.teamId else None

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
        
        return {
            "uid": user_record.uid,
            "email": new_user.email,
            "displayName": new_user.displayName,
            "role": new_user.role,
            "organizationId": creator_org_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/users", response_model=List[UserResponse])
async def list_users(user_token: dict = Depends(verify_admin)):
    """
    List all users.
    """
    try:
        users = []
        docs = db.collection('users').stream()
        for doc in docs:
            data = doc.to_dict()
            users.append({
                "uid": doc.id,
                "email": data.get('email'),
                "displayName": data.get('displayName'),
                "role": data.get('role')
            })
        return users
    except Exception as e:
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

class OrganizationCreate(BaseModel):
    name: str
    timezone: str
    currency: str
    address: Optional[str] = None
    industry: Optional[str] = None
    size: Optional[str] = None

@app.post("/api/organization")
async def create_organization(
    org: OrganizationCreate,
    user_token: dict = Depends(verify_org_owner)
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

        # Update User Doc with orgId
        db.collection('users').document(uid).update({
            'organizationId': org_id,
            'updatedAt': firestore.SERVER_TIMESTAMP
        })

        # Update Custom Claims
        user = auth.get_user(uid)
        current_claims = user.custom_claims or {}
        current_claims['organizationId'] = org_id
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
