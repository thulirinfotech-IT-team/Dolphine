"""
Admin views for Dolphin Naturals API
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Product, ProductImage, QuantityVariant, Category, Banner, DoctorVideo, Order
from .serializers import (
    ProductSerializer, CategorySerializer,
    BannerSerializer, DoctorVideoSerializer, OrderSerializer
)
from .permissions import IsAdminUser


@api_view(['POST'])
@permission_classes([IsAdminUser])
def create_product(request):
    """Create a new product"""
    serializer = ProductSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    product = Product.objects.create(**serializer.validated_data)

    # Handle images
    image_urls = request.data.get('image_urls', [])
    for idx, url in enumerate(image_urls):
        ProductImage.objects.create(product=product, image_url=url, display_order=idx)

    # Handle quantity variants
    variants = request.data.get('quantity_variants', [])
    for idx, variant_data in enumerate(variants):
        QuantityVariant.objects.create(product=product, display_order=idx, **variant_data)

    return Response(ProductSerializer(product).data, status=status.HTTP_201_CREATED)


@api_view(['PUT'])
@permission_classes([IsAdminUser])
def update_product(request, product_id):
    """Update a product"""
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({'detail': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

    serializer = ProductSerializer(product, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()

    # Update images if provided
    if 'image_urls' in request.data:
        product.images.all().delete()
        for idx, url in enumerate(request.data['image_urls']):
            ProductImage.objects.create(product=product, image_url=url, display_order=idx)

    # Update variants if provided
    if 'quantity_variants' in request.data:
        product.quantity_variants.all().delete()
        for idx, variant_data in enumerate(request.data['quantity_variants']):
            QuantityVariant.objects.create(product=product, display_order=idx, **variant_data)

    return Response(ProductSerializer(product).data)


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def delete_product(request, product_id):
    """Delete a product"""
    try:
        product = Product.objects.get(id=product_id)
        product.delete()
        return Response({'status': 'success', 'message': 'Product deleted'})
    except Product.DoesNotExist:
        return Response({'detail': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def create_category(request):
    """Create a new category"""
    serializer = CategorySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    category = serializer.save()
    return Response(CategorySerializer(category).data, status=status.HTTP_201_CREATED)


@api_view(['PUT'])
@permission_classes([IsAdminUser])
def update_category(request, category_id):
    """Update a category"""
    try:
        category = Category.objects.get(id=category_id)
    except Category.DoesNotExist:
        return Response({'detail': 'Category not found'}, status=status.HTTP_404_NOT_FOUND)

    serializer = CategorySerializer(category, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(CategorySerializer(category).data)


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def delete_category(request, category_id):
    """Delete a category"""
    try:
        category = Category.objects.get(id=category_id)
        if category.is_default:
            return Response({'detail': 'Cannot delete default category'}, status=status.HTTP_400_BAD_REQUEST)
        category.delete()
        return Response({'status': 'success', 'message': 'Category deleted'})
    except Category.DoesNotExist:
        return Response({'detail': 'Category not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def create_banner(request):
    """Create a new banner"""
    serializer = BannerSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    banner = serializer.save()
    return Response(BannerSerializer(banner).data, status=status.HTTP_201_CREATED)


@api_view(['PUT'])
@permission_classes([IsAdminUser])
def update_banner(request, banner_id):
    """Update a banner"""
    try:
        banner = Banner.objects.get(id=banner_id)
    except Banner.DoesNotExist:
        return Response({'detail': 'Banner not found'}, status=status.HTTP_404_NOT_FOUND)

    serializer = BannerSerializer(banner, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(BannerSerializer(banner).data)


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def delete_banner(request, banner_id):
    """Delete a banner"""
    try:
        banner = Banner.objects.get(id=banner_id)
        banner.delete()
        return Response({'status': 'success', 'message': 'Banner deleted'})
    except Banner.DoesNotExist:
        return Response({'detail': 'Banner not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def create_doctor_video(request):
    """Create a new doctor video"""
    serializer = DoctorVideoSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    video = serializer.save()
    return Response(DoctorVideoSerializer(video).data, status=status.HTTP_201_CREATED)


@api_view(['PUT'])
@permission_classes([IsAdminUser])
def update_doctor_video(request, video_id):
    """Update a doctor video"""
    try:
        video = DoctorVideo.objects.get(id=video_id)
    except DoctorVideo.DoesNotExist:
        return Response({'detail': 'Video not found'}, status=status.HTTP_404_NOT_FOUND)

    serializer = DoctorVideoSerializer(video, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(DoctorVideoSerializer(video).data)


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def delete_doctor_video(request, video_id):
    """Delete a doctor video"""
    try:
        video = DoctorVideo.objects.get(id=video_id)
        video.delete()
        return Response({'status': 'success', 'message': 'Video deleted'})
    except DoctorVideo.DoesNotExist:
        return Response({'detail': 'Video not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_all_orders(request):
    """Get all orders (admin only)"""
    orders = Order.objects.all().select_related('user').prefetch_related('items').order_by('-created_at')
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)


@api_view(['PUT'])
@permission_classes([IsAdminUser])
def update_order_status(request, order_id):
    """Update order status"""
    try:
        order = Order.objects.get(order_id=order_id)
    except Order.DoesNotExist:
        return Response({'detail': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

    new_status = request.data.get('status')
    if not new_status:
        return Response({'detail': 'Status is required'}, status=status.HTTP_400_BAD_REQUEST)

    order.status = new_status
    order.save()

    return Response(OrderSerializer(order).data)
