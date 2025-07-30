"""
Administration Django pour les feedbacks
"""
from django.contrib import admin
from .models import Feedback, FeedbackTheme, Department, Appointment, Reminder, Medication, Prescription, PrescriptionMedication


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('department_id', 'name', 'description', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('name', 'description')
    readonly_fields = ('department_id', 'created_at', 'updated_at')


@admin.register(FeedbackTheme)
class FeedbackThemeAdmin(admin.ModelAdmin):
    list_display = ('theme_id', 'theme_name', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('theme_name',)
    readonly_fields = ('theme_id', 'created_at', 'updated_at')


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ('feedback_id', 'patient_id', 'department_id', 'rating', 'language', 'is_processed', 'created_at')
    list_filter = ('rating', 'language', 'input_type', 'is_processed', 'created_at')
    search_fields = ('description', 'patient_id', 'department_id')
    readonly_fields = ('feedback_id', 'created_at', 'processed_at')
    
    fieldsets = (
        ('Informations principales', {
            'fields': ('feedback_id', 'patient_id', 'department_id', 'description')
        }),
        ('Métadonnées', {
            'fields': ('rating', 'language', 'input_type', 'created_at')
        }),
        ('Traitement', {
            'fields': ('theme', 'is_processed', 'processed_at')
        })
    )


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('appointment_id', 'patient_id', 'department', 'scheduled_date', 'time', 'status')
    list_filter = ('status', 'scheduled_date', 'created_at')
    search_fields = ('patient_id', 'department__name', 'type')
    readonly_fields = ('appointment_id', 'created_at', 'updated_at')


@admin.register(Reminder)
class ReminderAdmin(admin.ModelAdmin):
    list_display = ('reminder_id', 'patient_id', 'scheduled_time', 'status', 'channel')
    list_filter = ('status', 'channel', 'scheduled_time', 'created_at')
    search_fields = ('patient_id', 'message_content')
    readonly_fields = ('reminder_id', 'send_time', 'created_at', 'updated_at')


@admin.register(Medication)
class MedicationAdmin(admin.ModelAdmin):
    list_display = ('medication_id', 'name', 'dosage', 'frequency')
    list_filter = ('frequency',)
    search_fields = ('name', 'dosage')
    readonly_fields = ('medication_id',)


@admin.register(Prescription)
class PrescriptionAdmin(admin.ModelAdmin):
    list_display = ('prescription_id', 'appointment_id', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('appointment_id', 'general_notes')
    readonly_fields = ('prescription_id', 'created_at', 'updated_at')


@admin.register(PrescriptionMedication)
class PrescriptionMedicationAdmin(admin.ModelAdmin):
    list_display = ('prescription_medication_id', 'prescription', 'medication', 'start_date', 'end_date')
    list_filter = ('start_date', 'end_date')
    search_fields = ('prescription__appointment__patient_id', 'medication__name')
    readonly_fields = ('prescription_medication_id',)