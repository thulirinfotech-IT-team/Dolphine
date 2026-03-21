import { createContext, useState, useEffect, useContext } from "react";
import api from "./api";
import { AuthContext } from "./AuthContext";

export const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);
  const { user } = useContext(AuthContext);

  const fetchCartCount = async () => {
    if (!user) {
      setCartCount(0);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setCartCount(0);
        return;
      }

      const res = await api.get("/cart/");
      // Backend returns array directly, not {items: [...]}
      const items = Array.isArray(res.data) ? res.data : res.data.items || [];
      const totalItems = items.reduce((sum, item) => sum + (item.quantity || item.qty || 0), 0);
      setCartCount(totalItems);
    } catch (err) {
      console.error("Failed to fetch cart count:", err);
      setCartCount(0);
    }
  };

  useEffect(() => {
    fetchCartCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const updateCartCount = () => {
    fetchCartCount();
  };

  return (
    <CartContext.Provider value={{ cartCount, updateCartCount }}>
      {children}
    </CartContext.Provider>
  );
};
