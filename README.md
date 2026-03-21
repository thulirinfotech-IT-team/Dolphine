# Dolphin Naturals - E-commerce Platform

Full-stack e-commerce platform for natural/ayurvedic products.

## 🏗️ Tech Stack

**Backend**: Django 5.0 + Django REST Framework + PostgreSQL
**Frontend**: React 18 + React Router + Axios
**Payment**: Razorpay
**Deployment**: Render

---

## 📁 Project Structure

```
Dolphin/
├── backend/          # Django REST API Backend
│   ├── dolphin/            # Django project settings
│   ├── api/                # Main API app
│   │   ├── models.py       # Database models
│   │   ├── serializers.py  # DRF serializers
│   │   ├── views_*.py      # API views
│   │   ├── urls.py         # API routing
│   │   └── admin.py        # Admin panel config
│   ├── manage.py           # Django CLI
│   ├── requirements.txt    # Python dependencies
│   └── .env.example        # Environment template
│
├── frontend/                 # React Frontend
│   ├── src/
│   │   ├── pages/          # Page components
│   │   ├── components/     # Reusable components
│   │   ├── api.js          # API configuration
│   │   └── App.js          # Main app
│   ├── public/
│   └── package.json
│
├── DJANGO_DEPLOYMENT_GUIDE.md  # Render deployment guide
├── QUICK_REFERENCE.md          # Commands reference
├── package.json                # Root scripts
└── README.md                   # This file
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 16+
- PostgreSQL 14+

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\activate         # Windows
source venv/bin/activate      # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create admin user
python manage.py createsuperuser

# Run server
python manage.py runserver
```

**Backend URL**: http://localhost:8000

### 2. Frontend Setup

```bash
# In new terminal
cd frontend

# Install dependencies
npm install

# Run dev server
npm start
```

**Frontend URL**: http://localhost:3000

### 3. OR Run Both Together

```bash
# From root directory
npm install
npm run dev
```

---

## 🎯 Features

### Customer Features
✅ User registration with OTP
✅ Email/Mobile OTP login
✅ Product browsing & search
✅ Product categories & filtering
✅ Product reviews & ratings
✅ Shopping cart
✅ Order placement
✅ Razorpay payment integration
✅ Order history
✅ Password reset with OTP

### Admin Features (Django Admin)
✅ Product management (CRUD)
✅ Category management
✅ Order management & status updates
✅ User management
✅ Banner management
✅ Doctor video testimonials
✅ Review moderation
✅ Sales analytics

---

## 🔧 Available Scripts

### Root Directory

```bash
npm run dev              # Run both backend + frontend
npm run backend          # Django backend only
npm run frontend         # React frontend only
npm run migrate          # Run database migrations
npm run makemigrations   # Create migrations
npm run createsuperuser  # Create admin user
```

### Backend Scripts

```bash
cd backend
venv\Scripts\activate    # Activate venv first (Windows)

python manage.py runserver          # Run dev server
python manage.py makemigrations     # Create migrations
python manage.py migrate            # Apply migrations
python manage.py createsuperuser    # Create admin
python manage.py shell              # Django shell
python manage.py dbshell            # Database shell
python manage.py test               # Run tests
python manage.py collectstatic      # Collect static files
```

---

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register-with-otp` - Register with OTP
- `POST /api/auth/send-otp` - Send OTP
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/forgot-password` - Forgot password
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Current user

### Products
- `GET /api/products/` - List products
- `GET /api/products/{id}` - Product details
- `GET /api/products/home` - Homepage products

### Categories
- `GET /api/categories/` - List categories
- `GET /api/categories/{id}` - Category details

### Cart
- `GET /api/cart/` - Get cart
- `POST /api/cart/add` - Add to cart
- `PUT /api/cart/{id}` - Update cart item
- `DELETE /api/cart/{id}/delete` - Remove item

### Orders
- `GET /api/orders/` - User orders
- `POST /api/orders/create` - Create order
- `GET /api/orders/{id}` - Order details

### Payment
- `POST /api/payment/create-order` - Create Razorpay order
- `POST /api/payment/verify` - Verify payment

### Admin (requires admin role)
- `/api/admin/products` - Manage products
- `/api/admin/categories` - Manage categories
- `/api/admin/banners` - Manage banners
- `/api/admin/doctor-videos` - Manage videos
- `/api/admin/orders` - Manage orders

Full API docs: **[backend/README.md](backend/README.md)**

---

## 🎨 Admin Panel

**URL**: http://localhost:8000/admin/

Login with superuser credentials to manage:
- Products & categories
- Orders & order status
- Users & permissions
- Banners & videos
- Reviews & ratings

---

## 🔐 Environment Variables

### Backend (.env)

```env
# Django
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# PostgreSQL Database
DB_NAME=dolphin_naturals
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Razorpay
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_secret
```

### Frontend (.env.production)

```env
REACT_APP_API_URL=https://your-backend.onrender.com
```

---

## 🚢 Deployment

See **[DJANGO_DEPLOYMENT_GUIDE.md](DJANGO_DEPLOYMENT_GUIDE.md)** for complete deployment instructions.

### Quick Summary:

1. **PostgreSQL Database** (Render - Free)
   - Create managed PostgreSQL instance
   - Note internal database URL

2. **Django Backend** (Render Web Service - Free)
   - Root Directory: `backend`
   - Build: `./render-build.sh`
   - Start: `gunicorn dolphin.wsgi:application`
   - Add environment variables

3. **React Frontend** (Render Static Site - Free)
   - Root Directory: `frontend`
   - Build: `npm install && npm run build`
   - Publish: `build`

**Cost**: ₹0 (Free tier) for 90 days, then ₹500/month for PostgreSQL

---

## 📊 Database Schema

- **users** - User accounts with email auth
- **categories** - Product categories
- **products** - Products with pricing
- **product_images** - Multiple images per product
- **quantity_variants** - Size/quantity variants
- **reviews** - Product reviews & ratings
- **cart** - Shopping cart items
- **orders** - Customer orders
- **order_items** - Items in each order
- **banners** - Homepage banners
- **doctor_videos** - Doctor testimonials
- **otps** - OTP authentication

---

## 🧪 Testing

```bash
# Backend tests
cd backend
python manage.py test

# Frontend tests
cd frontend
npm test
```

---

## 📚 Documentation

- **[DJANGO_DEPLOYMENT_GUIDE.md](DJANGO_DEPLOYMENT_GUIDE.md)** - Deploy to Render
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Commands & troubleshooting
- **[backend/README.md](backend/README.md)** - API documentation

---

## 🐛 Troubleshooting

### Database connection error
```bash
# Create database
psql -U postgres
CREATE DATABASE dolphin_naturals;
\q
```

### CORS errors
Check `CORS_ALLOWED_ORIGINS` in `backend/.env`

### Static files not loading
```bash
cd backend
python manage.py collectstatic
```

More help: **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)**

---

## 📝 License

Proprietary - Dolphin Naturals

---

## 📞 Support

- Email: support@dolphinnaturals.com
- Documentation: See files listed above

---

**Built with Django + React**
**Last Updated**: 2026-03-19
