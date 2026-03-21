# Django + PostgreSQL Deployment Guide for Render

## 🎉 Migration Complete!

Your backend has been migrated from **FastAPI + MongoDB** to **Django + PostgreSQL**.

---

## Project Structure

```
backend/
├── dolphin/              # Main Django project
│   ├── settings.py       # Django settings
│   ├── urls.py          # Root URL configuration
│   ├── wsgi.py          # WSGI application
│   └── asgi.py          # ASGI application
├── api/                 # Main API app
│   ├── models.py        # Database models (PostgreSQL)
│   ├── serializers.py   # DRF serializers
│   ├── views_auth.py    # Authentication views
│   ├── views_products.py # Product/Category views
│   ├── views_cart.py    # Cart/Order views
│   ├── views_admin.py   # Admin views
│   ├── views_upload.py  # File upload views
│   ├── views_payment.py # Razorpay payment views
│   ├── urls.py          # API URL routing
│   ├── admin.py         # Django admin configuration
│   ├── permissions.py   # Custom permissions
│   └── utils.py         # Utility functions
├── manage.py            # Django management script
├── requirements.txt     # Python dependencies
├── runtime.txt          # Python version for Render
├── render-build.sh      # Build script for Render
└── .env.example         # Environment variables template
```

---

## Prerequisites

### 1. PostgreSQL Database (Render Managed)

**Option A: Render PostgreSQL (Recommended - Free Tier)**
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New +** → **PostgreSQL**
3. Configure:
   - **Name**: `dolphin-postgres`
   - **Database**: `dolphin_naturals`
   - **User**: Auto-generated
   - **Region**: Same as your web service
   - **Instance Type**: **Free** (512MB, 1GB storage)
4. Click **Create Database**
5. Note down the **Internal Database URL** (starts with `postgres://`)

**Option B: ElephantSQL (Alternative Free PostgreSQL)**
1. Go to [ElephantSQL](https://www.elephantsql.com/)
2. Create free account
3. Create new instance (Tiny Turtle - Free)
4. Copy the database URL

**Option C: Supabase (Alternative with Dashboard)**
1. Go to [Supabase](https://supabase.com/)
2. Create new project
3. Get database connection string from Settings → Database

### 2. Razorpay Account
- Get your API keys from [Razorpay Dashboard](https://dashboard.razorpay.com/)

---

## Deployment Steps

### Step 1: Update Code for Production

#### A. Update `backend/dolphin/settings.py`

Add this at the end of the file:

```python
# Production settings
if not DEBUG:
    # Security settings
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'

    # Trust Render proxy
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

    # Static files (use WhiteNoise for serving)
    MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')
    STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
```

#### B. Update `requirements.txt` (add WhiteNoise)

Add this line to `backend/requirements.txt`:

```txt
whitenoise==6.6.0
```

#### C. Create `.env` file locally (for testing)

```bash
cd backend
cp .env.example .env
# Edit .env with your local PostgreSQL credentials
```

### Step 2: Test Locally with PostgreSQL

#### A. Install PostgreSQL locally (if not installed)

**Windows**:
```bash
# Download from: https://www.postgresql.org/download/windows/
# Or use Docker:
docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
```

**Mac**:
```bash
brew install postgresql
brew services start postgresql
```

**Linux**:
```bash
sudo apt-get install postgresql postgresql-contrib
```

#### B. Create local database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE dolphin_naturals;

# Exit
\q
```

#### C. Run migrations

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Create migrations
python manage.py makemigrations

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

#### D. Test locally

```bash
# Run development server
python manage.py runserver

# Test API
# Open: http://localhost:8000/api/products/
# Admin panel: http://localhost:8000/admin/
```

### Step 3: Deploy to Render

#### A. Push to GitHub

```bash
# Add backend to git
git add backend/
git commit -m "Add Django backend with PostgreSQL"
git push origin main
```

#### B. Create Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `dolphin-django-backend` |
| **Region** | Choose closest to you |
| **Root Directory** | `backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `./render-build.sh` |
| **Start Command** | `gunicorn dolphin.wsgi:application` |
| **Instance Type** | **Free** |

#### C. Add Environment Variables

Click **Advanced** → **Add Environment Variable**:

| Key | Value | Notes |
|-----|-------|-------|
| `SECRET_KEY` | Generate using: `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` | Keep it secret! |
| `DEBUG` | `False` | Set to False in production |
| `ALLOWED_HOSTS` | `dolphin-django-backend.onrender.com,localhost` | Your actual Render domain |
| `DATABASE_URL` | Your Render PostgreSQL Internal URL | From PostgreSQL service |
| `CORS_ALLOWED_ORIGINS` | `https://your-frontend.onrender.com,http://localhost:3000` | Your frontend URLs |
| `RAZORPAY_KEY_ID` | `rzp_test_xxxxx` | From Razorpay |
| `RAZORPAY_KEY_SECRET` | `xxxxxxxxxxxxx` | From Razorpay |

**Important**: If using `DATABASE_URL`, update `settings.py`:

```python
import dj_database_url

# In settings.py, replace DATABASES with:
DATABASES = {
    'default': dj_database_url.config(
        default=os.getenv('DATABASE_URL'),
        conn_max_age=600
    )
}
```

And add to `requirements.txt`:
```txt
dj-database-url==2.1.0
```

#### D. Deploy

1. Click **Create Web Service**
2. Wait 5-10 minutes for build and deployment
3. Check logs for any errors
4. Note your backend URL: `https://dolphin-django-backend.onrender.com`

### Step 4: Verify Deployment

#### A. Test API Endpoints

```bash
# Test products endpoint
curl https://dolphin-django-backend.onrender.com/api/products/

# Test API docs (if enabled)
# Visit: https://dolphin-django-backend.onrender.com/admin/
```

#### B. Access Django Admin

1. Visit: `https://dolphin-django-backend.onrender.com/admin/`
2. Login with superuser credentials (create via shell if needed)

#### C. Create superuser via Render Shell

1. Go to Render Dashboard → Your Service → **Shell**
2. Run:
```bash
python manage.py createsuperuser
```

### Step 5: Seed Database (Optional)

Create a `seed_django.py` script:

```python
# backend/seed_django.py
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dolphin.settings')
django.setup()

from api.models import Category, Product, ProductImage, User

# Create default category
category, _ = Category.objects.get_or_create(
    name='Ayurvedic Products',
    defaults={
        'description': 'Natural Ayurvedic products',
        'active': True,
        'is_default': True
    }
)

# Create admin user if not exists
if not User.objects.filter(email='admin@dolphinnaturals.com').exists():
    User.objects.create_superuser(
        email='admin@dolphinnaturals.com',
        name='Admin',
        password='admin123'  # Change this!
    )

print("Database seeded successfully!")
```

Run locally or via Render Shell:
```bash
python seed_django.py
```

---

## Frontend Integration

### Update Frontend API URL

Update `frontend/src/api.js` or `frontend/.env.production`:

```javascript
// frontend/src/api.js
const API_URL = process.env.REACT_APP_API_URL || 'https://dolphin-django-backend.onrender.com';
```

```env
# frontend/.env.production
REACT_APP_API_URL=https://dolphin-django-backend.onrender.com
```

---

## Environment Variables Summary

### Required Environment Variables

```env
SECRET_KEY=your-django-secret-key
DEBUG=False
ALLOWED_HOSTS=your-domain.onrender.com
DATABASE_URL=postgresql://user:pass@host:5432/dbname
CORS_ALLOWED_ORIGINS=https://your-frontend.onrender.com
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
```

### Optional Environment Variables

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

---

## Troubleshooting

### Issue: Migrations fail on Render

**Solution**: Check if `DATABASE_URL` is set correctly. Run migrations manually via Shell:
```bash
python manage.py migrate --run-syncdb
```

### Issue: Static files not loading

**Solution**: Ensure WhiteNoise is installed and configured. Run:
```bash
python manage.py collectstatic --no-input
```

### Issue: CORS errors

**Solution**: Update `CORS_ALLOWED_ORIGINS` in settings or environment variables.

### Issue: Database connection refused

**Solution**: Use **Internal Database URL** from Render PostgreSQL service, not External URL.

---

## Cost Breakdown (Free Tier)

| Service | Free Tier | Cost |
|---------|-----------|------|
| Render Web Service | 750 hours/month | **FREE** |
| Render PostgreSQL | 90 days free, then $7/month | **FREE (90 days)** |
| Render Static Site (Frontend) | Unlimited | **FREE** |
| Razorpay | Test mode | **FREE** |

**After 90 days**: PostgreSQL costs $7/month, or migrate to ElephantSQL (free 20MB)

---

## Database Backup

### Export data (before switching)

```bash
# From MongoDB (old backend)
mongoexport --db=dolphin_naturals --collection=products --out=products.json

# Import to PostgreSQL (new backend)
python manage.py loaddata products.json
```

---

## Next Steps

1. ✅ Deploy backend on Render
2. ✅ Test all API endpoints
3. ✅ Update frontend to use new backend URL
4. ✅ Test authentication flow
5. ✅ Test payment integration
6. ✅ Monitor logs and errors
7. ✅ Set up database backups
8. ✅ Configure custom domain (optional)

---

## Additional Resources

- [Django Deployment Checklist](https://docs.djangoproject.com/en/5.0/howto/deployment/checklist/)
- [Render Django Documentation](https://render.com/docs/deploy-django)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Deployment Date**: 2026-03-19
**Framework**: Django 5.0 + Django REST Framework
**Database**: PostgreSQL
**Hosting**: Render
