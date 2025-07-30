from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid

class User(AbstractUser):
    """Modèle utilisateur personnalisé pour Patient et Professional"""
    USER_TYPE_CHOICES = [
        ('patient', 'Patient'),
        ('professional', 'Professional'),
        ('admin', 'Administrator'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES)
    phone_number = models.CharField(max_length=15, unique=True, db_index=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['user_type']),
            models.Index(fields=['phone_number']),
        ]


class Patient(models.Model):
    """Profil Patient selon le MCD"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    patient_id = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=10, choices=[
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other')
    ])
    preferred_language = models.CharField(max_length=3, choices=[
        ('fr', 'Français'),
        ('en', 'English'),
        ('dua', 'Douala'),
        ('bas', 'Bassa'),
        ('ewo', 'Ewondo'),
    ], default='fr')
    preferred_contact_method = models.CharField(max_length=10, choices=[
        ('sms', 'SMS'),
        ('voice', 'Voice Call'),
        ('whatsapp', 'WhatsApp'),
    ], default='sms')
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

    class Meta:
        db_table = 'patients'

    def __str__(self):
        return f"{self.patient_id} - {self.first_name} {self.last_name}"


class Professional(models.Model):
    """Profil Professional selon le MCD"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    professional_id = models.CharField(max_length=50, unique=True, db_index=True, blank=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    gender = models.CharField(max_length=10, choices=[
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other')
    ])
    date_of_birth = models.DateField()
    department_id = models.CharField(max_length=50, blank=True)
    specialization = models.CharField(max_length=100, blank=True)
    license_number = models.CharField(max_length=50, unique=True, blank=True)
    
    def save(self, *args, **kwargs):
        if not self.professional_id:
            self.professional_id = f"PRO{str(self.user.id)[:8]}"
        super().save(*args, **kwargs)

    class Meta:
        db_table = 'professionals'

    def __str__(self):
        return f"Dr. {self.first_name} {self.last_name}"