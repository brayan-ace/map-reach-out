import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD4TfyWTuRktmCj7xDl3y7PFcY2TEoTOF0",
  authDomain: "leadfinder-b9aed.firebaseapp.com",
  projectId: "leadfinder-b9aed",
  storageBucket: "leadfinder-b9aed.firebasestorage.app",
  messagingSenderId: "865238831948",
  appId: "1:865238831948:web:7a8fd68d372935eea035e9",
  measurementId: "G-230BT46YP0",
};

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (_app) return _app;
  _app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return _app;
}

export function getFirebaseAuth(): Auth {
  if (_auth) return _auth;
  _auth = getAuth(getFirebaseApp());
  return _auth;
}

export function getDb(): Firestore {
  if (_db) return _db;
  _db = getFirestore(getFirebaseApp());
  return _db;
}

export const googleProvider = new GoogleAuthProvider();

export function humanizeAuthError(code: string | undefined, fallback?: string): string {
  switch (code) {
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password. Try again.";
    case "auth/user-not-found":
      return "No account found with this email.";
    case "auth/email-already-in-use":
      return "This email is already registered. Try signing in.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/invalid-email":
      return "That email address looks invalid.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "";
    case "auth/popup-blocked":
      return "Popup was blocked — redirecting you to Google instead…";
    case "auth/unauthorized-domain":
      return "This domain isn't authorized in Firebase. Add it under Authentication → Settings → Authorized domains.";
    case "auth/operation-not-allowed":
      return "This sign-in method isn't enabled in your Firebase project.";
    default:
      return fallback || (code ? `Sign-in failed (${code}).` : "Something went wrong. Please try again.");
  }
}

export function isInIframe(): boolean {
  if (typeof window === "undefined") return false;
  try { return window.self !== window.top; } catch { return true; }
}
