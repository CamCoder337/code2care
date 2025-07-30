from django.db import models
from django.contrib.postgres.fields import ArrayField  # ou pgvector si installé

class Conversation(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def get_chat_history(self):
        """Retourne l'historique formaté pour LangChain"""
        messages = self.messages.order_by("timestamp")
        history = []
        for msg in messages:
            role = "human" if msg.role == "user" else "ai"
            history.append((role, msg.content))
        return history

    def get_messages_count(self):
        return self.messages.count()

class ChatMessage(models.Model):
    ROLE_CHOICES = [('user','Utilisateur'), ('assistant','Assistant')]
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

class ClinicalSummary(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class SummaryEmbedding(models.Model):
    summary = models.OneToOneField(ClinicalSummary, on_delete=models.CASCADE)
    # Exemple d’utilisation d’un champ vecteur (nécessite pgvector) :
    # vector = VectorField(dim=768, null=True)
    # Sinon on stocke l’ID Qdrant ou on l’ignore (vecteurs dans Qdrant).
    vector = ArrayField(models.FloatField(), size=768, null=True)

class SystemLog(models.Model):
    LEVELS = [('INFO','Info'), ('WARN','Warning'), ('ERROR','Error')]
    level = models.CharField(max_length=10, choices=LEVELS)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
