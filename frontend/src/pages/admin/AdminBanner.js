import { useEffect, useState } from "react";
import api from "../../api";
import ImageUpload from "../../components/ImageUpload";
import SuccessDialog from "../../components/SuccessDialog";

export default function AdminBanner() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [form, setForm] = useState({
    id: "",
    title: "",
    subtitle: "",
    cta_text: "Shop Now",
    cta_link: "/products",
    image_url: "",
    active: true,
  });
  const [editMode, setEditMode] = useState(false);

  const loadBanners = async () => {
    try {
      const res = await api.get("/admin/banners/all");
      setBanners(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load banners:", err);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const resetForm = () => {
    setForm({
      id: "",
      title: "",
      subtitle: "",
      cta_text: "Shop Now",
      cta_link: "/products",
      image_url: "",
      active: true,
    });
    setEditMode(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEdit = (banner) => {
    setForm({
      id: banner._id,
      title: banner.title,
      subtitle: banner.subtitle,
      cta_text: banner.cta_text,
      cta_link: banner.cta_link,
      image_url: banner.image_url,
      active: banner.active,
    });
    setEditMode(true);
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Validation
    if (!form.title || !form.subtitle) {
      setError("Title and subtitle are required");
      setLoading(false);
      return;
    }

    if (!form.image_url) {
      setError("Image URL is required");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        title: form.title,
        subtitle: form.subtitle,
        cta_text: form.cta_text,
        cta_link: form.cta_link,
        image_url: form.image_url,
        active: form.active,
      };

      // Only include _id if we're editing (not creating new)
      if (form.id) {
        payload._id = form.id;
      }

      await api.put("/admin/banners", payload);

      setSuccessMessage(editMode ? "Banner updated successfully!" : "Banner created successfully!");
      resetForm();
      await loadBanners();
      setShowSuccessDialog(true);
    } catch (err) {
      console.error("Failed to save banner:", err);
      setError(err.response?.data?.detail || "Failed to save banner. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (bannerId, currentStatus) => {
    try {
      const bannerToUpdate = banners.find(b => b._id === bannerId);
      if (!bannerToUpdate) return;

      await api.put("/admin/banners", {
        _id: bannerId,
        title: bannerToUpdate.title,
        subtitle: bannerToUpdate.subtitle,
        cta_text: bannerToUpdate.cta_text,
        cta_link: bannerToUpdate.cta_link,
        image_url: bannerToUpdate.image_url,
        active: !currentStatus,
      });

      setSuccessMessage(`Banner ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      await loadBanners();
      setShowSuccessDialog(true);
    } catch (err) {
      console.error("Failed to toggle banner status:", err);
      setError("Failed to update banner status. Please try again.");
    }
  };

  return (
    <div className="admin-page">
      <SuccessDialog
        isOpen={showSuccessDialog}
        message={successMessage}
        onClose={() => setShowSuccessDialog(false)}
      />

      <h2>{editMode ? "Edit Banner" : "Add New Banner"}</h2>

      {error && (
        <div className="error-message" style={{ marginBottom: "16px" }}>
          <span className="error-icon">⚠</span>
          {error}
        </div>
      )}

      {success && (
        <div className="success-message" style={{ marginBottom: "16px" }}>
          <span className="success-icon">✓</span>
          {success}
        </div>
      )}

      <form onSubmit={submit} className="card admin-form">
        <div className="form-group">
          <label htmlFor="title">Banner Title *</label>
          <input
            id="title"
            name="title"
            placeholder="e.g. Pure Ocean Minerals & Herbs"
            value={form.title}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="subtitle">Subtitle *</label>
          <textarea
            id="subtitle"
            name="subtitle"
            placeholder="A compelling description of your products"
            rows={3}
            value={form.subtitle}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="cta_text">Button Text</label>
            <input
              id="cta_text"
              name="cta_text"
              placeholder="e.g. Shop Now"
              value={form.cta_text}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="cta_link">Button Link</label>
            <input
              id="cta_link"
              name="cta_link"
              placeholder="e.g. /products"
              value={form.cta_link}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
        </div>

        <ImageUpload
          label="Banner Image *"
          currentImage={form.image_url}
          onUploadSuccess={(url) => setForm({ ...form, image_url: url })}
        />

        <div className="form-group">
          <label htmlFor="image_url">Or Enter Image URL Manually</label>
          <input
            id="image_url"
            name="image_url"
            placeholder="https://example.com/banner-image.jpg"
            value={form.image_url}
            onChange={handleChange}
            disabled={loading}
          />
          <small className="form-hint">Enter the URL of the banner background image</small>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="active"
              checked={form.active}
              onChange={handleChange}
              disabled={loading}
            />
            <span>Active (visible on home page)</span>
          </label>
        </div>

        {form.image_url && (
          <div className="banner-preview">
            <p className="form-hint" style={{ marginBottom: "12px" }}>Preview:</p>
            <div className="banner-preview-box">
              <img src={form.image_url} alt="Banner preview" onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/placeholder.svg';
              }} />
              <div className="banner-preview-text">
                <h3>{form.title || "Banner Title"}</h3>
                <p>{form.subtitle || "Banner subtitle will appear here"}</p>
                <button type="button" className="preview-btn">{form.cta_text || "Button"}</button>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? (editMode ? "Updating..." : "Creating...") : (editMode ? "Update Banner" : "Create Banner")}
          </button>
          {editMode && (
            <button
              type="button"
              className="btn ghost"
              onClick={resetForm}
              disabled={loading}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <h2 style={{ marginTop: "48px" }}>All Banners ({banners.length})</h2>
      <div className="banners-list">
        {banners.length === 0 && (
          <p className="muted">No banners created yet. Create your first banner above.</p>
        )}

        {banners.map((banner) => (
          <div key={banner._id} className="banner-item">
            <div className="banner-item-image">
              <img src={banner.image_url} alt={banner.title} onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/placeholder.svg';
              }} />
              <div className={`banner-status-badge ${banner.active ? 'active' : 'inactive'}`}>
                {banner.active ? 'Active' : 'Inactive'}
              </div>
            </div>
            <div className="banner-item-content">
              <h3>{banner.title}</h3>
              <p className="banner-subtitle">{banner.subtitle}</p>
              <div className="banner-meta">
                <span className="banner-cta">Button: "{banner.cta_text}" → {banner.cta_link}</span>
              </div>
            </div>
            <div className="banner-item-actions">
              <button
                className="btn-action edit"
                onClick={() => handleEdit(banner)}
                title="Edit banner"
              >
                Edit
              </button>
              <button
                className={`btn-action ${banner.active ? 'deactivate' : 'activate'}`}
                onClick={() => toggleActive(banner._id, banner.active)}
                title={banner.active ? 'Deactivate banner' : 'Activate banner'}
              >
                {banner.active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
