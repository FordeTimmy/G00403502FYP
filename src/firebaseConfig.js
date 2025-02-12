// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth, setPersistence, browserSessionPersistence, signOut } from "firebase/auth";

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

console.log('Initializing Firebase Auth');
const auth = getAuth(app);

// Sign out any existing user
signOut(auth).then(() => {
    console.log('Signed out any existing user');
}).catch((error) => {
    console.error('Error signing out:', error);
});

// Set persistence to SESSION (clears on tab close)
setPersistence(auth, browserSessionPersistence)
    .then(() => console.log('Auth persistence set to SESSION'))
    .catch((error) => {
        console.error("Auth persistence error:", error);
    });

auth.onAuthStateChanged((user) => {
    console.log("Auth state changed:", user ? "User logged in" : "No user");
});

export { analytics, auth, signOut };