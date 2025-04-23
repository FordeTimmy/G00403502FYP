import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import './Home.css';

const Home = () => {
    const navigate = useNavigate();
    const { volume, updateVolume, isDarkMode, toggleDarkMode } = useSettings();
    const [showSettings, setShowSettings] = useState(false);
    const [showRules, setShowRules] = useState(false);

    return (
        <div className={`home-container ${isDarkMode ? 'dark-mode' : ''}`}>
            <h1>Ace Up</h1>
            <div className="button-container">
                <button onClick={() => navigate('/game')} className="start-button">
                    Quick Play
                </button>
                <button onClick={() => navigate('/login')} className="login-button">
                    Login
                </button>
                <button onClick={() => setShowSettings(true)} className="settings-button">
                    Settings
                </button>
                <button onClick={() => setShowRules(true)} className="rules-button">
                    How to Play
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

            {showRules && (
                <div className="rules-modal">
                    <div className="rules-content">
                        <h2>How to Play Blackjack</h2>
                        
                        <div className="rules-section">
                            <h3>Objective</h3>
                            <p>Beat the dealer by getting a hand value closer to 21 than the dealer without going over 21.</p>
                        </div>

                        <div className="rules-section">
                            <h3>Card Values</h3>
                            <ul>
                                <li>2-10: Face value</li>
                                <li>Jack, Queen, King: 10</li>
                                <li>Ace: 1 or 11 (whichever benefits you)</li>
                            </ul>
                        </div>

                        <div className="rules-section">
                            <h3>Game Actions</h3>
                            <ul>
                                <li><strong>Hit:</strong> Take another card</li>
                                <li><strong>Stand:</strong> Keep current hand</li>
                                <li><strong>Double Down:</strong> Double your bet and take one more card</li>
                                <li><strong>Split:</strong> Split matching cards into two hands</li>
                            </ul>
                        </div>

                        <div className="rules-section">
                            <h3>Dealer Rules</h3>
                            <p>The dealer must hit on 16 and stand on 17.</p>
                        </div>

                        <div className="rules-section">
                            <h3>Winning</h3>
                            <ul>
                                <li>Get closer to 21 than the dealer</li>
                                <li>Dealer busts (goes over 21)</li>
                                <li>Get Blackjack (Ace + 10-value card)</li>
                            </ul>
                        </div>

                        <button onClick={() => setShowRules(false)} className="close-button">
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
