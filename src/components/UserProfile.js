import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserProfile.css';
import { auth } from '../firebaseConfig';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import PlayerStatsChart from './PlayerStatsChart';
import { simulateGames } from '../utils/simulateGames';
import defaultProfilePic from '../assets/defaultProfilePic.jpg';

// Update the localStorage key to be user-specific
const getUserStorageKey = (userId) => `profilePicture_${userId}`;

const UserProfile = () => {
    const navigate = useNavigate();
    const [showProfile, setShowProfile] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [stats, setStats] = useState(null);
    const [isTraining, setIsTraining] = useState(false);
    const [profilePicture, setProfilePicture] = useState(null);

    useEffect(() => {
        const loadProfilePicture = async () => {
            try {
                if (auth.currentUser) {
                    const db = getFirestore();
                    const userRef = doc(db, 'users', auth.currentUser.uid);
                    const docSnap = await getDoc(userRef);
                    
                    if (docSnap.exists() && docSnap.data().profilePicture) {
                        setProfilePicture(docSnap.data().profilePicture);
                        // Store in user-specific localStorage key
                        localStorage.setItem(getUserStorageKey(auth.currentUser.uid), docSnap.data().profilePicture);
                    }
                }
            } catch (error) {
                console.error('Error loading profile picture:', error);
                // Try local storage with user-specific key as fallback
                if (auth.currentUser) {
                    const localPicture = localStorage.getItem(getUserStorageKey(auth.currentUser.uid));
                    if (localPicture) {
                        setProfilePicture(localPicture);
                    }
                }
            }
        };

        loadProfilePicture();
        
        // Cleanup function to reset profile picture when component unmounts
        return () => {
            setProfilePicture(null);
        };
    }, []);

    const handleProfilePictureChange = async (event) => {
        const file = event.target.files[0];
        if (!file || !auth.currentUser) return;

        try {
            // Upload to Firebase Storage
            const storage = getStorage();
            const storageRef = ref(storage, `profilePictures/${auth.currentUser.uid}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            // Update Firestore
            const db = getFirestore();
            const userRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userRef, {
                profilePicture: downloadURL,
                lastUpdated: new Date().toISOString()
            });

            // Update state and user-specific localStorage
            setProfilePicture(downloadURL);
            localStorage.setItem(getUserStorageKey(auth.currentUser.uid), downloadURL);
            
            console.log('Profile picture uploaded successfully');
        } catch (error) {
            console.error('Error uploading profile picture:', error);
        }
    };

    const renderProfileImage = () => (
        <img 
            src={profilePicture || defaultProfilePic} 
            alt="Profile" 
            className="profile-picture"
            onError={(e) => {
                e.target.onerror = null;
                e.target.src = defaultProfilePic;
            }}
        />
    );

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

    const handleTrainAI = async () => {
        setIsTraining(true);
        try {
            const results = await simulateGames(10000);
            console.log(`Training Results - Wins: ${results.winCount}, Losses: ${results.lossCount}`);
        } catch (error) {
            console.error('Training error:', error);
        }
        setIsTraining(false);
    };

    return (
        <div className="profile-container">
            <div className="profile-picture-container">
                {renderProfileImage()}
                <input
                    type="file"
                    id="profilePicUpload"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleProfilePictureChange}
                />
                <button 
                    className="upload-button"
                    onClick={() => document.getElementById('profilePicUpload').click()}
                >
                    Change Picture
                </button>
            </div>
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
