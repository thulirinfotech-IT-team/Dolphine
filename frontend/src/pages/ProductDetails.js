import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import { AuthContext } from "../AuthContext";
import { CartContext } from "../CartContext";
import StarRating from "../components/StarRating";
import SuccessDialog from "../components/SuccessDialog";

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ total: 0, avg_rating: 0, rating_breakdown: {} });
  const [canReview, setCanReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: "", comment: "" });
  const [submitting, setSubmitting] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [successDialog, setSuccessDialog] = useState({ show: false, message: "" });
  const { user } = useContext(AuthContext);
  const { updateCartCount } = useContext(CartContext);
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/products/${id}`).then((res) => setProduct(res.data));
    fetchReviews();
  }, [id]);

  useEffect(() => {
    if (user) {
      checkCanReview();
    }
  }, [user, id]);

  const fetchReviews = async () => {
    try {
      const res = await api.get(`/reviews/product/${id}`);
      setReviews(res.data.reviews || []);
      setReviewStats({
        total: res.data.total || 0,
        avg_rating: res.data.avg_rating || 0,
        rating_breakdown: res.data.rating_breakdown || {}
      });
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    }
  };

  const checkCanReview = async () => {
    try {
      const res = await api.get(`/reviews/user/can-review/${id}`);
      setCanReview(res.data.can_review);
      if (res.data.has_reviewed) {
        const existingReview = reviews.find(r => (r.id || r._id) === res.data.review_id);
        setUserReview(existingReview);
      }
    } catch (err) {
      console.error("Failed to check review status:", err);
    }
  };

  const ensureLogin = () => {
    if (!user) {
      navigate("/login");
      return false;
    }
    return true;
  };

  const handleAdd = async () => {
    if (!ensureLogin()) return;
    try {
      const params = { product_id: id, qty: 1 };
      if (selectedVariant !== null) {
        params.variant_index = selectedVariant;
      }
      await api.post("/cart/add", null, { params });
      updateCartCount();
      setSuccessDialog({ show: true, message: "Product added to the cart" });
    } catch (err) {
      alert("Failed to add product to cart. Please try again.");
    }
  };

  const handleBuy = async () => {
    if (!ensureLogin()) return;
    try {
      const params = { product_id: id, qty: 1 };
      if (selectedVariant !== null) {
        params.variant_index = selectedVariant;
      }
      await api.post("/cart/add", null, { params });
      updateCartCount();
      navigate("/cart");
    } catch (err) {
      alert("Failed to add product. Please try again.");
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }
    if (!reviewForm.comment.trim()) {
      alert("Please write a review comment");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/reviews/", {
        product_id: id,
        rating: reviewForm.rating,
        title: reviewForm.title,
        comment: reviewForm.comment
      });
      alert("Review submitted successfully!");
      setShowReviewForm(false);
      setReviewForm({ rating: 5, title: "", comment: "" });
      fetchReviews();
      setCanReview(false);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleHelpful = async (reviewId) => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      await api.post(`/reviews/${reviewId}/helpful`);
      fetchReviews();
    } catch (err) {
      console.error("Failed to mark helpful:", err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const getRatingPercentage = (star) => {
    if (reviewStats.total === 0) return 0;
    return ((reviewStats.rating_breakdown[star] || 0) / reviewStats.total) * 100;
  };

  if (!product) return <div className="page">Loading...</div>;

  // Get all available images
  const productImages = product.image_urls && product.image_urls.length > 0
    ? product.image_urls
    : product.images && product.images.length > 0
    ? product.images
    : product.image
    ? [product.image]
    : ["/placeholder.svg"];

  const currentImage = productImages[selectedImageIndex] || productImages[0];

  return (
    <div className="page product-detail">
      <div className="detail-main">
        <div className="detail-image-section">
          {/* Main Image Display */}
          <div className="detail-image">
            <img src={currentImage} alt={product.name} />
          </div>

          {/* Image Thumbnails */}
          {productImages.length > 1 && (
            <div className="image-thumbnails">
              {productImages.map((img, index) => (
                <div
                  key={index}
                  className={`thumbnail ${index === selectedImageIndex ? 'active' : ''}`}
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <img src={img} alt={`${product.name} ${index + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="detail-info">
          <span className="badge">In Stock</span>
          <h1>{product.name}</h1>
          <p className="muted">{product.category_name || product.category}</p>

          {/* Quantity Variants Selector */}
          {product.quantity_variants && product.quantity_variants.length > 0 && (
            <div className="quantity-variants" style={{ marginBottom: "20px" }}>
              <h3 style={{ fontSize: "1rem", marginBottom: "12px", color: "#0F172A" }}>
                Select Quantity
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                {/* Default product option */}
                <button
                  className={`variant-option ${selectedVariant === null ? 'active' : ''}`}
                  onClick={() => setSelectedVariant(null)}
                  style={{
                    padding: "12px 16px",
                    borderRadius: "8px",
                    border: selectedVariant === null ? "2px solid #1F3556" : "2px solid #e0e7ef",
                    background: selectedVariant === null ? "#f0f4f8" : "white",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ fontWeight: "600", color: "#0F172A", marginBottom: "4px" }}>
                    Standard
                  </div>
                  <div style={{ fontSize: "0.95rem", color: "#1F3556", fontWeight: "600" }}>
                    ₹{((product.sale_price || 0) / 100).toFixed(2)}
                  </div>
                  {product.discount_percent > 0 && (
                    <div style={{ fontSize: "0.8rem", color: "#6FAE4F", marginTop: "2px" }}>
                      {product.discount_percent}% off
                    </div>
                  )}
                </button>

                {/* Variant options */}
                {product.quantity_variants.map((variant, index) => (
                  <button
                    key={index}
                    className={`variant-option ${selectedVariant === index ? 'active' : ''}`}
                    onClick={() => setSelectedVariant(index)}
                    style={{
                      padding: "12px 16px",
                      borderRadius: "8px",
                      border: selectedVariant === index ? "2px solid #1F3556" : "2px solid #e0e7ef",
                      background: selectedVariant === index ? "#f0f4f8" : "white",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ fontWeight: "600", color: "#0F172A", marginBottom: "4px" }}>
                      {variant.label}
                    </div>
                    <div style={{ fontSize: "0.95rem", color: "#1F3556", fontWeight: "600" }}>
                      ₹{((variant.sale_price || 0) / 100).toFixed(2)}
                    </div>
                    {variant.discount_percent > 0 && (
                      <div style={{ fontSize: "0.8rem", color: "#6FAE4F", marginTop: "2px" }}>
                        {variant.discount_percent}% off
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Display selected price */}
          <p className="price big">
            ₹{selectedVariant !== null && product.quantity_variants[selectedVariant]
              ? ((product.quantity_variants[selectedVariant].sale_price || 0) / 100).toFixed(2)
              : ((product.sale_price || 0) / 100).toFixed(2)
            }
            {((selectedVariant !== null && product.quantity_variants[selectedVariant]?.discount_percent > 0) ||
              (selectedVariant === null && product.discount_percent > 0)) && (
              <>
                <span className="mrp">
                  ₹{selectedVariant !== null && product.quantity_variants[selectedVariant]
                    ? ((product.quantity_variants[selectedVariant].mrp || 0) / 100).toFixed(2)
                    : ((product.mrp || 0) / 100).toFixed(2)
                  }
                </span>
                <span className="discount-text">
                  {" • Save "}
                  {selectedVariant !== null && product.quantity_variants[selectedVariant]
                    ? product.quantity_variants[selectedVariant].discount_percent
                    : product.discount_percent
                  }%
                </span>
              </>
            )}
          </p>

          <p style={{ whiteSpace: "pre-line" }}>{product.description}</p>

          <ul className="bullet-list">
            {product.benefits?.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>

          <div className="detail-actions">
            <button className="btn ghost" onClick={handleAdd}>
              Add to Cart
            </button>
            <button className="btn primary" onClick={handleBuy}>
              Buy Now
            </button>
          </div>

          <div className="detail-extra">
            <h3>Ingredients</h3>
            <ul className="bullet-list">
              {product.ingredients?.map((ingredient, idx) => (
                <li key={idx}>{ingredient}</li>
              ))}
            </ul>
            <h3>How to Use</h3>
            <p style={{ whiteSpace: "pre-line" }}>{product.how_to_use}</p>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="reviews-section">
        <div className="reviews-header">
          <h2>Customer Reviews</h2>
          <div className="reviews-summary">
            <div className="rating-overview">
              <div className="rating-big">
                <span className="rating-number">{reviewStats.avg_rating.toFixed(1)}</span>
                <StarRating rating={reviewStats.avg_rating} size="large" />
                <span className="total-reviews">Based on {reviewStats.total} reviews</span>
              </div>
              <div className="rating-bars">
                {[5, 4, 3, 2, 1].map((star) => (
                  <div key={star} className="rating-bar-row">
                    <span className="star-label">{star} star</span>
                    <div className="rating-bar">
                      <div
                        className="rating-bar-fill"
                        style={{ width: `${getRatingPercentage(star)}%` }}
                      />
                    </div>
                    <span className="rating-count">
                      {reviewStats.rating_breakdown[star] || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Write Review Button/Form */}
        <div className="write-review-section">
          {!user ? (
            <button className="btn primary" onClick={() => navigate("/login")}>
              Login to Write a Review
            </button>
          ) : canReview ? (
            !showReviewForm ? (
              <button className="btn primary" onClick={() => setShowReviewForm(true)}>
                Write a Review
              </button>
            ) : (
              <form className="review-form" onSubmit={handleSubmitReview}>
                <h3>Write Your Review</h3>
                <div className="form-group">
                  <label>Your Rating</label>
                  <StarRating
                    rating={reviewForm.rating}
                    size="large"
                    interactive={true}
                    onRatingChange={(rating) => setReviewForm({ ...reviewForm, rating })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="review-title">Review Title (Optional)</label>
                  <input
                    id="review-title"
                    type="text"
                    placeholder="Summarize your review"
                    value={reviewForm.title}
                    onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="review-comment">Your Review</label>
                  <textarea
                    id="review-comment"
                    placeholder="Share your experience with this product..."
                    rows="4"
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    required
                  />
                </div>
                <div className="form-actions">
                  <button type="button" className="btn ghost" onClick={() => setShowReviewForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn primary" disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </form>
            )
          ) : userReview ? (
            <p className="already-reviewed">You have already reviewed this product</p>
          ) : null}
        </div>

        {/* Reviews List */}
        <div className="reviews-list">
          {reviews.length === 0 ? (
            <p className="no-reviews">No reviews yet. Be the first to review this product!</p>
          ) : (
            reviews.map((review) => (
              <div key={review._id} className="review-card">
                <div className="review-header">
                  <div className="reviewer-info">
                    <span className="reviewer-name">{review.user_name}</span>
                    {review.verified_purchase && (
                      <span className="verified-badge">Verified Purchase</span>
                    )}
                  </div>
                  <div className="review-meta">
                    <StarRating rating={review.rating} size="small" />
                    <span className="review-date">{formatDate(review.created_at)}</span>
                  </div>
                </div>
                {review.title && <h4 className="review-title">{review.title}</h4>}
                <p className="review-comment">{review.comment}</p>
                <div className="review-actions">
                  <button
                    className="helpful-btn"
                    onClick={() => handleHelpful(review._id)}
                  >
                    Helpful ({review.helpful_count})
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <SuccessDialog
        isOpen={successDialog.show}
        message={successDialog.message}
        onClose={() => setSuccessDialog({ show: false, message: "" })}
      />
    </div>
  );
}
