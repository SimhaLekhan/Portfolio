import json
import re
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .models import ContactMessage, Project
from django.core.mail import send_mail
from django.conf import settings

def index(request):
    """Render the main portfolio homepage."""
    projects = Project.objects.all()
    featured_projects = projects.filter(is_featured=True)
    context = {
        'projects': projects,
        'featured_projects': featured_projects,
    }
    return render(request, 'index.html', context)


@csrf_exempt
@require_http_methods(["POST"])
def contact_api(request):
    """
    API endpoint to handle contact form submissions.
    POST /api/contact/
    Body: { "name": "...", "email": "...", "message": "..." }
    """
    try:
        data = json.loads(request.body)
        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        message = data.get('message', '').strip()

        # Validation
        errors = {}
        if not name or len(name) < 2:
            errors['name'] = 'Name must be at least 2 characters.'
        if len(name) > 200:
            errors['name'] = 'Name is too long.'

        email_regex = r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$'
        if not email or not re.match(email_regex, email):
            errors['email'] = 'Please provide a valid email address.'

        if not message or len(message) < 10:
            errors['message'] = 'Message must be at least 10 characters.'
        if len(message) > 5000:
            errors['message'] = 'Message is too long (max 5000 characters).'

        if errors:
            return JsonResponse({'success': False, 'errors': errors}, status=400)

        # Get IP address
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        ip = x_forwarded_for.split(',')[0] if x_forwarded_for else request.META.get('REMOTE_ADDR')

        # Save to database
        contact_msg = ContactMessage.objects.create(
            name=name,
            email=email,
            message=message,
            ip_address=ip,
        )

        # Send email notification
        try:
            send_mail(
                subject=f"New Contact Form Submission from {name}",
                message=f"Name: {name}\nEmail: {email}\nIP: {ip}\n\nMessage:\n{message}",
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=['lekhansimhap@gmail.com'],
                fail_silently=False,  # set True if you want errors not to break API
            )
        except Exception as e:
            print(f"Email send failed: {e}")  # logs email failures

        # Return success JSON
        return JsonResponse({
            'success': True,
            'message': 'Your message has been transmitted successfully! I will respond within 24 hours.',
            'id': contact_msg.id,
        }, status=201)

    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Invalid JSON payload.'}, status=400)
    except Exception as e:
        print(f"Server error: {e}")  # log for debugging
        return JsonResponse({'success': False, 'error': 'Server error. Please try again.'}, status=500)


def projects_api(request):
    """API endpoint to get all projects as JSON."""
    projects = Project.objects.all().values(
        'id', 'title', 'description', 'tech_stack',
        'github_link', 'live_link', 'category', 'is_featured'
    )
    return JsonResponse({'projects': list(projects)})