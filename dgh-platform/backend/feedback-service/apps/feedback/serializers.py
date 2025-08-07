from rest_framework import serializers
from .models import (
    Department, FeedbackTheme, Feedback, Appointment, 
    Reminder, Medication, Prescription, PrescriptionMedication
)


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'
        read_only_fields = ('department_id', 'created_at', 'updated_at')


class FeedbackThemeSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeedbackTheme
        fields = '__all__'
        read_only_fields = ('theme_id', 'created_at', 'updated_at')


class FeedbackSerializer(serializers.ModelSerializer):
    theme_name = serializers.CharField(source='theme.theme_name', read_only=True)
    
    class Meta:
        model = Feedback
        fields = '__all__'
        read_only_fields = ('feedback_id', 'created_at', 'theme', 'is_processed', 'processed_at')
    
    def validate_rating(self, value):
        if value not in [1, 2, 3, 4, 5]:
            raise serializers.ValidationError("Le rating doit être entre 1 et 5")
        return value
    
    def validate_patient_id(self, value):
        # Ici on pourrait valider avec l'API Gateway que le patient existe
        return value


class FeedbackCreateSerializer(serializers.ModelSerializer):
    """Serializer spécifique pour la création de feedback"""
    
    class Meta:
        model = Feedback
        fields = ('description', 'language', 'input_type', 'rating', 'patient_id', 'department_id')
    
    def validate_rating(self, value):
        if value not in [1, 2, 3, 4, 5]:
            raise serializers.ValidationError("Le rating doit être entre 1 et 5")
        return value
    
    def validate_patient_id(self, value):
        import uuid
        try:
            uuid.UUID(str(value))
            return value
        except (ValueError, TypeError) as e:
            raise serializers.ValidationError({
                "patient_id": [
                    "Patient ID doit être un UUID valide.",
                    f"Valeur reçue: {value}",
                    f"Type reçu: {type(value).__name__}",
                    f"Erreur: {str(e)}"
                ]
            }) from e
    
    def validate_department_id(self, value):
        import uuid
        try:
            uuid.UUID(str(value))
            return value
        except (ValueError, TypeError) as e:
            raise serializers.ValidationError({
                "department_id": [
                    "Department ID doit être un UUID valide.",
                    f"Valeur reçue: {value}",
                    f"Type reçu: {type(value).__name__}",
                    f"Erreur: {str(e)}"
                ]
            }) from e


class AppointmentSerializer(serializers.ModelSerializer):
    """Serializer pour les rendez-vous - Version simplifiée"""
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    
    class Meta:
        model = Appointment
        fields = ['appointment_id', 'scheduled', 'type', 'type_display', 'patient_id', 'professional_id', 'created_at', 'updated_at']
        read_only_fields = ('appointment_id', 'created_at', 'updated_at')
    
    def validate_scheduled(self, value):
        """Validation que le rendez-vous n'est pas dans le passé"""
        from django.utils import timezone
        if value <= timezone.now():
            raise serializers.ValidationError({
                "scheduled": [
                    "Le rendez-vous ne peut pas être programmé dans le passé.",
                    f"Date demandée: {value}",
                    f"Date actuelle: {timezone.now()}"
                ]
            })
        return value
    
    def validate_patient_id(self, value):
        """Validation UUID patient"""
        import uuid
        try:
            uuid.UUID(str(value))
            return value
        except (ValueError, TypeError) as e:
            raise serializers.ValidationError({
                "patient_id": [
                    "Patient ID doit être un UUID valide.",
                    f"Valeur reçue: {value}",
                    f"Type reçu: {type(value).__name__}",
                    f"Erreur: {str(e)}"
                ]
            }) from e
    
    def validate_professional_id(self, value):
        """Validation UUID professional"""
        import uuid
        try:
            uuid.UUID(str(value))
            return value
        except (ValueError, TypeError) as e:
            raise serializers.ValidationError({
                "professional_id": [
                    "Professional ID doit être un UUID valide.",
                    f"Valeur reçue: {value}",
                    f"Type reçu: {type(value).__name__}",
                    f"Erreur: {str(e)}"
                ]
            }) from e


class AppointmentCreateSerializer(serializers.ModelSerializer):
    """Serializer spécifique pour la création de rendez-vous"""
    
    class Meta:
        model = Appointment
        fields = ['scheduled', 'type', 'patient_id', 'professional_id']
    
    def validate_scheduled(self, value):
        from django.utils import timezone
        if value <= timezone.now():
            raise serializers.ValidationError({
                "scheduled": [
                    "Le rendez-vous ne peut pas être programmé dans le passé.",
                    f"Date demandée: {value}",
                    f"Date actuelle: {timezone.now()}"
                ]
            })
        return value
    
    def validate_patient_id(self, value):
        import uuid
        try:
            uuid.UUID(str(value))
            return value
        except (ValueError, TypeError) as e:
            raise serializers.ValidationError({
                "patient_id": [
                    "Patient ID doit être un UUID valide.",
                    f"Valeur reçue: {value}",
                    f"Type reçu: {type(value).__name__}",
                    f"Erreur: {str(e)}"
                ]
            }) from e
    
    def validate_professional_id(self, value):
        import uuid
        try:
            uuid.UUID(str(value))
            return value
        except (ValueError, TypeError) as e:
            raise serializers.ValidationError({
                "professional_id": [
                    "Professional ID doit être un UUID valide.",
                    f"Valeur reçue: {value}",
                    f"Type reçu: {type(value).__name__}",
                    f"Erreur: {str(e)}"
                ]
            }) from e


class ReminderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reminder
        fields = '__all__'
        read_only_fields = ('reminder_id', 'send_time', 'created_at', 'updated_at')
    
    def validate_scheduled_time(self, value):
        from django.utils import timezone
        if value <= timezone.now():
            raise serializers.ValidationError(
                "Le rappel ne peut pas être programmé dans le passé"
            )
        return value


class MedicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medication
        fields = '__all__'
        read_only_fields = ('medication_id',)


class PrescriptionMedicationSerializer(serializers.ModelSerializer):
    medication_name = serializers.CharField(source='medication.name', read_only=True)
    medication_dosage = serializers.CharField(source='medication.dosage', read_only=True)
    
    class Meta:
        model = PrescriptionMedication
        fields = '__all__'
        read_only_fields = ('prescription_medication_id',)
    
    def validate(self, data):
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        
        if start_date and end_date and start_date >= end_date:
            raise serializers.ValidationError(
                "La date de fin doit être postérieure à la date de début"
            )
        
        return data


class PrescriptionSerializer(serializers.ModelSerializer):
    medications = PrescriptionMedicationSerializer(many=True, read_only=True)
    
    class Meta:
        model = Prescription
        fields = '__all__'
        read_only_fields = ('prescription_id', 'created_at', 'updated_at')


class PrescriptionCreateSerializer(serializers.ModelSerializer):
    medications = serializers.ListField(
        child=serializers.DictField(), 
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Prescription
        fields = ('appointment_id', 'general_notes', 'medications')
    
    def create(self, validated_data):
        medications_data = validated_data.pop('medications', [])
        prescription = Prescription.objects.create(**validated_data)
        
        for med_data in medications_data:
            # Extraire l'UUID du médicament et récupérer l'instance
            medication_id = med_data.pop('medication', None)
            if medication_id:
                try:
                    medication = Medication.objects.get(medication_id=medication_id)
                    
                    # Nettoyer les données - ne garder que les champs valides du modèle PrescriptionMedication
                    clean_med_data = {}
                    valid_fields = ['dosage', 'frequency', 'start_date', 'end_date', 'instructions']
                    
                    for field in valid_fields:
                        if field in med_data:
                            clean_med_data[field] = med_data[field]
                    
                    prescription_med = PrescriptionMedication.objects.create(
                        prescription=prescription,
                        medication=medication,
                        **clean_med_data
                    )
                    print(f"✅ PrescriptionMedication créé: {prescription_med.prescription_medication_id} pour {medication.name}")
                except Medication.DoesNotExist:
                    raise serializers.ValidationError(f"Medication with ID {medication_id} not found")
        
        return prescription