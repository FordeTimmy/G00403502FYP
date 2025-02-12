import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SettingsProvider } from './context/SettingsContext';
import Game from './components/Game';
import Home from './components/Home';
import Login from './components/Login';
import UserProfile from './components/UserProfile';

function App() {
    return (
        <SettingsProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/game" element={<Game />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/profile" element={<UserProfile />} />
                </Routes>
            </Router>
        </SettingsProvider>
    );
}

export default App;
