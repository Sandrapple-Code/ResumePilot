// Client Firestore-replacement Service routing all database queries to the FastAPI backend API

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  targetRole: string;
  bio: string;
  photoURL: string;
  preferredProvider: string;
  preferredModel: string;
  createdAt: string;
  updatedAt: string;
  experienceLevel?: string;
  studyHoursPerWeek?: string;
  targetTimeline?: string;
  education?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  username?: string;
  displayName?: string;
  interests?: string[];
  currentResumeId?: string;
}

export interface ResumeMetadata {
  userId: string;
  resumeId: string;
  filename: string;
  storagePath: string;
  uploadDate: string;
  analysisStatus: string;
  parsedData: any;
  latestATSScore: number | null;
  latestReportId: string | null;
}

const getHeaders = () => {
  if (typeof window === "undefined") return { "Content-Type": "application/json" };
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  };
};

// 1. User Profile Sync
export const syncUserProfile = async (uid: string, profileData: Partial<UserProfile>): Promise<UserProfile> => {
  const res = await fetch("http://127.0.0.1:8000/users/profile", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(profileData)
  });
  if (!res.ok) {
    throw new Error("Failed to sync user profile on server.");
  }
  return res.json();
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const res = await fetch("http://127.0.0.1:8000/users/profile", {
      method: "GET",
      headers: getHeaders()
    });
    if (!res.ok) {
      if (res.status === 404 || res.status === 401) return null;
      throw new Error("Failed to fetch profile");
    }
    return res.json();
  } catch (err) {
    console.warn("Failed to get profile from server", err);
    return null;
  }
};

// 2. Settings Management
export const getUserSettings = async (uid: string) => {
  const res = await fetch("http://127.0.0.1:8000/settings", {
    method: "GET",
    headers: getHeaders()
  });
  if (!res.ok) throw new Error("Failed to fetch settings.");
  return res.json();
};

export const saveUserSettings = async (uid: string, settingsData: any) => {
  const res = await fetch("http://127.0.0.1:8000/settings", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(settingsData)
  });
  if (!res.ok) throw new Error("Failed to save settings.");
};

// 3. Resume History List
export const fetchUserResumes = async (uid: string) => {
  const res = await fetch("http://127.0.0.1:8000/history", {
    method: "GET",
    headers: getHeaders()
  });
  if (!res.ok) return [];
  const list = await res.json();
  // Map backend history schema to frontend expectations
  return list.map((item: any) => ({
    uid: item.uid,
    upload_id: item.upload_id,
    filename: item.filename,
    version: item.version,
    timestamp: item.timestamp,
    ats_score: item.ats_score,
    target_role: item.target_role
  }));
};

export const clearUserResumes = async (uid: string) => {
  const res = await fetch("http://127.0.0.1:8000/history", {
    method: "DELETE",
    headers: getHeaders()
  });
  if (!res.ok) throw new Error("Failed to clear resume history.");
};

// 4. Career Reports Management
export const fetchUserReports = async (uid: string) => {
  const res = await fetch("http://127.0.0.1:8000/reports", {
    method: "GET",
    headers: getHeaders()
  });
  if (!res.ok) return [];
  return res.json();
};

export const fetchCareerReport = async (uploadId: string) => {
  const res = await fetch(`http://127.0.0.1:8000/report/${uploadId}`, {
    method: "GET",
    headers: getHeaders()
  });
  if (!res.ok) return null;
  return res.json();
};

export const deleteUserReport = async (uploadId: string) => {
  const res = await fetch(`http://127.0.0.1:8000/report/${uploadId}`, {
    method: "DELETE",
    headers: getHeaders()
  });
  if (!res.ok) throw new Error("Failed to delete report.");
};

// 5. Chat History Management
export const fetchChatHistory = async (uid: string, conversationId: string) => {
  const res = await fetch(`http://127.0.0.1:8000/chat/${conversationId}`, {
    method: "GET",
    headers: getHeaders()
  });
  if (!res.ok) return [];
  return res.json();
};

// 6. Resume Metadata Handlers
export const saveResumeMetadata = async (metadata: ResumeMetadata): Promise<void> => {
  const res = await fetch("http://127.0.0.1:8000/users/resumes/metadata", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(metadata)
  });
  if (!res.ok) throw new Error("Failed to save resume metadata.");
};

export const updateResumeMetadata = async (resumeId: string, fields: Partial<ResumeMetadata>): Promise<void> => {
  const res = await fetch("http://127.0.0.1:8000/users/resumes/metadata", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ resumeId, ...fields })
  });
  if (!res.ok) throw new Error("Failed to update resume metadata.");
};

export const getLatestResume = async (uid: string): Promise<ResumeMetadata | null> => {
  try {
    const res = await fetch("http://127.0.0.1:8000/users/resumes/latest", {
      method: "GET",
      headers: getHeaders()
    });
    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    return null;
  }
};

export const setCurrentResume = async (uid: string, resumeId: string): Promise<void> => {
  const res = await fetch("http://127.0.0.1:8000/users/resumes/current", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ resumeId })
  });
  if (!res.ok) throw new Error("Failed to set current resume.");
};
