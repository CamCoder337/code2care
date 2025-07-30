from django.apps import AppConfig


class FeedbackConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.feedback'
    verbose_name = 'Feedback Management'
    
    def ready(self):
        """Importe les signaux lors du démarrage de l'application"""
        import apps.feedback.signals