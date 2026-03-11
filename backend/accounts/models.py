from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user with role field."""

    ROLE_CHOICES = [
        ('chef_service', 'Chef de service'),
        ('medecin', 'Médecin'),
        ('secretaire', 'Secrétaire'),
    ]

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='medecin',
        verbose_name='Rôle',
    )
    
    force_password_change = models.BooleanField(
        default=False,
        verbose_name='Changement de mot de passe obligatoire'
    )

    class Meta:
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'
        ordering = ['last_name', 'first_name']

    def delete(self, *args, **kwargs):
        if self.username == 'souhila.laribi':
            raise ValueError("La suppression du compte Super-Admin 'souhila.laribi' est strictement interdite.")
        return super().delete(*args, **kwargs)

    def __str__(self):
        return f"{self.get_full_name()} ({self.get_role_display()})"

    @property
    def is_chef(self):
        return self.role == 'chef_service'

    @property
    def is_medecin(self):
        return self.role == 'medecin'

    @property
    def is_secretaire(self):
        return self.role == 'secretaire'
