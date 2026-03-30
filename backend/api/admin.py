"""
Django admin configuration for Dolphin Naturals
"""
from django import forms
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import (
    User, Category, Product, ProductImage, QuantityVariant,
    Review, Cart, Order, OrderItem, Banner, DoctorVideo, OTP
)


class ProductAdminForm(forms.ModelForm):
    """Custom form to display prices in Rupees instead of Paise"""

    mrp_rupees = forms.DecimalField(
        label='MRP (₹)',
        max_digits=10,
        decimal_places=2,
        required=False,
        help_text='Price in Rupees (e.g., 499.00 = ₹499)'
    )

    sale_price_rupees = forms.DecimalField(
        label='Sale Price (₹)',
        max_digits=10,
        decimal_places=2,
        required=False,
        help_text='Sale price in Rupees (e.g., 399.00 = ₹399)'
    )

    class Meta:
        model = Product
        fields = '__all__'
        # Specify field order
        field_order = ['name', 'description', 'category', 'mrp_rupees', 'sale_price_rupees',
                      'discount_percent', 'stock', 'show_on_home']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Convert paise to rupees for display
        if self.instance and self.instance.pk:
            if self.instance.mrp:
                self.fields['mrp_rupees'].initial = self.instance.mrp / 100
            if self.instance.sale_price:
                self.fields['sale_price_rupees'].initial = self.instance.sale_price / 100

        # Hide the original paise fields and make them not required
        self.fields['mrp'].widget = forms.HiddenInput()
        self.fields['mrp'].required = False
        self.fields['sale_price'].widget = forms.HiddenInput()
        self.fields['sale_price'].required = False

        # Make discount read-only with better styling
        self.fields['discount_percent'].widget.attrs.update({
            'readonly': 'readonly',
            'style': 'background-color: #f0f0f0; font-weight: bold;'
        })
        self.fields['discount_percent'].help_text = '✨ Auto-calculated from MRP and Sale Price'

    def clean(self):
        cleaned_data = super().clean()

        # Convert rupees to paise before saving
        mrp_rupees = cleaned_data.get('mrp_rupees')
        sale_price_rupees = cleaned_data.get('sale_price_rupees')

        if mrp_rupees:
            cleaned_data['mrp'] = int(mrp_rupees * 100)
        elif not cleaned_data.get('mrp'):
            raise forms.ValidationError("MRP (₹) is required.")

        if sale_price_rupees:
            cleaned_data['sale_price'] = int(sale_price_rupees * 100)
        elif not cleaned_data.get('sale_price'):
            raise forms.ValidationError("Sale Price (₹) is required.")

        # Auto-calculate discount
        if mrp_rupees and sale_price_rupees and mrp_rupees > 0:
            discount = ((mrp_rupees - sale_price_rupees) / mrp_rupees) * 100
            cleaned_data['discount_percent'] = round(discount)

        return cleaned_data


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'name', 'role', 'verified', 'is_active', 'date_joined']
    list_filter = ['role', 'verified', 'is_active']
    search_fields = ['email', 'name']
    ordering = ['-date_joined']

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('name', 'mobile')}),
        ('Permissions', {'fields': ('role', 'verified', 'is_active', 'is_staff', 'is_superuser')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'password1', 'password2', 'role'),
        }),
    )


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'icon_preview', 'active', 'show_on_home', 'display_order', 'is_default']
    list_filter = ['active', 'show_on_home', 'is_default']
    search_fields = ['name', 'description']
    ordering = ['display_order', 'name']
    fields = ['name', 'description', 'icon_image_preview', 'icon_file', 'icon_image', 'active', 'show_on_home', 'display_order', 'is_default']
    readonly_fields = ['icon_image_preview']
    help_text = "Upload icon file OR enter icon URL (file upload takes priority)"

    def icon_preview(self, obj):
        """Show small icon in list"""
        if obj.icon_image:
            return format_html('<img src="{}" style="max-height: 40px; max-width: 40px;" />', obj.icon_image)
        return "No icon"
    icon_preview.short_description = 'Icon'

    def icon_image_preview(self, obj):
        """Show larger icon preview in form"""
        if obj.icon_image:
            return format_html('<img src="{}" style="max-height: 150px; max-width: 200px;" />', obj.icon_image)
        return "No icon uploaded yet"
    icon_image_preview.short_description = 'Current Icon'


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ['image_preview', 'image_file', 'image_url', 'display_order']
    readonly_fields = ['image_preview']
    help_text = "Upload image file OR enter image URL (file upload takes priority)"

    def image_preview(self, obj):
        """Show image preview"""
        if obj.image_url:
            return format_html('<img src="{}" style="max-height: 100px; max-width: 150px;" />', obj.image_url)
        return "No image"
    image_preview.short_description = 'Preview'


class QuantityVariantInline(admin.TabularInline):
    model = QuantityVariant
    extra = 1
    fields = ['label', 'mrp', 'sale_price', 'stock', 'display_order']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    form = ProductAdminForm
    list_display = ['name', 'category', 'get_sale_price_display', 'stock', 'show_on_home', 'created_at']
    list_filter = ['category', 'show_on_home', 'created_at']
    search_fields = ['name', 'description']
    inlines = [ProductImageInline, QuantityVariantInline]
    ordering = ['-created_at']

    fieldsets = (
        ('📝 Basic Information', {
            'fields': ('name', 'description', 'category')
        }),
        ('💰 Pricing (in Rupees)', {
            'fields': ('mrp_rupees', 'sale_price_rupees', 'discount_percent'),
            'description': 'Enter prices in ₹ Rupees. Discount is auto-calculated! 🎉'
        }),
        ('📦 Inventory & Display', {
            'fields': ('stock', 'show_on_home')
        }),
        ('🔒 Hidden Fields (Do not edit)', {
            'fields': ('mrp', 'sale_price'),
            'classes': ('collapse',)
        }),
    )

    def get_sale_price_display(self, obj):
        """Display sale price in rupees in list view"""
        return f"₹{obj.sale_price / 100:.2f}" if obj.sale_price else "N/A"
    get_sale_price_display.short_description = 'Sale Price'


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['product', 'user', 'rating', 'verified_purchase', 'created_at']
    list_filter = ['rating', 'verified_purchase', 'created_at']
    search_fields = ['product__name', 'user__email', 'comment']
    ordering = ['-created_at']


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ['user', 'product', 'variant', 'quantity', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__email', 'product__name']
    ordering = ['-created_at']


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['product', 'variant', 'quantity', 'price']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_id', 'user', 'total_amount', 'status', 'payment_status', 'created_at']
    list_filter = ['status', 'payment_status', 'created_at']
    search_fields = ['order_id', 'user__email', 'shipping_name', 'shipping_email']
    inlines = [OrderItemInline]
    ordering = ['-created_at']
    readonly_fields = ['order_id', 'created_at']


@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = ['title', 'banner_preview', 'active', 'display_order', 'created_at']
    list_filter = ['active', 'created_at']
    search_fields = ['title', 'subtitle']
    ordering = ['display_order']
    fields = ['title', 'subtitle', 'cta_text', 'cta_link', 'banner_image_preview', 'image_file', 'image_url', 'active', 'display_order']
    readonly_fields = ['banner_image_preview']
    help_text = "Upload banner file OR enter banner URL (file upload takes priority)"

    def banner_preview(self, obj):
        """Show small banner in list"""
        if obj.image_url:
            return format_html('<img src="{}" style="max-height: 40px; max-width: 80px;" />', obj.image_url)
        return "No image"
    banner_preview.short_description = 'Banner'

    def banner_image_preview(self, obj):
        """Show larger banner preview in form"""
        if obj.image_url:
            return format_html('<img src="{}" style="max-height: 200px; max-width: 400px;" />', obj.image_url)
        return "No banner uploaded yet"
    banner_image_preview.short_description = 'Current Banner'


@admin.register(DoctorVideo)
class DoctorVideoAdmin(admin.ModelAdmin):
    list_display = ['title', 'doctor_name', 'video_type', 'active', 'display_order', 'created_at']
    list_filter = ['video_type', 'active', 'created_at']
    search_fields = ['title', 'doctor_name', 'description']
    ordering = ['display_order']


@admin.register(OTP)
class OTPAdmin(admin.ModelAdmin):
    list_display = ['identifier', 'purpose', 'verified', 'expiry', 'created_at']
    list_filter = ['purpose', 'verified', 'created_at']
    search_fields = ['identifier']
    ordering = ['-created_at']
