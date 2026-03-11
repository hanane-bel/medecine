from datetime import date, datetime
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q

from .models import Patient, ActivityLog
from .serializers import (
    PatientSerializer, PatientCreateSerializer,
    ActivityLogSerializer,
)


# ------------------------------------------------------------------
# Permissions
# ------------------------------------------------------------------
class IsSecretaireOrAbove(permissions.BasePermission):
    """Secretaire can create; medecin/chef can read/update."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return True

class CanEditPatientRecord(permissions.BasePermission):
    """
    Permission personnalisée pour les dossiers patients :
    - Chef de service : Accès total en modification/suppression.
    - Secretaire : Accès total (pour modifier identité ou requérant).
    - Medecin : Uniquement modifier les dossiers qu'ils ont créés ou qui leur sont assignés.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # La lecture (GET) est autorisée pour tous
        if request.method in permissions.SAFE_METHODS:
            return True
            
        user = request.user
        
        if user.role.lower() == 'chef_service':
            return True
            
        if user.role.lower() == 'secretaire':
            return True
            
        if user.role.lower() == 'medecin':
            return obj.created_by == user or obj.medecin_traitant == user
            
        return False


# ------------------------------------------------------------------
# Patient views
# ------------------------------------------------------------------
class PatientListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/patients/ – list patients (with filters)
    POST /api/patients/ – create patient (secretary)
    """

    def get_queryset(self):
        qs = Patient.objects.all()
        # Filter by date
        date_param = self.request.query_params.get('date')
        if date_param:
            qs = qs.filter(created_at__date=date_param)
        # Filter by type_consultation
        type_c = self.request.query_params.get('type')
        if type_c:
            qs = qs.filter(type_consultation=type_c)
        # Filter by unite
        unite = self.request.query_params.get('unite')
        if unite:
            qs = qs.filter(unite=unite)
        # Search by name
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(nom__icontains=search) |
                Q(prenom__icontains=search) |
                Q(numero_dossier__icontains=search)
            )
        return qs

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PatientCreateSerializer
        return PatientSerializer

    def perform_create(self, serializer):
        patient = serializer.save(created_by=self.request.user)
        ActivityLog.objects.create(
            action='create',
            patient=patient,
            user=self.request.user,
            details=f"Patient {patient.nom} {patient.prenom} créé.",
        )


class PatientDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/patients/<id>/ – patient detail
    PATCH  /api/patients/<id>/ – update patient
    DELETE /api/patients/<id>/ – delete patient
    """
    permission_classes = [CanEditPatientRecord]
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer

    def perform_update(self, serializer):
        patient = serializer.save()
        ActivityLog.objects.create(
            action='update',
            patient=patient,
            user=self.request.user,
            details=f"Patient {patient.nom} {patient.prenom} modifié.",
        )

    def perform_destroy(self, instance):
        ActivityLog.objects.create(
            action='delete',
            patient=instance,
            user=self.request.user,
            details=f"Patient {instance.nom} {instance.prenom} supprimé.",
        )
        instance.delete()


# ------------------------------------------------------------------
# Modification requests
# ------------------------------------------------------------------
class RequestModificationView(APIView):
    """POST /api/patients/<id>/request-modification/
    Any authenticated user can request a modification for a patient record.
    Sets the patient status to 'demande_modification'."""

    def post(self, request, pk):
        try:
            patient = Patient.objects.get(pk=pk)
        except Patient.DoesNotExist:
            return Response({'detail': 'Patient non trouvé.'}, status=status.HTTP_404_NOT_FOUND)

        patient.status = 'demande_modification'
        patient.save(update_fields=['status'])

        ActivityLog.objects.create(
            action='update',
            patient=patient,
            user=request.user,
            details=f"Demande de modification pour {patient.nom} {patient.prenom}.",
        )
        return Response({'status': 'demande_modification', 'detail': 'Demande envoyée.'})


class AcceptModificationView(APIView):
    """POST /api/patients/<id>/accept-modification/
    Only chef_service can accept a modification request."""

    def post(self, request, pk):
        if request.user.role.lower() != 'chef_service':
            return Response({'detail': 'Seul le chef de service peut accepter.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            patient = Patient.objects.get(pk=pk)
        except Patient.DoesNotExist:
            return Response({'detail': 'Patient non trouvé.'}, status=status.HTTP_404_NOT_FOUND)

        patient.status = ''
        patient.save(update_fields=['status'])

        ActivityLog.objects.create(
            action='update',
            patient=patient,
            user=request.user,
            details=f"Modification acceptée pour {patient.nom} {patient.prenom}.",
        )
        return Response({'status': '', 'detail': 'Modification acceptée.'})


class RejectModificationView(APIView):
    """POST /api/patients/<id>/reject-modification/
    Only chef_service can reject a modification request."""

    def post(self, request, pk):
        if request.user.role.lower() != 'chef_service':
            return Response({'detail': 'Seul le chef de service peut rejeter.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            patient = Patient.objects.get(pk=pk)
        except Patient.DoesNotExist:
            return Response({'detail': 'Patient non trouvé.'}, status=status.HTTP_404_NOT_FOUND)

        patient.status = 'termine'
        patient.save(update_fields=['status'])

        ActivityLog.objects.create(
            action='update',
            patient=patient,
            user=request.user,
            details=f"Modification rejetée pour {patient.nom} {patient.prenom}.",
        )
        return Response({'status': 'termine', 'detail': 'Modification rejetée.'})


# ------------------------------------------------------------------
# Activity log
# ------------------------------------------------------------------
class ActivityLogListView(generics.ListAPIView):
    """GET /api/activity/ – list recent activity."""
    serializer_class = ActivityLogSerializer

    def get_queryset(self):
        qs = ActivityLog.objects.select_related('user', 'patient').all()
        # Optionally filter by date
        date_param = self.request.query_params.get('date')
        if date_param:
            qs = qs.filter(timestamp__date=date_param)
        return qs[:100]


# ------------------------------------------------------------------
# Stats
# ------------------------------------------------------------------
class DailyStatsView(APIView):
    """
    GET /api/stats/daily/?date=YYYY-MM-DD&period=day|month|year
    Returns auto-computed statistics for the given period.
    period=day (default): stats for a single day
    period=month: stats for an entire month (date param = YYYY-MM)
    period=year: stats for an entire year (date param = YYYY)
    """

    def get(self, request):
        period = request.query_params.get('period', 'day')
        date_param = request.query_params.get('date', '')

        today = date.today()

        if period == 'month':
            try:
                if date_param:
                    parts = date_param.split('-')
                    year, month = int(parts[0]), int(parts[1])
                else:
                    year, month = today.year, today.month
                patients_qs = Patient.objects.filter(
                    created_at__year=year, created_at__month=month
                )
                label = f"{year}-{month:02d}"
            except (ValueError, IndexError):
                return Response(
                    {'detail': 'Format invalide. Utilisez YYYY-MM.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        elif period == 'year':
            try:
                year = int(date_param) if date_param else today.year
                patients_qs = Patient.objects.filter(created_at__year=year)
                label = str(year)
            except ValueError:
                return Response(
                    {'detail': 'Format invalide. Utilisez YYYY.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            # Default: day
            if date_param:
                try:
                    target_date = datetime.strptime(date_param, '%Y-%m-%d').date()
                except ValueError:
                    return Response(
                        {'detail': 'Format date invalide. Utilisez YYYY-MM-DD.'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            else:
                target_date = today
            patients_qs = Patient.objects.filter(created_at__date=target_date)
            label = target_date.isoformat()

        def stats_for_type(type_code):
            pts = patients_qs.filter(type_consultation=type_code)
            now = date.today()

            def calc_age(dob):
                if not dob:
                    return 0
                return now.year - dob.year - ((now.month, now.day) < (dob.month, dob.day))

            result = {
                'total': pts.count(),
                'mineur': sum(1 for p in pts if p.date_naissance and calc_age(p.date_naissance) < 18),
                'adulte': sum(1 for p in pts if p.date_naissance and calc_age(p.date_naissance) >= 18),
                'feminin': pts.filter(genre='Féminin').count(),
                'masculin': pts.filter(genre='Masculin').count(),
                'itt_0': pts.filter(itt_jours=0).count(),
                'itt_le_90': pts.filter(itt_jours__gt=0, itt_jours__lte=90).count(),
                'itt_gt_90': pts.filter(itt_jours__gt=90).count(),
            }

            if type_code == 'CBV':
                auteurs = {}
                for p in pts.exclude(auteur_agression=''):
                    auteurs[p.auteur_agression] = auteurs.get(p.auteur_agression, 0) + 1
                result['auteurs'] = auteurs

            return result

        data = {
            'date': label,
            'period': period,
            'total': patients_qs.count(),
            'cbv': stats_for_type('CBV'),
            'adc': stats_for_type('ADC'),
            'avp': stats_for_type('AVP'),
            'police': patients_qs.filter(autorite_requerante='Police').count(),
            'gendarmerie': patients_qs.filter(autorite_requerante='Gendarmerie').count(),
        }

        return Response(data)

