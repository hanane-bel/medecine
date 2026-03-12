from rest_framework import serializers
from .models import Patient, ActivityLog
from accounts.serializers import UserSerializer


class PatientSerializer(serializers.ModelSerializer):
    """Full patient serializer."""
    created_by_detail = UserSerializer(source='created_by', read_only=True)
    medecin_traitant_detail = UserSerializer(source='medecin_traitant', read_only=True)
    age = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = [
            'id', 'numero_dossier', 'nom', 'prenom',
            'date_naissance', 'lieu_naissance', 'genre',
            'situation', 'telephone', 'profession',
            'type_consultation', 'itt_jours',
            'auteur_agression', 'autorite_requerante',
            'unite', 'sous_unite', 'medecin_traitant', 'medecin_traitant_detail',
            'rapport_medical', 'status',
            'created_by', 'created_by_detail',
            'created_at', 'updated_at', 'age',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def get_age(self, obj):
        from datetime import date
        if not obj.date_naissance:
            return None
        today = date.today()
        born = obj.date_naissance
        return today.year - born.year - ((today.month, today.day) < (born.month, born.day))


class PatientCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating patients (secretary)."""

    class Meta:
        model = Patient
        fields = [
            'id', 'numero_dossier', 'nom', 'prenom',
            'date_naissance', 'lieu_naissance', 'genre',
            'situation', 'telephone', 'profession',
            'type_consultation', 'itt_jours',
            'auteur_agression', 'autorite_requerante',
        ]


class ActivityLogSerializer(serializers.ModelSerializer):
    """Activity log serializer."""
    user_detail = UserSerializer(source='user', read_only=True)
    patient_name = serializers.SerializerMethodField()
    action_display = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model = ActivityLog
        fields = [
            'id', 'action', 'action_display',
            'patient', 'patient_name',
            'user', 'user_detail',
            'details', 'timestamp',
        ]

    def get_patient_name(self, obj):
        return f"{obj.patient.nom} {obj.patient.prenom}"


class DailyStatsSerializer(serializers.Serializer):
    """Serializer for computed daily statistics."""
    date = serializers.DateField()
    total = serializers.IntegerField()

    cbv = serializers.DictField()
    adc = serializers.DictField()
    avp = serializers.DictField()

    police = serializers.IntegerField()
    gendarmerie = serializers.IntegerField()
