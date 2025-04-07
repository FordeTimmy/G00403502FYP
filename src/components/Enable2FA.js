import React, { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { auth } from '../firebaseConfig';
import "./UserProfile.css";

const Enable2FA = () => {
    const [qrCode, setQrCode] = useState(null);
    const [secret, setSecret] = useState("");
    const [error, setError] = useState("");
    const [isEnabled, setIsEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [setupSuccess, setSetupSuccess] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    const check2FAStatus = async () => {
        try {
            const user = auth.currentUser;
            if (!user) {
                throw new Error("No authenticated user");
            }

            const firebaseToken = await user.getIdToken(true);

            const response = await fetch("http://localhost:5000/api/verify-token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    firebaseToken,
                    email: user.email,
                    uid: user.uid
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to check 2FA status");
            }

            const data = await response.json();
            setIsEnabled(data.requires2FA || false);

            if (data.requires2FA && !qrCode && data.twoFactorSetup) {
                setQrCode(data.twoFactorSetup.qrCode);
                setSecret(data.twoFactorSetup.secret);
            }

            return data;

        } catch (error) {
            console.error("Error checking 2FA status:", error);
            setError(error.message);
            handleError(error);
            return { error: true, message: error.message };
        } finally {
            setLoading(false);
        }
    };

    const handleError = (error) => {
        if (error.message.includes("timeout")) {
            setError("Connection timeout. Please check your network.");
        } else if (error.message.includes("token")) {
            setError("Session expired. Please log in again.");
        } else {
            setError("Failed to check 2FA status. Please try again.");
        }

        if (retryCount < 3) {
            const delay = Math.pow(2, retryCount) * 1000;
            setTimeout(() => {
                setRetryCount(prev => prev + 1);
            }, delay);
        }
    };

    // Handle 2FA setup
    const setup2FA = async () => {
        setLoading(true);
        setError("");
        
        try {
            const user = auth.currentUser;
            if (!user) {
                throw new Error("No authenticated user");
            }

            // Get fresh Firebase token
            const firebaseToken = await user.getIdToken(true);
            console.log('Setup 2FA for email:', user.email); // Debug log
            
            const response = await fetch("http://localhost:5000/api/setup-2fa", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${firebaseToken}`
                },
                body: JSON.stringify({
                    uid: user.uid,
                    email: user.email?.trim().toLowerCase() // Normalize email
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to setup 2FA");
            }

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || "2FA setup failed");
            }

            // Success - update state
            setQrCode(data.qrCode);
            setSecret(data.secret);
            setSetupSuccess(true);
            setIsEnabled(true);
            
            // Store 2FA setup in local storage
            localStorage.setItem(`2fa_setup_${user.uid}`, 'completed');
            
        } catch (error) {
            console.error("2FA setup error:", {
                error: error.message,
                userEmail: auth.currentUser?.email
            });
            setError(error.message);
            
            // If it's a token error, suggest reauthentication
            if (error.message.includes("token") || error.message.includes("auth")) {
                setError("Authentication expired. Please log in again.");
            }
        } finally {
            setLoading(false);
        }
    };

    // Verify 2FA code (optional - if you want to verify immediately)
    const verify2FACode = async (code) => {
        try {
            const user = auth.currentUser;
            if (!user) {
                throw new Error("No authenticated user");
            }

            const response = await fetch("http://localhost:5000/api/verify-2fa", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    uid: user.uid,
                    code: code
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Verification failed");
            }

            return await response.json();
        } catch (error) {
            console.error("2FA verification error:", error);
            throw error;
        }
    };

    useEffect(() => {
        let mounted = true;
        const user = auth.currentUser;

        const checkStatus = async () => {
            if (!user || !mounted) return;
            
            try {
                await check2FAStatus();
            } catch (error) {
                if (mounted) {
                    console.error("2FA status check failed:", error);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        checkStatus();

        return () => {
            mounted = false;
        };
    }, [retryCount]); // Only depends on retryCount

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            // Clear any pending timeouts
        };
    }, []);

    return (
        <div className="profile-section">
            <h3>Two-Factor Authentication</h3>
            <div className="twofa-container">
                {error && (
                    <div className="error-message">
                        {error}
                        {error.includes("expired") && (
                            <button 
                                onClick={() => window.location.reload()}
                                className="retry-button"
                            >
                                Refresh Page
                            </button>
                        )}
                    </div>
                )}
                
                {setupSuccess && (
                    <div className="success-message">
                        <p>2FA has been enabled successfully!</p>
                        <p>You'll need to use it on your next login.</p>
                        <div className="instructions">
                            <p>1. Scan the QR code with your authenticator app</p>
                            <p>2. Save the backup code in a secure place</p>
                        </div>
                    </div>
                )}

                {isEnabled && !qrCode && (
                    <div className="info-message">
                        <p>Two-factor authentication is already enabled for your account.</p>
                        <p>You'll need to use your authenticator app when logging in.</p>
                    </div>
                )}

                <div className="action-buttons">
                    <button 
                        onClick={setup2FA}
                        className="profile-button"
                        disabled={isEnabled || loading}
                    >
                        {loading ? (
                            <span className="button-loading">
                                <span className="spinner"></span>
                                Setting Up...
                            </span>
                        ) : isEnabled ? (
                            "2FA Already Enabled"
                        ) : (
                            "Generate QR Code"
                        )}
                    </button>

                    {!isEnabled && (
                        <button 
                            onClick={check2FAStatus}
                            className="refresh-button"
                            disabled={loading}
                        >
                            Refresh Status
                        </button>
                    )}
                </div>

                {qrCode && (
                    <div className="qr-container">
                        <h4>Scan with Authenticator App</h4>
                        <div className="qr-code">
                            <QRCodeCanvas 
                                value={qrCode} 
                                size={200}
                                level="H" // High error correction
                                includeMargin={true}
                            />
                        </div>
                        
                        <div className="secret-info">
                            <h4>Manual Setup</h4>
                            <p>If you can't scan the QR code, enter this code manually:</p>
                            <div className="secret-code">
                                <code>{secret}</code>
                                <button 
                                    className="copy-button"
                                    onClick={() => {
                                        navigator.clipboard.writeText(secret);
                                        alert("Secret code copied to clipboard");
                                    }}
                                >
                                    Copy
                                </button>
                            </div>
                        </div>

                        <div className="backup-notes">
                            <h4>Important Notes:</h4>
                            <ul>
                                <li>Save this secret code in a secure place</li>
                                <li>Each code is valid for 30 seconds</li>
                                <li>You'll need this for future logins</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Enable2FA;