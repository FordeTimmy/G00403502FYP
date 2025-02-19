import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
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

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password);
            console.log("Login successful, navigating to profile...");
            navigate('/profile'); // Ensure this line executes
        } catch (error) {
            console.error("Login error:", error);
            setError('Invalid email or password');
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