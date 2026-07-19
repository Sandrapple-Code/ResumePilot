export interface AISettings {
  apiKey: string;
  model: string;
  provider: string;
}

const getStorageKey = (base: string, uid?: string) => {
  return uid ? `${base}_${uid}` : base;
};

/**
 * Loads AI settings from browser localStorage with per-user data isolation.
 */
export const loadAISettings = (uid?: string): AISettings => {
  if (typeof window === "undefined") {
    return { apiKey: "", model: "Llama 3.3 70B", provider: "Groq" };
  }
  return {
    apiKey: localStorage.getItem(getStorageKey("resumepilot_groq_api_key", uid)) || "",
    model: localStorage.getItem(getStorageKey("resumepilot_selected_model", uid)) || "Llama 3.3 70B",
    provider: localStorage.getItem(getStorageKey("resumepilot_selected_provider", uid)) || "Groq",
  };
};

/**
 * Saves or updates partial AI settings in browser localStorage per user.
 */
export const saveAISettings = (settings: Partial<AISettings>, uid?: string): void => {
  if (typeof window === "undefined") return;
  if (settings.apiKey !== undefined) {
    localStorage.setItem(getStorageKey("resumepilot_groq_api_key", uid), settings.apiKey);
  }
  if (settings.model !== undefined) {
    localStorage.setItem(getStorageKey("resumepilot_selected_model", uid), settings.model);
  }
  if (settings.provider !== undefined) {
    localStorage.setItem(getStorageKey("resumepilot_selected_provider", uid), settings.provider);
  }
};

/**
 * Purges the API key from browser storage for a specific user.
 */
export const deleteAPIKey = (uid?: string): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getStorageKey("resumepilot_groq_api_key", uid));
};

/**
 * Resets all AI configuration metrics to factory defaults for a specific user.
 */
export const resetAISettings = (uid?: string): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getStorageKey("resumepilot_groq_api_key", uid));
  localStorage.setItem(getStorageKey("resumepilot_selected_model", uid), "Llama 3.3 70B");
  localStorage.setItem(getStorageKey("resumepilot_selected_provider", uid), "Groq");
};
