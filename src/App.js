// src/App.js
import React, { useState, useEffect } from 'react';
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
        <div>
            {!user ? (
                <Login />
            ) : (
                <div>
                    <h1>Welcome, {user.email}!</h1>
                    <button onClick={() => auth.signOut()}>Logout</button>
                    <h1>Blackjack Game</h1>
                    <Game />
                </div>
            )}
        </div>
    );
}

export default App;
