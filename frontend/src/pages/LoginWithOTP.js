import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
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

                <div className="social-login">
                  <button type="button" className="social-btn" disabled>
                    <svg width="20" height="20" viewBox="0 0 20 20">
                      <path
                        fill="currentColor"
                        d="M19.6 10.23c0-.82-.1-1.42-.25-2.05H10v3.72h5.5c-.15.96-.74 2.31-2.04 3.22v2.45h3.16c1.89-1.73 2.98-4.3 2.98-7.34z"
                      />
                      <path
                        fill="currentColor"
                        d="M13.46 15.13c-.83.59-1.96 1-3.46 1-2.64 0-4.88-1.74-5.68-4.15H1.07v2.52C2.72 17.75 6.09 20 10 20c2.7 0 4.96-.89 6.62-2.42l-3.16-2.45z"
                      />
                      <path
                        fill="currentColor"
                        d="M3.99 10c0-.69.12-1.35.32-1.97V5.51H1.07A9.973 9.973 0 000 10c0 1.61.39 3.14 1.07 4.49l3.24-2.52c-.2-.62-.32-1.28-.32-1.97z"
                      />
                      <path
                        fill="currentColor"
                        d="M10 3.88c1.88 0 3.13.81 3.85 1.48l2.84-2.76C14.96.99 12.7 0 10 0 6.09 0 2.72 2.25 1.07 5.51l3.24 2.52C5.12 5.62 7.36 3.88 10 3.88z"
                      />
                    </svg>
                    Google
                  </button>
                  <button type="button" className="social-btn" disabled>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" />
                    </svg>
                    Facebook
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: OTP Verification */}
            {step === 2 && (
              <form className="premium-auth-form" onSubmit={verifyLoginOTP}>
                {/* Development mode OTP display */}
                {devOtp && (
                  <div style={{
                    background: "#fef3c7",
                    border: "1px solid #f59e0b",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    marginBottom: "16px",
                    textAlign: "center"
                  }}>
                    <p style={{ margin: 0, fontSize: "12px", color: "#92400e", fontWeight: 600 }}>
                      🔧 DEV MODE — Your OTP:
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: "28px", fontWeight: 700, letterSpacing: "8px", color: "#b45309" }}>
                      {devOtp}
                    </p>
                  </div>
                )}
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
