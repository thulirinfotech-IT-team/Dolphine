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

    import time
    from_email = settings.EMAIL_HOST_USER if hasattr(settings, 'EMAIL_HOST_USER') else 'noreply@dolphinnaturals.com'
    for attempt in range(3):
        try:
            send_mail(subject, message, from_email, [email], fail_silently=False)
            print(f"✅ Email sent to {email} (attempt {attempt + 1})")
            return True
        except Exception as e:
            print(f"Email attempt {attempt + 1} failed: {e}")
            if attempt < 2:
                time.sleep(3)
    return False


def send_otp_sms(mobile, otp):
    """Send OTP via SMS using Fast2SMS"""
    import requests
    api_key = settings.FAST2SMS_API_KEY if hasattr(settings, 'FAST2SMS_API_KEY') else ''

    if not api_key:
        print(f"SMS skipped - FAST2SMS_API_KEY not configured. OTP for {mobile}: {otp}")
        return False

    # Normalize mobile: remove +91, 91 prefix, spaces, dashes — keep 10 digits
    clean_mobile = str(mobile).strip().replace(' ', '').replace('-', '')
    if clean_mobile.startswith('+91'):
        clean_mobile = clean_mobile[3:]
    elif clean_mobile.startswith('91') and len(clean_mobile) == 12:
        clean_mobile = clean_mobile[2:]

    if len(clean_mobile) != 10 or not clean_mobile.isdigit():
        print(f"❌ Invalid mobile number format: {mobile}")
        return False

    try:
        # Try OTP route first (requires DLT), fallback to quick route
        response = requests.post(
            'https://www.fast2sms.com/dev/bulkV2',
            headers={'authorization': api_key},
            data={
                'route': 'otp',
                'variables_values': otp,
                'flash': 0,
                'numbers': clean_mobile,
            },
            timeout=10
        )
        result = response.json()
        if result.get('return'):
            print(f"✅ SMS (OTP route) sent to {clean_mobile}")
            return True

        # OTP route failed - try quick route
        print(f"OTP route failed: {result}. Trying quick route...")
        response2 = requests.post(
            'https://www.fast2sms.com/dev/bulkV2',
            headers={'authorization': api_key},
            data={
                'route': 'q',
                'message': f'Your Dolphin Naturals OTP is {otp}. Valid for 10 minutes. Do not share with anyone.',
                'flash': 0,
                'numbers': clean_mobile,
            },
            timeout=10
        )
        result2 = response2.json()
        if result2.get('return'):
            print(f"✅ SMS (quick route) sent to {clean_mobile}")
            return True
        else:
            print(f"❌ SMS failed on both routes: {result2}")
            return False
    except Exception as e:
        print(f"❌ SMS error: {e}")
        return False


def generate_order_id():
    """Generate unique order ID"""
    timestamp = timezone.now().strftime('%Y%m%d%H%M%S')
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"ORD-{timestamp}-{random_str}"
