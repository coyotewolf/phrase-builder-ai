import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getAuth, setPersistence, browserLocalPersistence, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCRV61hZubg7B8JHqxbiVUJHImtL-cf-aE",
  authDomain: "vocabulary-flow.firebaseapp.com",
  projectId: "vocabulary-flow",
  storageBucket: "vocabulary-flow.firebasestorage.app",
  messagingSenderId: "112823250813",
  appId: "1:112823250813:web:974ca7e9b012f4f15ce614",
  measurementId: "G-F021Q21DDL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Set authentication persistence
setPersistence(auth, browserLocalPersistence);

// Connect to emulators in development
if (import.meta.env.DEV) {
  connectAuthEmulator(auth, "http://localhost:9099");
  connectFirestoreEmulator(db, "localhost", 8081);
  connectStorageEmulator(storage, "localhost", 9199);
}

console.log("Firebase App initialized:", app); // Keep the log for now
export { app, analytics, auth, db, storage };