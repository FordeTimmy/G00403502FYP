import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { SettingsProvider } from './context/SettingsContext';
import Game from './components/Game';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import UserProfile from './components/UserProfile';

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleLogout = () => {
        // Clear user-specific data from localStorage
        if (auth.currentUser) {
            localStorage.removeItem(`profilePicture_${auth.currentUser.uid}`);
        }
        // Proceed with normal logout
        signOut(auth);
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <SettingsProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/game" element={<Game />} />
                    <Route 
                        path="/login" 
                        element={user ? <Navigate to="/profile" /> : <Login />} 
                    />
                    <Route 
                        path="/register" 
                        element={user ? <Navigate to="/profile" /> : <Register />} 
                    />
                    <Route 
                        path="/profile" 
                        element={user ? <UserProfile /> : <Navigate to="/login" />} 
                    />
                </Routes>
            </Router>
        </SettingsProvider>
    );
}

export default App;
