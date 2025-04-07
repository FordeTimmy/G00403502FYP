// Updated UserProfile.js with all issues fixed

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserProfile.css';
import { auth } from '../firebaseConfig';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import PlayerStatsChart from './PlayerStatsChart';
import { simulateGames } from '../utils/simulateGames';
import defaultProfilePic from '../assets/defaultProfilePic.jpg';
import { signOut } from 'firebase/auth';
import Enable2FA from './Enable2FA';
import { onAuthStateChanged } from 'firebase/auth';

const getUserStorageKey = (userId) => `profilePicture_${userId}`;

const UserProfile = () => {
    const navigate = useNavigate();
    const [showProfile, setShowProfile] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [stats, setStats] = useState(null);
    const [isTraining, setIsTraining] = useState(false);
    const [profilePicture, setProfilePicture] = useState(null);
    const [showRedeemModal, setShowRedeemModal] = useState(false);
    const [redeemCode, setRedeemCode] = useState('');
    const [redeemMessage, setRedeemMessage] = useState({ text: '', type: '' });
    const [username, setUsername] = useState('');
    const [tempToken, setTempToken] = useState(null);
    const [isInitializing, setIsInitializing] = useState(true);
    const [initError, setInitError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    const loadProfilePicture = async () => {
        try {
            if (auth.currentUser) {
                const db = getFirestore();
                const userRef = doc(db, 'users', auth.currentUser.email); // <- email used as doc ID
                const docSnap = await getDoc(userRef);

                if (docSnap.exists() && docSnap.data().profilePicture) {
                    setProfilePicture(docSnap.data().profilePicture);
                    localStorage.setItem(getUserStorageKey(auth.currentUser.uid), docSnap.data().profilePicture);
                }
            }
        } catch (error) {
            console.error('Error loading profile picture:', error);
            if (auth.currentUser) {
                const localPicture = localStorage.getItem(getUserStorageKey(auth.currentUser.uid));
                if (localPicture) {
                    setProfilePicture(localPicture);
                }
            }
        }
    };

    const loadUserProfile = async () => {
        if (auth.currentUser) {
            const db = getFirestore();
            const userRef = doc(db, 'users', auth.currentUser.email); // <- email used again
            const docSnap = await getDoc(userRef);
            if (docSnap.exists()) {
                setUsername(docSnap.data().username || auth.currentUser.email.split('@')[0]);
            }
        }
    };

    // Add auth state listener
    useEffect(() => {
        console.log('Auth state effect running');
        let mounted = true;

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            console.log('Auth state changed:', currentUser?.email);
            if (mounted) {
                setUser(currentUser);
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            unsubscribe();
        };
    }, []);

    // Separate profile loading effect
    useEffect(() => {
        console.log('Profile loading effect:', { user, loading });
        let mounted = true;

        const loadProfile = async () => {
            if (!user || !mounted) return;

            try {
                await loadProfilePicture();
                await loadUserProfile();
                setInitError(null);
            } catch (error) {
                console.error('Profile load error:', error);
                if (mounted) {
                    setInitError(error.message);
                }
            } finally {
                if (mounted) {
                    setIsInitializing(false);
                }
            }
        };

        loadProfile();

        return () => {
            mounted = false;
        };
    }, [user]);

    // Early return for initial loading
    if (loading) {
        console.log('Showing initial loading');
        return <div className="loading-message">Loading...</div>;
    }

    // Redirect if no user
    if (!user && !loading) {
        console.log('No user, redirecting to login');
        navigate('/login');
        return null;
    }

    const initializeProfile = async () => {
        try {
            if (!user || !loading) {
                setInitError(null);
                await loadProfilePicture();
                await loadUserProfile();
            }
        } catch (error) {
            console.error('Profile initialization error:', error);
            setInitError(error.message);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            localStorage.removeItem('token');
            localStorage.removeItem('blackjack_currency');
            navigate('/login');
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    return (
        <div className="profile-container">
            {isInitializing ? (
                <div className="loading-message">Loading profile...</div>
            ) : initError ? (
                <div className="error-message">
                    {initError}
                    <button onClick={() => initializeProfile()} className="retry-button">
                        Retry
                    </button>
                </div>
            ) : (
                <>
                    <div className="profile-header">
                        <div className="profile-picture-container">
                            <img src={profilePicture || defaultProfilePic} alt="Profile" className="profile-picture" />
                            <span className="username">{username}</span>
                        </div>
                        <button className="logout-button" onClick={handleLogout}>
                            Logout
                        </button>
                    </div>
                    <h1>Welcome!</h1>
                    <div className="profile-actions">
                        <button className="profile-button" onClick={() => setShowProfile(true)}>User Profile</button>
                        <button className="stats-button" onClick={() => setShowStats(true)}>Player Statistics</button>
                        <button className="game-button" onClick={() => navigate('/game')}>Play Game</button>
                        <button className="redeem-button" onClick={() => setShowRedeemModal(true)}>Redeem Code</button>
                        <button className="back-button" onClick={() => navigate('/')}>Back to Home</button>
                    </div>

                    {showProfile && (
                        <div className="profile-modal">
                            <div className="profile-content">
                                <h2>User Profile</h2>
                                <p>Email: {auth.currentUser?.email}</p>
                                <Enable2FA tempToken={tempToken} />
                                <button onClick={() => setShowProfile(false)}>Close</button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default UserProfile;
