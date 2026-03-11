from django.urls import path
from . import views

urlpatterns = [
    path('patients/', views.PatientListCreateView.as_view(), name='patient-list'),
    path('patients/<int:pk>/', views.PatientDetailView.as_view(), name='patient-detail'),
    path('patients/<int:pk>/request-modification/', views.RequestModificationView.as_view(), name='patient-request-modification'),
    path('patients/<int:pk>/accept-modification/', views.AcceptModificationView.as_view(), name='patient-accept-modification'),
    path('patients/<int:pk>/reject-modification/', views.RejectModificationView.as_view(), name='patient-reject-modification'),
    path('activity/', views.ActivityLogListView.as_view(), name='activity-list'),
    path('stats/daily/', views.DailyStatsView.as_view(), name='stats-daily'),
]
