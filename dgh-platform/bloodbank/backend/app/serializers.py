# app/serializers.py
from rest_framework import serializers
from .models import (
    Donor, Site, Department, Patient, BloodRecord,
    BloodUnit, BloodRequest, BloodConsumption, Prevision
)


class DonorSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les donneurs"""
    age = serializers.ReadOnlyField()

    class Meta:
        model = Donor
        fields = [
            'donor_id', 'first_name', 'last_name', 'date_of_birth',
            'gender', 'blood_type', 'phone_number', 'age'
        ]
        read_only_fields = ['age']


class SiteSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les sites"""

    class Meta:
        model = Site
        fields = ['site_id', 'nom', 'ville']


class DepartmentSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les départements"""

    class Meta:
        model = Department
        fields = ['department_id', 'name', 'description']


class PatientSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les patients"""
    age = serializers.ReadOnlyField()

    class Meta:
        model = Patient
        fields = [
            'patient_id', 'first_name', 'last_name', 'date_of_birth',
            'blood_type', 'patient_history', 'age'
        ]
        read_only_fields = ['age']


class BloodRecordSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les enregistrements de don"""
    site_name = serializers.CharField(source='site.nom', read_only=True)

    class Meta:
        model = BloodRecord
        fields = [
            'record_id', 'site', 'site_name', 'screening_results',
            'record_date', 'quantity'
        ]


class BloodUnitSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les unités de sang"""
    donor_name = serializers.CharField(source='donor.first_name', read_only=True)
    donor_blood_type = serializers.CharField(source='donor.blood_type', read_only=True)
    site_name = serializers.CharField(source='record.site.nom', read_only=True)
    is_expired = serializers.ReadOnlyField()
    days_until_expiry = serializers.ReadOnlyField()
    blood_type = serializers.ReadOnlyField()

    class Meta:
        model = BloodUnit
        fields = [
            'unit_id', 'donor', 'donor_name', 'donor_blood_type', 'record',
            'collection_date', 'volume_ml', 'hemoglobin_g_dl', 'date_expiration',
            'status', 'site_name', 'is_expired', 'days_until_expiry', 'blood_type'
        ]


class BloodRequestSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les demandes de sang"""
    department_name = serializers.CharField(source='department.name', read_only=True)
    site_name = serializers.CharField(source='site.nom', read_only=True)

    class Meta:
        model = BloodRequest
        fields = [
            'request_id', 'department', 'department_name', 'site', 'site_name',
            'blood_type', 'quantity', 'priority', 'status', 'request_date'
        ]


class BloodConsumptionSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les consommations de sang"""
    unit_id = serializers.CharField(source='unit.unit_id', read_only=True)
    unit_blood_type = serializers.CharField(source='unit.donor.blood_type', read_only=True)
    patient_name = serializers.SerializerMethodField()
    request_id = serializers.CharField(source='request.request_id', read_only=True)
    department_name = serializers.CharField(source='request.department.name', read_only=True)

    class Meta:
        model = BloodConsumption
        fields = [
            'request', 'unit', 'patient', 'date', 'volume',
            'unit_id', 'unit_blood_type', 'patient_name',
            'request_id', 'department_name'
        ]

    def get_patient_name(self, obj):
        """Retourne le nom complet du patient"""
        return f"{obj.patient.first_name} {obj.patient.last_name}"


class PrevisionSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les prévisions"""
    reliability_percentage = serializers.ReadOnlyField()

    class Meta:
        model = Prevision
        fields = [
            'prevision_id', 'blood_type', 'prevision_date',
            'previsional_volume', 'fiability', 'reliability_percentage'
        ]


# ==================== SERIALIZERS AVANCÉS ====================

class BloodUnitDetailSerializer(BloodUnitSerializer):
    """Sérialiseur détaillé pour les unités de sang"""
    donor_details = DonorSerializer(source='donor', read_only=True)
    record_details = BloodRecordSerializer(source='record', read_only=True)

    class Meta(BloodUnitSerializer.Meta):
        fields = BloodUnitSerializer.Meta.fields + ['donor_details', 'record_details']


class BloodRequestDetailSerializer(BloodRequestSerializer):
    """Sérialiseur détaillé pour les demandes de sang"""
    department_details = DepartmentSerializer(source='department', read_only=True)
    site_details = SiteSerializer(source='site', read_only=True)
    consumption_history = BloodConsumptionSerializer(
        source='bloodconsumption_set', many=True, read_only=True
    )

    class Meta(BloodRequestSerializer.Meta):
        fields = BloodRequestSerializer.Meta.fields + [
            'department_details', 'site_details', 'consumption_history'
        ]


class DashboardStatsSerializer(serializers.Serializer):
    """Sérialiseur pour les statistiques du dashboard"""
    total_units = serializers.IntegerField()
    available_units = serializers.IntegerField()
    expired_units = serializers.IntegerField()
    used_units = serializers.IntegerField()
    utilization_rate = serializers.FloatField()
    expiring_soon = serializers.IntegerField()
    pending_requests = serializers.IntegerField()
    urgent_requests = serializers.IntegerField()
    today_transfusions = serializers.IntegerField()


class StockByBloodTypeSerializer(serializers.Serializer):
    """Sérialiseur pour le stock par groupe sanguin"""
    donor__blood_type = serializers.CharField()
    count = serializers.IntegerField()
    total_volume = serializers.IntegerField()


class ForecastSerializer(serializers.Serializer):
    """Sérialiseur pour les prévisions de demande"""
    date = serializers.DateField()
    predicted_volume = serializers.FloatField()
    confidence = serializers.FloatField()


class AlertSerializer(serializers.Serializer):
    """Sérialiseur pour les alertes"""
    type = serializers.CharField()
    severity = serializers.CharField()
    message = serializers.CharField()
    blood_type = serializers.CharField(required=False)
    count = serializers.IntegerField(required=False)
    unit_id = serializers.CharField(required=False)
    days_left = serializers.IntegerField(required=False)
    request_id = serializers.CharField(required=False)
    department = serializers.CharField(required=False)
    quantity = serializers.IntegerField(required=False)


class OptimizationRecommendationSerializer(serializers.Serializer):
    """Sérialiseur pour les recommandations d'optimisation"""
    blood_type = serializers.CharField()
    current_stock = serializers.IntegerField()
    recommended_stock = serializers.IntegerField()
    stock_deficit = serializers.IntegerField()
    avg_daily_consumption = serializers.FloatField()
    expiring_soon = serializers.IntegerField()
    days_of_supply = serializers.FloatField()
    priority = serializers.CharField()
    actions = serializers.ListField(child=serializers.DictField())


class UtilizationRateSerializer(serializers.Serializer):
    """Sérialiseur pour les taux d'utilisation"""
    blood_type = serializers.CharField()
    collected = serializers.IntegerField()
    used = serializers.IntegerField()
    expired = serializers.IntegerField()
    utilization_rate = serializers.FloatField()
    waste_rate = serializers.FloatField()


class StockEvolutionSerializer(serializers.Serializer):
    """Sérialiseur pour l'évolution des stocks"""
    date = serializers.DateField()
    stocks = serializers.DictField()
    total = serializers.IntegerField()


class WasteAnalysisSerializer(serializers.Serializer):
    """Sérialiseur pour l'analyse des pertes"""
    monthly_waste = serializers.ListField(child=serializers.DictField())
    total_expired_units = serializers.IntegerField()
    estimated_cost_fcfa = serializers.IntegerField()
    main_causes = serializers.ListField(child=serializers.DictField())


class PerformanceMetricsSerializer(serializers.Serializer):
    """Sérialiseur pour les métriques de performance"""
    total_requests = serializers.IntegerField()
    fulfilled_requests = serializers.IntegerField()
    fulfillment_rate = serializers.FloatField()
    safety_stock_status = serializers.ListField(child=serializers.DictField())
    average_stock_turnover = serializers.FloatField()


# ==================== SERIALIZERS DE VALIDATION ====================

class CSVImportSerializer(serializers.Serializer):
    """Sérialiseur pour l'import CSV"""
    csv_file = serializers.FileField()

    def validate_csv_file(self, value):
        """Valide le fichier CSV"""
        if not value.name.endswith('.csv'):
            raise serializers.ValidationError("Le fichier doit être au format CSV")

        if value.size > 10 * 1024 * 1024:  # 10 MB max
            raise serializers.ValidationError("Le fichier est trop volumineux (max 10MB)")

        return value


class DateRangeSerializer(serializers.Serializer):
    """Sérialiseur pour les plages de dates"""
    date_from = serializers.DateField(required=False)
    date_to = serializers.DateField(required=False)

    def validate(self, data):
        """Valide que date_from <= date_to"""
        if data.get('date_from') and data.get('date_to'):
            if data['date_from'] > data['date_to']:
                raise serializers.ValidationError(
                    "La date de début doit être antérieure à la date de fin"
                )
        return data


class BloodTypeFilterSerializer(serializers.Serializer):
    """Sérialiseur pour les filtres par groupe sanguin"""
    blood_type = serializers.ChoiceField(
        choices=Donor.BLOOD_TYPE_CHOICES,
        required=False
    )
    status = serializers.ChoiceField(
        choices=BloodUnit.STATUS_CHOICES,
        required=False
    )
    expiring_days = serializers.IntegerField(min_value=1, max_value=365, required=False)


# ==================== BULK OPERATIONS SERIALIZERS ====================

class BulkBloodUnitUpdateSerializer(serializers.Serializer):
    """Sérialiseur pour les mises à jour en lot des unités"""
    unit_ids = serializers.ListField(
        child=serializers.CharField(),
        min_length=1,
        max_length=100
    )
    status = serializers.ChoiceField(choices=BloodUnit.STATUS_CHOICES)

    def validate_unit_ids(self, value):
        """Valide que toutes les unités existent"""
        existing_units = BloodUnit.objects.filter(unit_id__in=value).count()
        if existing_units != len(value):
            raise serializers.ValidationError(
                "Certaines unités spécifiées n'existent pas"
            )
        return value


class BulkRequestFulfillmentSerializer(serializers.Serializer):
    """Sérialiseur pour la satisfaction en lot des demandes"""
    request_id = serializers.CharField()
    unit_assignments = serializers.ListField(
        child=serializers.DictField(child=serializers.CharField())
    )

    def validate_request_id(self, value):
        """Valide que la demande existe et est en attente"""
        try:
            request = BloodRequest.objects.get(request_id=value)
            if request.status != 'Pending':
                raise serializers.ValidationError(
                    "Cette demande n'est pas en attente"
                )
        except BloodRequest.DoesNotExist:
            raise serializers.ValidationError("Demande introuvable")
        return value