import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
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

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/profile');
        } catch (error) {
            console.error("Login error:", error);
            setError("Invalid email or password");
        }
    };

    const handleRegisterClick = () => {
        navigate('/register');
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h1>Casino Login</h1>
                {error && (
                    <div data-testid="error-msg" role="alert" className="error-message">
                        {error}
                    </div>
                )}

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