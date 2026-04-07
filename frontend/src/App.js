import { useContext, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, AuthContext } from "./AuthContext";
import { CartProvider } from "./CartContext";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Categories from "./pages/Categories";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import LoginWithOTP from "./pages/LoginWithOTP";
import RegisterWithOTP from "./pages/RegisterWithOTP";
import ForgotPassword from "./pages/ForgotPassword";
import About from "./pages/About";
import Contact from "./pages/Contact";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminBanner from "./pages/admin/AdminBanner";
import AdminDoctorVideos from "./pages/admin/AdminDoctorVideos";
import AdminCategories from "./pages/admin/AdminCategories";
import Layout from "./components/Layout";

const PrivateRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  return user && user.role === "admin" ? children : <Navigate to="/" />;
};

const BACKEND_URL = process.env.REACT_APP_API_URL || "";

export default function App() {
  // Wake up backend on app load (simple GET = no CORS preflight)
  useEffect(() => {
    if (BACKEND_URL) {
      fetch(`${BACKEND_URL}/api/health`).catch(() => {});
    }
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetails />} />
            <Route path="/categories" element={<Categories />} />
            <Route
              path="/cart"
              element={
                <PrivateRoute>
                  <Cart />
                </PrivateRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <PrivateRoute>
                  <Checkout />
                </PrivateRoute>
              }
            />
            <Route path="/login" element={<LoginWithOTP />} />
            <Route path="/register" element={<RegisterWithOTP />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route
              path="/admin/products"
              element={
                <AdminRoute>
                  <AdminProducts />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/banner"
              element={
                <AdminRoute>
                  <AdminBanner />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/doctor-videos"
              element={
                <AdminRoute>
                  <AdminDoctorVideos />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <AdminRoute>
                  <AdminCategories />
                </AdminRoute>
              }
            />
          </Routes>
        </Layout>
      </CartProvider>
    </AuthProvider>
  );
}
