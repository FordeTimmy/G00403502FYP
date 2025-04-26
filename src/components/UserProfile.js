// Updated UserProfile.js with all issues fixed

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserProfile.css';
import { auth } from '../firebaseConfig';
import { getFirestore, doc, getDoc, updateDoc, increment, arrayUnion, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import PlayerStatsChart from './PlayerStatsChart';
import { simulateGames } from '../utils/simulateGames';
import defaultProfilePic from '../assets/defaultProfilePic.jpg';
import { signOut } from 'firebase/auth';
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
    const [isInitializing, setIsInitializing] = useState(true);
    const [initError, setInitError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [redeemError, setRedeemError] = useState('');
    const [redeemSuccess, setRedeemSuccess] = useState('');

    const loadProfilePicture = async () => {
        try {
            if (auth.currentUser) {
                const db = getFirestore();
                const userRef = doc(db, 'users', auth.currentUser.uid); // Changed from email to uid
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
            const userRef = doc(db, 'users', auth.currentUser.uid); // Changed from email to uid
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

    // Update loadPlayerStats to ensure we get valid data
    const loadPlayerStats = async () => {
        try {
            if (auth.currentUser) {
                const db = getFirestore();
                const userRef = doc(db, 'users', auth.currentUser.uid); // Changed from email to uid
                const docSnap = await getDoc(userRef);
                
                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    setStats({
                        handsWon: userData.handsWon || 0,
                        handsLost: userData.handsLost || 0,
                        totalAmountWon: userData.totalAmountWon || 0,
                        totalAmountLost: userData.totalAmountLost || 0,
                        gamesPlayed: userData.gamesPlayed || 0
                    });
                } else {
                    // Initialize with default values if no data exists
                    setStats({
                        handsWon: 0,
                        handsLost: 0,
                        totalAmountWon: 0,
                        totalAmountLost: 0,
                        gamesPlayed: 0
                    });
                }
            }
        } catch (error) {
            console.error('Error loading stats:', error);
            // Set default values on error
            setStats({
                handsWon: 0,
                handsLost: 0,
                totalAmountWon: 0,
                totalAmountLost: 0,
                gamesPlayed: 0
            });
        }
    };

    // Add useEffect to load stats when showStats changes
    useEffect(() => {
        if (showStats) {
            loadPlayerStats();
        }
    }, [showStats]);

    // Add this function to refresh user data
    const refreshUserData = async () => {
        try {
            const db = getFirestore();
            const userRef = doc(db, 'users', auth.currentUser.uid);
            const docSnap = await getDoc(userRef);
            
            if (docSnap.exists()) {
                const userData = docSnap.data();
                setStats({
                    handsWon: userData.handsWon || 0,
                    handsLost: userData.handsLost || 0,
                    totalAmountWon: userData.totalAmountWon || 0,
                    totalAmountLost: userData.totalAmountLost || 0,
                    gamesPlayed: userData.gamesPlayed || 0
                });
            }
        } catch (error) {
            console.error('Error refreshing user data:', error);
        }
    };

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

    const handleRedeemCode = async () => {
        setRedeemError('');
        setRedeemSuccess('');

        if (!redeemCode.trim()) {
            setRedeemError('Please enter a code');
            return;
        }

        try {
            const db = getFirestore();
            const codeQuery = redeemCode.trim().toUpperCase();

            // Search for matching code that is not claimed
            const codesRef = collection(db, 'currency_codes');
            const q = query(
                codesRef,
                where('code', '==', codeQuery),
                where('claimed', '==', false),
                where('email', '==', auth.currentUser.email),
                limit(1)
            );
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setRedeemError('Invalid or already claimed code.');
                return;
            }

            const codeDoc = querySnapshot.docs[0];
            const { currencyAmount } = codeDoc.data();

            // Update user balance and mark code as claimed
            const userRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userRef, {
                currency: increment(currencyAmount),
            });

            await updateDoc(doc(db, 'currency_codes', codeDoc.id), {
                claimed: true,
            });

            setRedeemSuccess(`Successfully redeemed ${currencyAmount} coins!`);
            setRedeemCode('');
            await refreshUserData();

        } catch (error) {
            console.error('Error redeeming code:', error);
            setRedeemError('Failed to redeem code. Please try again.');
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
                                <button onClick={() => setShowProfile(false)}>Close</button>
                            </div>
                        </div>
                    )}

{showStats && (
  <div className="profile-modal">
    <div className="profile-content">
      <h2>Player Statistics</h2>
      {stats ? (
        <PlayerStatsChart stats={stats} />
      ) : (
        <p>Loading statistics...</p>
      )}
      <button onClick={() => setShowStats(false)}>Close</button>
    </div>
  </div>
)}

{showRedeemModal && (
    <div className="profile-modal">
        <div className="profile-content">
            <h2>Redeem Code</h2>
            <div className="redeem-input-group">
                <input
                    type="text"
                    value={redeemCode}
                    onChange={(e) => setRedeemCode(e.target.value)}
                    placeholder="Enter your code"
                    className="redeem-input"
                />
                <button onClick={handleRedeemCode} className="redeem-button">
                    Redeem
                </button>
            </div>
            {redeemError && <div className="error-message">{redeemError}</div>}
            {redeemSuccess && <div className="success-message">{redeemSuccess}</div>}
            <button onClick={() => setShowRedeemModal(false)} className="close-button">Close</button>
        </div>
    </div>
)}


                </>
            )}
        </div>
    );
};

export default UserProfile;
