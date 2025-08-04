from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal


class Donor(models.Model):
    """Modèle pour les donneurs de sang"""
    GENDER_CHOICES = [
        ('M', 'Masculin'),
        ('F', 'Féminin'),
    ]

    BLOOD_TYPE_CHOICES = [
        ('A+', 'A+'),
        ('A-', 'A-'),
        ('B+', 'B+'),
        ('B-', 'B-'),
        ('AB+', 'AB+'),
        ('AB-', 'AB-'),
        ('O+', 'O+'),
        ('O-', 'O-'),
    ]

    donor_id = models.CharField(max_length=50, primary_key=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=2, choices=GENDER_CHOICES)
    blood_type = models.CharField(max_length=3, choices=BLOOD_TYPE_CHOICES)
    phone_number = models.CharField(max_length=20)

    class Meta:
        db_table = 'donor'
        verbose_name = 'Donneur'
        verbose_name_plural = 'Donneurs'

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.blood_type})"

    @property
    def age(self):
        """Calcul automatique de l'âge"""
        from datetime import date
        today = date.today()
        return today.year - self.date_of_birth.year - (
                (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )


class Site(models.Model):
    site_id = models.CharField(max_length=50, primary_key=True)
    nom = models.CharField(max_length=200)
    ville = models.CharField(max_length=100)
    type = models.CharField(max_length=50, choices=[
        ('hospital', 'Hôpital'),
        ('clinic', 'Clinique'),
        ('collection_center', 'Centre de Collecte'),
    ], default='hospital')
    address = models.TextField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    manager = models.CharField(max_length=200, blank=True, null=True)
    capacity = models.IntegerField(blank=True, null=True)
    region = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=20, choices=[
        ('active', 'Actif'),
        ('maintenance', 'Maintenance'),
        ('inactive', 'Inactif'),
    ], default='active')
    blood_bank = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Department(models.Model):
    """Modèle pour les départements/services"""
    department_id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=50)
    description = models.TextField(max_length=60, blank=True)

    class Meta:
        db_table = 'department'
        verbose_name = 'Département'
        verbose_name_plural = 'Départements'

    def __str__(self):
        return self.name


class Patient(models.Model):
    """Modèle pour les patients"""
    BLOOD_TYPE_CHOICES = [
        ('A+', 'A+'),
        ('A-', 'A-'),
        ('B+', 'B+'),
        ('B-', 'B-'),
        ('AB+', 'AB+'),
        ('AB-', 'AB-'),
        ('O+', 'O+'),
        ('O-', 'O-'),
    ]

    patient_id = models.CharField(max_length=50, primary_key=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    date_of_birth = models.DateField()
    blood_type = models.CharField(max_length=3, choices=BLOOD_TYPE_CHOICES)
    patient_history = models.TextField(blank=True)

    class Meta:
        db_table = 'patient'
        verbose_name = 'Patient'
        verbose_name_plural = 'Patients'

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.blood_type})"

    @property
    def age(self):
        """Calcul automatique de l'âge"""
        from datetime import date
        today = date.today()
        return today.year - self.date_of_birth.year - (
                (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )


class BloodRecord(models.Model):
    """Modèle pour les enregistrements de don"""
    SCREENING_CHOICES = [
        ('Valid', 'Valide'),
        ('Rejected', 'Rejeté'),
        ('Pending', 'En attente'),
    ]

    record_id = models.CharField(max_length=50, primary_key=True)
    site = models.ForeignKey(Site, on_delete=models.CASCADE, db_column='site_id')
    screening_results = models.CharField(max_length=150, choices=SCREENING_CHOICES)
    record_date = models.DateField()
    quantity = models.IntegerField(validators=[MinValueValidator(0)])

    class Meta:
        db_table = 'blood_record'
        verbose_name = 'Enregistrement de don'
        verbose_name_plural = 'Enregistrements de don'

    def __str__(self):
        return f"Don {self.record_id} - {self.record_date}"


class BloodUnit(models.Model):
    """Modèle pour les unités/poches de sang"""
    STATUS_CHOICES = [
        ('Available', 'Disponible'),
        ('Reserved', 'Réservé'),
        ('Expired', 'Expiré'),
        ('Used', 'Utilisé'),
    ]

    unit_id = models.CharField(max_length=50, primary_key=True)
    donor = models.ForeignKey(Donor, on_delete=models.CASCADE, db_column='donor_id')
    record = models.ForeignKey(BloodRecord, on_delete=models.CASCADE, db_column='record_id')
    collection_date = models.DateField()
    volume_ml = models.IntegerField(validators=[MinValueValidator(1)])
    hemoglobin_g_dl = models.FloatField(
        validators=[MinValueValidator(0.0)],
        null=True,
        blank=True
    )
    date_expiration = models.DateField()
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Available')

    class Meta:
        db_table = 'blood_unit'
        verbose_name = 'Unité de sang'
        verbose_name_plural = 'Unités de sang'

    def __str__(self):
        return f"Unité {self.unit_id} - {self.donor.blood_type}"

    @property
    def is_expired(self):
        """Vérifier si l'unité est expirée"""
        from datetime import date
        return date.today() > self.date_expiration

    @property
    def blood_type(self):
        """Récupérer le groupe sanguin via le donneur"""
        return self.donor.blood_type

    @property
    def days_until_expiry(self):
        """Nombre de jours avant expiration"""
        from datetime import date
        delta = self.date_expiration - date.today()
        return delta.days

    def save(self, *args, **kwargs):
        """Override save pour gérer automatiquement le statut d'expiration"""
        if self.is_expired and self.status == 'Available':
            self.status = 'Expired'
        super().save(*args, **kwargs)


class BloodRequest(models.Model):
    """Modèle pour les demandes de sang"""
    BLOOD_TYPE_CHOICES = [
        ('A+', 'A+'),
        ('A-', 'A-'),
        ('B+', 'B+'),
        ('B-', 'B-'),
        ('AB+', 'AB+'),
        ('AB-', 'AB-'),
        ('O+', 'O+'),
        ('O-', 'O-'),
    ]

    PRIORITY_CHOICES = [
        ('Routine', 'Routine'),
        ('Urgent', 'Urgent'),
    ]

    STATUS_CHOICES = [
        ('Pending', 'En attente'),
        ('Approved', 'Approuvé'),
        ('Rejected', 'Rejeté'),
        ('Fulfilled', 'Satisfait'),
    ]

    request_id = models.CharField(max_length=50, primary_key=True)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, db_column='department_id')
    site = models.ForeignKey(Site, on_delete=models.CASCADE, db_column='site_id')
    blood_type = models.CharField(max_length=3, choices=BLOOD_TYPE_CHOICES)
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    priority = models.CharField(max_length=50, choices=PRIORITY_CHOICES, default='Routine')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Pending')
    request_date = models.DateField()

    class Meta:
        db_table = 'blood_request'
        verbose_name = 'Demande de sang'
        verbose_name_plural = 'Demandes de sang'
        ordering = ['-request_date', 'priority']

    def __str__(self):
        return f"Demande {self.request_id} - {self.blood_type} ({self.priority})"


class BloodConsumption(models.Model):
    """Modèle pour la consommation/transfusion de sang"""
    request = models.ForeignKey(BloodRequest, on_delete=models.CASCADE, db_column='request_id')
    unit = models.ForeignKey(BloodUnit, on_delete=models.CASCADE, db_column='unit_id')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, db_column='patient_id')
    date = models.DateField()
    volume = models.FloatField(validators=[MinValueValidator(0.0)])

    class Meta:
        db_table = 'blood_consumption'
        verbose_name = 'Consommation de sang'
        verbose_name_plural = 'Consommations de sang'
        # Contrainte unique pour éviter double utilisation d'une même unité
        constraints = [
            models.UniqueConstraint(fields=['unit'], name='unique_unit_consumption')
        ]

    def __str__(self):
        return f"Transfusion {self.unit.unit_id} → {self.patient}"

    def save(self, *args, **kwargs):
        """Override save pour marquer l'unité comme utilisée"""
        super().save(*args, **kwargs)
        # Marquer l'unité comme utilisée
        self.unit.status = 'Used'
        self.unit.save()

        # Marquer la demande comme satisfaite si toutes les unités sont attribuées
        request = self.request
        consumed_quantity = BloodConsumption.objects.filter(request=request).count()
        if consumed_quantity >= request.quantity:
            request.status = 'Fulfilled'
            request.save()


class Prevision(models.Model):
    """Modèle pour les prévisions IA"""
    BLOOD_TYPE_CHOICES = [
        ('A+', 'A+'),
        ('A-', 'A-'),
        ('B+', 'B+'),
        ('B-', 'B-'),
        ('AB+', 'AB+'),
        ('AB-', 'AB-'),
        ('O+', 'O+'),
        ('O-', 'O-'),
    ]

    prevision_id = models.CharField(max_length=50, primary_key=True)
    blood_type = models.CharField(max_length=3, choices=BLOOD_TYPE_CHOICES)
    prevision_date = models.DateField()
    previsional_volume = models.IntegerField(validators=[MinValueValidator(0)])
    fiability = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00')), MaxValueValidator(Decimal('1.00'))]
    )

    class Meta:
        db_table = 'prevision'
        verbose_name = 'Prévision'
        verbose_name_plural = 'Prévisions'
        ordering = ['-prevision_date']

    def __str__(self):
        return f"Prévision {self.blood_type} - {self.prevision_date} ({self.fiability * 100}%)"

    @property
    def reliability_percentage(self):
        """Retourne la fiabilité en pourcentage"""
        return float(self.fiability * 100)


# Signaux pour gérer automatiquement les statuts
from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender=BloodUnit)
def update_expired_units(sender, instance, **kwargs):
    """Signal pour marquer automatiquement les unités expirées"""
    if instance.is_expired and instance.status == 'Available':
        instance.status = 'Expired'
        instance.save(update_fields=['status'])


@receiver(post_save, sender=BloodConsumption)
def update_request_status(sender, instance, created, **kwargs):
    """Signal pour mettre à jour le statut des demandes"""
    if created:
        request = instance.request
        consumed_units = BloodConsumption.objects.filter(request=request).count()

        if consumed_units >= request.quantity and request.status != 'Fulfilled':
            request.status = 'Fulfilled'
            request.save(update_fields=['status'])