"""
Utility functions for Dolphin Naturals API
"""
import random
import string
from datetime import timedelta
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.views import exception_handler
from rest_framework.response import Response


def custom_exception_handler(exc, context):
    """Custom exception handler to return consistent error responses"""
    response = exception_handler(exc, context)

    if response is not None:
        # Customize the response format
        custom_response_data = {
            'detail': response.data.get('detail', str(exc))
        }
        response.data = custom_response_data

    return response


def generate_otp(length=6):
    """Generate a random OTP"""
    return ''.join(random.choices(string.digits, k=length))


def get_otp_expiry(minutes=10):
    """Get OTP expiry time (default 10 minutes from now)"""
    return timezone.now() + timedelta(minutes=minutes)


def verify_otp(stored_otp, stored_expiry, provided_otp):
    """Verify OTP against stored values"""
    if timezone.now() > stored_expiry:
        return False
    return stored_otp == provided_otp


def send_otp_email(email, otp, name="User", purpose="registration"):
    """Send OTP via email"""
    subject_map = {
        'registration': 'Your Registration OTP - Dolphin Naturals',
        'login': 'Your Login OTP - Dolphin Naturals',
        'password_reset': 'Password Reset OTP - Dolphin Naturals',
    }

    message_map = {
        'registration': f"""
Hi {name},

Welcome to Dolphin Naturals!

Your OTP for registration is: {otp}

This OTP will expire in 10 minutes.

If you didn't request this, please ignore this email.

Best regards,
Dolphin Naturals Team
        """,
        'login': f"""
Hi {name},

Your OTP for login is: {otp}

This OTP will expire in 10 minutes.

If you didn't request this, please secure your account immediately.

Best regards,
Dolphin Naturals Team
        """,
        'password_reset': f"""
Hi {name},

Your OTP for password reset is: {otp}

This OTP will expire in 10 minutes.

If you didn't request this, please secure your account immediately.

Best regards,
Dolphin Naturals Team
        """
    }

    subject = subject_map.get(purpose, 'Your OTP - Dolphin Naturals')
    message = message_map.get(purpose, f'Your OTP is: {otp}')

    try:
        send_mail(
            subject,
            message,
            settings.EMAIL_HOST_USER if hasattr(settings, 'EMAIL_HOST_USER') else 'noreply@dolphinnaturals.com',
            [email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False


def send_otp_sms(mobile, otp):
    """Send OTP via SMS (placeholder - integrate with SMS provider)"""
    # TODO: Integrate with SMS provider (Twilio, AWS SNS, etc.)
    print(f"SMS to {mobile}: Your OTP is {otp}")
    return True


def generate_order_id():
    """Generate unique order ID"""
    timestamp = timezone.now().strftime('%Y%m%d%H%M%S')
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"ORD-{timestamp}-{random_str}"
