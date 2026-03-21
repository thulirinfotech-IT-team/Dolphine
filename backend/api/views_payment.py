"""
Payment views for Dolphin Naturals API (Razorpay integration)
"""
import razorpay
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Order


# Initialize Razorpay client
razorpay_client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_razorpay_order(request):
    """Create Razorpay order"""
    print(f"💳 Creating Razorpay order")
    print(f"💳 Request data: {request.data}")

    amount = request.data.get('amount')  # Amount in paise
    currency = request.data.get('currency', 'INR')

    if not amount:
        return Response({'detail': 'Amount is required'}, status=status.HTTP_400_BAD_REQUEST)

    # Check if Razorpay is configured
    if not settings.RAZORPAY_KEY_ID or settings.RAZORPAY_KEY_ID == 'your_razorpay_key_id':
        print("❌ Razorpay not configured - using test mode")
        return Response({'detail': 'Razorpay not configured. Please use Cash on Delivery for testing.'},
                       status=status.HTTP_400_BAD_REQUEST)

    try:
        # Create Razorpay order
        razorpay_order = razorpay_client.order.create({
            'amount': amount,
            'currency': currency,
            'payment_capture': '1'  # Auto capture
        })

        print(f"✅ Razorpay order created: {razorpay_order['id']}")
        return Response({
            'status': 'success',
            'order_id': razorpay_order['id'],
            'amount': razorpay_order['amount'],
            'currency': razorpay_order['currency'],
            'key_id': settings.RAZORPAY_KEY_ID
        })

    except Exception as e:
        print(f"❌ Razorpay error: {str(e)}")
        return Response({'detail': f'Payment gateway error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_payment(request):
    """Verify Razorpay payment"""
    payment_id = request.data.get('razorpay_payment_id')
    order_id = request.data.get('razorpay_order_id')
    signature = request.data.get('razorpay_signature')
    our_order_id = request.data.get('order_id')  # Our internal order ID

    if not all([payment_id, order_id, signature]):
        return Response({'detail': 'Missing payment details'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Verify signature
        params_dict = {
            'razorpay_order_id': order_id,
            'razorpay_payment_id': payment_id,
            'razorpay_signature': signature
        }

        razorpay_client.utility.verify_payment_signature(params_dict)

        # Update order
        if our_order_id:
            try:
                order = Order.objects.get(order_id=our_order_id, user=request.user)
                order.payment_id = payment_id
                order.payment_status = 'completed'
                order.status = 'confirmed'
                order.save()
            except Order.DoesNotExist:
                pass

        return Response({
            'status': 'success',
            'message': 'Payment verified successfully',
            'payment_id': payment_id
        })

    except razorpay.errors.SignatureVerificationError:
        return Response({'detail': 'Invalid payment signature'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_razorpay_key(request):
    """Get Razorpay public key"""
    return Response({
        'key_id': settings.RAZORPAY_KEY_ID
    })
