"""
File upload views for Dolphin Naturals API
Uploads files to Cloudinary cloud storage
"""
import os
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from .permissions import IsAdminUser
from .cloudinary_utils import upload_image_to_cloudinary, upload_video_to_cloudinary


@api_view(['POST'])
@permission_classes([IsAdminUser])
@parser_classes([MultiPartParser, FormParser])
def upload_image(request):
    """Upload a single image to Cloudinary"""
    if 'file' not in request.FILES:
        return Response({'detail': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

    file = request.FILES['file']
    folder = request.data.get('folder', 'products')  # Default folder: products

    # Validate file type
    allowed_extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
    file_ext = file.name.split('.')[-1].lower()

    if file_ext not in allowed_extensions:
        return Response({'detail': 'Invalid file type. Allowed: jpg, jpeg, png, gif, webp'},
                        status=status.HTTP_400_BAD_REQUEST)

    # Upload to Cloudinary
    result = upload_image_to_cloudinary(file, folder=folder)

    if result['success']:
        return Response({
            'status': 'success',
            'url': result['url'],
            'public_id': result['public_id'],
            'width': result['width'],
            'height': result['height'],
        })
    else:
        return Response({
            'status': 'error',
            'detail': result['error']
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAdminUser])
@parser_classes([MultiPartParser, FormParser])
def upload_multiple_images(request):
    """Upload multiple images to Cloudinary"""
    if 'files' not in request.FILES:
        return Response({'detail': 'No files provided'}, status=status.HTTP_400_BAD_REQUEST)

    files = request.FILES.getlist('files')
    folder = request.data.get('folder', 'products')  # Default folder: products
    uploaded_urls = []

    allowed_extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']

    for file in files:
        # Validate file type
        file_ext = file.name.split('.')[-1].lower()

        if file_ext not in allowed_extensions:
            continue  # Skip invalid files

        # Upload to Cloudinary
        result = upload_image_to_cloudinary(file, folder=folder)

        if result['success']:
            uploaded_urls.append({
                'url': result['url'],
                'public_id': result['public_id'],
                'width': result['width'],
                'height': result['height'],
            })

    return Response({
        'status': 'success',
        'files': uploaded_urls,
        'count': len(uploaded_urls)
    })


@api_view(['POST'])
@permission_classes([IsAdminUser])
@parser_classes([MultiPartParser, FormParser])
def upload_video(request):
    """Upload a video file to Cloudinary"""
    if 'file' not in request.FILES:
        return Response({'detail': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

    file = request.FILES['file']
    folder = request.data.get('folder', 'videos')  # Default folder: videos

    # Validate file type
    allowed_extensions = ['mp4', 'webm', 'mov', 'avi']
    file_ext = file.name.split('.')[-1].lower()

    if file_ext not in allowed_extensions:
        return Response({'detail': 'Invalid file type. Allowed: mp4, webm, mov, avi'},
                        status=status.HTTP_400_BAD_REQUEST)

    # Upload to Cloudinary
    result = upload_video_to_cloudinary(file, folder=folder)

    if result['success']:
        return Response({
            'status': 'success',
            'url': result['url'],
            'public_id': result['public_id'],
            'duration': result.get('duration'),
        })
    else:
        return Response({
            'status': 'error',
            'detail': result['error']
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
