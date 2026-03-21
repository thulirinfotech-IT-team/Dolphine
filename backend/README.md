# Dolphin Naturals - Django Backend

E-commerce backend API built with Django + Django REST Framework + PostgreSQL.

## Tech Stack

- **Framework**: Django 5.0 + Django REST Framework
- **Database**: PostgreSQL
- **Authentication**: JWT (djangorestframework-simplejwt)
- **Payment**: Razorpay
- **Deployment**: Render

## Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL 14+
- pip

### Installation

```bash
# Clone repository
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env
# Edit .env with your credentials

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run development server
python manage.py runserver
```

### Access

- **API**: http://localhost:8000/api/
- **Admin Panel**: http://localhost:8000/admin/

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register-with-otp` - Register with OTP
- `POST /api/auth/send-otp` - Send OTP
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/forgot-password` - Forgot password
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products/` - List products
- `GET /api/products/{id}` - Get product
- `GET /api/products/home` - Home page products

### Categories
- `GET /api/categories/` - List categories
- `GET /api/categories/{id}` - Get category
- `GET /api/categories/home` - Home page categories

### Cart
- `GET /api/cart/` - Get cart
- `POST /api/cart/add` - Add to cart
- `PUT /api/cart/{id}` - Update cart item
- `DELETE /api/cart/{id}/delete` - Remove from cart
- `DELETE /api/cart/clear` - Clear cart

### Orders
- `GET /api/orders/` - List orders
- `POST /api/orders/create` - Create order
- `GET /api/orders/{id}` - Get order

### Admin (requires admin role)
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/{id}` - Update product
- `DELETE /api/admin/products/{id}/delete` - Delete product
- ... (similar for categories, banners, videos)

### Payment
- `POST /api/payment/create-order` - Create Razorpay order
- `POST /api/payment/verify` - Verify payment
- `GET /api/payment/key` - Get Razorpay key

### Upload (admin only)
- `POST /api/upload/image` - Upload image
- `POST /api/upload/images` - Upload multiple images
- `POST /api/upload/video` - Upload video

## Database Models

- **User** - Custom user model with email auth
- **Category** - Product categories
- **Product** - Products with variants
- **ProductImage** - Product images
- **QuantityVariant** - Product quantity/size variants
- **Review** - Product reviews
- **Cart** - Shopping cart
- **Order** - Customer orders
- **OrderItem** - Items in orders
- **Banner** - Homepage banners
- **DoctorVideo** - Doctor testimonial videos
- **OTP** - One-time passwords for auth

## Environment Variables

See `.env.example` for all required environment variables.

## Deployment

See `DJANGO_DEPLOYMENT_GUIDE.md` for detailed deployment instructions.

## Development

```bash
# Make migrations after model changes
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run tests
python manage.py test

# Collect static files
python manage.py collectstatic

# Run development server
python manage.py runserver
```

## Project Structure

```
backend/
├── dolphin/              # Main project
│   ├── settings.py       # Settings
│   ├── urls.py          # Root URLs
│   └── wsgi.py          # WSGI config
├── api/                 # Main app
│   ├── models.py        # Database models
│   ├── serializers.py   # DRF serializers
│   ├── views_*.py       # View files
│   ├── urls.py          # API URLs
│   └── admin.py         # Admin config
├── media/               # Uploaded files
├── staticfiles/         # Static files
├── manage.py            # Django CLI
└── requirements.txt     # Dependencies
```

## License

Proprietary - Dolphin Naturals

## Support

For issues and questions, contact the development team.
