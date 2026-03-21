import "./PremiumSuccessDialog.css";

export default function PremiumSuccessDialog({ isOpen, title, message, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="premium-dialog-overlay" onClick={onClose}>
      <div className="premium-dialog-box" onClick={(e) => e.stopPropagation()}>
        <div className="premium-dialog-header">
          <div className="premium-success-icon">
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
              <circle cx="30" cy="30" r="28" fill="#10B981" fillOpacity="0.1"/>
              <circle cx="30" cy="30" r="24" fill="#10B981" fillOpacity="0.2"/>
              <circle cx="30" cy="30" r="20" fill="#10B981"/>
              <path d="M20 30L26 36L40 22" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        <div className="premium-dialog-content">
          <h2 className="premium-dialog-title">{title}</h2>
          <p className="premium-dialog-message">{message}</p>
        </div>
        <button className="premium-dialog-button" onClick={onClose}>
          <span>Continue</span>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
