import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters long.");
            return;
        }

        setLoading(true);

        try {
            const response = await api.post("/register", {
                email,
                password
            });

            setSuccess(
                response.data?.message ||
                "Admin account created successfully."
            );

            setEmail("");
            setPassword("");
            setConfirmPassword("");

            // Give the user a moment to see the success message
            setTimeout(() => {
                navigate("/login");
            }, 1500);

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Registration failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">

            <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl flex overflow-hidden">

                {/* Left side - form */}
                <div className="w-full md:w-1/2 p-10">

                    {/* Logo / Header */}
                    <div className="flex items-center gap-3 mb-6">

                        <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
                            H
                        </div>

                        <div>
                            <h1 className="text-lg font-bold text-gray-900">
                                HRMS
                            </h1>

                            <p className="text-xs text-gray-500">
                                Human Resource Management System
                            </p>
                        </div>

                    </div>


                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 mb-6">

                        <button
                            type="button"
                            onClick={() => navigate("/login")}
                            className="px-4 py-2 text-sm font-medium text-gray-400"
                        >
                            Login
                        </button>

                        <button
                            type="button"
                            className="px-4 py-2 text-sm font-semibold text-indigo-600 border-b-2 border-indigo-600"
                        >
                            Sign up
                        </button>

                    </div>


                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                        Create Admin Account
                    </h2>

                    <p className="text-sm text-gray-500 mb-6">
                        Create the initial administrator account for your HRMS.
                    </p>


                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-4">
                            {error}
                        </div>
                    )}


                    {/* Success */}
                    {success && (
                        <div className="bg-green-50 text-green-700 text-sm rounded-lg p-3 mb-4">
                            {success}
                        </div>
                    )}


                    <form
                        onSubmit={handleSubmit}
                        className="space-y-4"
                    >

                        {/* Email */}
                        <div>

                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address
                            </label>

                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter admin email"
                                required
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />

                        </div>


                        {/* Password */}
                        <div>

                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>

                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Create a password"
                                required
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />

                        </div>


                        {/* Confirm Password */}
                        <div>

                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Confirm Password
                            </label>

                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm your password"
                                required
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />

                        </div>


                        {/* Information */}
                        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">

                            <p className="text-xs text-indigo-700">
                                This registration creates the initial Admin
                                account. After an Admin account exists, public
                                registration is disabled. Employee accounts
                                are created by the Admin.
                            </p>

                        </div>


                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white font-medium py-2.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                            {loading
                                ? "Creating account..."
                                : "Create Admin Account"}
                        </button>

                    </form>


                    <p className="text-center text-sm text-gray-500 mt-6">

                        Already have an account?{" "}

                        <button
                            type="button"
                            onClick={() => navigate("/login")}
                            className="text-indigo-600 font-semibold"
                        >
                            Login
                        </button>

                    </p>

                </div>


                {/* Right side */}
                <div className="hidden md:flex w-1/2 bg-indigo-50 items-center justify-center">

                    <div className="text-center px-10">

                        <h3 className="text-2xl font-bold text-gray-800 mb-2">
                            Welcome to HRMS
                        </h3>

                        <p className="text-gray-500 text-sm">
                            Set up your administrator account to begin
                            managing your organization.
                        </p>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default Register;