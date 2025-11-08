import { initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
} from "firebase/auth";
import { CACHE_SIZE_UNLIMITED, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey:
    process.env.REACT_APP_FIREBASE_API_KEY ||
    "AIzaSyACvgnR2RJhUwLDzw5gtVLz37j0zie1yRs",
  authDomain:
    process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ||
    "career-connect-lesotho.firebaseapp.com",
  projectId:
    process.env.REACT_APP_FIREBASE_PROJECT_ID || "career-connect-lesotho",
  storageBucket:
    process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ||
    "career-connect-lesotho.appspot.com",
  messagingSenderId:
    process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "486454264099",
  appId:
    process.env.REACT_APP_FIREBASE_APP_ID ||
    "1:486454264099:web:3c1c9e5edf897385aa4c96",
  measurementId:
    process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-HMR3R62Y1Z",
};

// Initialize Firebase with error handling
let app;
let auth;
let db;
let storage;

try {
  console.log("🔥 Initializing Firebase...");
  app = initializeApp(firebaseConfig);

  // Initialize services
  auth = getAuth(app);

  // Initialize Firestore with new persistence API (no deprecation warnings)
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
      cacheSizeBytes: CACHE_SIZE_UNLIMITED
    })
  });

  storage = getStorage(app);

  // Set auth persistence
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      console.log("✅ Auth persistence enabled");
    })
    .catch((error) => {
      console.error("❌ Auth persistence error:", error);
    });

  console.log("✅ Firebase initialized successfully");
} catch (error) {
  console.error("❌ Firebase initialization failed:", error);

  // Create fallback objects to prevent app crashes
  app = {};
  auth = {
    currentUser: null,
    onAuthStateChanged: () => () => { },
    signInWithEmailAndPassword: () =>
      Promise.reject(new Error("Firebase not initialized")),
    signOut: () => Promise.reject(new Error("Firebase not initialized")),
  };
  db = {
    collection: () => ({
      doc: () => ({
        get: () => Promise.reject(new Error("Firebase not initialized")),
        set: () => Promise.reject(new Error("Firebase not initialized")),
        update: () => Promise.reject(new Error("Firebase not initialized")),
        delete: () => Promise.reject(new Error("Firebase not initialized")),
      }),
      where: () => ({}),
      orderBy: () => ({}),
      limit: () => ({}),
    }),
  };
  storage = {};
}

export { auth, db, storage };
export default app;
