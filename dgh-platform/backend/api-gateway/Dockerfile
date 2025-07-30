FROM python:3.11-slim

LABEL authors="Fred Tchiadeu"

WORKDIR /app

RUN apt-get update && apt-get install -y \
    postgresql-client \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["sh", "-c", "echo 'Running collectstatic...' && python manage.py collectstatic --noinput --settings=config.settings.production && echo 'Running migrations...' && python manage.py migrate --settings=config.settings.production && echo 'Starting gunicorn...' && gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 2"]