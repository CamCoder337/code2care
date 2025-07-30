from django.urls import path
from .views import ChatAPIView
from .views import ChatGroqAPIView
urlpatterns = [
    path('chat/', ChatAPIView.as_view(), name='chat'),
    path('chat-groq/', ChatGroqAPIView.as_view(), name='chat-groq'),
]
