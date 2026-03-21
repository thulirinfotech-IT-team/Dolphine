import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import { AuthContext } from "../AuthContext";
import PremiumSuccessDialog from "../components/PremiumSuccessDialog";

export default function RegisterWithOTP() {
  const [step, setStep] = useState(1); // 1: Details, 2: OTP, 3: Password
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  // Step 1: Send OTP
  const sendOTP = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validation
    if (!form.name || !form.email) {
      setError("Name and email are required");
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      const otpRes = await api.post("/auth/send-otp", {
        email: form.email,
        mobile: form.mobile || null,
        name: form.name,
      });

      // Development mode: show OTP in UI if returned by server
      if (otpRes.data.dev_otp) {
        setDevOtp(otpRes.data.dev_otp);
      }

      setOtpSent(true);
      setStep(2);
      startResendTimer();
      setError("");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const verifyOTP = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      setLoading(false);
      return;
    }

    try {
      await api.post("/auth/verify-otp", {
        email: form.email,
        mobile: form.mobile || null,
        otp: otp,
      });

      setStep(3);
      setError("");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Complete Registration
  const completeRegistration = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validation
    if (!form.password || form.password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (!agreeToTerms) {
      setError("Please agree to the terms and conditions");
      setLoading(false);
      return;
    }

    try {
      const res = await api.post("/auth/register-with-otp", {
        name: form.name,
        email: form.email,
        mobile: form.mobile || null,
        password: form.password,
      });

      login(res.data);

      // Show success dialog
      setSuccessDialog({
        show: true,
        title: "Welcome Aboard!",
        message: `Registration successful! Welcome to Dolphin Naturals, ${res.data.user.name}!`
      });
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
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
      await api.post("/auth/send-otp", {
        email: form.email,
        mobile: form.mobile || null,
        name: form.name,
      });

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
              Join thousands who trust us for premium natural wellness products
            </p>
            <div className="auth-features">
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Secure OTP Verification</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Exclusive Member Benefits</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Premium Natural Products</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="auth-right">
          <div className="auth-form-wrapper">
            {/* Step Indicator */}
            <div className="otp-steps">
              <div className={`step ${step >= 1 ? "active" : ""}`}>
                <div className="step-number">1</div>
                <div className="step-label">Details</div>
              </div>
              <div className="step-line"></div>
              <div className={`step ${step >= 2 ? "active" : ""}`}>
                <div className="step-number">2</div>
                <div className="step-label">Verify</div>
              </div>
              <div className="step-line"></div>
              <div className={`step ${step >= 3 ? "active" : ""}`}>
                <div className="step-number">3</div>
                <div className="step-label">Password</div>
              </div>
            </div>

            <div className="auth-header">
              <h2>
                {step === 1 && "Create Account"}
                {step === 2 && "Verify OTP"}
                {step === 3 && "Set Password"}
              </h2>
              <p>
                {step === 1 && "Enter your details to get started"}
                {step === 2 && `OTP sent to ${form.email}`}
                {step === 3 && "Create a secure password"}
              </p>
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠</span>
                {error}
              </div>
            )}

            {/* Step 1: Enter Details */}
            {step === 1 && (
              <form className="premium-auth-form" onSubmit={sendOTP}>
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className="premium-input"
                      placeholder="John Doe"
                      value={form.name}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                    <span className="input-icon">👤</span>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <div className="input-wrapper">
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="premium-input"
                      placeholder="john@example.com"
                      value={form.email}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                    <span className="input-icon">✉</span>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="mobile">Mobile Number (Optional)</label>
                  <div className="input-wrapper">
                    <input
                      type="tel"
                      id="mobile"
                      name="mobile"
                      className="premium-input"
                      placeholder="+91 98765 43210"
                      value={form.mobile}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    <span className="input-icon">📱</span>
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
              </form>
            )}

            {/* Step 2: Verify OTP */}
            {step === 2 && (
              <form className="premium-auth-form" onSubmit={verifyOTP}>
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
                    "Verify OTP"
                  )}
                </button>

                <button
                  type="button"
                  className="btn-back"
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  ← Back
                </button>
              </form>
            )}

            {/* Step 3: Set Password */}
            {step === 3 && (
              <form className="premium-auth-form" onSubmit={completeRegistration}>
                <div className="form-group">
                  <label htmlFor="password">Password *</label>
                  <div className="input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      className="premium-input"
                      placeholder="Min 6 characters"
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

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password *</label>
                  <div className="input-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      className="premium-input"
                      placeholder="Re-enter password"
                      value={form.confirmPassword}
                      onChange={handleChange}
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

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                    disabled={loading}
                  />
                  I agree to the Terms & Conditions
                </label>

                <button
                  className="premium-btn"
                  type="submit"
                  disabled={loading || !agreeToTerms}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>
            )}

            <div className="signup-link">
              Already have an account? <Link to="/login">Login</Link>
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
