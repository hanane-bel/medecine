"""
Management command to populate database with demo users and patients.
Usage: python manage.py seed_data
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from patients.models import Patient, ActivityLog
from datetime import date

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed database with demo data'

    def handle(self, *args, **options):
        self.stdout.write('Creating demo users...')

        # --- Users ---
        chef, _ = User.objects.get_or_create(
            username='laribi',
            defaults={
                'first_name': 'Souhila',
                'last_name': 'LARIBI',
                'email': 'souhilalaribi13@gmail.com',
                'role': 'chef_service',
            }
        )
        chef.set_password('laribi0770398488!')
        chef.save()

        medecin1, _ = User.objects.get_or_create(
            username='medecin1',
            defaults={
                'first_name': 'Karim',
                'last_name': 'Hadj',
                'email': 'karim@med.dz',
                'role': 'medecin',
            }
        )
        medecin1.set_password('med1234')
        medecin1.save()

        medecin2, _ = User.objects.get_or_create(
            username='medecin2',
            defaults={
                'first_name': 'Samira',
                'last_name': 'Khelifi',
                'email': 'samira@med.dz',
                'role': 'medecin',
            }
        )
        medecin2.set_password('med1234')
        medecin2.save()

        secretaire, _ = User.objects.get_or_create(
            username='secretaire',
            defaults={
                'first_name': 'Fatima',
                'last_name': 'Zahra',
                'email': 'fatima@med.dz',
                'role': 'secretaire',
            }
        )
        secretaire.set_password('sec1234')
        secretaire.save()

        self.stdout.write(self.style.SUCCESS(
            'Users created: laribi souhila/laribi0770398488!, medecin1/med1234, medecin2/med1234, secretaire/sec1234'
        ))

        # --- Patients ---
        patients_data = [
            {
                'numero_dossier': 'D-2026-001',
                'nom': 'Boudiaf',
                'prenom': 'Mohamed',
                'date_naissance': date(1990, 5, 15),
                'lieu_naissance': 'Alger',
                'genre': 'Masculin',
                'situation': 'Marié(e)',
                'telephone': '0555123456',
                'profession': 'Employé',
                'type_consultation': 'CBV',
                'itt_jours': 15,
                'auteur_agression': 'Voisin',
                'autorite_requerante': 'Police',
                'unite': 'Dommage Corporel',
            },
            {
                'numero_dossier': 'D-2026-002',
                'nom': 'Rahma',
                'prenom': 'Aicha',
                'date_naissance': date(2010, 8, 22),
                'lieu_naissance': 'Oran',
                'genre': 'Féminin',
                'situation': 'Célibataire',
                'telephone': '0661234567',
                'profession': 'Étudiant',
                'type_consultation': 'AVP',
                'itt_jours': 45,
                'autorite_requerante': 'Gendarmerie',
                'unite': 'Dommage Corporel',
            },
            {
                'numero_dossier': 'D-2026-003',
                'nom': 'Kaci',
                'prenom': 'Youcef',
                'date_naissance': date(1985, 3, 10),
                'lieu_naissance': 'Constantine',
                'genre': 'Masculin',
                'situation': 'Marié(e)',
                'telephone': '0770987654',
                'profession': 'Employé',
                'type_consultation': 'ADC',
                'itt_jours': 0,
                'autorite_requerante': 'Police',
                'unite': 'Dommage Corporel',
            },
            {
                'numero_dossier': 'D-2026-004',
                'nom': 'Saidi',
                'prenom': 'Nadia',
                'date_naissance': date(1975, 11, 30),
                'lieu_naissance': 'Blida',
                'genre': 'Féminin',
                'situation': 'Marié(e)',
                'telephone': '0550112233',
                'profession': 'Sans emploi',
                'type_consultation': 'CBV',
                'itt_jours': 120,
                'auteur_agression': 'Conjoint',
                'autorite_requerante': 'Police',
                'unite': 'Dommage Corporel',
            },
            {
                'numero_dossier': 'D-2026-005',
                'nom': 'Mebarki',
                'prenom': 'Ali',
                'date_naissance': date(2000, 7, 14),
                'lieu_naissance': 'Tizi Ouzou',
                'genre': 'Masculin',
                'situation': 'Célibataire',
                'telephone': '0699887766',
                'profession': 'Étudiant',
                'unite': 'Thanatologie',
                'sous_unite': 'autopsie',
            },
        ]

        for p_data in patients_data:
            patient, created = Patient.objects.get_or_create(
                numero_dossier=p_data['numero_dossier'],
                defaults={**p_data, 'created_by': secretaire},
            )
            if created:
                ActivityLog.objects.create(
                    action='create',
                    patient=patient,
                    user=secretaire,
                    details=f"Patient {patient.nom} {patient.prenom} créé (données démo).",
                )

        self.stdout.write(self.style.SUCCESS(f'{len(patients_data)} patients created.'))
        self.stdout.write(self.style.SUCCESS('Demo data seeded successfully!'))
