# 🚀 Dolphin Naturals - Render Deployment Guide

Complete step-by-step guide to deploy Django + React app on Render.com

---

## 📋 Pre-Deployment Checklist

✅ All deployment files created:
- `backend/build.sh` - Build script for Django
- `backend/requirements.txt` - Python dependencies
- `render.yaml` - Render configuration
- `frontend/.env.example` - Frontend environment variables

✅ Cloudinary configured for image/video storage
✅ Git repository ready
✅ GitHub repository created

---

## 🎯 Deployment Steps

### Step 1: Push Code to GitHub

```bash
# Make sure you're in the project root
cd E:\Dolphin

# Check git status
git status

# Add all files
git add .

# Commit changes
git commit -m "Prepare for Render deployment

- Add Cloudinary integration
- Configure Whitenoise for static files
- Add render.yaml configuration
- Update Django settings for production

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Push to GitHub
git push origin main
```

---

### Step 2: Create Render Account

1. Go to: https://render.com/
2. Click **"Get Started for Free"**
3. Sign up with **GitHub** (recommended)
4. Authorize Render to access your GitHub repositories

---

### Step 3: Deploy Backend (Django API)

#### 3.1 Create Web Service

1. **Dashboard** → Click **"New +"** → **"Web Service"**

2. **Connect Repository:**
   - Select: `thulirinfotech-IT-team/Dolphine`
   - Click **"Connect"**

3. **Configure Service:**
   ```
   Name: dolphin-backend
   Region: Singapore (or closest to you)
   Branch: main
   Root Directory: backend
   Runtime: Python 3
   Build Command: chmod +x build.sh && ./build.sh
   Start Command: gunicorn dolphin.wsgi:application
   Instance Type: Free
   ```

4. **Add Environment Variables:**

   Click **"Advanced"** → **"Add Environment Variable"**

   Add these variables:

   ```env
   # Django
   SECRET_KEY=<click "Generate" button>
   DEBUG=False
   PYTHON_VERSION=3.11.0

   # Cloudinary
   CLOUDINARY_CLOUD_NAME=dik1wlhqk
   CLOUDINARY_API_KEY=737474814736168
   CLOUDINARY_API_SECRET=fiyUamcEoX8ElbbFiogqgTphV1I

   # Razorpay
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   ```

   **Note:** Don't add DATABASE_URL - Render will add it automatically when you connect the database.

5. **Click "Create Web Service"**

   Render will start building your backend. This takes 5-10 minutes.

#### 3.2 Create PostgreSQL Database

1. **Dashboard** → Click **"New +"** → **"PostgreSQL"**

2. **Configure Database:**
   ```
   Name: dolphin-db
   Database: dolphin_naturals
   User: dolphin_user
   Region: Singapore (same as backend)
   Plan: Free
   ```

3. **Click "Create Database"**

   Database creation takes 1-2 minutes.

#### 3.3 Connect Database to Backend

1. Go to **dolphin-backend** service
2. Click **"Environment"** tab
3. Click **"Add Environment Variable"**
4. Add:
   ```
   Key: DATABASE_URL
   Value: <Click "Choose from existing" → Select "dolphin-db">
   ```
5. **Save Changes**

   Backend will automatically redeploy with database connection.

#### 3.4 Update ALLOWED_HOSTS

1. After backend deploys, copy the URL (e.g., `https://dolphin-backend.onrender.com`)
2. Go to **Environment** tab
3. Add variable:
   ```
   Key: ALLOWED_HOSTS
   Value: dolphin-backend.onrender.com
   ```
4. Save and wait for redeployment

---

### Step 4: Deploy Frontend (React)

#### 4.1 Create Web Service

1. **Dashboard** → Click **"New +"** → **"Web Service"**

2. **Connect Repository:**
   - Select: `thulirinfotech-IT-team/Dolphine` (same repo)
   - Click **"Connect"**

3. **Configure Service:**
   ```
   Name: dolphin-frontend
   Region: Singapore (same as backend)
   Branch: main
   Root Directory: frontend
   Runtime: Node
   Build Command: npm install && npm run build
   Start Command: npm install -g serve && serve -s build -p $PORT
   Instance Type: Free
   ```

4. **Add Environment Variables:**

   Click **"Advanced"** → **"Add Environment Variable"**

   ```env
   NODE_VERSION=18.17.0
   REACT_APP_API_URL=https://dolphin-backend.onrender.com
   ```

   **Important:** Use YOUR actual backend URL (from Step 3.4)

5. **Click "Create Web Service"**

   Frontend build takes 5-10 minutes.

---

### Step 5: Update CORS Settings

After frontend deploys:

1. **Copy frontend URL** (e.g., `https://dolphin-frontend.onrender.com`)

2. **Go to backend service** (dolphin-backend)

3. **Environment** tab → Add variable:
   ```
   Key: CORS_ALLOWED_ORIGINS
   Value: https://dolphin-frontend.onrender.com
   ```

4. **Save** - Backend will redeploy

---

### Step 6: Create Admin User

1. Go to **dolphin-backend** service
2. Click **"Shell"** tab
3. Run these commands:
   ```bash
   python manage.py createsuperuser
   ```
4. Enter:
   - Email: `admin@dolphinnaturals.com`
   - Name: `Admin`
   - Password: `<your-secure-password>`

---

### Step 7: Test Deployment

#### Test Backend:
- Visit: `https://dolphin-backend.onrender.com/admin/`
- Login with admin credentials
- Add a product with image (Cloudinary upload!)

#### Test Frontend:
- Visit: `https://dolphin-frontend.onrender.com/`
- Browse products
- Register/Login
- Add to cart
- Checkout

---

## 🎉 Deployment Complete!

### Your Live URLs:

- **Frontend (Website):** `https://dolphin-frontend.onrender.com`
- **Backend (API):** `https://dolphin-backend.onrender.com/api/`
- **Admin Panel:** `https://dolphin-backend.onrender.com/admin/`

---

## 📝 Post-Deployment Tasks

### 1. Update Custom Domain (Optional)

#### For Frontend:
1. Buy domain (e.g., `dolphinnaturals.com`)
2. Render → dolphin-frontend → **Settings** → **Custom Domain**
3. Add domain and update DNS records
4. Update `CORS_ALLOWED_ORIGINS` in backend

#### For Backend:
1. Buy domain (e.g., `api.dolphinnaturals.com`)
2. Render → dolphin-backend → **Settings** → **Custom Domain**
3. Add domain and update DNS records
4. Update `ALLOWED_HOSTS` in backend
5. Update `REACT_APP_API_URL` in frontend

### 2. Configure Email (OTP)

If using Gmail SMTP:

1. Enable 2FA: https://myaccount.google.com/security
2. Create App Password: https://myaccount.google.com/apppasswords
3. Backend → Environment → Add:
   ```env
   EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USE_TLS=True
   EMAIL_HOST_USER=your-email@gmail.com
   EMAIL_HOST_PASSWORD=<app-password>
   ```

### 3. Monitor Services

- **Logs:** Each service → **Logs** tab
- **Metrics:** Each service → **Metrics** tab
- **Alerts:** Set up in Render settings

---

## 🐛 Troubleshooting

### Issue 1: Build Failed

**Check:**
- Logs tab for error details
- requirements.txt has all dependencies
- Python version matches (3.11.0)

**Fix:**
- Update requirements.txt
- Push to GitHub
- Render auto-redeploys

### Issue 2: Database Connection Error

**Check:**
- DATABASE_URL environment variable is set
- Database service is running

**Fix:**
- Re-add DATABASE_URL from dolphin-db
- Manual redeploy

### Issue 3: Static Files Not Loading

**Check:**
- Whitenoise installed
- collectstatic ran in build.sh

**Fix:**
- Verify build.sh has `collectstatic` command
- Check logs for collectstatic errors

### Issue 4: CORS Errors

**Check:**
- CORS_ALLOWED_ORIGINS has frontend URL
- No trailing slashes in URLs

**Fix:**
- Update CORS_ALLOWED_ORIGINS
- Redeploy backend

### Issue 5: Frontend Can't Connect to Backend

**Check:**
- REACT_APP_API_URL points to backend
- Backend is running (green status)

**Fix:**
- Update REACT_APP_API_URL
- Redeploy frontend

### Issue 6: Images Not Uploading

**Check:**
- Cloudinary credentials are correct
- CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET set

**Fix:**
- Verify credentials in Cloudinary dashboard
- Test upload manually

---

## 💰 Free Tier Limits

### Render Free Plan:
- ✅ 750 hours/month (enough for 1 service 24/7)
- ✅ Auto-sleep after 15 min inactivity
- ✅ Wakes up on request (cold start ~30s)
- ✅ PostgreSQL 90-day limit (free tier)
- ⚠️ Limited bandwidth
- ⚠️ Limited build minutes

### Tips to Stay Within Limits:
1. **Use 1 combined service** (if possible)
2. **Upgrade to paid** ($7/month) for always-on
3. **Monitor usage** in dashboard

---

## 📊 Environment Variables Summary

### Backend (dolphin-backend):
```env
SECRET_KEY=<auto-generated>
DEBUG=False
PYTHON_VERSION=3.11.0
ALLOWED_HOSTS=dolphin-backend.onrender.com
DATABASE_URL=<from dolphin-db>
CORS_ALLOWED_ORIGINS=https://dolphin-frontend.onrender.com
CLOUDINARY_CLOUD_NAME=dik1wlhqk
CLOUDINARY_API_KEY=737474814736168
CLOUDINARY_API_SECRET=fiyUamcEoX8ElbbFiogqgTphV1I
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### Frontend (dolphin-frontend):
```env
NODE_VERSION=18.17.0
REACT_APP_API_URL=https://dolphin-backend.onrender.com
```

---

## 🔄 Continuous Deployment

Render automatically redeploys when you push to GitHub:

```bash
# Make changes locally
git add .
git commit -m "Update feature"
git push origin main

# Render auto-deploys! ✅
```

---

## ✅ Success Checklist

- [ ] Code pushed to GitHub
- [ ] Render account created
- [ ] Backend deployed and running
- [ ] Database created and connected
- [ ] Frontend deployed and running
- [ ] CORS configured
- [ ] Admin user created
- [ ] Products can be added
- [ ] Images upload to Cloudinary
- [ ] Frontend loads and connects to API
- [ ] Register/Login works
- [ ] Cart and checkout work
- [ ] Payment integration tested

---

## 🎯 Next Steps

1. **Test thoroughly** - Try all features
2. **Add sample data** - Products, categories, banners
3. **Share with users** - Get feedback
4. **Monitor logs** - Check for errors
5. **Optimize** - Improve performance
6. **Scale** - Upgrade when needed

---

## 🆘 Need Help?

- **Render Docs:** https://render.com/docs
- **Django Docs:** https://docs.djangoproject.com/
- **React Docs:** https://react.dev/

---

**Deployment-க்கு all the best! 🚀🎉**
