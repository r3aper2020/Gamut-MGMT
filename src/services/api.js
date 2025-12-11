import { getAuth } from "firebase/auth";

const API_BASE = "/api";

export const getAuthToken = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
        throw new Error("User not authenticated");
    }
    return user.getIdToken();
};

export const apiCall = async (endpoint, method = "GET", body = null, requireAuth = true) => {
    try {
        let headers = {
            "Content-Type": "application/json",
        };

        if (requireAuth) {
            const token = await getAuthToken();
            headers["Authorization"] = `Bearer ${token}`;
        }

        const config = {
            method,
            headers,
        };

        if (body) {
            config.body = JSON.stringify(body);
        }

        const response = await fetch(`${API_BASE}${endpoint}`, config);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "API call failed");
        }

        return await response.json();
    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
};

export const performAdminAction = async () => {
    return apiCall("/admin-action", "GET");
};

export const checkHealth = async () => {
    const response = await fetch(`${API_BASE}/health`);
    return response.json();
};

export const signup = async (userData) => {
    // userData: { email, password, displayName }
    return apiCall("/signup", "POST", userData, false);
};

export const adminCreateUser = async (userData) => {
    // userData: { email, password, displayName, role }
    return apiCall("/users", "POST", userData);
};

export const createOrganization = async (orgData) => {
    // orgData: { name, timezone, currency }
    return apiCall("/organization", "POST", orgData);
};

export const getOrganization = async () => {
    return apiCall("/organization", "GET");
};

export const updateUserProfile = async (profileData) => {
    // profileData: { jobTitle, phoneNumber }
    return apiCall("/users/profile", "PUT", profileData);
};


// --- Team Management ---

export const getTeams = async () => {
    return apiCall("/teams", "GET");
};

export const createTeam = async (teamData) => {
    // teamData: { name, specialty, description }
    return apiCall("/teams", "POST", teamData);
};

export const updateTeam = async (teamId, teamData) => {
    // teamData: { name, specialty, description }
    return apiCall(`/teams/${teamId}`, "PUT", teamData);
};

export const deleteTeam = async (teamId) => {
    return apiCall(`/teams/${teamId}`, "DELETE");
};

// --- Admin User Management ---

export const adminUpdateUser = async (uid, updates) => {
    // updates: { role, teamId, jobTitle, etc }
    return apiCall(`/admin/users/${uid}`, "PUT", updates);
};

export const adminDeleteUser = async (uid) => {
    return apiCall(`/admin/users/${uid}`, "DELETE");
};
