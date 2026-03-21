import { useState } from "react";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Validation
    if (!form.name || !form.email || !form.subject || !form.message) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    // Simulate form submission (you can integrate with backend later)
    setTimeout(() => {
      setSuccess("Thank you for contacting us! We'll get back to you within 24 hours.");
      setForm({ name: "", email: "", subject: "", message: "" });
      setLoading(false);

      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccess(""), 5000);
    }, 1000);
  };

  return (
    <div className="page">
      <div className="contact-page">
        {/* Header */}
        <div className="contact-header">
          <h1>Get in Touch</h1>
          <p>We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
        </div>

        <div className="contact-container">
          {/* Contact Form */}
          <div className="contact-form-section">
            <div className="card">
              <h2>Send Us a Message</h2>
              <form onSubmit={handleSubmit} className="contact-form">
                {error && (
                  <div className="error-message">
                    <span className="error-icon">⚠</span>
                    {error}
                  </div>
                )}

                {success && (
                  <div className="success-message">
                    <span className="success-icon">✓</span>
                    {success}
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="name">Your Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    disabled={loading}
                    className="contact-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    disabled={loading}
                    className="contact-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subject">Subject</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    placeholder="How can we help you?"
                    disabled={loading}
                    className="contact-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us more about your inquiry..."
                    rows="6"
                    disabled={loading}
                    className="contact-input"
                  ></textarea>
                </div>

                <button type="submit" className="btn primary full" disabled={loading}>
                  {loading ? "Sending..." : "Send Message"}
                </button>
              </form>
            </div>
          </div>

          {/* Contact Information */}
          <div className="contact-info-section">
            <div className="card contact-info-card">
              <h2>Contact Information</h2>
              <div className="contact-details">
                <div className="contact-detail-item">
                  <div className="contact-detail-icon">📍</div>
                  <div>
                    <h4>Address</h4>
                    <p>123 Ocean Drive, Coastal City<br />Mumbai, Maharashtra 400001<br />India</p>
                  </div>
                </div>

                <div className="contact-detail-item">
                  <div className="contact-detail-icon">📞</div>
                  <div>
                    <h4>Phone</h4>
                    <p>+91 98765 43210</p>
                    <p className="muted">Mon-Fri, 9am-6pm IST</p>
                  </div>
                </div>

                <div className="contact-detail-item">
                  <div className="contact-detail-icon">✉️</div>
                  <div>
                    <h4>Email</h4>
                    <p>support@dolphinnaturals.com</p>
                    <p>info@dolphinnaturals.com</p>
                  </div>
                </div>

                <div className="contact-detail-item">
                  <div className="contact-detail-icon">⏰</div>
                  <div>
                    <h4>Business Hours</h4>
                    <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
                    <p>Saturday: 10:00 AM - 4:00 PM</p>
                    <p>Sunday: Closed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="card faq-card">
              <h3>Quick Answers</h3>
              <div className="faq-list">
                <div className="faq-item">
                  <h4>How long does shipping take?</h4>
                  <p>Standard delivery takes 3-5 business days across India.</p>
                </div>
                <div className="faq-item">
                  <h4>What is your return policy?</h4>
                  <p>We offer 30-day returns on unopened products.</p>
                </div>
                <div className="faq-item">
                  <h4>Are products certified organic?</h4>
                  <p>Yes, all our products use certified organic ingredients.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
