import { useEffect, useState, useContext } from "react";
import api from "../api";
import { AuthContext } from "../AuthContext";
import { CartContext } from "../CartContext";
import { useNavigate } from "react-router-dom";

export default function Cart() {
  const [cart, setCart] = useState(null);
  const [products, setProducts] = useState({});
  const [error, setError] = useState("");
  const { user } = useContext(AuthContext);
  const { updateCartCount } = useContext(CartContext);
  const navigate = useNavigate();

  const loadCart = async () => {
    try {
      // Check if token exists
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const cartRes = await api.get("/cart/");
      console.log('📦 Cart API response:', cartRes.data);
      console.log('📦 First item:', cartRes.data[0]);

      // Backend returns array directly, not {items: [...]}
      const cartItems = Array.isArray(cartRes.data) ? cartRes.data : cartRes.data.items || [];
      console.log('📦 Cart items count:', cartItems.length);

      setCart({ items: cartItems });

      // Get unique product IDs
      const ids = cartItems.map((i) => i.product);
      console.log('🔢 Product IDs:', ids);

      if (ids.length > 0) {
        const prodsRes = await api.get("/products");
        const map = {};
        prodsRes.data.forEach((p) => {
          const productId = p.id || p._id;
          if (ids.includes(productId)) {
            console.log(`✅ Matched product ${productId}:`, p.name);
            map[productId] = p;
          }
        });
        console.log('🗺️ Products map:', map);
        setProducts(map);
      }
    } catch (err) {
      console.error("Cart loading error:", err);
      if (err.response?.status === 401) {
        // Token expired or invalid
        localStorage.clear();
        navigate("/login");
      } else {
        setError("Failed to load cart. Please try again.");
      }
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const updateQuantity = async (cartId, newQty) => {
    if (newQty < 1) return;
    try {
      await api.put(`/cart/${cartId}`, { quantity: newQty });
      await loadCart();
      updateCartCount();
    } catch (err) {
      console.error("Update quantity error:", err);
      alert("Failed to update quantity. Please try again.");
    }
  };

  const removeItem = async (cartId) => {
    try {
      await api.delete(`/cart/${cartId}/delete`);
      await loadCart();
      updateCartCount();
    } catch (err) {
      console.error("Remove item error:", err);
      alert("Failed to remove item. Please try again.");
    }
  };

  if (error) {
    return (
      <div className="page">
        <div className="error-message">
          <span className="error-icon">⚠</span>
          {error}
        </div>
      </div>
    );
  }

  if (!cart) return <div className="page">Loading cart...</div>;

  console.log('🛒 Rendering cart with items:', cart.items.length);

  const itemsWithData = cart.items.map((i, index) => {
    console.log(`🔍 Processing cart item ${index}:`, i);
    const product = products[i.product];
    console.log(`🔍 Found product for ID ${i.product}:`, product?.name || 'NOT FOUND');

    const qty = i.quantity || i.qty || 1;
    let priceData = { sale_price: product?.sale_price || 0, mrp: product?.mrp || 0, discount_percent: product?.discount_percent || 0 };
    let variantLabel = i.variant_label || null;

    // If variant exists, get the variant pricing
    if (i.variant && product?.quantity_variants) {
      const variant = product.quantity_variants.find(v => v.id === i.variant);
      if (variant) {
        priceData = { sale_price: variant.sale_price, mrp: variant.mrp, discount_percent: variant.discount_percent };
        variantLabel = variant.label;
      }
    }

    const result = {
      ...i,
      product,
      priceData,
      variantLabel,
      qty,
    };

    console.log(`✨ Item with data ${index}:`, result);
    return result;
  });

  console.log('📊 Total items with data:', itemsWithData.length);
  console.log('📊 Items with products:', itemsWithData.filter(i => i.product).length);

  const subtotal = itemsWithData.reduce((sum, i) => {
    if (!i.product) return sum;
    return sum + ((i.priceData.sale_price || 0) / 100) * i.qty;
  }, 0);

  const shipping = subtotal >= 2000 ? 0 : 50; // free over ₹2000
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + shipping + tax;

  return (
    <div className="page cart-page">
      <div className="cart-main">
        <h1>Your Cart</h1>
        <p className="muted">
          Free shipping on orders over ₹2,000. You are{" "}
          {subtotal >= 2000
            ? "eligible for free shipping!"
            : `₹${(2000 - subtotal).toFixed(2)} away from free shipping.`}
        </p>

        {itemsWithData.length === 0 && (
          <p className="muted">Your cart is empty.</p>
        )}

        {itemsWithData.map((item) =>
          !item.product ? null : (
            <div key={`${item.id || item.product}-${item.variant ?? 'default'}`} className="cart-item">
              <div className="cart-img">
                <img src={item.product.image || item.product.images?.[0] || item.product.image_urls?.[0]} alt={item.product.name} />
              </div>
              <div className="cart-info">
                <h3>{item.product.name}</h3>
                <p className="muted">{item.product.category_name || item.product.category}</p>
                {item.variantLabel && (
                  <p style={{ fontSize: "0.9rem", color: "#1F3556", fontWeight: "600", marginTop: "4px" }}>
                    Quantity: {item.variantLabel}
                  </p>
                )}
                <div className="quantity-controls">
                  <button
                    className="qty-btn"
                    onClick={() => updateQuantity(item.id, item.qty - 1)}
                    disabled={item.qty <= 1}
                  >
                    −
                  </button>
                  <span className="qty-display">{item.qty}</span>
                  <button
                    className="qty-btn"
                    onClick={() => updateQuantity(item.id, item.qty + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="cart-price">
                <p>
                  ₹{(((item.priceData.sale_price || 0) / 100) * item.qty).toFixed(2)}
                </p>
                <button
                  className="btn-remove"
                  onClick={() => removeItem(item.id)}
                  title="Remove item"
                >
                  ✕
                </button>
              </div>
            </div>
          )
        )}
      </div>

      <aside className="cart-summary">
        <h2>Order Summary</h2>
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
        <div className="summary-row total">
          <span>Total</span>
          <span>₹{total.toFixed(2)}</span>
        </div>
        <button
          className="btn primary full"
          onClick={() => navigate("/checkout")}
          disabled={itemsWithData.length === 0}
        >
          Proceed to Checkout
        </button>
      </aside>
    </div>
  );
}
