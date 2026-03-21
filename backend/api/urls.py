"""
URL configuration for Dolphin Naturals API
"""
from django.urls import path
from . import (
    views_auth, views_products, views_cart,
    views_admin, views_upload, views_payment
)

urlpatterns = [
    # Authentication routes
    path('auth/login', views_auth.login, name='login'),
    path('auth/login-verify-credentials', views_auth.login_verify_credentials, name='login-verify-credentials'),
    path('auth/login-with-otp', views_auth.login_with_otp, name='login-with-otp'),
    path('auth/me', views_auth.get_current_user, name='me'),
    path('auth/send-otp', views_auth.send_otp, name='send-otp'),
    path('auth/verify-otp', views_auth.verify_otp, name='verify-otp'),
    path('auth/register-with-otp', views_auth.register_with_otp, name='register-with-otp'),
    path('auth/forgot-password', views_auth.forgot_password, name='forgot-password'),
    path('auth/reset-password', views_auth.reset_password, name='reset-password'),

    # Product routes
    path('products/', views_products.list_products, name='list-products'),
    path('products', views_products.list_products, name='list-products-no-slash'),
    path('products/home/', views_products.get_home_products, name='home-products'),
    path('products/home', views_products.get_home_products, name='home-products-no-slash'),
    path('products/<int:product_id>', views_products.get_product, name='get-product'),

    # Category routes
    path('categories/', views_products.list_categories, name='list-categories'),
    path('categories', views_products.list_categories, name='list-categories-no-slash'),
    path('categories/home/', views_products.get_home_categories, name='home-categories'),
    path('categories/home', views_products.get_home_categories, name='home-categories-no-slash'),
    path('categories/<int:category_id>', views_products.get_category, name='get-category'),

    # Review routes
    path('reviews/product/<int:product_id>', views_products.list_reviews, name='list-reviews'),
    path('reviews/user/can-review/<int:product_id>', views_products.can_review_product, name='can-review-product'),
    path('reviews', views_products.create_review, name='create-review'),

    # Cart routes
    path('cart/', views_cart.get_cart, name='get-cart'),
    path('cart', views_cart.get_cart, name='get-cart-no-slash'),
    path('cart/add', views_cart.add_to_cart, name='add-to-cart'),
    path('cart/<int:cart_id>', views_cart.update_cart_item, name='update-cart-item'),
    path('cart/<int:cart_id>/delete', views_cart.remove_from_cart, name='remove-from-cart'),
    path('cart/clear', views_cart.clear_cart, name='clear-cart'),

    # Order routes
    path('orders/', views_cart.get_orders, name='get-orders'),
    path('orders', views_cart.get_orders, name='get-orders-no-slash'),
    path('orders/create', views_cart.create_order, name='create-order'),
    path('orders/<str:order_id>', views_cart.get_order, name='get-order'),

    # Doctor videos
    path('doctor-videos/', views_products.list_doctor_videos, name='list-doctor-videos'),
    path('doctor-videos', views_products.list_doctor_videos, name='list-doctor-videos-no-slash'),

    # Banners
    path('banners/', views_products.list_banners, name='list-banners'),
    path('banners', views_products.list_banners, name='list-banners-no-slash'),

    # Admin - Products
    path('admin/products', views_admin.create_product, name='admin-create-product'),
    path('admin/products/<int:product_id>', views_admin.update_product, name='admin-update-product'),
    path('admin/products/<int:product_id>/delete', views_admin.delete_product, name='admin-delete-product'),

    # Admin - Categories
    path('admin/categories', views_admin.create_category, name='admin-create-category'),
    path('admin/categories/<int:category_id>', views_admin.update_category, name='admin-update-category'),
    path('admin/categories/<int:category_id>/delete', views_admin.delete_category, name='admin-delete-category'),

    # Admin - Banners
    path('admin/banners', views_admin.create_banner, name='admin-create-banner'),
    path('admin/banners/<int:banner_id>', views_admin.update_banner, name='admin-update-banner'),
    path('admin/banners/<int:banner_id>/delete', views_admin.delete_banner, name='admin-delete-banner'),

    # Admin - Doctor Videos
    path('admin/doctor-videos', views_admin.create_doctor_video, name='admin-create-doctor-video'),
    path('admin/doctor-videos/<int:video_id>', views_admin.update_doctor_video, name='admin-update-doctor-video'),
    path('admin/doctor-videos/<int:video_id>/delete', views_admin.delete_doctor_video, name='admin-delete-doctor-video'),

    # Admin - Orders
    path('admin/orders', views_admin.get_all_orders, name='admin-get-all-orders'),
    path('admin/orders/<str:order_id>/status', views_admin.update_order_status, name='admin-update-order-status'),

    # Upload routes
    path('upload/image', views_upload.upload_image, name='upload-image'),
    path('upload/images', views_upload.upload_multiple_images, name='upload-multiple-images'),
    path('upload/video', views_upload.upload_video, name='upload-video'),

    # Payment routes
    path('payment/create-order', views_payment.create_razorpay_order, name='create-razorpay-order'),
    path('payment/verify', views_payment.verify_payment, name='verify-payment'),
    path('payment/key', views_payment.get_razorpay_key, name='get-razorpay-key'),
]
