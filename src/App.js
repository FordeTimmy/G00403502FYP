import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Login from './components/Login';
import Game from './components/Game';

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log('App mounting, setting up auth listener');
        // Clear any existing auth state on mount
        signOut(auth).then(() => {
            console.log('Initial sign out successful');
        }).catch((error) => {
            console.error('Initial sign out error:', error);
        });

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            console.log('Auth state changed:', currentUser ? 'User logged in' : 'No user');
            setUser(currentUser);
            setLoading(false);
        });
        return () => {
            console.log('Cleaning up auth listener');
            unsubscribe();
        };
    }, []);

    if (loading) {
        console.log('App is loading...');
        return <div>Loading auth state...</div>;
    }

    console.log('Rendering routes. User state:', user ? 'Logged in' : 'Not logged in');
    
    return (
        <Routes>
            <Route path="/" element={
                console.log('Rendering root route') ||
                (!user ? <Login /> : <Navigate to="/game" replace />)
            } />
            <Route path="/game" element={
                console.log('Rendering game route') ||
                (user ? <Game /> : <Navigate to="/" replace />)
            } />
            <Route path="*" element={
                console.log('Rendering fallback route') ||
                <Navigate to="/" replace />
            } />
        </Routes>
    );
}

export default App;
