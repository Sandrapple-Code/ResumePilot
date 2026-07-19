import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "";
export const isMockFirebase = !apiKey || apiKey === "mock-api-key" || apiKey.includes("placeholder") || apiKey.startsWith("mock");

const firebaseConfig = {
  apiKey: apiKey || "mock-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mock-project.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mock-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "mock-project.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "12345678",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:12345678:web:123456"
};

// Initialize App conditionally
let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;

if (!isMockFirebase) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (err) {
    console.warn("Failed to initialize Firebase SDK:", err);
  }
}

export { app, auth, db, storage };
