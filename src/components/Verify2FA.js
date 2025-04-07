import React, { useState } from "react";

const Verify2FA = ({ email, onSuccess }) => {
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const tempToken = localStorage.getItem("tempToken");

    const handleVerify = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/verify-2fa", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    token: code,
                    tempToken //  include this
                })
                
            });

            const data = await response.json();
            
            if (response.ok) {
                localStorage.removeItem("tempToken"); // Clean up temp token
                localStorage.setItem("token", data.token);
                onSuccess();
            } else {
                setError(data.message || "Invalid verification code");
            }
        } catch (err) {
            console.error("2FA verification error:", err);
            setError("Verification failed. Please try again.");
        }
    };

    return (
        <div className="twofa-verify">
            <h3>Enter Your 2FA Code</h3>
            <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="6-digit code from authenticator app"
                className="twofa-input"
                maxLength="6"
            />
            <button onClick={handleVerify} className="profile-button">Verify</button>
            {error && <div className="error-message">{error}</div>}
        </div>
    );
};

export default Verify2FA;