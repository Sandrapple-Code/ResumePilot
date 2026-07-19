"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { getUserSettings, saveUserSettings } from "@/services/firestore";

export const useUser = () => {
  const { user, profile, refreshProfile, updateProfileState } = useAuth();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchUserSettings = async () => {
    if (!user) return;
    try {
      const settingsData = await getUserSettings(user.uid);
      setSettings(settingsData);
    } catch (err) {
      console.error("Failed to load user settings:", err);
    }
  };

  const updateSettings = async (newSettings: any) => {
    if (!user) return;
    try {
      await saveUserSettings(user.uid, newSettings);
      setSettings((prev: any) => ({ ...prev, ...newSettings }));
      const profileUpdate: any = {};
      if (newSettings.preferredProvider) profileUpdate.preferredProvider = newSettings.preferredProvider;
      if (newSettings.preferredModel) profileUpdate.preferredModel = newSettings.preferredModel;
      if (Object.keys(profileUpdate).length > 0) {
        updateProfileState(profileUpdate);
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
      throw err;
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserSettings();
    }
  }, [user]);

  return {
    profile,
    settings,
    loading,
    refresh: refreshProfile,
    updateSettings
  };
};
