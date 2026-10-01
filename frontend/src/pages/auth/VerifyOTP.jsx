import React, {
    useEffect,
    useRef,
    useState
} from "react";

import {
    useLocation,
    useNavigate
} from "react-router-dom";

import PasswordRecoveryLayout from "./PasswordRecoveryLayout";

const API_URL = "http://localhost:5000";

const VerifyOTP = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const email = location.state?.email;

    const [otp, setOtp] = useState([
        "",
        "",
        "",
        "",
        "",
        ""
    ]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [seconds, setSeconds] = useState(60);
    const [resending, setResending] = useState(false);

    const inputRefs = useRef([]);

    useEffect(() => {
        if (!email) {
            navigate("/forgot-password");
        }
    }, [email, navigate]);

    useEffect(() => {
        if (seconds <= 0) {
            return;
        }

        const timer = setInterval(() => {
            setSeconds((previous) => previous - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [seconds]);

    const handleChange = (index, value) => {
        if (!/^\d*$/.test(value)) {
            return;
        }

        const newOtp = [...otp];

        newOtp[index] = value.slice(-1);

        setOtp(newOtp);
        setError("");

        if (
            value &&
            index < otp.length - 1
        ) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (
            e.key === "Backspace" &&
            !otp[index] &&
            index > 0
        ) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();

        const pastedData = e.clipboardData
            .getData("text")
            .replace(/\D/g, "")
            .slice(0, 6);

        if (!pastedData) {
            return;
        }

        const newOtp = [
            "",
            "",
            "",
            "",
            "",
            ""
        ];

        pastedData
            .split("")
            .forEach((digit, index) => {
                newOtp[index] = digit;
            });

        setOtp(newOtp);

        const focusIndex = Math.min(
            pastedData.length,
            5
        );

        inputRefs.current[focusIndex]?.focus();
    };

    const handleVerify = async (e) => {
        e.preventDefault();

        const enteredOtp = otp.join("");

        setError("");

        if (enteredOtp.length !== 6) {
            setError("Please enter the complete 6-digit OTP.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                `${API_URL}/verify-otp`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email,
                        otp: enteredOtp
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Invalid OTP."
                );
            }

            navigate("/reset-password", {
                state: {
                    email,
                    otp: enteredOtp
                }
            });

        } catch (error) {
            setError(
                error.message ||
                "Unable to verify OTP."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (seconds > 0 || resending) {
            return;
        }

        setError("");
        setResending(true);

        try {
            const response = await fetch(
                `${API_URL}/forgot-password`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to resend OTP."
                );
            }

            setOtp([
                "",
                "",
                "",
                "",
                "",
                ""
            ]);

            setSeconds(60);

            inputRefs.current[0]?.focus();

        } catch (error) {
            setError(
                error.message ||
                "Unable to resend OTP."
            );
        } finally {
            setResending(false);
        }
    };

    if (!email) {
        return null;
    }

    return (
        <PasswordRecoveryLayout
            step={2}
            illustration="otp"
            title="Verify OTP"
            description={
                <>
                    Enter the 6-digit verification code
                    <br />
                    sent to your email.
                </>
            }
        >
            <form
                className="recovery-form"
                onSubmit={handleVerify}
            >
                <div
                    className="otp-container"
                    onPaste={handlePaste}
                >
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            ref={(element) => {
                                inputRefs.current[index] =
                                    element;
                            }}
                            type="text"
                            inputMode="numeric"
                            maxLength="1"
                            className="otp-input"
                            value={digit}
                            onChange={(e) =>
                                handleChange(
                                    index,
                                    e.target.value
                                )
                            }
                            onKeyDown={(e) =>
                                handleKeyDown(index, e)
                            }
                            autoComplete={
                                index === 0
                                    ? "one-time-code"
                                    : "off"
                            }
                        />
                    ))}
                </div>

                {error && (
                    <div className="recovery-error">
                        {error}
                    </div>
                )}

                <div className="resend-row">
                    Didn't receive the code?

                    <button
                        type="button"
                        className="resend-button"
                        onClick={handleResend}
                        disabled={
                            seconds > 0 ||
                            resending
                        }
                    >
                        {resending
                            ? "Sending..."
                            : "Resend OTP"}
                    </button>
                </div>

                <div className="timer">
                    {seconds > 0 ? (
                        <>
                            Resend available in{" "}
                            <strong>
                                00:
                                {String(seconds).padStart(
                                    2,
                                    "0"
                                )}
                            </strong>
                        </>
                    ) : (
                        <span>
                            You can resend the OTP now.
                        </span>
                    )}
                </div>

                <button
                    type="submit"
                    className="recovery-primary-button"
                    disabled={loading}
                >
                    {loading
                        ? "Verifying..."
                        : "Verify OTP"}
                </button>
            </form>
        </PasswordRecoveryLayout>
    );
};

export default VerifyOTP;