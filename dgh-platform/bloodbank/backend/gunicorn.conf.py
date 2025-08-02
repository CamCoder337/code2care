# gunicorn.conf.py - Configuration optimisée pour Render (512MB RAM, 0.1 CPU)

import os
import multiprocessing

# ==================== CONFIGURATION SERVEUR ====================
# Adresse et port
bind = f"0.0.0.0:{os.getenv('PORT', '8000')}"

# ==================== WORKERS CONFIGURATION ====================
# Pour 512MB RAM et 0.1 CPU, utiliser 1 seul worker pour éviter les timeouts
workers = 1
worker_class = "sync"  # sync est plus stable pour les calculs lourds
worker_connections = 100  # Réduit pour économiser la mémoire

# ==================== TIMEOUTS ====================
# Timeout élevé pour les calculs de forecasting
timeout = 180  # 3 minutes (au lieu des 30s par défaut)
keepalive = 5
graceful_timeout = 120

# ==================== MEMORY MANAGEMENT ====================
# Redémarrer les workers après N requêtes pour éviter les fuites mémoire
max_requests = 500
max_requests_jitter = 50

# Précharger l'application pour économiser la mémoire
preload_app = True

# ==================== LOGS CONFIGURATION ====================
# Logs pour debug
loglevel = "info"
accesslog = "-"  # stdout
errorlog = "-"   # stderr
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# ==================== PERFORMANCE OPTIMIZATIONS ====================
# Désactiver le check des fichiers statiques par Gunicorn
check_config = False

# ==================== PROCESS NAMING ====================
proc_name = "bloodbank_gunicorn"

# ==================== CUSTOM HOOKS ====================
def when_ready(server):
    """Hook appelé quand le serveur est prêt"""
    server.log.info("Blood Bank Server ready to serve requests")

def worker_int(worker):
    """Hook appelé lors de l'interruption d'un worker"""
    worker.log.info("Worker received INT or QUIT signal")

def pre_fork(server, worker):
    """Hook appelé avant le fork d'un worker"""
    server.log.info(f"Worker spawned (pid: {worker.pid})")

def post_fork(server, worker):
    """Hook appelé après le fork d'un worker"""
    server.log.info(f"Worker ready (pid: {worker.pid})")

def worker_abort(worker):
    """Hook appelé quand un worker est tué brutalement"""
    worker.log.info(f"Worker aborted (pid: {worker.pid})")

# ==================== CONFIGURATION ENVIRONNEMENT ====================
# Variables d'environnement pour Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bloodbank.settings')

# Configuration spécifique pour Render
if os.getenv('RENDER'):
    # Timeout plus élevé sur Render pour les calculs
    timeout = 300  # 5 minutes
    # Désactiver le preload sur Render pour éviter les problèmes de mémoire
    preload_app = False
    # Utiliser moins de connexions sur Render
    worker_connections = 50

# ==================== CONFIGURATION SSL (si nécessaire) ====================
# Pour les environnements de production avec SSL
forwarded_allow_ips = "*"
secure_scheme_headers = {
    'X-FORWARDED-PROTOCOL': 'ssl',
    'X-FORWARDED-PROTO': 'https',
    'X-FORWARDED-SSL': 'on'
}

# ==================== DEBUGGING ====================
# Configuration pour le debugging en développement
if os.getenv('DEBUG', 'False').lower() == 'true':
    reload = True
    reload_engine = 'auto'
    loglevel = "debug"
else:
    reload = False