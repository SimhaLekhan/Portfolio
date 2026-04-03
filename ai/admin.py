from django.contrib import admin
from .models import ContactMessage, Project


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'timestamp', 'is_read', 'ip_address')
    list_filter = ('is_read', 'timestamp')
    search_fields = ('name', 'email', 'message')
    readonly_fields = ('timestamp', 'ip_address')
    ordering = ('-timestamp',)
    actions = ['mark_as_read']

    def mark_as_read(self, request, queryset):
        queryset.update(is_read=True)
        self.message_user(request, f'{queryset.count()} messages marked as read.')
    mark_as_read.short_description = 'Mark selected messages as read'


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'is_featured', 'order', 'created_at')
    list_filter = ('category', 'is_featured')
    search_fields = ('title', 'description', 'tech_stack')
    list_editable = ('is_featured', 'order')
    ordering = ('order', '-created_at')