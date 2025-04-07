import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import Verify2FA from './Verify2FA';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [twoFARequired, setTwoFARequired] = useState(false);
    const [twoFACode, setTwoFACode] = useState('');
    const [tempToken, setTempToken] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        let mounted = true;

        const checkAuth = () => {
            return onAuthStateChanged(auth, (user) => {
                if (!mounted) return;

                if (user && !loading) {
                    navigate('/profile');
                }
                setLoading(false);
            });
        };

        const unsubscribe = checkAuth();
        return () => {
            mounted = false;
            unsubscribe();
        };
    }, [loading, navigate]);

    const verifyTokenWithBackend = async (firebaseToken, email) => {
        try {
            const response = await fetch("http://localhost:5000/api/verify-token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ firebaseToken, email })
            });

            // Handle non-JSON responses
            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch {
                throw new Error(text || "Invalid server response");
            }

            if (!response.ok) {
                throw new Error(data.message || "Verification failed");
            }

            return data;
        } catch (error) {
            console.error("Token verification failed:", error);
            throw error;
        }
    };

    const verify2FA = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/verify-2fa", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${tempToken}`
                },
                body: JSON.stringify({ code: twoFACode })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("token", data.token);
                navigate('/profile');
            } else {
                setError('Invalid 2FA code');
            }
        } catch (error) {
            console.error("2FA verification error:", error);
            setError('Failed to verify 2FA code');
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const firebaseToken = await userCredential.user.getIdToken(true);

            const response = await fetch("http://localhost:5000/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ firebaseToken })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Login failed");
            }

            if (data.requires2FA) {
                setTwoFARequired(true);
                setTempToken(data.tempToken);
                localStorage.setItem("tempToken", data.tempToken);
                return;
            }

            // No 2FA required - store regular token
            localStorage.setItem("token", data.token);
            navigate('/profile');
        } catch (error) {
            console.error("Login error:", error);
            setError(error.message);
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

                // ...existing imports and code...

                {twoFARequired ? (
                    <Verify2FA
                        token={tempToken}
                        email={email}
                        onSuccess={() => navigate('/profile')}
                    />
                ) : (
                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" className="login-button">Login</button>
                    </form>
                )}

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