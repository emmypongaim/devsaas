import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBxnzcAnH9EmUiauJFJ-1r3TpPpIvHnWWs",
  authDomain: "saas-9a800.firebaseapp.com",
  projectId: "saas-9a800",
  storageBucket: "saas-9a800.appspot.com",
  messagingSenderId: "452387599645",
  appId: "1:452387599645:web:823298c7346de47cd11df4",
  measurementId: "G-K0D5TEH9TC"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

console.log('Firebase initialized');