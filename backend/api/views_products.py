"""
Product, Category, and Review views for Dolphin Naturals API
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q, Avg
from .models import Product, Category, Review, DoctorVideo, Banner
from .serializers import (
    ProductSerializer, ProductListSerializer, CategorySerializer,
    ReviewSerializer, ReviewCreateSerializer,
    DoctorVideoSerializer, BannerSerializer
)


@api_view(['GET'])
@permission_classes([AllowAny])
def list_products(request):
    """List products with optional filtering"""
    category = request.query_params.get('category')
    search = request.query_params.get('q')

    products = Product.objects.select_related('category').prefetch_related('images', 'quantity_variants')

    if category:
        products = products.filter(category__name=category)

    if search:
        products = products.filter(Q(name__icontains=search) | Q(description__icontains=search))

    serializer = ProductListSerializer(products, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_home_products(request):
    """Get products marked to show on home page"""
    products = Product.objects.filter(show_on_home=True).select_related('category').prefetch_related('images')[:4]
    serializer = ProductListSerializer(products, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_product(request, product_id):
    """Get single product details"""
    try:
        product = Product.objects.select_related('category').prefetch_related(
            'images', 'quantity_variants', 'reviews'
        ).get(id=product_id)
    except Product.DoesNotExist:
        return Response({'detail': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

    serializer = ProductSerializer(product)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def list_categories(request):
    """List all active categories"""
    categories = Category.objects.filter(active=True).prefetch_related('products')
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_home_categories(request):
    """Get categories marked to show on home page"""
    categories = Category.objects.filter(active=True, show_on_home=True)[:4]
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_category(request, category_id):
    """Get single category"""
    try:
        category = Category.objects.get(id=category_id)
    except Category.DoesNotExist:
        return Response({'detail': 'Category not found'}, status=status.HTTP_404_NOT_FOUND)

    serializer = CategorySerializer(category)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def list_reviews(request, product_id):
    """List reviews for a product"""
    reviews = Review.objects.filter(product_id=product_id).select_related('user').order_by('-created_at')
    serializer = ReviewSerializer(reviews, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_review(request):
    """Create a product review"""
    serializer = ReviewCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    product_id = serializer.validated_data['product_id']

    # Check if product exists
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({'detail': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

    # Check if user already reviewed this product
    if Review.objects.filter(product_id=product_id, user=request.user).exists():
        return Response({'detail': 'You have already reviewed this product'}, status=status.HTTP_400_BAD_REQUEST)

    # Create review
    review = Review.objects.create(
        product_id=product_id,
        user=request.user,
        rating=serializer.validated_data['rating'],
        title=serializer.validated_data.get('title', ''),
        comment=serializer.validated_data['comment']
    )

    return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def can_review_product(request, product_id):
    """Check if user can review this product"""
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({'detail': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

    # Check if user already reviewed this product
    existing_review = Review.objects.filter(product_id=product_id, user=request.user).first()

    if existing_review:
        return Response({
            'can_review': False,
            'has_reviewed': True,
            'review_id': existing_review.id
        })

    return Response({
        'can_review': True,
        'has_reviewed': False
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def list_doctor_videos(request):
    """List all active doctor videos"""
    videos = DoctorVideo.objects.filter(active=True).order_by('display_order')
    serializer = DoctorVideoSerializer(videos, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def list_banners(request):
    """List all active banners"""
    banners = Banner.objects.filter(active=True).order_by('display_order')
    serializer = BannerSerializer(banners, many=True)
    return Response(serializer.data)
