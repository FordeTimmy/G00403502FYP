// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDe1srWDIJV926tUgWawcGDhmdJNWbd62Y",
  authDomain: "blackjack-7de19.firebaseapp.com",
  projectId: "blackjack-7de19",
  storageBucket: "blackjack-7de19.firebasestorage.app",
  messagingSenderId: "564129196836",
  appId: "1:564129196836:web:6c507fcc6ef83f086b21b1",
  measurementId: "G-976KW10Z14"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);

export { analytics };