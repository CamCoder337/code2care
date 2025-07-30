from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import User, Patient, Professional


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Configuration d'administration pour le modèle User personnalisé"""
    
    # Champs affichés dans la liste
    list_display = ('username', 'email', 'phone_number', 'user_type', 'is_verified', 'is_active', 'created_at')
    list_filter = ('user_type', 'is_verified', 'is_active', 'is_staff', 'is_superuser', 'created_at')
    search_fields = ('username', 'email', 'phone_number', 'first_name', 'last_name')
    ordering = ('-created_at',)
    
    # Configuration des fieldsets pour l'édition
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Informations personnelles', {'fields': ('first_name', 'last_name', 'email', 'phone_number')}),
        ('Paramètres utilisateur', {'fields': ('user_type', 'is_verified')}),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
            'classes': ('collapse',)
        }),
        ('Dates importantes', {'fields': ('last_login', 'date_joined', 'created_at', 'updated_at')}),
    )
    
    # Configuration pour l'ajout d'utilisateur
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'phone_number', 'user_type', 'password1', 'password2'),
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at', 'date_joined')
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related()


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    """Configuration d'administration pour le modèle Patient"""
    
    list_display = ('patient_id', 'get_full_name', 'get_username', 'get_phone', 'gender', 'age', 'preferred_language')
    list_filter = ('gender', 'preferred_language', 'preferred_contact_method', 'user__is_verified', 'user__created_at')
    search_fields = ('patient_id', 'first_name', 'last_name', 'user__username', 'user__phone_number')
    ordering = ('-user__created_at',)
    
    fieldsets = (
        ('Informations patient', {
            'fields': ('patient_id', 'first_name', 'last_name', 'date_of_birth', 'gender')
        }),
        ('Préférences', {
            'fields': ('preferred_language', 'preferred_contact_method')
        }),
        ('Utilisateur associé', {
            'fields': ('user', 'get_user_info'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('patient_id', 'get_user_info')
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"
    get_full_name.short_description = 'Nom complet'
    
    def get_username(self, obj):
        return obj.user.username
    get_username.short_description = 'Nom d\'utilisateur'
    
    def get_phone(self, obj):
        return obj.user.phone_number
    get_phone.short_description = 'Téléphone'
    
    def get_user_info(self, obj):
        if obj.user:
            return format_html(
                '<strong>Username:</strong> {}<br>'
                '<strong>Email:</strong> {}<br>'
                '<strong>Téléphone:</strong> {}<br>'
                '<strong>Vérifié:</strong> {}<br>'
                '<strong>Actif:</strong> {}',
                obj.user.username,
                obj.user.email or 'Non renseigné',
                obj.user.phone_number,
                '✅ Oui' if obj.user.is_verified else '❌ Non',
                '✅ Oui' if obj.user.is_active else '❌ Non'
            )
        return "Aucun utilisateur associé"
    get_user_info.short_description = 'Informations utilisateur'
    
    def age(self, obj):
        from datetime import date
        if obj.date_of_birth:
            today = date.today()
            return today.year - obj.date_of_birth.year - (
                (today.month, today.day) < (obj.date_of_birth.month, obj.date_of_birth.day)
            )
        return None
    age.short_description = 'Âge'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')


@admin.register(Professional)
class ProfessionalAdmin(admin.ModelAdmin):
    """Configuration d'administration pour le modèle Professional"""
    
    list_display = ('professional_id', 'get_full_name', 'get_username', 'specialization', 'license_number', 'get_phone')
    list_filter = ('gender', 'specialization', 'user__is_verified', 'user__created_at')
    search_fields = ('professional_id', 'first_name', 'last_name', 'specialization', 'license_number', 'user__username', 'user__phone_number')
    ordering = ('-user__created_at',)
    
    fieldsets = (
        ('Informations professionnel', {
            'fields': ('professional_id', 'first_name', 'last_name', 'date_of_birth', 'gender')
        }),
        ('Informations professionnelles', {
            'fields': ('department_id', 'specialization', 'license_number')
        }),
        ('Utilisateur associé', {
            'fields': ('user', 'get_user_info'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('professional_id', 'get_user_info')
    
    def get_full_name(self, obj):
        return f"Dr. {obj.first_name} {obj.last_name}"
    get_full_name.short_description = 'Nom complet'
    
    def get_username(self, obj):
        return obj.user.username
    get_username.short_description = 'Nom d\'utilisateur'
    
    def get_phone(self, obj):
        return obj.user.phone_number
    get_phone.short_description = 'Téléphone'
    
    def get_user_info(self, obj):
        if obj.user:
            return format_html(
                '<strong>Username:</strong> {}<br>'
                '<strong>Email:</strong> {}<br>'
                '<strong>Téléphone:</strong> {}<br>'
                '<strong>Vérifié:</strong> {}<br>'
                '<strong>Actif:</strong> {}',
                obj.user.username,
                obj.user.email or 'Non renseigné',
                obj.user.phone_number,
                '✅ Oui' if obj.user.is_verified else '❌ Non',
                '✅ Oui' if obj.user.is_active else '❌ Non'
            )
        return "Aucun utilisateur associé"
    get_user_info.short_description = 'Informations utilisateur'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')


# Configuration générale de l'admin
admin.site.site_header = "DGH Platform Administration"
admin.site.site_title = "DGH Admin"
admin.site.index_title = "Bienvenue dans l'administration DGH Platform"
