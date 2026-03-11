from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model
from django.db import models

from .serializers import (
    UserSerializer, UserCreateSerializer, LoginSerializer, MeSerializer,
    RegisterSerializer, ChangePasswordSerializer,
)

User = get_user_model()


# ------------------------------------------------------------------
# Permissions
# ------------------------------------------------------------------
class IsChefDeService(permissions.BasePermission):
    """Only chef_service can manage users."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role.lower() == 'chef_service'


# ------------------------------------------------------------------
# Auth views
# ------------------------------------------------------------------
class LoginView(APIView):
    """POST /api/auth/login/ – returns JWT tokens."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Normalize the username input
        raw_username = serializer.validated_data['username'].strip()
        
        # Try finding the user by inexact username or exact email
        try:
            user_obj = User.objects.get(
                models.Q(username__iexact=raw_username) | models.Q(email__iexact=raw_username)
            )
            actual_username = user_obj.username
        except (User.DoesNotExist, User.MultipleObjectsReturned):
            actual_username = raw_username

        user = authenticate(
            username=actual_username,
            password=serializer.validated_data['password'],
        )

        if user is None:
            return Response(
                {'detail': 'Identifiants invalides.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active:
            return Response(
                {'detail': 'Votre compte est en attente d\'approbation par le chef de service.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': MeSerializer(user).data,
        })


class RegisterView(APIView):
    """POST /api/auth/register/ – public registration (creates inactive user)."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {'detail': 'Votre compte a été créé et est en attente d\'approbation par le chef de service.'},
            status=status.HTTP_201_CREATED,
        )


class MeView(APIView):
    """GET /api/auth/me/ – returns current user profile."""

    def get(self, request):
        return Response(MeSerializer(request.user).data)


class ChangePasswordView(APIView):
    """POST /api/auth/change-password/ – force password change."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.force_password_change = False
        user.save()

        return Response({'detail': 'Mot de passe mis à jour avec succès.'})


# ------------------------------------------------------------------
# User management (chef de service)
# ------------------------------------------------------------------
class UserListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/auth/users/ – list all users
    POST /api/auth/users/ – create a user
    """
    permission_classes = [IsChefDeService]
    queryset = User.objects.all()

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserCreateSerializer
        return UserSerializer


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/auth/users/<id>/ – user detail
    PATCH  /api/auth/users/<id>/ – update user
    DELETE /api/auth/users/<id>/ – delete user
    """
    permission_classes = [IsChefDeService]
    queryset = User.objects.all()
    serializer_class = UserSerializer


class PendingUsersView(generics.ListAPIView):
    """GET /api/auth/pending-users/ – list users awaiting approval."""
    permission_classes = [IsChefDeService]
    serializer_class = UserSerializer
    queryset = User.objects.filter(is_active=False)


class ApproveUserView(APIView):
    """POST /api/auth/users/<id>/approve/ – activate a pending user."""
    permission_classes = [IsChefDeService]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk, is_active=False)
        except User.DoesNotExist:
            return Response(
                {'detail': 'Utilisateur non trouvé ou déjà actif.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        user.is_active = True
        user.save()
        return Response({'detail': f'Le compte de {user.get_full_name()} a été approuvé.'})


class RejectUserView(APIView):
    """POST /api/auth/users/<id>/reject/ – delete a pending user."""
    permission_classes = [IsChefDeService]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk, is_active=False)
        except User.DoesNotExist:
            return Response(
                {'detail': 'Utilisateur non trouvé ou déjà actif.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        name = user.get_full_name()
        user.delete()
        return Response({'detail': f'La demande de {name} a été rejetée.'})
