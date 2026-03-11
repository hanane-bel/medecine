from django.contrib import admin
from .models import Patient, ActivityLog


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = [
        'numero_dossier', 'nom', 'prenom', 'genre',
        'type_consultation', 'unite', 'created_at',
    ]
    list_filter = ['type_consultation', 'genre', 'unite', 'autorite_requerante']
    search_fields = ['nom', 'prenom', 'numero_dossier']
    date_hierarchy = 'created_at'


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ['action', 'patient', 'user', 'timestamp']
    list_filter = ['action']
    date_hierarchy = 'timestamp'
