import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserProfile.css';
import { auth } from '../firebaseConfig';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import PlayerStatsChart from './PlayerStatsChart';

const UserProfile = () => {
    const navigate = useNavigate();
    const [showProfile, setShowProfile] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [stats, setStats] = useState(null);

    const handleViewStats = async () => {
        if (auth.currentUser) {
            const db = getFirestore();
            const userRef = doc(db, 'users', auth.currentUser.uid);
            const docSnap = await getDoc(userRef);
            if (docSnap.exists()) {
                setStats(docSnap.data());
            }
        }
        setShowStats(true);
    };

    return (
        <div className="profile-container">
            <h1>Welcome!</h1>
            <div className="profile-actions">
                <button 
                    className="profile-button"
                    onClick={() => setShowProfile(true)}
                >
                    User Profile
                </button>
                <button 
                    className="stats-button"
                    onClick={handleViewStats}
                >
                    Player Statistics
                </button>
                <button 
                    className="game-button"
                    onClick={() => navigate('/game')}
                >
                    Play Blackjack
                </button>
                <button 
                    className="back-button"
                    onClick={() => navigate('/')}
                >
                    Back to Home
                </button>
            </div>

            {/* Stats Modal */}
            {showStats && (
                <div className="profile-modal">
                    <div className="profile-content stats-content">
                        <h2>Player Statistics</h2>
                        {stats ? (
                            <>
                                <div className="stats-grid">
                                    <div className="stat-item">
                                        <span>Games Played:</span>
                                        <span>{stats.gamesPlayed || 0}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span>Hands Won:</span>
                                        <span>{stats.handsWon || 0}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span>Hands Lost:</span>
                                        <span>{stats.handsLost || 0}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span>Total Won:</span>
                                        <span>${stats.totalAmountWon || 0}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span>Total Lost:</span>
                                        <span>${stats.totalAmountLost || 0}</span>
                                    </div>
                                </div>
                                <div className="stats-charts">
                                    <PlayerStatsChart stats={stats} />
                                </div>
                            </>
                        ) : (
                            <p>No statistics available</p>
                        )}
                        <button onClick={() => setShowStats(false)}>Close</button>
                    </div>
                </div>
            )}

            {/* Existing Profile Modal */}
            {showProfile && (
                <div className="profile-modal">
                    <div className="profile-content">
                        <h2>User Profile</h2>
                        <p>Email: {auth.currentUser?.email}</p>
                        {/* We can add more user stats here later */}
                        <button onClick={() => setShowProfile(false)}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfile;
