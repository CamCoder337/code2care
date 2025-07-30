import os

# Binding
bind = f"0.0.0.0:{os.getenv('PORT', '10000')}"
backlog = 2048

# Workers
workers = 1  # Commencer avec 1 worker pour Render
worker_class = "sync"
worker_connections = 1000
timeout = 300  # 5 minutes pour les requêtes RAG longues
keepalive = 2

# Restart workers
max_requests = 1000
max_requests_jitter = 50
preload_app = True  # Important pour les variables globales

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"
capture_output = True

# Process naming
proc_name = "high5_medical_chatbot"

# Server mechanics
daemon = False
pidfile = None

# Worker process lifecycle
def on_starting(server):
    """Called just before the master process is initialized."""
    server.log.info("🚀 Démarrage du serveur médical High5")

def on_reload(server):
    """Called to recycle workers during a reload via SIGHUP."""
    server.log.info("🔄 Rechargement du serveur")

def worker_int(worker):
    """Called just after a worker exited on SIGINT or SIGQUIT."""
    worker.log.info("⚠️ Worker interrompu - connexions Qdrant nettoyées")

def post_worker_init(worker):
    """Called just after a worker has been forked."""
    worker.log.info(f"👷 Worker {worker.pid} initialisé - mode lazy loading")