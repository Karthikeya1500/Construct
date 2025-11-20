
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { User, UserRole } from '../types';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Check if config is present
export let isConfigured = !!(process.env.FIREBASE_API_KEY && process.env.FIREBASE_PROJECT_ID);

let app;
let auth: any;
let db: any;
let storage: any;

if (isConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (error) {
    console.error("Firebase initialization error:", error);
    isConfigured = false;
  }
}

export { auth, db, storage };

export const signInWithGoogle = async (): Promise<{ user: Partial<User>, isNewUser: boolean }> => {
  if (!auth) throw new Error("Firebase not configured");
  
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Check if user exists in Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      return { 
        user: userDoc.data() as User,
        isNewUser: false 
      };
    } else {
      // Return basic info for new user signup flow
      return {
        user: {
          id: user.uid,
          name: user.displayName || '',
          email: user.email || '',
          photoURL: user.photoURL || '',
        },
        isNewUser: true
      };
    }
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const logoutUser = async () => {
  if (!auth) return;
  await firebaseSignOut(auth);
};
