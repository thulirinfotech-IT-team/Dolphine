import { useEffect, useState, useContext } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api";
import { AuthContext } from "../AuthContext";
import StarRating from "../components/StarRating";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    // Load products and categories
    api.get("/products").then((res) => setProducts(res.data));
    api.get("/categories").then((res) => setCategories(res.data));

    // Check if there's a category parameter in URL
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      setSelectedCategory(decodeURIComponent(categoryParam));
    }

    // Check if there's a search parameter in URL
    const searchParam = searchParams.get("search");
    if (searchParam) {
      setSearch(decodeURIComponent(searchParam));
    }
  }, [searchParams]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    if (category) {
      setSearchParams({ category: encodeURIComponent(category) });
    } else {
      setSearchParams({});
    }
  };

  const filtered = products.filter((p) => {
    const price = (p.sale_price || 0) / 100; // Convert paise to rupees
    const text = p.name.toLowerCase().includes(search.toLowerCase());
    const aboveMin = minPrice === "" || price >= Number(minPrice);
    const belowMax = maxPrice === "" || price <= Number(maxPrice);
    // Use category_name for filtering (not category ID)
    const matchCategory = selectedCategory === "" || p.category_name === selectedCategory;
    return text && aboveMin && belowMax && matchCategory;
  });

  const ensureLogin = () => {
    if (!user) {
      navigate("/login");
      return false;
    }
    return true;
  };

  const handleAdd = async (id) => {
    if (!ensureLogin()) return;
    try {
      console.log('Adding to cart, product_id:', id);
      await api.post("/cart/add", null, { params: { product_id: id, qty: 1 } });
      alert("Product added to cart successfully!");
    } catch (err) {
      console.error("Cart add error:", err.response?.data || err.message);
      alert(`Failed to add product to cart: ${err.response?.data?.detail || 'Please try again'}`);
    }
  };

  const handleBuy = async (id) => {
    if (!ensureLogin()) return;
    try {
      await api.post("/cart/add", null, { params: { product_id: id, qty: 1 } });
      navigate("/checkout");
    } catch (err) {
      alert("Failed to proceed to checkout. Please try again.");
    }
  };

  return (
    <div className="page">
      <div className="products-header">
        <h1>Shop Nature&apos;s Best</h1>
        <p>Ethically sourced herbal remedies and skincare in Indian rupees.</p>
      </div>

      <div className="filters-section">
        {/* Category Filter */}
        <div className="category-filter">
          <h3>Categories</h3>
          <div className="category-chips">
            <button
              className={`category-chip ${selectedCategory === "" ? "active" : ""}`}
              onClick={() => handleCategoryChange("")}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id || cat.id}
                className={`category-chip ${selectedCategory === cat.name ? "active" : ""}`}
                onClick={() => handleCategoryChange(cat.name)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Search and Price Filters */}
        <div className="filters">
          <input
            className="input"
            placeholder="Search products"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          
          <div className="price-filter">
            <input
              className="input"
              type="number"
              placeholder="Min ₹"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <span>-</span>
            <input
              className="input"
              type="number"
              placeholder="Max ₹"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
        </div>

        {/* Active Filters Display */}
        {(selectedCategory || search || minPrice || maxPrice) && (
          <div className="active-filters">
            <span className="filter-label">Active Filters:</span>
            {selectedCategory && (
              <span className="filter-tag">
                Category: {selectedCategory}
                <button onClick={() => handleCategoryChange("")}>×</button>
              </span>
            )}
            {search && (
              <span className="filter-tag">
                Search: "{search}"
                <button onClick={() => setSearch("")}>×</button>
              </span>
            )}
            {(minPrice || maxPrice) && (
              <span className="filter-tag">
                Price: ₹{minPrice || "0"} - ₹{maxPrice || "∞"}
                <button onClick={() => { setMinPrice(""); setMaxPrice(""); }}>×</button>
              </span>
            )}
            <button 
              className="clear-all-filters"
              onClick={() => {
                setSelectedCategory("");
                setSearch("");
                setMinPrice("");
                setMaxPrice("");
                setSearchParams({});
              }}
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      <div className="product-grid">
        {filtered.map((p) => {
          // Get all available images for the product
          const productImages = p.image_urls && p.image_urls.length > 0
            ? p.image_urls
            : p.images && p.images.length > 0
            ? p.images
            : p.image
            ? [p.image]
            : ["/placeholder.svg"];

          const productId = p.id || p._id;
          const currentIndex = currentImageIndex[productId] || 0;
          const displayImage = productImages[currentIndex] || productImages[0];
          const hasMultipleImages = productImages.length > 1;

          return (
            <div
              key={productId}
              className="product-card"
              onMouseEnter={() => setHoveredProduct(productId)}
              onMouseLeave={() => setHoveredProduct(null)}
            >
              <Link to={`/products/${productId}`} className="product-card-link">
                <div className="img-wrap">
                  <img src={displayImage} alt={p.name} />

                  {/* Image dots indicator */}
                  {hasMultipleImages && (
                    <div className="image-dots">
                      {productImages.map((_, index) => (
                        <span
                          key={index}
                          className={`dot ${index === currentIndex ? 'active' : ''}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setCurrentImageIndex(prev => ({ ...prev, [productId]: index }));
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <div className="card-body">
                  <h3>{p.name}</h3>
                  <p className="muted">{p.category_name}</p>
                  {(p.avg_rating > 0 || p.review_count > 0) && (
                    <div className="product-rating">
                      <StarRating rating={p.avg_rating || 0} size="small" />
                      <span className="review-count">({p.review_count || 0})</span>
                    </div>
                  )}
                  <p className="price">
                    ₹{((p.sale_price || 0) / 100).toFixed(2)}
                    {p.discount_percent > 0 && (
                      <>
                        <span className="mrp">₹{((p.mrp || 0) / 100).toFixed(2)}</span>
                        <span className="discount-text"> • {p.discount_percent}% off</span>
                      </>
                    )}
                  </p>
                </div>
              </Link>
              <div className="card-actions">
                <button
                  className="btn ghost"
                  onClick={(e) => { e.stopPropagation(); handleAdd(productId); }}
                >
                  Add to Cart
                </button>
                <button
                  className="btn primary"
                  onClick={(e) => { e.stopPropagation(); handleBuy(productId); }}
                >
                  Buy Now
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="muted">No products match your filters.</p>
        )}
      </div>
    </div>
  );
}
