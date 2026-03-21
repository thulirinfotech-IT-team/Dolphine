import { useState, useEffect } from "react";
import api from "../../api";
import ImageUpload from "../../components/ImageUpload";
import SuccessDialog from "../../components/SuccessDialog";

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    id: "",
    name: "",
    description: "",
    icon: "",
    icon_image: "",
    active: true,
    show_on_home: false,
    display_order: 0,
  });
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await api.get("/categories/all");
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load categories:", err);
      setError("Failed to load categories. Please refresh the page.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim() || !form.description.trim()) {
      setError("❌ Please fill in all required fields!");
      return;
    }

    if (!form.icon_image || !form.icon_image.trim()) {
      setError("❌ Please upload a category image!");
      return;
    }

    // Check if trying to enable show_on_home and there are already 4 categories
    if (form.show_on_home) {
      const homeCategories = categories.filter(cat => 
        cat.show_on_home && cat._id !== form.id
      );
      if (homeCategories.length >= 4) {
        setError("❌ Maximum 4 categories can be displayed on the home page. Please disable another category first.");
        return;
      }
    }

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        icon: "",
        icon_image: form.icon_image,
        active: form.active,
        show_on_home: form.show_on_home,
        display_order: parseInt(form.display_order) || 0,
      };

      if (editMode) {
        await api.put(`/categories/${form.id}`, payload);
        setSuccessMessage("Category updated successfully!");
      } else {
        await api.post("/categories", payload);
        setSuccessMessage("Category added successfully!");
      }

      resetForm();
      loadCategories();
      setShowSuccessDialog(true);
    } catch (err) {
      console.error("Failed to save category:", err);
      setError(err.response?.data?.detail || "❌ Failed to save category. Please try again.");
    }
  };

  const handleEdit = (category) => {
    setForm({
      id: category._id || category.id,
      name: category.name,
      description: category.description,
      icon: "",
      icon_image: category.icon_image || "",
      active: category.active,
      show_on_home: category.show_on_home || false,
      display_order: category.display_order,
    });
    setEditMode(true);
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id, categoryName) => {
    // Check if it's the default category
    const category = categories.find(c => (c._id === id || c.id === id));
    if (category && category.is_default) {
      setError("❌ Cannot delete the default 'Herbals' category. This category is used for product reassignment.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const catName = category ? category.name : categoryName;
    if (!window.confirm(`⚠️ Are you sure you want to delete the category "${catName}"?\n\nNote: All products in this category will be automatically moved to the "Herbals" category.`)) {
      return;
    }

    try {
      const response = await api.delete(`/categories/${id}`);
      const reassignedCount = response.data.products_reassigned || 0;
      if (reassignedCount > 0) {
        setSuccessMessage(`Category deleted successfully! ${reassignedCount} product(s) were moved to "Herbals" category.`);
      } else {
        setSuccessMessage("Category deleted successfully!");
      }
      loadCategories();
      setShowSuccessDialog(true);
    } catch (err) {
      console.error("Failed to delete category:", err);
      const errorMsg = err.response?.data?.detail || "Failed to delete category.";
      setError(`❌ ${errorMsg}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const resetForm = () => {
    setForm({
      id: "",
      name: "",
      description: "",
      icon: "",
      icon_image: "",
      active: true,
      show_on_home: false,
      display_order: 0,
    });
    setEditMode(false);
  };


  return (
    <div className="admin-page">
      <SuccessDialog
        isOpen={showSuccessDialog}
        message={successMessage}
        onClose={() => setShowSuccessDialog(false)}
      />

      <h1>📂 Manage Categories</h1>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError("")} className="alert-close">
            ✕
          </button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
          <button onClick={() => setSuccess("")} className="alert-close">
            ✕
          </button>
        </div>
      )}

      <div className="admin-form-card category-form-card">
        <div className="form-header">
          <h2>{editMode ? "✏️ Edit Category" : "➕ Add New Category"}</h2>
          <p className="form-subtitle">
            {editMode 
              ? "Update category information and save your changes" 
              : "Create a new category with an image and description"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="enhanced-form">
          <div className="form-section">
            <h3 className="section-title">📋 Basic Information</h3>
            
            <div className="form-group">
              <label>
                Category Name <span className="required">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Herbal Tea, Supplements, Essential Oils"
                className="enhanced-input"
                required
              />
            </div>

            <div className="form-group">
              <label>
                Description <span className="required">*</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief, engaging description of the category (e.g., Natural blends for wellness)"
                rows="3"
                className="enhanced-input"
                required
              />
              <small className="helper-text">Keep it concise and customer-friendly (max 100 characters recommended)</small>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">🖼️ Category Icon</h3>
            
            <div className="icon-upload-section">
              <div className="image-preview-container">
                {form.icon_image ? (
                  <div className="image-preview-wrapper">
                    <img 
                      src={form.icon_image} 
                      alt="Category icon" 
                      className="category-icon-preview"
                    />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => setForm({ ...form, icon_image: "" })}
                      title="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="no-image-placeholder">
                    <span className="placeholder-icon">🖼️</span>
                    <p>No image uploaded</p>
                  </div>
                )}
              </div>

              <div className="upload-controls">
                <ImageUpload 
                  label="Category Image"
                  currentImage={form.icon_image}
                  onUploadSuccess={(url) => setForm({ ...form, icon_image: url })}
                />
                <p className="upload-hint">
                  📸 Upload a high-quality image (recommended: 1080x1350px or larger, PNG or JPG)
                </p>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">⚙️ Settings</h3>
            
            <div className="form-row settings-row">
              <div className="form-group">
                <label>Display Order</label>
                <input
                  type="number"
                  value={form.display_order}
                  onChange={(e) => setForm({ ...form, display_order: e.target.value })}
                  min="0"
                  placeholder="0"
                  className="enhanced-input"
                />
                <small className="helper-text">Lower numbers appear first (0, 1, 2...)</small>
              </div>

              <div className="form-group toggle-group">
                <label className="toggle-label">
                  <div className="toggle-info">
                    <span className="toggle-title">Active Status</span>
                    <small className="toggle-description">Show this category on the website</small>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </label>
              </div>

              <div className="form-group toggle-group">
                <label className="toggle-label">
                  <div className="toggle-info">
                    <span className="toggle-title">🏠 Show on Home Page</span>
                    <small className="toggle-description">Display this category on the home page (max 4)</small>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={form.show_on_home}
                      onChange={(e) => setForm({ ...form, show_on_home: e.target.checked })}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </label>
              </div>
            </div>
          </div>

          <div className="form-actions enhanced-actions">
            <button 
              type="submit" 
              className="btn btn-primary btn-large"
            >
              {editMode ? (
                <>💾 Update Category</>
              ) : (
                <>➕ Add Category</>
              )}
            </button>
            {editMode && (
              <button 
                type="button" 
                onClick={resetForm} 
                className="btn btn-secondary btn-large"
              >
                ✕ Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="admin-table-card category-table-card">
        <div className="table-header">
          <h2>📋 All Categories</h2>
          <span className="count-badge">{categories.length} {categories.length === 1 ? 'Category' : 'Categories'}</span>
        </div>
        
        <div className="table-responsive">
          <table className="admin-table enhanced-table">
            <thead>
              <tr>
                <th className="icon-col">Image</th>
                <th className="name-col">Name</th>
                <th className="desc-col">Description</th>
                <th className="order-col">Order</th>
                <th className="status-col">Status</th>
                <th className="home-col">Home Page</th>
                <th className="actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-state">
                    <div className="empty-state-content">
                      <span className="empty-icon">📭</span>
                      <h3>No Categories Yet</h3>
                      <p>Add your first category using the form above!</p>
                    </div>
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category._id || category.id} className="category-row">
                    <td className="category-icon-cell">
                      {category.icon_image ? (
                        <img 
                          src={category.icon_image} 
                          alt={category.name}
                          className="category-thumbnail"
                        />
                      ) : (
                        <div className="no-image-thumbnail">
                          <span>📷</span>
                        </div>
                      )}
                    </td>
                    <td className="category-name">
                      <strong>{category.name}</strong>
                    </td>
                    <td className="category-description">{category.description}</td>
                    <td className="text-center">
                      <span className="order-badge">{category.display_order}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${category.active ? "active" : "inactive"}`}>
                        {category.active ? "✓ Active" : "✕ Inactive"}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className={`status-badge ${category.show_on_home ? "home-active" : "home-inactive"}`}>
                        {category.show_on_home ? "🏠 Yes" : "—"}
                      </span>
                      {category.is_default && (
                        <span className="status-badge" style={{ marginLeft: '8px', backgroundColor: '#fff3cd', color: '#856404', border: '1px solid #ffc107', fontSize: '0.7rem' }} title="Default category for product reassignment">
                          🔒 Default
                        </span>
                      )}
                    </td>
                    <td className="actions-cell">
                      <button
                        onClick={() => handleEdit(category)}
                        className="btn-icon btn-edit"
                        title="Edit category"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(category._id || category.id, category.name)}
                        className="btn-icon btn-delete"
                        title={category.is_default ? "Cannot delete default category" : "Delete category"}
                        disabled={category.is_default}
                        style={category.is_default ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
