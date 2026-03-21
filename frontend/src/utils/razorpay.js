import api from "../api";

/**
 * Initialize Razorpay payment
 * @param {Object} options - Payment options
 * @param {number} options.amount - Amount in rupees (will be converted to paise)
 * @param {string} options.orderId - Order ID from your database
 * @param {Object} options.user - User details
 * @param {Function} options.onSuccess - Success callback
 * @param {Function} options.onFailure - Failure callback
 */
export const initiateRazorpayPayment = async ({
  amount,
  orderId,
  user,
  onSuccess,
  onFailure
}) => {
  try {
    // Create Razorpay order
    const response = await api.post("/payment/create-order", {
      amount: Math.round(amount * 100), // Convert rupees to paise
      currency: "INR"
    });

    const { order_id, amount: razorpayAmount, currency, key_id } = response.data;

    // Razorpay options
    const options = {
      key: key_id,
      amount: razorpayAmount,
      currency: currency,
      name: "Dolphin Naturals",
      description: "Order Payment",
      image: "/logo.png",
      order_id: order_id,
      prefill: {
        name: user.name,
        email: user.email,
        contact: user.mobile || ""
      },
      theme: {
        color: "#1F3556"
      },
      handler: async function (response) {
        try {
          // Verify payment on backend
          const verifyResponse = await api.post("/payment/verify-payment", {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            order_id: orderId
          });

          if (verifyResponse.data.status === "success") {
            onSuccess(verifyResponse.data);
          } else {
            onFailure(new Error("Payment verification failed"));
          }
        } catch (error) {
          onFailure(error);
        }
      },
      modal: {
        ondismiss: function () {
          onFailure(new Error("Payment cancelled by user"));
        }
      }
    };

    // Open Razorpay checkout
    const razorpay = new window.Razorpay(options);
    razorpay.open();
  } catch (error) {
    onFailure(error);
  }
};
