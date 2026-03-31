"""
Django models for Dolphin Naturals E-commerce Platform
Converted from FastAPI + MongoDB to Django + PostgreSQL
"""
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class UserManager(BaseUserManager):
    """Custom user manager for email-based authentication"""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom User model with email as username"""

    ROLE_CHOICES = [
        ('user', 'User'),
        ('admin', 'Admin'),
    ]

    email = models.EmailField(unique=True, db_index=True)
    name = models.CharField(max_length=255)
    mobile = models.CharField(max_length=20, blank=True, null=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user')
    verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return self.email


class OTP(models.Model):
    """OTP storage for authentication and password reset"""

    PURPOSE_CHOICES = [
        ('registration', 'Registration'),
        ('login', 'Login'),
        ('password_reset', 'Password Reset'),
    ]

    identifier = models.CharField(max_length=255, db_index=True)  # Email or mobile
    otp = models.CharField(max_length=6)
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES, default='registration')
    verified = models.BooleanField(default=False)
    expiry = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'otps'
        verbose_name = 'OTP'
        verbose_name_plural = 'OTPs'
        indexes = [
            models.Index(fields=['identifier', 'verified']),
        ]

    def __str__(self):
        return f"OTP for {self.identifier} - {self.purpose}"


class Category(models.Model):
    """Product categories"""

    name = models.CharField(max_length=255, unique=True)
    description = models.TextField()
    icon_image = models.CharField(max_length=500, blank=True, help_text="Image URL (or upload file below)")
    icon_file = models.ImageField(upload_to='categories/', blank=True, null=True, help_text="Upload category icon")
    active = models.BooleanField(default=True)
    show_on_home = models.BooleanField(default=False)
    display_order = models.IntegerField(default=0)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # After save, get the Cloudinary URL
        if self.icon_file:
            url = self.icon_file.url
            if url != self.icon_image:
                self.icon_image = url
                Category.objects.filter(pk=self.pk).update(icon_image=url)

    class Meta:
        db_table = 'categories'
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'
        ordering = ['display_order', 'name']

    def __str__(self):
        return self.name


class Product(models.Model):
    """Products with quantity variants"""

    name = models.CharField(max_length=255)
    description = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='products')
    mrp = models.IntegerField(help_text='Price in paise (e.g., 249900 = ₹2,499)')
    sale_price = models.IntegerField(help_text='Sale price in paise')
    discount_percent = models.IntegerField(default=0)
    stock = models.IntegerField(default=0)
    tags = models.JSONField(default=list, blank=True)
    benefits = models.JSONField(default=list, blank=True)
    ingredients = models.JSONField(default=list, blank=True)
    how_to_use = models.TextField(blank=True)
    show_on_home = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'products'
        verbose_name = 'Product'
        verbose_name_plural = 'Products'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['category', 'show_on_home']),
        ]

    def __str__(self):
        return self.name


class ProductImage(models.Model):
    """Product images (multiple images per product)"""

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image_url = models.CharField(max_length=500, blank=True, help_text="Image URL (or upload file below)")
    image_file = models.ImageField(upload_to='products/', blank=True, null=True, help_text="Upload product image")
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'product_images'
        verbose_name = 'Product Image'
        verbose_name_plural = 'Product Images'
        ordering = ['display_order']

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # After save, get the Cloudinary URL
        if self.image_file:
            url = self.image_file.url
            if url != self.image_url:
                self.image_url = url
                ProductImage.objects.filter(pk=self.pk).update(image_url=url)

    def __str__(self):
        return f"Image for {self.product.name}"


class QuantityVariant(models.Model):
    """Different quantity/size options for a product"""

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='quantity_variants')
    label = models.CharField(max_length=100, help_text='e.g., "50g", "100ml", "Pack of 3"')
    mrp = models.IntegerField(help_text='Price in paise')
    sale_price = models.IntegerField(help_text='Sale price in paise')
    discount_percent = models.IntegerField(default=0)
    stock = models.IntegerField(default=0)
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'quantity_variants'
        verbose_name = 'Quantity Variant'
        verbose_name_plural = 'Quantity Variants'
        ordering = ['display_order']

    def __str__(self):
        return f"{self.product.name} - {self.label}"


class Review(models.Model):
    """Product reviews and ratings"""

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    title = models.CharField(max_length=255, blank=True)
    comment = models.TextField()
    helpful_count = models.IntegerField(default=0)
    verified_purchase = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'reviews'
        verbose_name = 'Review'
        verbose_name_plural = 'Reviews'
        ordering = ['-created_at']
        unique_together = ['product', 'user']  # One review per user per product

    def __str__(self):
        return f"{self.user.name} - {self.product.name} ({self.rating}★)"


class Cart(models.Model):
    """Shopping cart for users"""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cart_items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    variant = models.ForeignKey(QuantityVariant, on_delete=models.CASCADE, null=True, blank=True)
    quantity = models.IntegerField(default=1, validators=[MinValueValidator(1)])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'cart'
        verbose_name = 'Cart Item'
        verbose_name_plural = 'Cart Items'
        unique_together = ['user', 'product', 'variant']

    def __str__(self):
        return f"{self.user.email} - {self.product.name} (x{self.quantity})"


class Order(models.Model):
    """Customer orders"""

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]

    user = models.ForeignKey(User, on_delete=models.PROTECT, related_name='orders')
    order_id = models.CharField(max_length=100, unique=True, db_index=True)
    total_amount = models.IntegerField(help_text='Total in paise')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_id = models.CharField(max_length=255, blank=True)
    payment_status = models.CharField(max_length=50, default='pending')

    # Shipping details
    shipping_name = models.CharField(max_length=255)
    shipping_email = models.EmailField()
    shipping_mobile = models.CharField(max_length=20)
    shipping_address = models.TextField()
    shipping_city = models.CharField(max_length=100)
    shipping_state = models.CharField(max_length=100)
    shipping_pincode = models.CharField(max_length=10)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'orders'
        verbose_name = 'Order'
        verbose_name_plural = 'Orders'
        ordering = ['-created_at']

    def __str__(self):
        return f"Order {self.order_id} - {self.user.email}"


class OrderItem(models.Model):
    """Items within an order"""

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    variant = models.ForeignKey(QuantityVariant, on_delete=models.PROTECT, null=True, blank=True)
    quantity = models.IntegerField()
    price = models.IntegerField(help_text='Price per unit in paise at time of order')

    class Meta:
        db_table = 'order_items'
        verbose_name = 'Order Item'
        verbose_name_plural = 'Order Items'

    def __str__(self):
        return f"{self.order.order_id} - {self.product.name}"


class Banner(models.Model):
    """Homepage banners"""

    title = models.CharField(max_length=255)
    subtitle = models.TextField()
    cta_text = models.CharField(max_length=100)
    cta_link = models.CharField(max_length=500)
    image_url = models.CharField(max_length=500, blank=True, help_text="Image URL (or upload file below)")
    image_file = models.ImageField(upload_to='banners/', blank=True, null=True, help_text="Upload banner image")
    active = models.BooleanField(default=True)
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # After save, get the Cloudinary URL
        if self.image_file:
            url = self.image_file.url
            if url != self.image_url:
                self.image_url = url
                Banner.objects.filter(pk=self.pk).update(image_url=url)

    class Meta:
        db_table = 'banners'
        verbose_name = 'Banner'
        verbose_name_plural = 'Banners'
        ordering = ['display_order']

    def __str__(self):
        return self.title


class DoctorVideo(models.Model):
    """Doctor testimonial videos"""

    VIDEO_TYPE_CHOICES = [
        ('youtube', 'YouTube'),
        ('local', 'Local'),
    ]

    title = models.CharField(max_length=255)
    doctor_name = models.CharField(max_length=255)
    designation = models.CharField(max_length=255)
    video_url = models.CharField(max_length=500)
    video_type = models.CharField(max_length=10, choices=VIDEO_TYPE_CHOICES, default='youtube')
    thumbnail_url = models.CharField(max_length=500, blank=True)
    description = models.TextField(blank=True)
    duration = models.CharField(max_length=20, blank=True)
    active = models.BooleanField(default=True)
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'doctor_videos'
        verbose_name = 'Doctor Video'
        verbose_name_plural = 'Doctor Videos'
        ordering = ['display_order']

    def __str__(self):
        return f"{self.title} - Dr. {self.doctor_name}"
