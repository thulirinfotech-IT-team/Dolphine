"""
Django REST Framework serializers for Dolphin Naturals
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Category, Product, ProductImage, QuantityVariant,
    Review, Cart, Order, OrderItem, Banner, DoctorVideo, OTP
)

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """User serializer"""

    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'mobile', 'role', 'verified', 'date_joined']
        read_only_fields = ['id', 'date_joined']


class UserCreateSerializer(serializers.ModelSerializer):
    """User registration serializer"""
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['email', 'name', 'mobile', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            name=validated_data['name'],
            mobile=validated_data.get('mobile', ''),
        )
        return user


class OTPRequestSerializer(serializers.Serializer):
    """OTP request serializer"""
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    mobile = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    name = serializers.CharField(default='User')

    def validate(self, data):
        if not data.get('email') and not data.get('mobile'):
            raise serializers.ValidationError("Either email or mobile is required")
        return data


class OTPVerifySerializer(serializers.Serializer):
    """OTP verification serializer"""
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    mobile = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    otp = serializers.CharField(max_length=6)

    def validate(self, data):
        if not data.get('email') and not data.get('mobile'):
            raise serializers.ValidationError("Either email or mobile is required")
        return data


class CategorySerializer(serializers.ModelSerializer):
    """Category serializer"""
    product_count = serializers.SerializerMethodField()
    icon_image = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = '__all__'

    def get_product_count(self, obj):
        return obj.products.filter(stock__gt=0).count()

    def get_icon_image(self, obj):
        """Always return the correct image URL (prefer icon_file Cloudinary URL)"""
        if obj.icon_file:
            return obj.icon_file.url
        return obj.icon_image or ""


class ProductImageSerializer(serializers.ModelSerializer):
    """Product image serializer"""
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ['id', 'image_url', 'display_order']

    def get_image_url(self, obj):
        """Always return the correct image URL (prefer image_file Cloudinary URL)"""
        if obj.image_file:
            return obj.image_file.url
        return obj.image_url or ""


class QuantityVariantSerializer(serializers.ModelSerializer):
    """Quantity variant serializer"""

    class Meta:
        model = QuantityVariant
        fields = '__all__'


class ProductSerializer(serializers.ModelSerializer):
    """Product serializer with images and variants"""
    images = ProductImageSerializer(many=True, read_only=True)
    quantity_variants = QuantityVariantSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    image_urls = serializers.SerializerMethodField()  # For backward compatibility
    average_rating = serializers.SerializerMethodField()
    total_reviews = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = '__all__'

    def get_image_urls(self, obj):
        """Return list of image URLs for compatibility"""
        return [img.image_url for img in obj.images.all().order_by('display_order')]

    def get_average_rating(self, obj):
        """Calculate average rating"""
        reviews = obj.reviews.all()
        if not reviews:
            return 0
        return round(sum(r.rating for r in reviews) / len(reviews), 1)

    def get_total_reviews(self, obj):
        """Get total review count"""
        return obj.reviews.count()


class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight product serializer for lists"""
    image_urls = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'category', 'category_name',
                  'mrp', 'sale_price', 'discount_percent', 'stock',
                  'image_urls', 'show_on_home']

    def get_image_urls(self, obj):
        images = obj.images.all().order_by('display_order')[:1]  # First image only
        return [img.image_url for img in images]


class ReviewSerializer(serializers.ModelSerializer):
    """Review serializer"""
    user_name = serializers.CharField(source='user.name', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)

    class Meta:
        model = Review
        fields = '__all__'
        read_only_fields = ['user', 'user_name', 'user_id', 'created_at', 'updated_at']


class ReviewCreateSerializer(serializers.ModelSerializer):
    """Review creation serializer"""
    product_id = serializers.IntegerField()

    class Meta:
        model = Review
        fields = ['product_id', 'rating', 'title', 'comment']

    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value


class CartSerializer(serializers.ModelSerializer):
    """Cart item serializer"""
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.SerializerMethodField()
    variant_label = serializers.CharField(source='variant.label', read_only=True, allow_null=True)
    price = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = '__all__'
        read_only_fields = ['user']

    def get_product_image(self, obj):
        first_image = obj.product.images.first()
        return first_image.image_url if first_image else None

    def get_price(self, obj):
        if obj.variant:
            return obj.variant.sale_price
        return obj.product.sale_price


class OrderItemSerializer(serializers.ModelSerializer):
    """Order item serializer"""
    product_name = serializers.CharField(source='product.name', read_only=True)
    variant_label = serializers.CharField(source='variant.label', read_only=True, allow_null=True)

    class Meta:
        model = OrderItem
        fields = '__all__'


class OrderSerializer(serializers.ModelSerializer):
    """Order serializer with items"""
    items = OrderItemSerializer(many=True, read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ['user', 'order_id', 'created_at', 'updated_at']


class BannerSerializer(serializers.ModelSerializer):
    """Banner serializer"""
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Banner
        fields = '__all__'

    def get_image_url(self, obj):
        """Always return the correct image URL (prefer image_file Cloudinary URL)"""
        if obj.image_file:
            return obj.image_file.url
        return obj.image_url or ""


class DoctorVideoSerializer(serializers.ModelSerializer):
    """Doctor video serializer"""

    class Meta:
        model = DoctorVideo
        fields = '__all__'
