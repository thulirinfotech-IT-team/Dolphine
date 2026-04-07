from django.http import HttpResponse


class CustomCORSMiddleware:
    """
    Custom CORS middleware that adds headers to every response.
    Replaces django-cors-headers for reliability.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        origin = request.META.get('HTTP_ORIGIN', '')

        # Handle preflight OPTIONS request immediately
        if request.method == 'OPTIONS':
            response = HttpResponse()
            response.status_code = 204
            if origin:
                response['Access-Control-Allow-Origin'] = origin
            else:
                response['Access-Control-Allow-Origin'] = '*'
            response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Authorization, Content-Type, Accept, X-Requested-With'
            response['Access-Control-Allow-Credentials'] = 'true'
            response['Access-Control-Max-Age'] = '86400'
            return response

        response = self.get_response(request)

        # Add CORS headers to all responses
        if origin:
            response['Access-Control-Allow-Origin'] = origin
        else:
            response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Authorization, Content-Type, Accept, X-Requested-With'
        response['Access-Control-Allow-Credentials'] = 'true'

        return response
