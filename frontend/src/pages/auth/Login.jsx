import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import ParticleText from "../../components/ParticleText";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Company branding
  const [companyLogo, setCompanyLogo] = useState("");

  React.useEffect(() => {
    const fetchBranding = async () => {
      try {
        const response = await api.get("/settings/company-branding");

        if (response.data?.companyLogo) {
          setCompanyLogo(response.data.companyLogo);
        }
      } catch (error) {
        console.error("Failed to load company branding:", error);
      }
    };

    fetchBranding();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/login", {
        email: formData.email,
        password: formData.password,
      });

      const { token, user } = response.data;

      login(user, token);

      if (user.role === "Admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/employee/dashboard");
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Invalid email or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#11121c] p-4 sm:p-6">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden flex min-h-[620px]">
        
        {/* ================= LEFT SIDE ================= */}
        <div className="w-full lg:w-1/2 p-8 sm:p-10 lg:p-12 flex flex-col justify-center">

          {/* Company Branding */}
          <div className="flex items-center gap-4 mb-12">
            {companyLogo ? (
              <img
                src={companyLogo}
                alt="TechNova"
                className="w-14 h-14 object-contain rounded-xl"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-indigo-600 flex items-center justify-center">
                <span className="text-white text-xl font-bold">
                  T
                </span>
              </div>
            )}

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                TechNova
              </h1>

              <p className="text-sm text-gray-500">
                SOLUTIONS PVT. LTD.
              </p>
            </div>
          </div>

          {/* Welcome */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Welcome Back!
            </h2>

            <p className="text-gray-500 mt-2">
              Login to your account to continue
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>

            {/* Email */}
            <div className="mb-5">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-800 mb-2"
              >
                Email Address
              </label>

              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                className="w-full h-12 px-4 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            {/* Password */}
            <div className="mb-5">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-800 mb-2"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                className="w-full h-12 px-4 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            {/* Remember / Forgot */}
            <div className="flex items-center justify-between mb-6">

              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4"
                />

                Remember Me
              </label>

              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Forgot password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* OR */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200"></div>

            <span className="text-sm text-gray-400">
              OR
            </span>

            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

{/* ================= GOOGLE LOGIN ================= */}
<button
    type="button"
    onClick={() => {
        alert("Google Login is coming soon.");
    }}
    className="w-full h-12 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium flex items-center justify-center gap-3 hover:bg-gray-50 hover:border-gray-400 transition"
>
    {/* Google Logo */}
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M21.35 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.42Z"
            fill="#4285F4"
        />

        <path
            d="M12 21.75c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.55 0-4.71-1.72-5.49-4.03H3.26v2.53A9.75 9.75 0 0 0 12 21.75Z"
            fill="#34A853"
        />

        <path
            d="M6.51 13.83A5.86 5.86 0 0 1 6.2 12c0-.64.11-1.26.31-1.83V7.64H3.26A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.01 4.36l3.25-2.53Z"
            fill="#FBBC05"
        />

        <path
            d="M12 6.14c1.43 0 2.72.49 3.74 1.45l2.8-2.8C16.84 3.23 14.63 2.25 12 2.25a9.75 9.75 0 0 0-8.74 5.39l3.25 2.53C7.29 7.86 9.45 6.14 12 6.14Z"
            fill="#EA4335"
        />
    </svg>

    <span>
        Continue with Google
    </span>
</button>

        </div>

        {/* ================= RIGHT SIDE ================= */}
        <div className="hidden lg:flex lg:w-1/2 bg-[#09090f] relative overflow-hidden">

          <div className="w-full h-full flex items-center justify-center">
            <ParticleText
              text="TechNova"
              colors={["#ffffff", "#c4b5fd", "#8b5cf6"]}
              fontSize={150}
              particleSize={2}
              particleGap={3}
              animationSpeed={0.35}
              interactionStrength={80}
            />
            
          </div>

        </div>

      </div>
    </div>
  );
};

export default Login;