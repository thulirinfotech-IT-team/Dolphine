import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [devOtp, setDevOtp] = useState(""); // Development only: shows OTP in UI
  const navigate = useNavigate();

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

  // Step 1: Send OTP to email
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/forgot-password", { email });

      if (res.data.status === "success") {
        // Development mode: show OTP in UI if returned by server
        if (res.data.dev_otp) {
          setDevOtp(res.data.dev_otp);
        }
        setStep(2);
        startResendTimer();
        setError("");
      }
    } catch (err) {
      if (!err.response) {
        setError("Cannot connect to server. Please wait a moment and try again (server may be starting up).");
      } else {
        setError(err.response?.data?.detail || `Error ${err.response.status}: Failed to send OTP.`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/auth/reset-password", {
        email,
        otp,
        new_password: newPassword,
      });

      if (res.data.status === "success") {
        // Show success message and redirect to login
        alert("Password reset successfully! You can now login with your new password.");
        navigate("/login");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to reset password. Please try again.");
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
      await api.post("/auth/forgot-password", { email });
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
              Secure password reset with OTP verification
            </p>
            <div className="auth-features">
              <div className="feature-item">
                <span className="feature-icon">&#10004;</span>
                <span>Email Verification</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">&#10004;</span>
                <span>Secure OTP Process</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">&#10004;</span>
                <span>Account Protection</span>
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
                <div className="step-label">Email</div>
              </div>
              <div className="step-line"></div>
              <div className={`step ${step >= 2 ? "active" : ""}`}>
                <div className="step-number">2</div>
                <div className="step-label">Reset</div>
              </div>
            </div>

            <div className="auth-header">
              <h2>
                {step === 1 && "Forgot Password?"}
                {step === 2 && "Reset Your Password"}
              </h2>
              <p>
                {step === 1 && "Enter your email to receive a password reset OTP"}
                {step === 2 && `OTP sent to ${email}`}
              </p>
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠</span>
                {error}
              </div>
            )}

            {/* Step 1: Email Input */}
            {step === 1 && (
              <form className="premium-auth-form" onSubmit={handleSendOTP}>
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <div className="input-wrapper">
                    <input
                      id="email"
                      className="premium-input"
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                    <span className="input-icon">✉</span>
                  </div>
                </div>

                <button
                  className="premium-btn"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Sending OTP...
                    </>
                  ) : (
                    "Send OTP"
                  )}
                </button>

                <div className="signup-link" style={{ marginTop: "20px" }}>
                  Remember your password? <Link to="/login">Back to Login</Link>
                </div>
              </form>
            )}

            {/* Step 2: OTP & Password Reset */}
            {step === 2 && (
              <form className="premium-auth-form" onSubmit={handleResetPassword}>
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

                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <div className="input-wrapper">
                    <input
                      id="newPassword"
                      className="premium-input"
                      type={showPassword ? "text" : "password"}
                      name="newPassword"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
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

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <div className="input-wrapper">
                    <input
                      id="confirmPassword"
                      className="premium-input"
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                      style={{ paddingRight: "80px" }}
                    />
                    <span className="input-icon">🔒</span>
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                </div>

                <button
                  className="premium-btn"
                  type="submit"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </button>

                <button
                  type="button"
                  className="btn-back"
                  onClick={() => {
                    setStep(1);
                    setOtp("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setError("");
                  }}
                  disabled={loading}
                >
                  ← Back to Email
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
