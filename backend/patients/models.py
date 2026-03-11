from django.db import models
from django.conf import settings


class Patient(models.Model):
    """Patient registered by secretary, treated by doctor."""

    GENRE_CHOICES = [
        ('Masculin', 'Masculin'),
        ('Féminin', 'Féminin'),
    ]
    SITUATION_CHOICES = [
        ('Célibataire', 'Célibataire'),
        ('Marié(e)', 'Marié(e)'),
    ]
    PROFESSION_CHOICES = [
        ('Étudiant', 'Étudiant'),
        ('Employé', 'Employé'),
        ('Sans emploi', 'Sans emploi'),
        ('Autre', 'Autre'),
    ]
    CONSULTATION_CHOICES = [
        ('CBV', 'CBV - Coups et Blessures Volontaires'),
        ('ADC', 'ADC - Accident de la Circulation'),
        ('AVP', 'AVP - Accident sur Voie Publique'),
    ]
    AUTORITE_CHOICES = [
        ('Police', 'Police'),
        ('Gendarmerie', 'Gendarmerie'),
    ]
    AUTEUR_CHOICES = [
        ('Voisin', 'Voisin'),
        ('Cousin', 'Cousin'),
        ('Conjoint', 'Conjoint'),
        ('Parent', 'Parent'),
        ('Frère/Sœur', 'Frère/Sœur'),
        ('Inconnu', 'Inconnu'),
        ('Autre', 'Autre'),
    ]
    UNITE_CHOICES = [
        ('Thanatologie', 'Thanatologie'),
        ('Dommage Corporel', 'Dommage Corporel'),
    ]

    # --- Identity ---
    numero_dossier = models.CharField(max_length=50, unique=True, verbose_name='N° Dossier')
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100, verbose_name='Prénom')
    date_naissance = models.DateField(null=True, blank=True, verbose_name='Date de naissance')
    lieu_naissance = models.CharField(max_length=200, blank=True, default='', verbose_name='Lieu de naissance')
    genre = models.CharField(max_length=10, choices=GENRE_CHOICES)
    situation = models.CharField(max_length=20, choices=SITUATION_CHOICES, blank=True, default='')
    telephone = models.CharField(max_length=20, blank=True, default='', verbose_name='Téléphone')
    profession = models.CharField(max_length=30, choices=PROFESSION_CHOICES, blank=True, default='')

    # --- Consultation details ---
    type_consultation = models.CharField(
        max_length=5, choices=CONSULTATION_CHOICES,
        blank=True, null=True, verbose_name='Type de consultation',
    )
    itt_jours = models.IntegerField(default=0, verbose_name='ITT (jours)')
    auteur_agression = models.CharField(
        max_length=20, choices=AUTEUR_CHOICES,
        blank=True, default='', verbose_name="Auteur de l'agression",
    )
    autorite_requerante = models.CharField(
        max_length=15, choices=AUTORITE_CHOICES,
        blank=True, default='', verbose_name='Autorité requérante',
    )

    # --- Assignment ---
    unite = models.CharField(max_length=50, choices=UNITE_CHOICES, blank=True, default='', verbose_name='Unité')
    sous_unite = models.CharField(max_length=50, blank=True, default='', verbose_name='Sous-unité')
    medecin_traitant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='patients_traites',
        verbose_name='Médecin traitant',
    )
    rapport_medical = models.TextField(blank=True, default='', verbose_name='Rapport médical')
    status = models.CharField(max_length=30, blank=True, default='', verbose_name='Statut')

    # --- Audit ---
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='patients_crees',
        verbose_name='Créé par',
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Créé le')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Modifié le')

    class Meta:
        verbose_name = 'Patient'
        verbose_name_plural = 'Patients'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.numero_dossier} – {self.nom} {self.prenom}"


class ActivityLog(models.Model):
    """Tracks all actions performed on patients."""

    ACTION_CHOICES = [
        ('create', 'Création'),
        ('update', 'Modification'),
        ('assign', 'Affectation'),
        ('delete', 'Suppression'),
    ]

    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name='activity_logs',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='activity_logs',
    )
    details = models.TextField(blank=True, default='')
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Journal d'activité"
        verbose_name_plural = "Journal d'activité"
        ordering = ['-timestamp']

    def __str__(self):
        return f"[{self.get_action_display()}] {self.patient} par {self.user}"
