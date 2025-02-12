import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserProfile.css';
import { auth } from '../firebaseConfig';

const UserProfile = () => {
    const navigate = useNavigate();
    const [showProfile, setShowProfile] = useState(false);

    const handleViewProfile = () => {
        setShowProfile(true);
    };

    return (
        <div className="profile-container">
            <h1>Welcome!</h1>
            <div className="profile-actions">
                <button 
                    className="profile-button"
                    onClick={handleViewProfile}
                >
                    User Profile
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
