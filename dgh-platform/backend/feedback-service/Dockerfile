FROM python:3.11-slim

LABEL authors="Fred Tchiadeu"

WORKDIR /app

RUN apt-get update && apt-get install -y \
    postgresql-client \
    gcc \
    git \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip && \
    # pip install torch==2.7.1+cpu --extra-index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements.txt && \
    pip cache purge && \
    find /usr/local/lib/python3.11 -name "*.pyc" -delete && \
    find /usr/local/lib/python3.11 -name "__pycache__" -type d -exec rm -rf {} + || true

COPY . .

EXPOSE 8000

CMD ["sh", "-c", "echo 'Running collectstatic...' && python manage.py collectstatic --noinput --settings=config.settings.production && echo 'Running migrations...' && python manage.py migrate --settings=config.settings.production && echo 'Starting Celery worker (trial optimized)...' && DJANGO_SETTINGS_MODULE=config.settings.production celery -A config worker --loglevel=warning --concurrency=1 --max-tasks-per-child=10 & echo 'Starting Celery Beat scheduler...' && DJANGO_SETTINGS_MODULE=config.settings.production celery -A config beat --loglevel=warning --pidfile=/tmp/celerybeat.pid --schedule=/tmp/celerybeat-schedule & echo 'Starting Django server...' && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 1 --max-requests=50 --timeout=120"]
