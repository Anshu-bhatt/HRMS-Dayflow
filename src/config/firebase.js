import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCLmMJ4WFtOMtdFjqYJ6_rjQPlzu6sW-uM",
  authDomain: "dayflow-d735d.firebaseapp.com",
  projectId: "dayflow-d735d",
  storageBucket: "dayflow-d735d.firebasestorage.app",
  messagingSenderId: "919855600162",
  appId: "1:919855600162:web:e30338152d2734c9acf07b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

export default app;
