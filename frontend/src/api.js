import axios from "axios";

// Use environment variable in production, proxy in development
const API_BASE_URL = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api`
  : "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Retry failed requests (handles Render free tier cold start ~50s spin-up)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    // No response = CORS/network error (backend sleeping)
    if (!error.response) {
      if (!config._retryCount) config._retryCount = 0;
      if (config._retryCount < 3) {
        config._retryCount += 1;
        // Wait longer each retry: 15s, 20s, 25s
        const delay = 10000 + config._retryCount * 5000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return api(config);
      }
    }
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect on auth endpoints (login, register, OTP verification)
      const authEndpoints = ['/auth/login', '/auth/login-verify-credentials', '/auth/send-otp', '/auth/verify-otp', '/auth/login-with-otp', '/auth/register-with-otp', '/auth/forgot-password', '/auth/reset-password'];
      const isAuthEndpoint = authEndpoints.some(endpoint => error.config?.url?.includes(endpoint));

      if (!isAuthEndpoint) {
        // Token expired or invalid for protected routes
        console.error("Authentication failed. Please login again.");

        // Clear invalid token
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Show alert and redirect to login
        alert('Your session has expired. Please login again.');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
