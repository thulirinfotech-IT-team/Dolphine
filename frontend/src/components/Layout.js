// src/components/Layout.js
import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import { CartContext } from "../CartContext";
import PremiumSuccessDialog from "./PremiumSuccessDialog";
import logo from "./logo.png";

export default function Layout({ children }) {
  const { user, logout } = useContext(AuthContext);
  const { cartCount } = useContext(CartContext);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [logoutDialog, setLogoutDialog] = useState({ show: false });

  const handleLogout = () => {
    const userName = user?.name || "User";
    logout();
    setLogoutDialog({
      show: true,
      title: "Logged Out Successfully!",
      message: `Goodbye ${userName}! We hope to see you again soon.`
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <div>
      <header className="nav">
        <div className="nav-inner">
          <Link to="/" className="logo">
            <img
              src={logo}
              alt="Dolphin Naturals Logo"
              className="logo-img"
            />
          </Link>

          <form className="nav-search" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="nav-search-input"
            />
            <button type="submit" className="nav-search-btn" title="Search">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </button>
          </form>

          <nav className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/products">Products</Link>
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
            {user ? (
              <>
                <Link to="/cart" className="cart-link" title="Cart" style={{ position: "relative" }}>
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                  {cartCount > 0 && (
                    <span style={{
                      position: "absolute",
                      top: "-8px",
                      right: "-8px",
                      backgroundColor: "#1F3556",
                      color: "white",
                      borderRadius: "50%",
                      width: "20px",
                      height: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "11px",
                      fontWeight: "600"
                    }}>
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </Link>
                {user.role === "admin" && (
                  <>
                    <Link to="/admin/products">Products</Link>
                    <Link to="/admin/banner">Banner</Link>
                    <Link to="/admin/doctor-videos">Videos</Link>
                    <Link to="/admin/categories">Categories</Link>
                  </>
                )}
                <span className="user-name">{user.name}</span>
                <button onClick={handleLogout} className="btn ghost btn-sm">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main style={{ paddingTop: "64px" }}>{children}</main>
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <Link to="/" className="logo">
              <img
                src={logo}
                alt="Dolphin Naturals Logo"
                className="logo-img"
              />
            </Link>
            <p><b>Pure Ocean Minerals & Herbs for your wellness journey.</b></p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <Link to="/products">Products</Link>
            <Link to="/about">About Us</Link>
            <Link to="/contact">Contact</Link>
          </div>
          <div className="footer-section">
            <h4>Customer Service</h4>
            <Link to="/">Shipping Info</Link>
            <Link to="/">Returns</Link>
            <Link to="/">Privacy Policy</Link>
          </div>
          <div className="footer-section">
            <h4>Contact</h4>
            <p>Email: info@dolphinnaturals.com</p>
            <p>Phone: +91 1234567890</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 Dolphin Naturals. All rights reserved.</p>
        </div>
      </footer>

      <PremiumSuccessDialog
        isOpen={logoutDialog.show}
        title={logoutDialog.title}
        message={logoutDialog.message}
        onClose={() => {
          setLogoutDialog({ show: false });
          navigate("/");
        }}
      />
    </div>
  );
}
