import React, { useState } from 'react';
import { auth } from '../firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

function Login() {
    const [email, setEmail] = useState(''); // Holds the email entered by the user.
    const [password, setPassword] = useState(''); // Holds the password entered by the user.
    const [error, setError] = useState('');

     // Initialize Firestore to interact with the database.
    const db = getFirestore();

    // initialize a user profile in Firestore
    const initializeUserProfile = async (userId) => {
        try {
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                await setDoc(userRef, {
                    biggestLoss: 0,
                    biggestWin: 0,
                    handsWon: 0,
                    handsLost: 0,
                    totalAmountWon: 0,
                    totalAmountLost: 0,
                    gamesPlayed: 0,
                    averageBetSize: 0,
                    lastPlayed: null,
                    dateJoined: new Date().toISOString()
                });
                console.log("User profile initialized successfully");
            }
        } catch (error) {
            console.error("Error initializing user profile:", error);
            setError("Failed to initialize user profile");
        }
    };

    // handles user sign-up
    const handleSignUp = async (e) => {
        e.preventDefault();
        try {
            // Create a new user with the email and password using Firebase Authentication.
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
             // Initialize the user's profile in Firestore
            await initializeUserProfile(userCredential.user.uid);
            setError('');
        } catch (error) {
            setError(error.message);
        }
    };

    //handle user login
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            // Log in the user with their email and password using Firebase Authentication
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            // Initialize the user's profile in Firestore
            await initializeUserProfile(userCredential.user.uid);
            setError('');
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <div className="login-container">
            <h2>Login / Sign Up</h2>
            {error && <p className="error">{error}</p>}
            <form>
                <div>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div>
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <button onClick={handleLogin}>Login</button>
                <button onClick={handleSignUp}>Sign Up</button>
            </form>
        </div>
    );
}

export default Login;