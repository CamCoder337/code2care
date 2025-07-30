"""
Configuration Celery pour le feedback-service
"""
import os
from celery import Celery
from django.conf import settings

# Définit le module de settings Django par défaut pour Celery
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')

# Crée l'instance Celery
app = Celery('feedback-service')

# Configure Celery avec les settings Django
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-découverte des tâches dans tous les modules Django
app.autodiscover_tasks()

# Configuration additionnelle
app.conf.update(
    # Retry policy
    task_always_eager=False,
    task_eager_propagates=True,
    
    # Routing - utiliser la queue par défaut
    task_routes={},
    
    # Monitoring
    worker_send_task_events=True,
    task_send_sent_event=True,
    
    # Timeouts augmentés pour le chargement de modèles IA
    task_soft_time_limit=120,  # 2 minutes
    task_time_limit=180,       # 3 minutes
)

@app.task(bind=True)
def debug_task(self):
    """Tâche de debug pour tester Celery"""
    print(f'Request: {self.request!r}')