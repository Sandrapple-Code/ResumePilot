"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  loginWithEmail, 
  registerWithEmail, 
  logout, 
  resetPassword, 
  subscribeToAuthChanges 
} from "@/services/auth";
import { syncUserProfile, getUserProfile, UserProfile } from "@/services/firestore";

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  getIdToken: () => Promise<string>;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  loginWithEmail: typeof loginWithEmail;
  registerWithEmail: typeof registerWithEmail;
  logout: typeof logout;
  resetPassword: typeof resetPassword;
  getIdToken: () => Promise<string | null>;
  refreshProfile: () => Promise<void>;
  updateProfileState: (updated: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const getIdToken = async (): Promise<string | null> => {
    if (!user) return null;
    try {
      return await user.getIdToken();
    } catch (e) {
      console.error("Failed to get ID token", e);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    try {
      const data = await getUserProfile(user.uid);
      setProfile(data);
    } catch (err) {
      console.error("Failed to refresh user profile:", err);
    }
  };

  const updateProfileState = (updated: Partial<UserProfile>) => {
    setProfile(prev => {
      if (!prev) return null;
      return {
        ...prev,
        ...updated
      };
    });
  };

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // Retrieve existing user profile directly, do not auto-create
          const prof = await getUserProfile(currentUser.uid);
          setProfile(prof);
        } catch (err) {
          console.error("Failed to fetch user profile in Firestore:", err);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      loginWithEmail,
      registerWithEmail,
      logout,
      resetPassword,
      getIdToken,
      refreshProfile,
      updateProfileState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
