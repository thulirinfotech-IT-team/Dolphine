# Django + PostgreSQL - Quick Reference

## 🚀 Quick Commands

### Local Development

```bash
# Navigate to Django backend
cd backend

# Activate virtual environment
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Create database migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run server
python manage.py runserver

# Access admin
# http://localhost:8000/admin/
```

### Database Commands

```bash
# Create migrations
python manage.py makemigrations

# View SQL for migration
python manage.py sqlmigrate api 0001

# Apply migrations
python manage.py migrate

# Open database shell
python manage.py dbshell

# Flush database (delete all data)
python manage.py flush
```

### Common Django Commands

```bash
# Create new app
python manage.py startapp myapp

# Collect static files
python manage.py collectstatic

# Run tests
python manage.py test

# Shell (Python REPL with Django)
python manage.py shell

# Show all URLs
python manage.py show_urls  # Requires django-extensions
```

---

## 🗄️ PostgreSQL Commands

### Connection

```bash
# Connect to PostgreSQL
psql -U postgres

# Connect to specific database
psql -U postgres -d dolphin_naturals

# Connection string format
postgresql://username:password@host:port/database
```

### Database Operations

```sql
-- List databases
\l

-- Connect to database
\c dolphin_naturals

-- List tables
\dt

-- Describe table
\d products

-- View table data
SELECT * FROM products;

-- Exit
\q
```

---

## 📝 Environment Variables

### Required (.env file)

```env
# Django
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/dolphin_naturals
# OR
DB_NAME=dolphin_naturals
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
```

---

## 🔧 Render Deployment

### Build Settings

| Setting | Value |
|---------|-------|
| Root Directory | `backend` |
| Build Command | `./render-build.sh` |
| Start Command | `gunicorn dolphin.wsgi:application` |

### Environment Variables on Render

```env
SECRET_KEY=<generate-new-key>
DEBUG=False
ALLOWED_HOSTS=<your-domain>.onrender.com
DATABASE_URL=<render-postgres-internal-url>
CORS_ALLOWED_ORIGINS=https://your-frontend.onrender.com
RAZORPAY_KEY_ID=<your-key>
RAZORPAY_KEY_SECRET=<your-secret>
```

### Render Shell Commands

```bash
# Create superuser
python manage.py createsuperuser

# Run migrations
python manage.py migrate

# Check migrations status
python manage.py showmigrations

# View logs
# Use Render dashboard Logs tab
```

---

## 🐛 Troubleshooting

### Common Errors

**Error**: `No module named 'psycopg2'`
```bash
pip install psycopg2-binary
```

**Error**: `django.db.utils.OperationalError: FATAL: database "dolphin_naturals" does not exist`
```bash
psql -U postgres
CREATE DATABASE dolphin_naturals;
\q
python manage.py migrate
```

**Error**: `CORS policy: No 'Access-Control-Allow-Origin' header`
```python
# In settings.py, update:
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://your-frontend.onrender.com",
]
```

**Error**: `relation "api_user" does not exist`
```bash
python manage.py migrate --run-syncdb
```

**Error**: `SECRET_KEY must not be empty`
```bash
# Generate new secret key
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

---

## 📊 Database Schema Reference

### Main Tables

```sql
-- Users
users (id, email, name, mobile, role, verified, password, date_joined)

-- Products
products (id, name, description, category_id, mrp, sale_price, stock, ...)
product_images (id, product_id, image_url, display_order)
quantity_variants (id, product_id, label, mrp, sale_price, stock)

-- Categories
categories (id, name, description, active, show_on_home, display_order)

-- Cart & Orders
cart (id, user_id, product_id, variant_id, quantity)
orders (id, user_id, order_id, total_amount, status, payment_id, ...)
order_items (id, order_id, product_id, variant_id, quantity, price)

-- Reviews
reviews (id, product_id, user_id, rating, title, comment, ...)

-- Others
banners (id, title, subtitle, image_url, active, ...)
doctor_videos (id, title, doctor_name, video_url, ...)
otps (id, identifier, otp, purpose, verified, expiry)
```

---

## 🔐 Authentication Flow

### Register with OTP

```javascript
// 1. Send OTP
POST /api/auth/send-otp
{
  "email": "user@example.com",
  "name": "John Doe"
}

// 2. Verify OTP
POST /api/auth/verify-otp
{
  "email": "user@example.com",
  "otp": "123456"
}

// 3. Complete registration
POST /api/auth/register-with-otp
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "password123"
}
// Returns: { access_token, user }
```

### Login with OTP

```javascript
// 1. Verify credentials
POST /api/auth/login-verify-credentials
{
  "email": "user@example.com",
  "password": "password123"
}

// 2. Send OTP
POST /api/auth/send-otp
{
  "email": "user@example.com",
  "name": "John Doe"
}

// 3. Verify OTP
POST /api/auth/verify-otp
{
  "email": "user@example.com",
  "otp": "123456"
}

// 4. Complete login
POST /api/auth/login-with-otp
{
  "email": "user@example.com",
  "otp": "123456"
}
// Returns: { access_token, user }
```

### Use JWT Token

```javascript
// Add to request headers
headers: {
  'Authorization': 'Bearer <access_token>'
}
```

---

## 📱 API Response Format

### Success Response

```json
{
  "id": 1,
  "name": "Product Name",
  "price": 29900
}
```

### Error Response

```json
{
  "detail": "Error message here"
}
```

---

## 🎨 Django Admin

### Access Admin Panel

```
URL: http://localhost:8000/admin/
URL (Production): https://your-domain.onrender.com/admin/
```

### Default Admin User

Create via:
```bash
python manage.py createsuperuser
```

---

## 📦 Project Files

### Key Files

| File | Purpose |
|------|---------|
| `manage.py` | Django CLI |
| `dolphin/settings.py` | Django settings |
| `api/models.py` | Database models |
| `api/serializers.py` | API serializers |
| `api/views_*.py` | API views |
| `api/urls.py` | URL routing |
| `requirements.txt` | Python dependencies |
| `.env` | Environment variables |
| `render-build.sh` | Render build script |

---

## 🔗 Useful Links

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Render Documentation](https://render.com/docs)
- [Razorpay API](https://razorpay.com/docs/api/)

---

**Last Updated**: 2026-03-19
