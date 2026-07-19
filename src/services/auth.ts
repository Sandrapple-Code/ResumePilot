// Client Username/Password Authentication Service calling FastAPI backend directly

let authSubscribers: ((user: any | null) => void)[] = [];

export const getStoredUser = () => {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("access_token");
  const userId = localStorage.getItem("user_id");
  const username = localStorage.getItem("username");
  if (!token || !userId || !username) return null;
  return {
    uid: userId,
    email: `${username}@resumepilot.ai`,
    displayName: username,
    getIdToken: async () => token
  };
};

export const notifyAuthSubscribers = () => {
  const current = getStoredUser();
  authSubscribers.forEach(cb => cb(current));
};

export const loginWithEmail = async (username: string, password: string) => {
  const res = await fetch("http://127.0.0.1:8000/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, password })
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Invalid username or password.");
  }
  
  const data = await res.json();
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("user_id", data.user_id);
  localStorage.setItem("username", data.username);
  
  notifyAuthSubscribers();
  return { user: getStoredUser() };
};

export const registerWithEmail = async (username: string, password: string) => {
  const res = await fetch("http://127.0.0.1:8000/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      username,
      password,
      confirm_password: password
    })
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Registration failed.");
  }
  
  // Auto login on successful register
  return loginWithEmail(username, password);
};

export const logout = async () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user_id");
  localStorage.removeItem("username");
  
  // Scoped clean up of localstorage keys
  if (typeof window !== "undefined") {
    // Keep credentials but purge all other items
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key !== "access_token" && key !== "user_id" && key !== "username") {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  }
  
  notifyAuthSubscribers();
};

export const resetPassword = async (username: string) => {
  return Promise.resolve();
};

export const subscribeToAuthChanges = (callback: (user: any | null) => void) => {
  authSubscribers.push(callback);
  const current = getStoredUser();
  setTimeout(() => callback(current), 20);
  return () => {
    authSubscribers = authSubscribers.filter(cb => cb !== callback);
  };
};
