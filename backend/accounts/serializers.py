from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Full user serializer (for lists and detail)."""
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'role_display', 'is_active', 'force_password_change',
        ]
        read_only_fields = ['id']


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating users (with password)."""
    password = serializers.CharField(write_only=True, min_length=4)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'password',
        ]

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError(
                "Ce nom d'utilisateur est déjà pris. Veuillez en choisir un autre."
            )
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    """Login request serializer."""
    username = serializers.CharField()
    password = serializers.CharField()


class MeSerializer(serializers.ModelSerializer):
    """Current user profile serializer."""
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'role_display', 'force_password_change',
        ]
        read_only_fields = fields


class RegisterSerializer(serializers.ModelSerializer):
    """Public registration serializer – creates an inactive user."""
    password = serializers.CharField(write_only=True, min_length=4)
    password_confirm = serializers.CharField(write_only=True, min_length=4)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'password', 'password_confirm',
        ]

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError(
                "Ce nom d'utilisateur est déjà pris. Veuillez en choisir un autre."
            )
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password_confirm'):
            raise serializers.ValidationError(
                {'password_confirm': 'Les mots de passe ne correspondent pas.'}
            )
        # Only medecin and secretaire can self-register
        if attrs.get('role') not in ('medecin', 'secretaire'):
            raise serializers.ValidationError(
                {'role': 'Rôle invalide pour l\'inscription.'}
            )
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.is_active = False
        user.set_password(password)
        user.save()
        return user


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for mandatory password change at first login."""
    new_password = serializers.CharField(write_only=True, min_length=4)
    confirm_password = serializers.CharField(write_only=True, min_length=4)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError("Les mots de passe ne correspondent pas.")
        return attrs
