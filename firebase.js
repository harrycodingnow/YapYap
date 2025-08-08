// firebase.js
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAjRn7rvM1_rAFgC409JUvZAr554Q2jNq0",
  authDomain: "yapyap-a750c.firebaseapp.com",
  projectId: "yapyap-a750c",
  storageBucket: "yapyap-a750c.firebasestorage.app",
  messagingSenderId: "175735257281",
  appId: "1:175735257281:web:146fd9386f60ba7dbc3c40",
  measurementId: "G-K39MVE2ZHZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Use persistence for React Native via AsyncStorage
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const db = getFirestore(app);

export { app, auth, db, signInAnonymously, onAuthStateChanged };
