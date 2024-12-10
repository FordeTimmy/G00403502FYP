import React, { useState, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    console.log('Login component rendering');

    useEffect(() => {
        // Check and clear any existing session
        if (auth.currentUser) {
            signOut(auth).then(() => {
                console.log('Existing session cleared');
            }).catch((error) => {
                console.error('Error clearing session:', error);
            });
        }
    }, []);

    const handleSignUp = async (e) => {
        e.preventDefault();
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            navigate('/game');
        } catch (error) {
            setError(error.message);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        console.log('Login attempt with email:', email);
        try {
            console.log('Attempting Firebase authentication...');
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log('Firebase auth successful:', user.uid);

            console.log('Requesting ID token...');
            const idToken = await user.getIdToken();
            console.log('ID token received:', idToken.substring(0, 20) + '...');
            
            console.log('Sending request to backend...');
            const response = await fetch('http://localhost:5000/api/protected', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${idToken}`,
                },
            });

            if (!response.ok) {
                console.error('Backend response not OK:', response.status, response.statusText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Backend authentication successful:', data);
            console.log('Login successful, navigating to game');
            navigate('/game');
        } catch (error) {
            console.error('Login process failed:', error);
            console.error('Error details:', {
                code: error.code,
                message: error.message,
                stack: error.stack
            });
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