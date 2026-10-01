import React, { useEffect, useState } from "react";

import {
    useLocation,
    useNavigate
} from "react-router-dom";

import PasswordRecoveryLayout from "./PasswordRecoveryLayout";

const API_URL = "https://hrms-qxao.onrender.com";

const ResetPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const email = location.state?.email;
    const otp = location.state?.otp;

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [showPassword, setShowPassword] =
        useState(false);

    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!email || !otp) {
            navigate("/forgot-password");
        }
    }, [email, otp, navigate]);

    const passwordRules = {
        length: password.length >= 8,
        number: /\d/.test(password),
        uppercase: /[A-Z]/.test(password),
        special: /[^A-Za-z0-9]/.test(password),
        lowercase: /[a-z]/.test(password)
    };

    const validRules = Object.values(
        passwordRules
    ).filter(Boolean).length;

    const getStrengthText = () => {
        if (!password) {
            return "";
        }

        if (validRules <= 2) {
            return "Weak";
        }

        if (validRules <= 4) {
            return "Medium";
        }

        return "Strong";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        if (!password) {
            setError("Please enter a new password.");
            return;
        }

        if (password.length < 8) {
            setError(
                "Password must be at least 8 characters."
            );
            return;
        }

        if (
            !passwordRules.number ||
            !passwordRules.uppercase ||
            !passwordRules.lowercase ||
            !passwordRules.special
        ) {
            setError(
                "Please meet all password requirements."
            );
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                `${API_URL}/reset-password`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email,
                        otp,
                        newPassword: password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to reset password."
                );
            }

            navigate("/password-changed");

        } catch (error) {
            setError(
                error.message ||
                "Unable to reset password."
            );
        } finally {
            setLoading(false);
        }
    };

    if (!email || !otp) {
        return null;
    }

    return (
        <PasswordRecoveryLayout
            step={3}
            illustration="password"
            title="Create New Password"
            description={
                <>
                    Create a strong password
                    <br />
                    for your account.
                </>
            }
        >
            <form
                className="recovery-form"
                onSubmit={handleSubmit}
            >

                <label className="recovery-label">
                    New Password
                </label>

                <div className="recovery-input-wrapper password-input-wrapper">

                    <span className="recovery-input-icon">
                        🔒
                    </span>

                    <input
                        type={
                            showPassword
                                ? "text"
                                : "password"
                        }
                        className="recovery-input password-input"
                        placeholder="Enter new password"
                        value={password}
                        onChange={(e) =>
                            setPassword(
                                e.target.value
                            )
                        }
                    />

                    <button
                        type="button"
                        className="password-toggle"
                        onClick={() =>
                            setShowPassword(
                                !showPassword
                            )
                        }
                    >
                        {showPassword
                            ? "◉"
                            : "◌"}
                    </button>

                </div>

                {password && (
                    <div className="password-strength">

                        <div className="strength-bars">
                            {[1, 2, 3, 4].map(
                                (bar) => (
                                    <div
                                        key={bar}
                                        className={`strength-bar ${
                                            validRules >= bar
                                                ? "active"
                                                : ""
                                        }`}
                                    />
                                )
                            )}
                        </div>

                        <div className="strength-text">
                            {getStrengthText()}
                        </div>

                    </div>
                )}

                <label className="recovery-label">
                    Confirm Password
                </label>

                <div className="recovery-input-wrapper password-input-wrapper">

                    <span className="recovery-input-icon">
                        🔒
                    </span>

                    <input
                        type={
                            showConfirmPassword
                                ? "text"
                                : "password"
                        }
                        className="recovery-input password-input"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) =>
                            setConfirmPassword(
                                e.target.value
                            )
                        }
                    />

                    <button
                        type="button"
                        className="password-toggle"
                        onClick={() =>
                            setShowConfirmPassword(
                                !showConfirmPassword
                            )
                        }
                    >
                        {showConfirmPassword
                            ? "◉"
                            : "◌"}
                    </button>

                </div>

                <div className="password-rules">

                    <div
                        className={`password-rule ${
                            passwordRules.length
                                ? "valid"
                                : "invalid"
                        }`}
                    >
                        At least 8 characters
                    </div>

                    <div
                        className={`password-rule ${
                            passwordRules.number
                                ? "valid"
                                : "invalid"
                        }`}
                    >
                        One number
                    </div>

                    <div
                        className={`password-rule ${
                            passwordRules.uppercase
                                ? "valid"
                                : "invalid"
                        }`}
                    >
                        One uppercase letter
                    </div>

                    <div
                        className={`password-rule ${
                            passwordRules.special
                                ? "valid"
                                : "invalid"
                        }`}
                    >
                        One special character
                    </div>

                    <div
                        className={`password-rule ${
                            passwordRules.lowercase
                                ? "valid"
                                : "invalid"
                        }`}
                    >
                        One lowercase letter
                    </div>

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
                    {loading
                        ? "Resetting..."
                        : "Reset Password"}
                </button>

            </form>
        </PasswordRecoveryLayout>
    );
};

export default ResetPassword;