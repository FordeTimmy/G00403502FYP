import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import './Home.css';

const Home = () => {
    const navigate = useNavigate();
    const { volume, updateVolume, isDarkMode, toggleDarkMode } = useSettings();
    const [showSettings, setShowSettings] = useState(false);

    return (
        <div className={`home-container ${isDarkMode ? 'dark-mode' : ''}`}>
            <h1>Casino Blackjack</h1>
            <div className="button-container">
                <button onClick={() => navigate('/game')} className="start-button">
                    Start Game
                </button>
                <button onClick={() => navigate('/login')} className="login-button">
                    Login
                </button>
                <button onClick={() => setShowSettings(true)} className="settings-button">
                    Settings
                </button>
            </div>

            {showSettings && (
                <div className="settings-modal">
                    <div className="settings-content">
                        <h2>Settings</h2>
                        <div className="setting-item">
                            <label>Volume</label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={volume}
                                onChange={(e) => updateVolume(Number(e.target.value))}
                            />
                            <span>{volume}%</span>
                        </div>
                        <div className="setting-item">
                            <label>Dark Mode</label>
                            <input
                                type="checkbox"
                                checked={isDarkMode}
                                onChange={toggleDarkMode}
                            />
                        </div>
                        <button onClick={() => setShowSettings(false)} className="close-button">
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
