import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PasswordRecoveryLayout from "./PasswordRecoveryLayout";

const API_URL = "http://localhost:5000";

const ForgotPassword = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        if (!email.trim()) {
            setError("Please enter your email address.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                `${API_URL}/forgot-password`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: email.trim()
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to send OTP."
                );
            }

            navigate("/verify-otp", {
                state: {
                    email: email.trim()
                }
            });

        } catch (error) {
            setError(
                error.message ||
                "Something went wrong. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <PasswordRecoveryLayout
            step={1}
            illustration="lock"
            title="Forgot Password"
            description={
                <>
                    Enter your registered email address
                    <br />
                    to receive a verification code.
                </>
            }
        >
            <form
                className="recovery-form"
                onSubmit={handleSubmit}
            >
                <label className="recovery-label">
                    Email Address
                </label>

                <div className="recovery-input-wrapper">
                    <span className="recovery-input-icon">
                        ✉
                    </span>

                    <input
                        type="email"
                        className="recovery-input"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                    />
                </div>

                {error && (
                    <div className="recovery-error">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    className="recovery-primary-button"
                    disabled={loading}
                >
                    {loading ? "Sending..." : "Send OTP"}
                </button>
            </form>
        </PasswordRecoveryLayout>
    );
};

export default ForgotPassword;