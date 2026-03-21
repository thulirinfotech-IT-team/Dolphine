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

    # Send OTP
    if email:
        success = send_otp_email(email, otp_code, name)
        if not success:
            return Response({'detail': 'Failed to send OTP email'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    else:
        success = send_otp_sms(mobile, otp_code)
        if not success:
            return Response({'detail': 'Failed to send OTP SMS'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response({
        'status': 'success',
        'message': f"OTP sent to {'email' if email else 'mobile'}",
        'identifier': identifier,
        'dev_otp': otp_code  # Development only - remove in production
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
        # For security, don't reveal if email exists
        return Response({
            'status': 'success',
            'message': 'If the email is registered, you will receive a password reset OTP'
        })

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
        'message': 'If the email is registered, you will receive a password reset OTP',
        'email': email,
        'dev_otp': otp_code  # Development only
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
