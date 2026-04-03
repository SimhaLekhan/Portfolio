from django.db import models
from django.utils import timezone


class ContactMessage(models.Model):
    """Stores contact form submissions from portfolio visitors."""
    name = models.CharField(max_length=200)
    email = models.EmailField()
    message = models.TextField()
    timestamp = models.DateTimeField(default=timezone.now)
    is_read = models.BooleanField(default=False)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Contact Message'
        verbose_name_plural = 'Contact Messages'

    def __str__(self):
        return f"{self.name} <{self.email}> — {self.timestamp.strftime('%Y-%m-%d %H:%M')}"


class Project(models.Model):
    """Portfolio projects displayed on the website."""
    CATEGORY_CHOICES = [
        ('backend', 'Backend'),
        ('fullstack', 'Full Stack'),
        ('automation', 'Automation'),
        ('ai_ml', 'AI / ML'),
        ('other', 'Other'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField()
    tech_stack = models.CharField(max_length=500, help_text='Comma-separated list of technologies')
    github_link = models.URLField(blank=True, null=True)
    live_link = models.URLField(blank=True, null=True)
    image_url = models.URLField(blank=True, null=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='fullstack')
    is_featured = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', '-created_at']
        verbose_name = 'Project'
        verbose_name_plural = 'Projects'

    def __str__(self):
        return self.title

    def get_tech_list(self):
        return [t.strip() for t in self.tech_stack.split(',') if t.strip()]