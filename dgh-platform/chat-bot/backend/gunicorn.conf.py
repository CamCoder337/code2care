# gunicorn.conf.py

import os

# Server socket
bind = f"0.0.0.0:{os.getenv('PORT', '10000')}"
backlog = 2048

# Worker processes
workers = 1  # Start with 1 worker for Render's memory limits
worker_class = "sync"
worker_connections = 1000
timeout = 120  # Increased timeout for API calls
keepalive = 2
max_requests = 1000
max_requests_jitter = 50

# Restart workers after this many requests, with up to 50 more requests
preload_app = True

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"

# Process naming
proc_name = "high5_chatbot"

# Server mechanics
daemon = False
pidfile = None
tmp_upload_dir = None

# Security
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190