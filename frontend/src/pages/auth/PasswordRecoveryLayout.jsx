import React from "react";
import { useNavigate } from "react-router-dom";
import "./PasswordRecovery.css";

const LockIllustration = () => {
    return (
        <div className="recovery-illustration lock-illustration">
            <div className="question-bubble">?</div>

            <div className="lock-body">
                <div className="lock-shackle"></div>

                <div className="lock-face">
                    <div className="lock-keyhole"></div>
                </div>
            </div>

            <div className="floating-paper">➤</div>

            <div className="person-illustration">
                <div className="person-head"></div>
                <div className="person-hair"></div>
                <div className="person-body"></div>
            </div>

            <div className="leaf leaf-one">❧</div>
            <div className="leaf leaf-two">❧</div>
        </div>
    );
};

const OtpIllustration = () => {
    return (
        <div className="recovery-illustration otp-illustration">
            <div className="envelope">
                <div className="envelope-paper">
                    <strong>123456</strong>
                </div>

                <div className="envelope-flap"></div>

                <div className="envelope-front"></div>
            </div>

            <div className="shield">
                <div className="shield-check">✓</div>
            </div>

            <div className="otp-leaf leaf-one">❧</div>
            <div className="otp-leaf leaf-two">❧</div>
        </div>
    );
};

const PasswordIllustration = () => {
    return (
        <div className="recovery-illustration password-illustration">
            <div className="password-shield">
                <div className="shield-lock">
                    <div className="mini-lock"></div>
                </div>
            </div>

            <div className="password-key">
                <div className="key-circle"></div>
                <div className="key-stick"></div>
                <div className="key-tooth"></div>
            </div>

            <div className="password-dots">
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span>★</span>
            </div>

            <div className="password-leaf leaf-one">❧</div>
            <div className="password-leaf leaf-two">❧</div>
        </div>
    );
};

const StepHeader = ({ number, title }) => {
    return (
        <div className="recovery-step-header">
            <div className="step-number">{number}</div>

            <h2>{title}</h2>
        </div>
    );
};

const PasswordRecoveryLayout = ({
    step,
    title,
    description,
    illustration,
    children
}) => {
    const navigate = useNavigate();

    const renderIllustration = () => {
        if (illustration === "lock") {
            return <LockIllustration />;
        }

        if (illustration === "otp") {
            return <OtpIllustration />;
        }

        return <PasswordIllustration />;
    };

    return (
        <div className="password-recovery-page">
            <div className="recovery-main-card">

                <StepHeader
                    number={step}
                    title={
                        step === 1
                            ? "FORGOT PASSWORD"
                            : step === 2
                            ? "VERIFY OTP"
                            : "CREATE NEW PASSWORD"
                    }
                />

                <div className="recovery-content">

                    <div className="recovery-visual-section">
                        {renderIllustration()}
                    </div>

                    <div className="recovery-form-section">

                        <h1>{title}</h1>

                        <p className="recovery-description">
                            {description}
                        </p>

                        {children}

                        <button
                            type="button"
                            className="back-login-button"
                            onClick={() => navigate("/login")}
                        >
                            <span>←</span>
                            Back to Login
                        </button>

                    </div>

                </div>
            </div>
        </div>
    );
};

export default PasswordRecoveryLayout;