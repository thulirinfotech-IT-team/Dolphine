"""
Cloudinary upload utilities for images and videos
"""
import cloudinary
import cloudinary.uploader
from django.core.files.uploadedfile import InMemoryUploadedFile, TemporaryUploadedFile


def upload_image_to_cloudinary(image_file, folder="products"):
    """
    Upload an image file to Cloudinary

    Args:
        image_file: Django UploadedFile object or file path
        folder: Cloudinary folder name (default: "products")

    Returns:
        dict: Cloudinary response with 'url', 'public_id', etc.
    """
    try:
        # Upload to Cloudinary
        response = cloudinary.uploader.upload(
            image_file,
            folder=folder,
            resource_type="image",
            transformation=[
                {'width': 1000, 'height': 1000, 'crop': 'limit'},  # Max 1000x1000
                {'quality': 'auto:good'},  # Optimize quality
                {'fetch_format': 'auto'}  # Auto format (WebP, etc.)
            ]
        )

        return {
            'success': True,
            'url': response.get('secure_url'),
            'public_id': response.get('public_id'),
            'width': response.get('width'),
            'height': response.get('height'),
            'format': response.get('format'),
        }

    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def upload_video_to_cloudinary(video_file, folder="videos"):
    """
    Upload a video file to Cloudinary

    Args:
        video_file: Django UploadedFile object or file path
        folder: Cloudinary folder name (default: "videos")

    Returns:
        dict: Cloudinary response with 'url', 'public_id', etc.
    """
    try:
        # Upload to Cloudinary
        response = cloudinary.uploader.upload(
            video_file,
            folder=folder,
            resource_type="video",
            transformation=[
                {'quality': 'auto:good'},  # Optimize quality
            ]
        )

        return {
            'success': True,
            'url': response.get('secure_url'),
            'public_id': response.get('public_id'),
            'width': response.get('width'),
            'height': response.get('height'),
            'format': response.get('format'),
            'duration': response.get('duration'),
        }

    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def delete_from_cloudinary(public_id, resource_type="image"):
    """
    Delete a file from Cloudinary

    Args:
        public_id: Cloudinary public ID of the file
        resource_type: 'image' or 'video'

    Returns:
        dict: Cloudinary response
    """
    try:
        response = cloudinary.uploader.destroy(
            public_id,
            resource_type=resource_type
        )

        return {
            'success': response.get('result') == 'ok',
            'result': response.get('result')
        }

    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def get_cloudinary_url(public_id, transformations=None):
    """
    Generate a Cloudinary URL with optional transformations

    Args:
        public_id: Cloudinary public ID
        transformations: List of transformation dicts

    Returns:
        str: Cloudinary URL
    """
    if transformations:
        url, options = cloudinary.utils.cloudinary_url(
            public_id,
            transformation=transformations,
            secure=True
        )
        return url
    else:
        url, options = cloudinary.utils.cloudinary_url(
            public_id,
            secure=True
        )
        return url
