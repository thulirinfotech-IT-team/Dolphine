import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { AuthContext } from "../AuthContext";
import { initiateRazorpayPayment } from "../utils/razorpay";
import PremiumSuccessDialog from "../components/PremiumSuccessDialog";

export default function Checkout() {
  const [cart, setCart] = useState(null);
  const [products, setProducts] = useState({});
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successDialog, setSuccessDialog] = useState({ show: false, title: "", message: "" });
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [deliveryInfo, setDeliveryInfo] = useState({
    name: "",
    mobile: "",
    address: "",
    city: "",
    state: "",
    pincode: ""
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    loadCart();
  }, [user, navigate]);

  const loadCart = async () => {
    try {
      const cartRes = await api.get("/cart/");
      // Backend returns array directly, not {items: [...]}
      const cartItems = Array.isArray(cartRes.data) ? cartRes.data : cartRes.data.items || [];
      setCart({ items: cartItems });

      const ids = cartItems.map((i) => i.product);
      if (ids.length > 0) {
        const prodsRes = await api.get("/products");
        const map = {};
        prodsRes.data.forEach((p) => {
          const productId = p.id || p._id;
          if (ids.includes(productId)) map[productId] = p;
        });
        setProducts(map);
      }
    } catch (err) {
      console.error("Cart loading error:", err);
      setError("Failed to load cart. Please try again.");
    }
  };

  const handleInputChange = (e) => {
    setDeliveryInfo({
      ...deliveryInfo,
      [e.target.name]: e.target.value
    });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validation
    if (!deliveryInfo.name || !deliveryInfo.mobile || !deliveryInfo.address ||
        !deliveryInfo.city || !deliveryInfo.state || !deliveryInfo.pincode) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }

    if (deliveryInfo.mobile.length !== 10) {
      setError("Mobile number must be 10 digits");
      setLoading(false);
      return;
    }

    if (deliveryInfo.pincode.length !== 6) {
      setError("Pincode must be 6 digits");
      setLoading(false);
      return;
    }

    try {
      const orderResponse = await api.post("/orders/create", {
        shipping: {
          name: deliveryInfo.name,
          email: user.email,
          mobile: deliveryInfo.mobile,
          address: deliveryInfo.address,
          city: deliveryInfo.city || "Unknown",
          state: deliveryInfo.state || "Unknown",
          pincode: deliveryInfo.pincode
        },
        payment_method: paymentMethod
      });

      const orderId = orderResponse.data.order_id;

      // If payment method is online, initiate Razorpay
      if (paymentMethod === "online") {
        setLoading(false);
        initiateRazorpayPayment({
          amount: total,
          orderId: orderId,
          user: user,
          onSuccess: (data) => {
            setSuccessDialog({
              show: true,
              title: "Payment Successful!",
              message: `Your order has been placed successfully. Order ID: ${orderId}`
            });
          },
          onFailure: (error) => {
            setError(`Payment failed: ${error.message}`);
            setLoading(false);
          }
        });
      } else {
        // COD - Show success dialog directly
        setSuccessDialog({
          show: true,
          title: "Order Placed!",
          message: `Your order has been placed successfully with Cash on Delivery. Order ID: ${orderId}`
        });
        setLoading(false);
      }
    } catch (err) {
      console.error("Order placement error:", err);
      setError("Failed to place order. Please try again.");
      setLoading(false);
    }
  };

  if (!cart || !cart.items) return <div className="page">Loading...</div>;

  const itemsWithData = cart.items.map((i) => {
    const product = products[i.product];
    const qty = i.quantity || i.qty || 1;
    return {
      ...i,
      product,
      qty,
    };
  });

  const subtotal = itemsWithData.reduce((sum, i) => {
    if (!i.product) return sum;
    return sum + ((i.product.sale_price || 0) / 100) * i.qty;
  }, 0);

  const shipping = subtotal >= 2000 ? 0 : 50;
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + shipping + tax;

  return (
    <div className="page checkout-page">
      <h1>Checkout</h1>

      <div className="checkout-container">
        <div className="checkout-left">
          <div className="checkout-section">
            <h2>Delivery Information</h2>
            <form onSubmit={handlePlaceOrder}>
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  className="checkout-input"
                  placeholder="Enter your full name"
                  value={deliveryInfo.name}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="mobile">Mobile Number *</label>
                <input
                  id="mobile"
                  type="tel"
                  name="mobile"
                  className="checkout-input"
                  placeholder="10-digit mobile number"
                  value={deliveryInfo.mobile}
                  onChange={handleInputChange}
                  pattern="[0-9]{10}"
                  maxLength="10"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="address">Delivery Address *</label>
                <textarea
                  id="address"
                  name="address"
                  className="checkout-input"
                  placeholder="Enter your complete address"
                  value={deliveryInfo.address}
                  onChange={handleInputChange}
                  rows="3"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="city">City *</label>
                <input
                  id="city"
                  type="text"
                  name="city"
                  className="checkout-input"
                  placeholder="Enter your city"
                  value={deliveryInfo.city}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="state">State *</label>
                <input
                  id="state"
                  type="text"
                  name="state"
                  className="checkout-input"
                  placeholder="Enter your state"
                  value={deliveryInfo.state}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="pincode">Pincode *</label>
                <input
                  id="pincode"
                  type="text"
                  name="pincode"
                  className="checkout-input"
                  placeholder="6-digit pincode"
                  value={deliveryInfo.pincode}
                  onChange={handleInputChange}
                  pattern="[0-9]{6}"
                  maxLength="6"
                  required
                  disabled={loading}
                />
              </div>
            </form>
          </div>

          <div className="checkout-section">
            <h2>Payment Method</h2>
            <div className="payment-methods">
              <label className="payment-option">
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  disabled={loading}
                />
                <div className="payment-details">
                  <strong>💵 Cash on Delivery (COD)</strong>
                  <p>Pay when you receive your order ✅ Recommended for testing</p>
                </div>
              </label>

              <label className="payment-option">
                <input
                  type="radio"
                  name="payment"
                  value="online"
                  checked={paymentMethod === "online"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  disabled={loading}
                />
                <div className="payment-details">
                  <strong>💳 Online Payment (Razorpay)</strong>
                  <p>UPI, Cards, NetBanking, Wallets - Secure Payment</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="checkout-right">
          <div className="order-summary-box">
            <h2>Order Summary</h2>

            <div className="order-items">
              {itemsWithData.map((item) => {
                if (!item.product) return null;
                const qty = item.quantity || item.qty || 0;
                return (
                  <div key={item.product_id} className="summary-item">
                    <div className="summary-item-info">
                      <span>{item.product.name}</span>
                      <span className="item-qty">x{qty}</span>
                    </div>
                    <span className="item-price">
                      ₹{(((item.product.sale_price || 0) / 100) * qty).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="summary-divider"></div>

            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span>{shipping ? `₹${shipping.toFixed(2)}` : "Free"}</span>
            </div>
            <div className="summary-row">
              <span>Tax (5%)</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-row total">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>

            {error && (
              <div className="error-message" style={{ marginTop: "16px" }}>
                <span className="error-icon">⚠</span>
                {error}
              </div>
            )}

            <button
              onClick={handlePlaceOrder}
              className={`btn primary full ${loading ? 'loading' : ''}`}
              disabled={loading || itemsWithData.length === 0}
            >
              {loading ? "Placing Order..." : "Place Order"}
            </button>
          </div>
        </div>
      </div>

      <PremiumSuccessDialog
        isOpen={successDialog.show}
        title={successDialog.title}
        message={successDialog.message}
        onClose={() => {
          setSuccessDialog({ show: false, title: "", message: "" });
          navigate("/");
        }}
      />
    </div>
  );
}
