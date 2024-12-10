import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './firebaseConfig';
import Login from './components/Login';
import Game from './components/Game';

function App() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            setUser(user);
        });
        return () => unsubscribe();
    }, []);

    return (
        <Router>
            <div>
                <Routes>
                    <Route path="/login" element={!user ? <Login /> : <Navigate to="/game" />} />
                    <Route path="/game" element={user ? <Game /> : <Navigate to="/login" />} />
                    <Route path="/" element={<Navigate to={user ? "/game" : "/login"} />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
