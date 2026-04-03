import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import api from "../api";
import { AuthContext } from "../AuthContext";
import PremiumSuccessDialog from "../components/PremiumSuccessDialog";

export default function LoginWithOTP() {
  const [step, setStep] = useState(1); // 1: Email/Password, 2: OTP Verification
  const [form, setForm] = useState({ email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [devOtp, setDevOtp] = useState(""); // Development only: shows OTP in UI
  const [successDialog, setSuccessDialog] = useState({ show: false, title: "", message: "" });
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/google-login", {
        credential: credentialResponse.credential,
      });
      login(res.data);
      setSuccessDialog({
        show: true,
        title: "Welcome!",
        message: `You have successfully logged in as ${res.data.user.name}`,
      });
    } catch (err) {
      setError(err.response?.data?.detail || "Google login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Start resend timer
  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Step 1: Verify credentials and send OTP
  const sendLoginOTP = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // First verify credentials
      const res = await api.post("/auth/login-verify-credentials", {
        email: form.email,
        password: form.password,
      });

      if (res.data.status === "success") {
        // Credentials valid, send OTP
        const otpRes = await api.post("/auth/send-otp", {
          email: form.email,
          name: res.data.name || "User",
        });

        // Development mode: show OTP in UI if returned by server
        if (otpRes.data.dev_otp) {
          setDevOtp(otpRes.data.dev_otp);
        }

        setStep(2);
        startResendTimer();
        setError("");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and complete login
  const verifyLoginOTP = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      setLoading(false);
      return;
    }

    try {
      // Verify OTP
      await api.post("/auth/verify-otp", {
        email: form.email,
        otp: otp,
      });

      // OTP verified, complete login
      const res = await api.post("/auth/login-with-otp", {
        email: form.email,
        otp: otp, // Include OTP
      });

      login(res.data);

      // Show success dialog
      setSuccessDialog({
        show: true,
        title: "Welcome Back!",
        message: `You have successfully logged in as ${res.data.user.name}`
      });
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const resendOTP = async () => {
    if (resendTimer > 0) return;

    setError("");
    setLoading(true);

    try {
      const otpRes = await api.post("/auth/send-otp", {
        email: form.email,
        name: "User",
      });

      // Development mode: show OTP in UI if returned by server
      if (otpRes.data.dev_otp) {
        setDevOtp(otpRes.data.dev_otp);
      }

      startResendTimer();
      setError("");
    } catch (err) {
      setError("Failed to resend OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="premium-auth-page">
      <div className="auth-container">
        {/* Left Side - Branding */}
        <div className="auth-left">
          <div className="auth-branding">
            <div className="brand-logo">
              <div className="logo-circle">
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M50 20 Q30 35 30 50 Q30 65 50 80 Q70 65 70 50 Q70 35 50 20 Z"
                    fill="currentColor"
                    opacity="0.9"
                  />
                  <circle cx="50" cy="50" r="5" fill="currentColor" />
                </svg>
              </div>
              <h1>Dolphin Naturals</h1>
            </div>
            <p className="brand-tagline">
              Secure login with OTP verification for your safety
            </p>
            <div className="auth-features">
              <div className="feature-item">
                <span className="feature-icon">&#10004;</span>
                <span>Two-Factor Authentication</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">&#10004;</span>
                <span>Secure Account Access</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">&#10004;</span>
                <span>Protected Transactions</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="auth-right">
          <div className="auth-form-wrapper">
            {/* Step Indicator */}
            <div className="otp-steps" style={{ marginBottom: "30px" }}>
              <div className={`step ${step >= 1 ? "active" : ""}`}>
                <div className="step-number">1</div>
                <div className="step-label">Login</div>
              </div>
              <div className="step-line"></div>
              <div className={`step ${step >= 2 ? "active" : ""}`}>
                <div className="step-number">2</div>
                <div className="step-label">Verify</div>
              </div>
            </div>

            <div className="auth-header">
              <h2>
                {step === 1 && "Welcome Back"}
                {step === 2 && "Verify OTP"}
              </h2>
              <p>
                {step === 1 && "Enter your credentials to continue"}
                {step === 2 && `OTP sent to ${form.email}`}
              </p>
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠</span>
                {error}
              </div>
            )}

            {/* Step 1: Email & Password */}
            {step === 1 && (
              <form className="premium-auth-form" onSubmit={sendLoginOTP}>
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <div className="input-wrapper">
                    <input
                      id="email"
                      className="premium-input"
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                    <span className="input-icon">✉</span>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <div className="input-wrapper">
                    <input
                      id="password"
                      className="premium-input"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Enter your password"
                      value={form.password}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      style={{ paddingRight: "80px" }}
                    />
                    <span className="input-icon">🔒</span>
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                </div>

                <div className="form-row" style={{ justifyContent: "flex-end" }}>
                  <Link to="/forgot-password" className="forgot-link">
                    Forgot password?
                  </Link>
                </div>

                <button
                  className="premium-btn"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Verifying...
                    </>
                  ) : (
                    "Continue"
                  )}
                </button>

                <div className="divider">
                  <span>or sign in with</span>
                </div>

                <div className="social-login" style={{ justifyContent: "center" }}>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError("Google login failed. Please try again.")}
                    useOneTap
                    theme="outline"
                    shape="rectangular"
                    text="signin_with"
                    width="300"
                  />
                </div>
              </form>
            )}

            {/* Step 2: OTP Verification */}
            {step === 2 && (
              <form className="premium-auth-form" onSubmit={verifyLoginOTP}>
                <div className="form-group">
                  <label htmlFor="otp">Enter 6-Digit OTP</label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      id="otp"
                      className="premium-input otp-input"
                      placeholder="000000"
                      value={otp}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        if (value.length <= 6) setOtp(value);
                      }}
                      maxLength={6}
                      required
                      disabled={loading}
                      style={{ letterSpacing: "8px", fontSize: "24px", textAlign: "center" }}
                    />
                    <span className="input-icon">🔐</span>
                  </div>
                </div>

                <div className="otp-resend">
                  {resendTimer > 0 ? (
                    <p>Resend OTP in {resendTimer}s</p>
                  ) : (
                    <button
                      type="button"
                      onClick={resendOTP}
                      className="link-button"
                      disabled={loading}
                    >
                      Resend OTP
                    </button>
                  )}
                </div>

                <button
                  className="premium-btn"
                  type="submit"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Verifying...
                    </>
                  ) : (
                    "Verify & Login"
                  )}
                </button>

                <button
                  type="button"
                  className="btn-back"
                  onClick={() => {
                    setStep(1);
                    setOtp("");
                    setError("");
                  }}
                  disabled={loading}
                >
                  ← Back to Login
                </button>
              </form>
            )}

            <div className="signup-link">
              Don't have an account? <Link to="/register">Sign up for free</Link>
            </div>
          </div>
        </div>
      </div>

      <PremiumSuccessDialog
        isOpen={successDialog.show}
        title={successDialog.title}
        message={successDialog.message}
        onClose={() => {
          setSuccessDialog({ show: false, title: "", message: "" });
          navigate("/");
        }}
      />
    </div>
  );
}
