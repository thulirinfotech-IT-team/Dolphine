"""
Authentication views for Dolphin Naturals API
Converted from FastAPI to Django REST Framework
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .models import OTP
from .serializers import (
    UserSerializer, UserCreateSerializer,
    OTPRequestSerializer, OTPVerifySerializer
)
from .utils import generate_otp, get_otp_expiry, verify_otp as validate_otp_code, send_otp_email, send_otp_sms

User = get_user_model()


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Login with email and password (without OTP - for backward compatibility)"""
    email = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        return Response({'detail': 'Email and password required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=email)
        if not user.check_password(password):
            return Response({'detail': 'Invalid email/password'}, status=status.HTTP_401_UNAUTHORIZED)
    except User.DoesNotExist:
        return Response({'detail': 'Invalid email/password'}, status=status.HTTP_401_UNAUTHORIZED)

    # Generate JWT token
    refresh = RefreshToken.for_user(user)

    return Response({
        'access_token': str(refresh.access_token),
        'user': {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'role': user.role
        }
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def login_verify_credentials(request):
    """Step 1: Verify credentials before sending OTP"""
    email = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        return Response({'detail': 'Email and password required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=email)
        if not user.check_password(password):
            return Response({'detail': 'Invalid email/password'}, status=status.HTTP_401_UNAUTHORIZED)
    except User.DoesNotExist:
        return Response({'detail': 'Invalid email/password'}, status=status.HTTP_401_UNAUTHORIZED)

    return Response({
        'status': 'success',
        'message': 'Credentials verified',
        'name': user.name
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def login_with_otp(request):
    """Step 2: Complete login after OTP verification"""
    serializer = OTPVerifySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    identifier = serializer.validated_data.get('email') or serializer.validated_data.get('mobile')

    # Check if OTP was verified
    try:
        otp_record = OTP.objects.get(identifier=identifier, verified=True)
    except OTP.DoesNotExist:
        return Response({'detail': 'Please verify OTP before login'}, status=status.HTTP_400_BAD_REQUEST)

    # Get user
    try:
        user = User.objects.get(email=identifier)
    except User.DoesNotExist:
        return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    # Delete OTP record after successful login
    otp_record.delete()

    # Generate JWT token
    refresh = RefreshToken.for_user(user)

    return Response({
        'access_token': str(refresh.access_token),
        'user': {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'role': user.role
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """Get current authenticated user"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def send_otp(request):
    """Send OTP to email or mobile"""
    serializer = OTPRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    email = serializer.validated_data.get('email')
    mobile = serializer.validated_data.get('mobile')
    name = serializer.validated_data.get('name', 'User')

    # Generate OTP
    otp_code = generate_otp()
    expiry = get_otp_expiry()

    # Create identifier
    identifier = email if email else mobile

    # Store OTP in database
    OTP.objects.update_or_create(
        identifier=identifier,
        defaults={
            'otp': otp_code,
            'expiry': expiry,
            'verified': False,
            'purpose': 'registration'
        }
    )

    # If email provided, also look up user's registered mobile number
    if email and not mobile:
        try:
            user_obj = User.objects.get(email=email)
            if user_obj.mobile:
                mobile = user_obj.mobile
        except User.DoesNotExist:
            pass

    # Send OTP
    email_sent = False
    sms_sent = False
    if email:
        email_sent = send_otp_email(email, otp_code, name)

    if mobile:
        sms_sent = send_otp_sms(mobile, otp_code)

    return Response({
        'status': 'success',
        'message': 'OTP sent to email and mobile' if (email_sent and sms_sent) else ('OTP sent to email' if email_sent else 'OTP sent to mobile'),
        'identifier': identifier,
        'email_sent': email_sent,
        'sms_sent': sms_sent,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    """Verify OTP"""
    serializer = OTPVerifySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    identifier = serializer.validated_data.get('email') or serializer.validated_data.get('mobile')
    provided_otp = serializer.validated_data.get('otp')

    # Get stored OTP
    try:
        otp_record = OTP.objects.get(identifier=identifier)
    except OTP.DoesNotExist:
        return Response({'detail': 'OTP not found. Please request a new OTP'}, status=status.HTTP_404_NOT_FOUND)

    # Verify OTP
    is_valid = validate_otp_code(
        stored_otp=otp_record.otp,
        stored_expiry=otp_record.expiry,
        provided_otp=provided_otp
    )

    if not is_valid:
        return Response({'detail': 'Invalid or expired OTP'}, status=status.HTTP_400_BAD_REQUEST)

    # Mark OTP as verified
    otp_record.verified = True
    otp_record.save()

    return Response({
        'status': 'success',
        'message': 'OTP verified successfully',
        'verified': True
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def register_with_otp(request):
    """Register user after OTP verification"""
    serializer = UserCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    email = serializer.validated_data.get('email')

    # Check if OTP was verified
    try:
        otp_record = OTP.objects.get(identifier=email, verified=True)
    except OTP.DoesNotExist:
        return Response({'detail': 'Please verify OTP before registration'}, status=status.HTTP_400_BAD_REQUEST)

    # Check if email already registered
    if User.objects.filter(email=email).exists():
        return Response({'detail': 'Email already registered'}, status=status.HTTP_400_BAD_REQUEST)

    # Create user
    user = serializer.save()
    user.verified = True
    user.save()

    # Delete OTP record
    otp_record.delete()

    # Generate JWT token
    refresh = RefreshToken.for_user(user)

    return Response({
        'access_token': str(refresh.access_token),
        'user': {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'role': user.role
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    """Initiate password reset"""
    email = request.data.get('email')

    if not email:
        return Response({'detail': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

    # Check if user exists
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({
            'detail': 'No account found with this email address.'
        }, status=status.HTTP_404_NOT_FOUND)

    # Generate OTP
    otp_code = generate_otp()
    expiry = get_otp_expiry()

    # Store OTP
    OTP.objects.update_or_create(
        identifier=email,
        defaults={
            'otp': otp_code,
            'expiry': expiry,
            'verified': False,
            'purpose': 'password_reset'
        }
    )

    # Send OTP email
    send_otp_email(email, otp_code, user.name, purpose='password_reset')

    return Response({
        'status': 'success',
        'message': 'OTP sent to your email address.',
        'email': email,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def google_login(request):
    """Login or register via Google OAuth"""
    credential = request.data.get('credential')
    if not credential:
        return Response({'detail': 'Google credential is required'}, status=status.HTTP_400_BAD_REQUEST)

    from google.oauth2 import id_token
    from google.auth.transport import requests as google_requests
    from django.conf import settings

    client_id = settings.GOOGLE_CLIENT_ID
    if not client_id:
        return Response({'detail': 'Google login is not configured'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    try:
        id_info = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            client_id
        )
    except ValueError as e:
        return Response({'detail': f'Invalid Google token: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

    email = id_info.get('email')
    name = id_info.get('name', email.split('@')[0])

    if not email:
        return Response({'detail': 'Could not get email from Google account'}, status=status.HTTP_400_BAD_REQUEST)

    # Get or create user
    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            'name': name,
            'verified': True,
            'role': 'user',
        }
    )

    # If user exists but name is empty, update it
    if not created and not user.name:
        user.name = name
        user.save(update_fields=['name'])

    # Generate JWT token
    refresh = RefreshToken.for_user(user)

    return Response({
        'access_token': str(refresh.access_token),
        'user': {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'role': user.role
        },
        'created': created
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """Reset password using OTP"""
    email = request.data.get('email')
    otp_code = request.data.get('otp')
    new_password = request.data.get('new_password')

    if not all([email, otp_code, new_password]):
        return Response({'detail': 'Email, OTP, and new password required'}, status=status.HTTP_400_BAD_REQUEST)

    # Get user
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    # Get OTP record
    try:
        otp_record = OTP.objects.get(identifier=email, purpose='password_reset')
    except OTP.DoesNotExist:
        return Response({'detail': 'OTP not found. Please request a new password reset'}, status=status.HTTP_404_NOT_FOUND)

    # Verify OTP
    is_valid = validate_otp_code(
        stored_otp=otp_record.otp,
        stored_expiry=otp_record.expiry,
        provided_otp=otp_code
    )

    if not is_valid:
        return Response({'detail': 'Invalid or expired OTP'}, status=status.HTTP_400_BAD_REQUEST)

    # Validate password
    if len(new_password) < 6:
        return Response({'detail': 'Password must be at least 6 characters long'}, status=status.HTTP_400_BAD_REQUEST)

    # Update password
    user.set_password(new_password)
    user.save()

    # Delete OTP record
    otp_record.delete()

    return Response({
        'status': 'success',
        'message': 'Password reset successfully. You can now login with your new password'
    })
