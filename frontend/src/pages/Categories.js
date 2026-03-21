import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/categories")
      .then((res) => {
        setCategories(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load categories:", err);
        setCategories([]);
        setLoading(false);
      });
  }, []);

  const handleCategoryClick = (categoryName) => {
    // Navigate to products page - in the future, this could filter by category
    navigate(`/products?category=${encodeURIComponent(categoryName)}`);
  };

  return (
    <div className="page">
      <div className="categories-page-header">
        <h1>All Categories</h1>
        <p>Explore our complete collection of natural wellness products by category</p>
      </div>

      {loading ? (
        <div className="loading-message">
          <p>Loading categories...</p>
        </div>
      ) : (
        <div className="categories-page-grid">
          {categories.length > 0 ? (
            categories.map((category) => (
              <div 
                key={category._id || category.id} 
                className="category-page-card"
                onClick={() => handleCategoryClick(category.name)}
              >
                <div className="category-page-icon">
                  {category.icon_image && (
                    <img 
                      src={category.icon_image} 
                      alt={category.name}
                      className="category-icon-image"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                </div>
                <div className="category-page-content">
                  <h3>{category.name}</h3>
                  <p>{category.description}</p>
                  <button className="btn ghost category-btn">
                    View Products →
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-categories-message">
              <p>No categories available at the moment.</p>
              <Link to="/" className="btn primary">
                Back to Home
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
