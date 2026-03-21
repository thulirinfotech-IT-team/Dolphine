import { useEffect, useState, useContext } from "react";
import api from "../api";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import DoctorVideos from "../components/DoctorVideos";
import StarRating from "../components/StarRating";
import Toast from "../components/Toast";

export default function Home() {
  const [banners, setBanners] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [best, setBest] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [toast, setToast] = useState({ isVisible: false, message: "", type: "success" });
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const showToast = (message, type = "success") => {
    setToast({ isVisible: true, message, type });
  };

  const hideToast = () => {
    setToast({ ...toast, isVisible: false });
  };

  useEffect(() => {
    api.get("/banners")
      .then((res) => {
        setBanners(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        console.error("Failed to load banners:", err);
        setBanners([]);
      });

    api.get("/products/home").then((res) => setBest(res.data));

    // Fetch all products for the marquee section
    api.get("/products").then((res) => setAllProducts(res.data));

    api.get("/categories/home")
      .then((res) => {
        // Get categories marked to show on home page (max 4)
        setCategories(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        console.error("Failed to load categories:", err);
        setCategories([]);
      });
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const handleBuy = async (id) => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      await api.post(`/cart/add`, null, { params: { product_id: id, qty: 1 } });
      navigate("/checkout");
    } catch (err) {
      showToast("Failed to proceed to checkout. Please try again.", "error");
    }
  };

  const handleAdd = async (id) => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      await api.post(`/cart/add`, null, { params: { product_id: id, qty: 1 } });
      showToast("Product added to cart successfully!", "success");
    } catch (err) {
      showToast("Failed to add product to cart. Please try again.", "error");
    }
  };

  return (
    <div className="home">
      {banners.length > 0 && (
        <div className="carousel-container">
          <div className="carousel-wrapper">
            {banners.map((banner, index) => (
              <section
                key={banner.id || banner._id || index}
                className={`hero carousel-slide ${index === currentSlide ? 'active' : ''}`}
                style={{ transform: `translateX(${(index - currentSlide) * 100}%)` }}
              >
                <div className="hero-text">
                  <p className="badge">New Collection</p>
                  <h1>{banner.title}</h1>
                  <p>{banner.subtitle}</p>
                  <div className="hero-actions">
                    <Link to="/products" className="btn primary">
                      Shop Natural
                    </Link>
                    <a href="#best" className="btn ghost">
                      Learn More
                    </a>
                  </div>
                </div>
                <div className="hero-image">
                  <img src={banner.image_url || banner.image} alt={banner.title || "Herbal banner"} />
                </div>
              </section>
            ))}
          </div>

          {banners.length > 1 && (
            <>
              <button className="carousel-btn prev" onClick={prevSlide}>
                ‹
              </button>
              <button className="carousel-btn next" onClick={nextSlide}>
                ›
              </button>

              <div className="carousel-dots">
                {banners.map((_, index) => (
                  <button
                    key={index}
                    className={`dot ${index === currentSlide ? 'active' : ''}`}
                    onClick={() => goToSlide(index)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <section className="categories-section">
        <div className="section-header">
          <h2>Shop by Category</h2>
        </div>
        <p className="section-subtitle">Explore our curated collection of natural wellness products</p>
        <div className="categories-grid">
          {categories.length > 0 ? (
            categories.map((category) => (
              <div key={category._id || category.id} className="category-card">
                <div className="category-icon">
                  <img
                    src={category.icon_image}
                    alt={category.name}
                    className="category-icon-image"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
                <h3>{category.name}</h3>
                <p>{category.description}</p>
                <Link
                  to={`/products?category=${encodeURIComponent(category.name)}`}
                  className="btn ghost category-view-btn"
                >
                  View Products →
                </Link>
              </div>
            ))
          ) : (
            <div className="no-categories-message">
              <p>No categories available. Please add categories in the admin panel.</p>
            </div>
          )}
        </div>
        <div className="section-view-all">
          <Link to="/categories" className="view-all-btn">
            View All Categories
          </Link>
        </div>
      </section>

      <section id="best" className="best">
        <div className="section-header">
          <h2>Our Best Sellers</h2>
        </div>
        <div className="grid">
          {best.map((p) => {
            // Get all available images for the product
            const productImages = p.image_urls && p.image_urls.length > 0
              ? p.image_urls
              : p.images && p.images.length > 0
              ? p.images
              : p.image
              ? [p.image]
              : ["/placeholder.svg"];

            const hasMultipleImages = productImages.length > 1;
            const productId = p.id || p._id;
            const isHovered = hoveredProduct === productId;
            const displayImage = isHovered && hasMultipleImages ? productImages[1] : productImages[0];

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
                    {hasMultipleImages && (
                      <div className="hover-indicator">
                        <span className="indicator-dot"></span>
                        <span className="indicator-dot"></span>
                      </div>
                    )}
                  </div>
                  <h3>{p.name}</h3>
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
                </Link>
                <div className="card-actions">
                  <button onClick={(e) => { e.stopPropagation(); handleAdd(productId); }} className="btn ghost">
                    Add to Cart
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleBuy(productId); }} className="btn primary">
                    Buy Now
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="section-view-all">
          <Link to="/products" className="view-all-btn">
            View All Products
          </Link>
        </div>
      </section>

      {/* Horizontal Scrolling Products Section */}
      {allProducts.length > 0 && (
        <section className="products-marquee-section">
          <div className="section-header">
            <h2>Explore All Products</h2>
          </div>
          <div
            className={`marquee-container ${isPaused ? 'paused' : ''}`}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div className="marquee-track">
              {/* First set of products */}
              {allProducts.map((p) => {
                const productImages = p.image_urls && p.image_urls.length > 0
                  ? p.image_urls
                  : p.images && p.images.length > 0
                  ? p.images
                  : p.image
                  ? [p.image]
                  : ["/placeholder.svg"];
                const productId = p.id || p._id;

                return (
                  <Link
                    key={`first-${productId}`}
                    to={`/products/${productId}`}
                    className="marquee-item"
                  >
                    <div className="marquee-item-image">
                      <img src={productImages[0]} alt={p.name} />
                    </div>
                    <div className="marquee-item-info">
                      <h4>{p.name}</h4>
                      <p className="marquee-price">
                        ₹{((p.sale_price || 0) / 100).toFixed(2)}
                        {p.discount_percent > 0 && (
                          <span className="marquee-discount">{p.discount_percent}% off</span>
                        )}
                      </p>
                    </div>
                  </Link>
                );
              })}
              {/* Duplicate set for seamless loop */}
              {allProducts.map((p) => {
                const productImages = p.image_urls && p.image_urls.length > 0
                  ? p.image_urls
                  : p.images && p.images.length > 0
                  ? p.images
                  : p.image
                  ? [p.image]
                  : ["/placeholder.svg"];
                const productId = p.id || p._id;

                return (
                  <Link
                    key={`second-${productId}`}
                    to={`/products/${productId}`}
                    className="marquee-item"
                  >
                    <div className="marquee-item-image">
                      <img src={productImages[0]} alt={p.name} />
                    </div>
                    <div className="marquee-item-info">
                      <h4>{p.name}</h4>
                      <p className="marquee-price">
                        ₹{((p.sale_price || 0) / 100).toFixed(2)}
                        {p.discount_percent > 0 && (
                          <span className="marquee-discount">{p.discount_percent}% off</span>
                        )}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="section-view-all">
            <Link to="/products" className="view-all-btn">
              View All Products
            </Link>
          </div>
        </section>
      )}

      <DoctorVideos />

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
}
