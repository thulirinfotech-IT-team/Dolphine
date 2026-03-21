"""
Cart and Order views for Dolphin Naturals API
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Cart, Order, OrderItem, Product, QuantityVariant
from .serializers import CartSerializer, OrderSerializer
from .utils import generate_order_id


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_cart(request):
    """Get user's cart items"""
    cart_items = Cart.objects.filter(user=request.user).select_related(
        'product', 'variant'
    ).prefetch_related('product__images')
    serializer = CartSerializer(cart_items, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_to_cart(request):
    """Add item to cart"""
    # Support both query params and request body
    product_id = request.data.get('product_id') or request.query_params.get('product_id')
    variant_id = request.data.get('variant_id') or request.query_params.get('variant_id')
    quantity = int(request.data.get('quantity') or request.query_params.get('qty') or request.query_params.get('quantity') or 1)

    if not product_id:
        return Response({'detail': 'Product ID required'}, status=status.HTTP_400_BAD_REQUEST)

    # Check if product exists
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({'detail': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

    # Check variant if provided
    variant = None
    if variant_id:
        try:
            variant = QuantityVariant.objects.get(id=variant_id, product=product)
        except QuantityVariant.DoesNotExist:
            return Response({'detail': 'Variant not found'}, status=status.HTTP_404_NOT_FOUND)

    # Check if item already in cart
    cart_item, created = Cart.objects.get_or_create(
        user=request.user,
        product=product,
        variant=variant,
        defaults={'quantity': quantity}
    )

    if not created:
        # Update quantity if item already exists
        cart_item.quantity += quantity
        cart_item.save()

    serializer = CartSerializer(cart_item)
    return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_cart_item(request, cart_id):
    """Update cart item quantity"""
    try:
        cart_item = Cart.objects.get(id=cart_id, user=request.user)
    except Cart.DoesNotExist:
        return Response({'detail': 'Cart item not found'}, status=status.HTTP_404_NOT_FOUND)

    quantity = request.data.get('quantity')
    if quantity is None or quantity < 1:
        return Response({'detail': 'Valid quantity required'}, status=status.HTTP_400_BAD_REQUEST)

    cart_item.quantity = quantity
    cart_item.save()

    serializer = CartSerializer(cart_item)
    return Response(serializer.data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_from_cart(request, cart_id):
    """Remove item from cart"""
    try:
        cart_item = Cart.objects.get(id=cart_id, user=request.user)
        cart_item.delete()
        return Response({'status': 'success', 'message': 'Item removed from cart'})
    except Cart.DoesNotExist:
        return Response({'detail': 'Cart item not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def clear_cart(request):
    """Clear all items from cart"""
    Cart.objects.filter(user=request.user).delete()
    return Response({'status': 'success', 'message': 'Cart cleared'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_order(request):
    """Create order from cart"""
    print(f"📦 Create order request from user: {request.user.email}")
    print(f"📦 Request data: {request.data}")

    cart_items = Cart.objects.filter(user=request.user).select_related('product', 'variant')

    if not cart_items.exists():
        print("❌ Cart is empty")
        return Response({'detail': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

    # Get shipping details
    shipping_data = request.data.get('shipping', {})
    print(f"📦 Shipping data: {shipping_data}")
    required_fields = ['name', 'email', 'mobile', 'address', 'city', 'state', 'pincode']

    for field in required_fields:
        if not shipping_data.get(field):
            print(f"❌ Missing field: {field}")
            return Response({'detail': f'Shipping {field} is required'}, status=status.HTTP_400_BAD_REQUEST)

    # Calculate total
    total_amount = 0
    for item in cart_items:
        price = item.variant.sale_price if item.variant else item.product.sale_price
        total_amount += price * item.quantity

    # Create order
    order = Order.objects.create(
        user=request.user,
        order_id=generate_order_id(),
        total_amount=total_amount,
        shipping_name=shipping_data['name'],
        shipping_email=shipping_data['email'],
        shipping_mobile=shipping_data['mobile'],
        shipping_address=shipping_data['address'],
        shipping_city=shipping_data['city'],
        shipping_state=shipping_data['state'],
        shipping_pincode=shipping_data['pincode'],
    )

    # Create order items
    for item in cart_items:
        price = item.variant.sale_price if item.variant else item.product.sale_price
        OrderItem.objects.create(
            order=order,
            product=item.product,
            variant=item.variant,
            quantity=item.quantity,
            price=price
        )

    # Clear cart
    cart_items.delete()

    serializer = OrderSerializer(order)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_orders(request):
    """Get user's orders"""
    orders = Order.objects.filter(user=request.user).prefetch_related('items').order_by('-created_at')
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_order(request, order_id):
    """Get single order details"""
    try:
        order = Order.objects.prefetch_related('items').get(order_id=order_id, user=request.user)
    except Order.DoesNotExist:
        return Response({'detail': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

    serializer = OrderSerializer(order)
    return Response(serializer.data)
