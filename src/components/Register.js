import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import './Login.css';  // Reuse login styles
import { createOrUpdateUser } from '../utils/userProfile';

const Register = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // Initialize user profile
            await createOrUpdateUser(userCredential.user.uid, email, {
                currency: 1000,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            });
            
            await signOut(auth);
            alert('Account created successfully! Please login.');
            navigate('/login');
        } catch (error) {
            console.error("Registration error:", error);
            setError(error.message);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h1>Create Account</h1>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleRegister}>
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
                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="register-button">Create Account</button>
                    <button onClick={() => navigate('/')} className="back-button">Back to Home</button>
                </form>
            </div>
        </div>
    );
};

export default Register;
