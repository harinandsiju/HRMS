const User = require("../models/User");
const logActivity = require("../helpers/activityLogger");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// ===============================
// EMAIL TRANSPORTER
// ===============================
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ===============================
// REGISTER
// ===============================
const register = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check required fields
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and Password are required."
            });
        }

        // Check password length
        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters long."
            });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                message: "Email already registered."
            });
        }

        // Check whether an Admin already exists
        const existingAdmin = await User.findOne({
            role: "Admin"
        });

        // Public registration is allowed only for the first Admin
        if (existingAdmin) {
            return res.status(403).json({
                message:
                    "Public registration is closed. Please contact the administrator to get an employee account."
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the first Admin
        const newUser = await User.create({
            email,
            password: hashedPassword,
            role: "Admin",
            employeeId: null
        });

        // Return safe user information
        res.status(201).json({
            message: "Admin account created successfully.",
            user: {
                id: newUser._id,
                email: newUser.email,
                role: newUser.role
            }
        });
    } catch (error) {
        console.error("Register Error:", error);

        res.status(500).json({
            message: "Internal Server Error"
        });
    }
};

// ===============================
// LOGIN
// ===============================
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check required fields
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and Password are required."
            });
        }

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        // Check whether account is active
        if (!user.isActive) {
            return res.status(403).json({
                message: "Your account has been deactivated."
            });
        }

        // Compare password
        const isPasswordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordMatch) {
            return res.status(401).json({
                message: "Invalid Password."
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        // Log login activity
        await logActivity({
            userId: user._id,
            employeeId: user.employeeId,
            action: "User Login",
            module: "Auth",
            description: `${user.email} logged in`,
            req
        });

        // Login success response
        res.status(200).json({
            message: "Login Successful",
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Login Error:", error);

        res.status(500).json({
            message: "Internal Server Error"
        });
    }
};

// ===============================
// FORGOT PASSWORD
// ===============================
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Check required field
        if (!email) {
            return res.status(400).json({
                message: "Email is required."
            });
        }

        // Find user
        const user = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (!user) {
            return res.status(404).json({
                message: "No account found with this email."
            });
        }

        // Check whether account is active
        if (!user.isActive) {
            return res.status(403).json({
                message: "Your account has been deactivated."
            });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(
            100000 + Math.random() * 900000
        ).toString();

        // OTP valid for 10 minutes
        const otpExpires = new Date(
            Date.now() + 10 * 60 * 1000
        );

        // Save OTP to database
        user.resetOTP = otp;
        user.resetOTPExpires = otpExpires;

        await user.save();

        // Send OTP email
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: "TechNova - Password Reset OTP",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                    <h2 style="color: #4f46e5;">
                        TechNova Solutions Pvt. Ltd.
                    </h2>

                    <p>Hello,</p>

                    <p>
                        We received a request to reset your password.
                    </p>

                    <p>
                        Your password reset OTP is:
                    </p>

                    <h1 style="letter-spacing: 8px; color: #4f46e5;">
                        ${otp}
                    </h1>

                    <p>
                        This OTP is valid for <strong>10 minutes</strong>.
                    </p>

                    <p>
                        If you did not request a password reset,
                        please ignore this email.
                    </p>

                    <p>
                        Regards,<br>
                        TechNova Solutions Pvt. Ltd.
                    </p>
                </div>
            `
        });

        res.status(200).json({
            message: "OTP sent successfully."
        });
    } catch (error) {
        console.error("Forgot Password Error:", error);

        res.status(500).json({
            message: "Failed to send OTP."
        });
    }
};


// ===============================
// VERIFY OTP
// ===============================
const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Check required fields
        if (!email || !otp) {
            return res.status(400).json({
                message: "Email and OTP are required."
            });
        }

        // Find user
        const user = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (!user) {
            return res.status(404).json({
                message: "No account found with this email."
            });
        }

        // Check whether OTP exists
        if (!user.resetOTP || !user.resetOTPExpires) {
            return res.status(400).json({
                message: "No OTP request found. Please request a new OTP."
            });
        }

        // Check OTP expiry
        if (new Date() > user.resetOTPExpires) {
            return res.status(400).json({
                message: "OTP has expired. Please request a new OTP."
            });
        }

        // Check OTP
        if (user.resetOTP !== otp.toString().trim()) {
            return res.status(400).json({
                message: "Invalid OTP."
            });
        }

        // OTP is valid
        res.status(200).json({
            message: "OTP verified successfully."
        });
    } catch (error) {
        console.error("Verify OTP Error:", error);

        res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


// ===============================
// RESET PASSWORD
// ===============================
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        // Check required fields
        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                message: "Email, OTP and new password are required."
            });
        }

        // Check password length
        if (newPassword.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters long."
            });
        }

        // Find user
        const user = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (!user) {
            return res.status(404).json({
                message: "No account found with this email."
            });
        }

        // Check whether OTP exists
        if (!user.resetOTP || !user.resetOTPExpires) {
            return res.status(400).json({
                message: "No OTP request found. Please request a new OTP."
            });
        }

        // Check OTP expiry
        if (new Date() > user.resetOTPExpires) {
            return res.status(400).json({
                message: "OTP has expired. Please request a new OTP."
            });
        }

        // Check OTP
        if (user.resetOTP !== otp.toString().trim()) {
            return res.status(400).json({
                message: "Invalid OTP."
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        user.password = hashedPassword;

        // Clear OTP after successful password reset
        user.resetOTP = null;
        user.resetOTPExpires = null;

        await user.save();

        res.status(200).json({
            message: "Password reset successfully."
        });
    } catch (error) {
        console.error("Reset Password Error:", error);

        res.status(500).json({
            message: "Internal Server Error"
        });
    }
};

// ===============================
// EXPORT CONTROLLERS
// ===============================
module.exports = {
    register,
    login,
    forgotPassword,
    verifyOTP,
    resetPassword
};