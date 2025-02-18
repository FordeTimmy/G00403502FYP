import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import './Login.css';  // Reuse login styles

const Register = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const db = getFirestore();
            
            // Initialize user data in Firestore
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                email: email,
                currency: 1000,
                handsWon: 0,
                handsLost: 0,
                gamesPlayed: 0,
                createdAt: new Date().toISOString()
            });

            navigate('/game');
        } catch (error) {
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
                    <button type="submit" className="register-button">Create Account</button>
                    <button onClick={() => navigate('/')} className="back-button">Back to Home</button>
                </form>
            </div>
        </div>
    );
};

export default Register;
