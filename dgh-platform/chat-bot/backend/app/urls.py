from django.urls import path
from .views import ChatAPIView, ChatGroqAPIView, QdrantStatusAPIView

urlpatterns = [
    # Endpoints de chat existants
    path('chat/', ChatAPIView.as_view(), name='chat'),
    path('chat-groq/', ChatGroqAPIView.as_view(), name='chat-groq'),

    # Nouveau endpoint pour vérifier le statut Qdrant
    path('qdrant-status/', QdrantStatusAPIView.as_view(), name='qdrant-status'),
]