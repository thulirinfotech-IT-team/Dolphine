import "./SuccessDialog.css";

export default function SuccessDialog({ isOpen, message, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-icon">✓</div>
        <h3 className="dialog-title">Success!</h3>
        <p className="dialog-message">{message}</p>
        <button className="dialog-button" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
}
