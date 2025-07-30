# 🏥 Feedback Service - HIGH5 Code2Care Platform

Service de gestion des retours patients avec analyse de sentiment automatique et catégorisation thématique intelligente.

## 🚀 Fonctionnalités

### 📋 Gestion des Feedbacks
- **CRUD complet** : Création, lecture, mise à jour et suppression des feedbacks
- **Validation UUID** : Validation robuste des identifiants patients et départements
- **Multilingue** : Support français, anglais et langues locales camerounaises
- **Types d'entrée** : Texte et audio (préparé pour futures extensions)

### 🧠 Intelligence Artificielle
- **Analyse de sentiment** : Modèle IA `genie10/feedback_patients` avec fallback intelligent
- **Catégorisation automatique** : Génération de thèmes basés sur sentiment + rating
- **Traitement asynchrone** : Utilisation de Celery pour performance optimale
- **Scores détaillés** : Confiance positive, négative et neutre

### 📊 Analytics & Métriques
- **Tableaux de bord** : Interface d'administration Django complète
- **Filtrage avancé** : Par date, département, sentiment, rating
- **Historique complet** : Suivi des traitements et timestamps
- **Recherche** : Recherche full-text dans les feedbacks

## 🏗️ Architecture

### Structure du Service
```
feedback-service/
├── apps/
│   ├── feedback/           # Gestion des feedbacks patients
│   │   ├── models.py      # Feedback, FeedbackTheme, Department
│   │   ├── serializers.py # API serialization
│   │   ├── views.py       # CRUD operations + endpoints
│   │   ├── admin.py       # Interface d'administration
│   │   ├── tasks.py       # Tâches Celery asynchrones
│   │   ├── services.py    # Logique métier
│   │   ├── signals.py     # Signaux Django automatiques
│   │   ├── sentimental_analysis.py  # IA analyse sentiment
│   │   └── theme_extraction.py      # Génération thèmes
│   ├── analytics/         # Métriques et rapports
│   └── common/            # Utilitaires partagés
├── config/                # Configuration Django + Celery
├── requirements.txt       # Dépendances Python
└── Dockerfile            # Conteneurisation
```

### Technologies Utilisées
- **Framework** : Django 5.2.4 + Django REST Framework
- **Base de données** : PostgreSQL (SQLite en développement)
- **Cache & Queue** : Redis pour Celery et cache Django
- **IA/ML** : Transformers + PyTorch pour analyse sentiment
- **Asynchrone** : Celery pour tâches en arrière-plan
- **API** : REST avec documentation Swagger/OpenAPI

## 🔧 Installation & Configuration

### Prérequis
- Python 3.10+
- Redis Server
- PostgreSQL (optionnel en développement)

### Installation
```bash
# Cloner et naviguer
cd feedback-service

# Environnement virtuel
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Dépendances
pip install -r requirements.txt

# Configuration base de données
python manage.py migrate

# Création superutilisateur admin (automatique)
python manage.py migrate  # Inclut la création de l'admin

# Variables d'environnement (optionnel)
cp .env.example .env
```

### Configuration Redis
```bash
# Ubuntu/Debian
sudo apt install redis-server
redis-server

# Ou Docker
docker run -d -p 6379:6379 redis:alpine
```

## 🚀 Démarrage

### 1. Serveur Django
```bash
python manage.py runserver 0.0.0.0:8001
```

### 2. Worker Celery (Traitement IA)
```bash
# Terminal séparé
celery -A config worker --loglevel=info
```

### 3. Accès
- **API** : http://localhost:8001/api/v1/feedbacks/
- **Admin** : http://localhost:8001/admin/ (admin/admin123)
- **Health Check** : http://localhost:8001/health/
- **Documentation** : http://localhost:8001/swagger/

## 📡 API Endpoints

### Feedbacks
```bash
# Créer un feedback
POST /api/v1/feedbacks/
{
  "description": "Service excellent, personnel très accueillant",
  "rating": 5,
  "language": "fr",
  "patient_id": "uuid-patient",
  "department_id": "uuid-department"
}

# Lister les feedbacks (avec filtres)
GET /api/v1/feedbacks/?rating=5&sentiment=positive&date_from=2025-01-01

# Feedback par ID
GET /api/v1/feedbacks/{feedback_id}/

# Mes feedbacks (patient connecté)
GET /api/v1/feedbacks/my_feedbacks/
```

### Départements
```bash
# Lister départements
GET /api/v1/departments/

# Créer département
POST /api/v1/departments/
{
  "name": "Cardiologie",
  "description": "Service de cardiologie et chirurgie cardiovasculaire"
}
```

### Thèmes
```bash
# Thèmes générés automatiquement
GET /api/v1/feedback-themes/
```

## 🧠 Analyse de Sentiment

### Modèle IA
- **Modèle** : `genie10/feedback_patients` (spécialisé feedbacks médicaux)
- **Langues** : Français, anglais, multilingue
- **Fallback** : Analyse par mots-clés si IA indisponible
- **Performance** : ~0.03 secondes par feedback

### Catégories de Sentiment
- **Positif** : Service excellent, satisfaction élevée
- **Négatif** : Problèmes identifiés, insatisfaction
- **Neutre** : Service correct, évaluation équilibrée

### Thèmes Automatiques
```python
# Exemples de thèmes générés
"Satisfaction - Service excellent"      # Positif + Rating 4-5
"Insatisfaction - Problème majeur"      # Négatif + Rating 1-2
"Neutre - Service moyen"                # Neutre + Rating 3
```

## 🔒 Sécurité & Authentification

### Intégration API Gateway
- **Headers requis** : `X-User-ID`, `X-User-Type`, `Authorization`
- **CORS** : Configuré pour communication inter-services
- **Validation UUID** : Contrôle strict des identifiants

### Données Sensibles
- **Pas de PII** : Seulement références UUID vers API Gateway
- **Chiffrement** : Communications HTTPS en production
- **Logs** : Logs détaillés sans données personnelles

## 📊 Monitoring & Observabilité

### Health Checks
```bash
# Status service + base de données
GET /health/
# Retourne: {"status": "healthy", "service": "feedback-service", "database": "connected"}
```

### Logs Structurés
- **Django** : Logs applicatifs et erreurs
- **Celery** : Logs traitement IA et tâches asynchrones
- **Performance** : Temps de traitement et métriques

### Métriques Clés
- Feedbacks créés/minute
- Temps moyen d'analyse sentiment
- Taux de réussite IA vs fallback
- Distribution des sentiments

## 🐳 Déploiement

### Docker
```dockerfile
# Build
docker build -t feedback-service .

# Run avec Redis
docker run -d --name redis redis:alpine
docker run -d -p 8001:8001 --link redis feedback-service

# Ou Docker Compose (voir docker-compose.yml parent)
docker-compose up feedback-service redis
```

### Production
```bash
# Serveur WSGI
gunicorn config.wsgi:application --bind 0.0.0.0:8001

# Worker Celery (processus séparé)
celery -A config worker --loglevel=info --concurrency=4

# Variables d'environnement requises
DATABASE_URL=postgresql://user:pass@host:5432/feedback_db
REDIS_URL=redis://redis-host:6379/0
CORS_ORIGINS=https://api-gateway.domain.com
```

## 🧪 Tests & Qualité

### Tests
```bash
# Tests unitaires
python manage.py test

# Tests d'intégration
python manage.py test apps.feedback.tests.integration

# Coverage
coverage run --source='.' manage.py test
coverage report
```

### Linting
```bash
# Code quality (si configuré)
flake8 apps/
black apps/
```

## 🚨 Dépannage

### Problèmes Fréquents

**1. Erreur Redis Connection**
```bash
# Vérifier Redis
redis-cli ping
# PONG attendu

# Vérifier configuration
REDIS_URL=redis://localhost:6379/0
```

**2. Modèle IA ne charge pas**
```bash
# Vérifier dépendances
pip install sentencepiece transformers torch

# Logs Celery pour diagnostics
celery -A config worker --loglevel=debug
```

**3. Erreurs UUID**
```bash
# Format UUID requis
patient_id: "12345678-1234-1234-1234-123456789012"
department_id: "87654321-4321-4321-4321-cba987654321"
```

## 🤝 Contribution

### Standards de Code
- **PEP 8** : Style guide Python
- **Type hints** : Annotations de types
- **Docstrings** : Documentation des fonctions
- **Tests** : Couverture minimale 80%

### Architecture
- **Séparation des responsabilités** : Modèles, Services, Vues
- **DRY** : Don't Repeat Yourself
- **Single Responsibility** : Une classe = une responsabilité

## 📝 Licence

Projet hackathon HIGH5 Code2Care - Usage interne uniquement.

---

**🏥 Feedback Service** - *Améliorer les soins par l'écoute des patients*