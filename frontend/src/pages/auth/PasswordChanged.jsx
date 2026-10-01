import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./PasswordRecovery.css";

const PasswordChanged = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigate("/login");
        }, 2500);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="password-changed-page">

            <div className="success-card">

                <div className="success-icon">
                    ✓
                </div>

                <h1>
                    Password Updated Successfully
                </h1>

                <p>
                    Your password has been changed
                    successfully.
                    <br />
                    You can now sign in with your
                    new password.
                </p>

                <p className="redirect-text">
                    Redirecting to Login in 2.5 seconds...
                </p>

            </div>

        </div>
    );
};

export default PasswordChanged;