import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // User is already signed in, redirect to profile
                navigate('/profile');
            }
        });

        // Cleanup subscription
        return () => unsubscribe();
    }, [navigate]);

    const verifyTokenWithBackend = async (firebaseToken) => {
        try {
            const response = await fetch("http://localhost:5000/api/verify-token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ firebaseToken })
            });

            const data = await response.json();
            console.log("Backend Response:", data);

            if (!response.ok) {
                throw new Error(data.message || "Token verification failed");
            }

            // Store balance in both localStorage and Firestore
            if (data.balance) {
                localStorage.setItem('blackjack_currency', data.balance.toString());
                
                const db = getFirestore();
                const userRef = doc(db, 'users', auth.currentUser.uid);
                await updateDoc(userRef, {
                    currency: data.balance,
                    lastUpdated: new Date().toISOString()
                });
            }

            return data;
        } catch (error) {
            console.error("Token verification error:", error);
            throw error;
        }
    };

    const requestCurrencyCode = async (token) => {
        try {
            const response = await fetch("http://localhost:5000/api/send-currency-code", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await response.json();
            console.log("Currency Code Response:", data);
            
            if (response.ok && data.code) {
                // Store the currency code in localStorage for later use
                localStorage.setItem("currency_code", data.code);
                console.log("Currency code stored:", data.code);
            }
            
            return data;
        } catch (error) {
            console.error("Currency code request failed:", error);
            throw error;
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const firebaseToken = await userCredential.user.getIdToken();
            
            // Verify token and get initial balance
            const verificationResult = await verifyTokenWithBackend(firebaseToken);
            
            if (verificationResult.token) {
                localStorage.setItem("token", verificationResult.token);
                
                // Store initial balance
                if (verificationResult.balance) {
                    const db = getFirestore();
                    const userRef = doc(db, 'users', auth.currentUser.uid);
                    await updateDoc(userRef, {
                        currency: verificationResult.balance,
                        lastUpdated: new Date().toISOString()
                    });
                }

                try {
                    await requestCurrencyCode(verificationResult.token);
                    navigate('/profile');
                } catch (currencyError) {
                    console.error("Currency code error:", currencyError);
                    navigate('/profile');
                }
            } else {
                throw new Error("No token received from backend");
            }
        } catch (error) {
            console.error("Login error:", error);
            setError(error.message || 'Authentication failed. Please try again.');
            localStorage.removeItem("token");
        }
    };

    const handleRegisterClick = () => {
        navigate('/register');
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h1>Casino Login</h1>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="login-button">Login</button>
                </form>
                <div className="additional-options">
                    <button onClick={() => navigate('/')} className="back-button">
                        Back to Home
                    </button>
                    <button onClick={handleRegisterClick} className="register-button">
                        Create Account
                    </button>
                </div>
            </div>
            <div className="decorative-chips">
                <div className="chip red"></div>
                <div className="chip blue"></div>
                <div className="chip black"></div>
            </div>
        </div>
    );
};

export default Login;