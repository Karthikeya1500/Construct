
import { User } from '../types';
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getStorage } from "firebase/storage";

// --- CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyB73I1tSRH46CPY6iaMs9K9aXk81sutW6Q",
  authDomain: "worklink-478409.firebaseapp.com",
  projectId: "worklink-478409",
  storageBucket: "worklink-478409.appspot.com",
  messagingSenderId: "603970167632",
  appId: "1:603970167632:web:14784d6562594ddbb60255"
};

export const isConfigured = !!firebaseConfig.apiKey;

// --- INITIALIZATION ---
export let auth: any;
export let storage: any;
let googleProvider: any;

try {
  if (isConfigured) {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    auth.useDeviceLanguage(); // Use device language for popup
    storage = getStorage(app);

    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({
      prompt: 'select_account' // Forces account selection screen
    });

    console.log("Firebase Initialized. Auth Domain:", firebaseConfig.authDomain);
    console.log("Current Hostname:", window.location.hostname);
  }
} catch (e) {
  console.error("Firebase Initialization Failed:", e);
}

export const signInWithGoogle = async (): Promise<{ user: Partial<User>, isNewUser: boolean }> => {
  if (!auth) {
    throw new Error("auth/configuration-not-found");
  }

  try {
    console.log("Attempting Google Sign-In...");
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Google Sign-In Successful. User:", result.user.email);
    
    const fbUser = result.user;
    const isNew = fbUser.metadata.creationTime === fbUser.metadata.lastSignInTime;

    return {
      user: {
        id: fbUser.uid,
        name: fbUser.displayName || 'Google User',
        email: fbUser.email || '',
        phone: fbUser.phoneNumber || '',
        photoURL: fbUser.photoURL || '',
      },
      isNewUser: isNew
    };
  } catch (error: any) {
    console.error("Google Sign In Error Object:", error);
    
    if (error.code === 'auth/unauthorized-domain') {
        console.error(`🚨 DOMAIN ERROR: You must add "${window.location.hostname}" to the Authorized Domains list in Firebase Console -> Authentication -> Settings.`);
    }
    
    throw error;
  }
};
