"""
Clean up database - Remove all products, categories, and banners
Run this to start fresh with a clean database
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dolphin.settings')
django.setup()

from api.models import Product, Category, Banner, DoctorVideo, ProductImage, QuantityVariant

def clean_database():
    print("🧹 Cleaning database...")

    # Delete all products and related data
    product_count = Product.objects.count()
    category_count = Category.objects.count()
    banner_count = Banner.objects.count()
    video_count = DoctorVideo.objects.count()

    ProductImage.objects.all().delete()
    QuantityVariant.objects.all().delete()
    Product.objects.all().delete()
    Category.objects.all().delete()
    Banner.objects.all().delete()
    DoctorVideo.objects.all().delete()

    print(f"✅ Deleted {product_count} products")
    print(f"✅ Deleted {category_count} categories")
    print(f"✅ Deleted {banner_count} banners")
    print(f"✅ Deleted {video_count} videos")
    print("\n✨ Database is now clean!")
    print("\n📝 Next steps:")
    print("1. Go to http://localhost:8000/admin/")
    print("2. Add categories")
    print("3. Add products with proper images")
    print("4. Add banners for homepage slider")

if __name__ == "__main__":
    confirm = input("⚠️  This will delete ALL products, categories, and banners. Continue? (yes/no): ")
    if confirm.lower() == 'yes':
        clean_database()
    else:
        print("❌ Cancelled")
