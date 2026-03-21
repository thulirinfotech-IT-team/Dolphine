import { useEffect, useState } from "react";
import api from "../../api";
import MultipleImageUpload from "../../components/MultipleImageUpload";
import SuccessDialog from "../../components/SuccessDialog";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    id: "",
    name: "",
    description: "",
    category: "",
    mrp: "",
    sale_price: "",
    discount_percent: "",
    stock: "",
    image_urls: "",
    tags: "",
    benefits: "",
    ingredients: "",
    how_to_use: "",
    show_on_home: false,
    quantity_variants: [],
  });
  const [variantForm, setVariantForm] = useState({
    label: "",
    mrp: "",
    sale_price: "",
    discount_percent: "",
    stock: "",
  });

  const loadCategories = async () => {
    try {
      const res = await api.get("/categories");
      setCategories(res.data);
      // Set default category to first category or "Herbals"
      if (res.data.length > 0 && !form.category) {
        const defaultCat = res.data.find(c => c.name === "Herbals") || res.data[0];
        setForm(prev => ({ ...prev, category: defaultCat.name }));
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  const load = async () => {
    try {
      const res = await api.get("/products");
      setProducts(res.data);
    } catch (err) {
      console.error("Failed to load products:", err);
      setError("Failed to load products");
    }
  };

  useEffect(() => {
    loadCategories();
    load();
  }, []);

  const resetForm = () => {
    const defaultCat = categories.find(c => c.name === "Herbals") || categories[0];
    setForm({
      id: "",
      name: "",
      description: "",
      category: defaultCat ? defaultCat.name : "",
      mrp: "",
      sale_price: "",
      discount_percent: "",
      stock: "",
      image_urls: "",
      tags: "",
      benefits: "",
      ingredients: "",
      how_to_use: "",
      show_on_home: false,
      quantity_variants: [],
    });
    setVariantForm({
      label: "",
      mrp: "",
      sale_price: "",
      discount_percent: "",
      stock: "",
    });
    setEditMode(false);
  };

  const addVariant = () => {
    if (!variantForm.label || !variantForm.mrp || !variantForm.sale_price) {
      setError("Variant label, MRP and sale price are required");
      return;
    }

    if (Number(variantForm.sale_price) > Number(variantForm.mrp)) {
      setError("Variant sale price cannot be greater than MRP");
      return;
    }

    const newVariant = {
      label: variantForm.label,
      mrp: Math.round(Number(variantForm.mrp) * 100),
      sale_price: Math.round(Number(variantForm.sale_price) * 100),
      discount_percent: Number(variantForm.discount_percent) || 0,
      stock: Number(variantForm.stock) || 0,
    };

    setForm({ ...form, quantity_variants: [...form.quantity_variants, newVariant] });
    setVariantForm({
      label: "",
      mrp: "",
      sale_price: "",
      discount_percent: "",
      stock: "",
    });
    setError("");
  };

  const removeVariant = (index) => {
    const updatedVariants = form.quantity_variants.filter((_, i) => i !== index);
    setForm({ ...form, quantity_variants: updatedVariants });
  };

  const handleEdit = (product) => {
    const defaultCat = categories.find(c => c.name === "Herbals") || categories[0];
    setForm({
      id: product._id,
      name: product.name,
      description: product.description,
      category: product.category || (defaultCat ? defaultCat.name : ""),
      mrp: (product.mrp / 100).toFixed(2),
      sale_price: (product.sale_price / 100).toFixed(2),
      discount_percent: product.discount_percent || "",
      stock: product.stock || "",
      image_urls: product.image_urls ? product.image_urls.join(", ") : "",
      tags: product.tags ? product.tags.join(", ") : "",
      benefits: product.benefits ? product.benefits.join(", ") : "",
      ingredients: product.ingredients ? product.ingredients.join(", ") : "",
      how_to_use: product.how_to_use || "",
      show_on_home: product.show_on_home || false,
      quantity_variants: product.quantity_variants || [],
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
    if (!form.name || !form.description) {
      setError("Name and description are required");
      setLoading(false);
      return;
    }

    if (!form.mrp || !form.sale_price) {
      setError("MRP and Sale Price are required");
      setLoading(false);
      return;
    }

    if (Number(form.sale_price) > Number(form.mrp)) {
      setError("Sale price cannot be greater than MRP");
      setLoading(false);
      return;
    }

    // Check if trying to enable show_on_home and there are already 4 products
    if (form.show_on_home) {
      const homeProducts = products.filter(prod => 
        prod.show_on_home && prod._id !== form.id
      );
      if (homeProducts.length >= 4) {
        setError("❌ Maximum 4 products can be displayed on the home page. Please disable another product first.");
        setLoading(false);
        return;
      }
    }

    try {
      const payload = {
        name: form.name,
        description: form.description,
        category: form.category,
        mrp: Math.round(Number(form.mrp) * 100),
        sale_price: Math.round(Number(form.sale_price) * 100),
        discount_percent: Number(form.discount_percent) || 0,
        stock: Number(form.stock) || 0,
        image_urls: form.image_urls ? form.image_urls.split(",").map(url => url.trim()) : [],
        tags: form.tags ? form.tags.split(",").map(tag => tag.trim()) : [],
        benefits: form.benefits ? form.benefits.split(",").map(b => b.trim()) : [],
        ingredients: form.ingredients ? form.ingredients.split(",").map(i => i.trim()) : [],
        how_to_use: form.how_to_use || "",
        show_on_home: form.show_on_home,
        quantity_variants: form.quantity_variants || [],
      };

      if (editMode && form.id) {
        // Update existing product
        await api.put(`/admin/products/${form.id}`, payload);
        setSuccessMessage("Product updated successfully!");
      } else {
        // Create new product
        await api.post("/admin/products", payload);
        setSuccessMessage("Product added successfully!");
      }

      resetForm();
      await load();
      setShowSuccessDialog(true);
    } catch (err) {
      console.error("Failed to add product:", err);
      setError(err.response?.data?.detail || "Failed to add product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      await api.delete(`/admin/products/${productId}`);
      setSuccessMessage("Product deleted successfully!");
      await load();
      setShowSuccessDialog(true);
    } catch (err) {
      console.error("Failed to delete product:", err);
      setError("Failed to delete product. Please try again.");
    }
  };

  return (
    <div className="admin-page">
      <SuccessDialog
        isOpen={showSuccessDialog}
        message={successMessage}
        onClose={() => setShowSuccessDialog(false)}
      />

      <h2>{editMode ? "Edit Product" : "Add Product"}</h2>

      {editMode && (
        <button
          onClick={resetForm}
          className="btn ghost"
          style={{ marginBottom: "16px" }}
        >
          ← Cancel Edit
        </button>
      )}

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
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="name">Product Name *</label>
            <input
              id="name"
              placeholder="e.g. Organic Green Tea"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              disabled={loading}
              required
            >
              {categories.length === 0 ? (
                <option value="">Loading categories...</option>
              ) : (
                categories.map((cat) => (
                  <option key={cat._id || cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))
              )}
            </select>
            <small className="form-hint">Categories are managed in Admin Categories</small>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            placeholder="Detailed product description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows="3"
            required
            disabled={loading}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="mrp">MRP (₹) *</label>
            <input
              id="mrp"
              placeholder="e.g. 299"
              type="number"
              step="0.01"
              min="0"
              value={form.mrp}
              onChange={(e) => {
                const mrp = e.target.value;
                const discount = Number(form.discount_percent) || 0;
                const salePrice = mrp && discount > 0
                  ? (Number(mrp) * (1 - discount / 100)).toFixed(2)
                  : mrp;
                setForm({ ...form, mrp, sale_price: salePrice });
              }}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="discount_percent">Discount %</label>
            <input
              id="discount_percent"
              placeholder="e.g. 17"
              type="number"
              min="0"
              max="100"
              value={form.discount_percent}
              onChange={(e) => {
                const discount = e.target.value;
                const mrp = Number(form.mrp) || 0;
                const salePrice = mrp && discount > 0
                  ? (mrp * (1 - Number(discount) / 100)).toFixed(2)
                  : form.mrp;
                setForm({ ...form, discount_percent: discount, sale_price: salePrice });
              }}
              disabled={loading}
            />
            <small className="form-hint">Sale price will be auto-calculated</small>
          </div>

          <div className="form-group">
            <label htmlFor="sale_price">Sale Price (₹) *</label>
            <input
              id="sale_price"
              placeholder="e.g. 249"
              type="number"
              step="0.01"
              min="0"
              value={form.sale_price}
              onChange={(e) => setForm({ ...form, sale_price: e.target.value })}
              required
              disabled={loading}
            />
            <small className="form-hint">Auto-calculated or enter manually</small>
          </div>

          <div className="form-group">
            <label htmlFor="stock">Stock Quantity</label>
            <input
              id="stock"
              placeholder="e.g. 100"
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              disabled={loading}
            />
          </div>
        </div>

        <MultipleImageUpload
          label="Product Images"
          currentImages={form.image_urls ? form.image_urls.split(",").map(u => u.trim()).filter(u => u) : []}
          onImagesChange={(imageUrls) => {
            setForm({ ...form, image_urls: imageUrls.join(", ") });
          }}
        />

        <div className="form-group">
          <label htmlFor="image_urls">Or Enter Image URLs Manually (comma-separated)</label>
          <input
            id="image_urls"
            placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
            value={form.image_urls}
            onChange={(e) => setForm({ ...form, image_urls: e.target.value })}
            disabled={loading}
          />
          <small className="form-hint">Enter multiple URLs separated by commas, or use the upload tool above</small>
        </div>

        <div className="form-group">
          <label htmlFor="tags">Tags (comma-separated)</label>
          <input
            id="tags"
            placeholder="organic, herbal, caffeine-free"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="benefits">Benefits (comma-separated)</label>
          <textarea
            id="benefits"
            placeholder="Boosts immunity, Aids digestion, Rich in antioxidants"
            value={form.benefits}
            onChange={(e) => setForm({ ...form, benefits: e.target.value })}
            rows="2"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="ingredients">Ingredients (comma-separated)</label>
          <textarea
            id="ingredients"
            placeholder="Green tea leaves, Tulsi, Ginger, Lemon"
            value={form.ingredients}
            onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
            rows="2"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="how_to_use">How to Use</label>
          <textarea
            id="how_to_use"
            placeholder="Add 1 teaspoon to hot water, steep for 3-5 minutes"
            value={form.how_to_use}
            onChange={(e) => setForm({ ...form, how_to_use: e.target.value })}
            rows="2"
            disabled={loading}
          />
        </div>

        {/* Quantity Variants Section */}
        <div className="form-group" style={{ marginTop: "32px", padding: "20px", background: "#F5F9FC", borderRadius: "12px" }}>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "16px", color: "#0F172A" }}>
            📦 Quantity Variants (Optional)
          </h3>
          <p style={{ fontSize: "0.9rem", color: "#475569", marginBottom: "16px" }}>
            Add different quantity options for this product (e.g., 50g, 100g, 250g). Each variant can have its own price and stock.
          </p>

          {/* Add Variant Form */}
          <div style={{ background: "white", padding: "16px", borderRadius: "8px", marginBottom: "16px" }}>
            <div className="form-row" style={{ gap: "12px" }}>
              <div className="form-group" style={{ flex: "2" }}>
                <label htmlFor="variant_label">Variant Label *</label>
                <input
                  id="variant_label"
                  placeholder="e.g., 50g, 100ml, Pack of 3"
                  value={variantForm.label}
                  onChange={(e) => setVariantForm({ ...variantForm, label: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className="form-group" style={{ flex: "1" }}>
                <label htmlFor="variant_mrp">MRP (₹) *</label>
                <input
                  id="variant_mrp"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="299"
                  value={variantForm.mrp}
                  onChange={(e) => {
                    const mrp = e.target.value;
                    const discount = Number(variantForm.discount_percent) || 0;
                    const salePrice = mrp && discount > 0
                      ? (Number(mrp) * (1 - discount / 100)).toFixed(2)
                      : mrp;
                    setVariantForm({ ...variantForm, mrp, sale_price: salePrice });
                  }}
                  disabled={loading}
                />
              </div>

              <div className="form-group" style={{ flex: "1" }}>
                <label htmlFor="variant_discount">Discount %</label>
                <input
                  id="variant_discount"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="17"
                  value={variantForm.discount_percent}
                  onChange={(e) => {
                    const discount = e.target.value;
                    const mrp = Number(variantForm.mrp) || 0;
                    const salePrice = mrp && discount > 0
                      ? (mrp * (1 - Number(discount) / 100)).toFixed(2)
                      : variantForm.mrp;
                    setVariantForm({ ...variantForm, discount_percent: discount, sale_price: salePrice });
                  }}
                  disabled={loading}
                />
              </div>

              <div className="form-group" style={{ flex: "1" }}>
                <label htmlFor="variant_sale_price">Sale Price (₹) *</label>
                <input
                  id="variant_sale_price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="249"
                  value={variantForm.sale_price}
                  onChange={(e) => setVariantForm({ ...variantForm, sale_price: e.target.value })}
                  disabled={loading}
                />
                <small style={{ fontSize: "0.75rem", color: "#6c757d" }}>Auto-calculated</small>
              </div>

              <div className="form-group" style={{ flex: "1" }}>
                <label htmlFor="variant_stock">Stock</label>
                <input
                  id="variant_stock"
                  type="number"
                  min="0"
                  placeholder="100"
                  value={variantForm.stock}
                  onChange={(e) => setVariantForm({ ...variantForm, stock: e.target.value })}
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="button"
              className="btn ghost"
              onClick={addVariant}
              disabled={loading}
              style={{ marginTop: "8px" }}
            >
              + Add Variant
            </button>
          </div>

          {/* Display Added Variants */}
          {form.quantity_variants.length > 0 && (
            <div>
              <h4 style={{ fontSize: "0.95rem", marginBottom: "12px", color: "#0F172A" }}>
                Added Variants ({form.quantity_variants.length})
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {form.quantity_variants.map((variant, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      background: "white",
                      borderRadius: "8px",
                      border: "1px solid #e0e7ef",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <strong style={{ color: "#0F172A" }}>{variant.label}</strong>
                      <span style={{ color: "#475569", marginLeft: "12px" }}>
                        ₹{(variant.sale_price / 100).toFixed(2)}
                      </span>
                      {variant.discount_percent > 0 && (
                        <span style={{ color: "#6FAE4F", marginLeft: "8px", fontSize: "0.85rem" }}>
                          ({variant.discount_percent}% off)
                        </span>
                      )}
                      <span style={{ color: "#94A3B8", marginLeft: "12px", fontSize: "0.85rem" }}>
                        Stock: {variant.stock}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn-delete"
                      onClick={() => removeVariant(index)}
                      disabled={loading}
                      style={{ fontSize: "0.85rem", padding: "6px 12px" }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="form-group toggle-group">
          <label className="toggle-label">
            <div className="toggle-info">
              <span className="toggle-title">🏠 Show on Home Page</span>
              <small className="toggle-description">Display this product on the home page (max 4)</small>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={form.show_on_home}
                onChange={(e) => setForm({ ...form, show_on_home: e.target.checked })}
                disabled={loading}
              />
              <span className="toggle-slider"></span>
            </label>
          </label>
        </div>

        <button className="btn primary" type="submit" disabled={loading}>
          {loading ? (editMode ? "Updating..." : "Adding...") : (editMode ? "Update Product" : "Add Product")}
        </button>
        {editMode && (
          <button
            type="button"
            className="btn ghost"
            onClick={resetForm}
            style={{ marginLeft: "12px" }}
          >
            Cancel
          </button>
        )}
      </form>

      <h2 style={{ marginTop: "48px" }}>All Products ({products.length})</h2>
      <div className="grid">
        {products.map((p) => (
          <div key={p._id} className="product-card small admin-product-card">
            <img src={p.image_urls?.[0] || "/placeholder.svg"} alt={p.name} />
            <h4>{p.name}</h4>
            <p className="product-category">{p.category}</p>
            <p className="product-price">₹{(p.sale_price / 100).toFixed(2)}</p>
            <p className="product-stock">Stock: {p.stock || 0}</p>
            {p.show_on_home && (
              <span className="status-badge home-active" style={{ fontSize: '0.75rem', padding: '4px 8px', marginTop: '8px', display: 'inline-block' }}>
                🏠 On Home Page
              </span>
            )}
            <div className="admin-card-actions">
              <button
                className="btn-edit"
                onClick={() => handleEdit(p)}
                title="Edit product"
              >
                Edit
              </button>
              <button
                className="btn-delete"
                onClick={() => deleteProduct(p._id)}
                title="Delete product"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
