"""
Schémas Swagger pour les endpoints feedback de l'API Gateway
"""
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework import status


# Schémas de données pour Swagger
feedback_create_schema = {
    "type": "object",
    "properties": {
        "description": {
            "type": "string",
            "description": "Description du feedback du patient",
            "example": "Le service médical était excellent, personnel très professionnel"
        },
        "rating": {
            "type": "integer",
            "minimum": 1,
            "maximum": 5,
            "description": "Note de satisfaction (1-5)",
            "example": 4
        },
        "language": {
            "type": "string",
            "enum": ["fr", "en", "dua", "bas", "ewo"],
            "description": "Langue du feedback",
            "example": "fr"
        },
        "input_type": {
            "type": "string",
            "enum": ["text", "audio"],
            "description": "Type d'input",
            "example": "text"
        },
        "department_id": {
            "type": "string",
            "format": "uuid",
            "description": "ID du département concerné",
            "example": "87654321-4321-4321-4321-cba987654321"
        }
    },
    "required": ["description", "rating", "department_id"]
}

feedback_response_schema = {
    "type": "object",
    "properties": {
        "message": {
            "type": "string",
            "example": "Feedback créé avec succès"
        },
        "feedback": {
            "type": "object",
            "properties": {
                "feedback_id": {
                    "type": "string",
                    "format": "uuid",
                    "example": "123e4567-e89b-12d3-a456-426614174000"
                },
                "description": {"type": "string"},
                "rating": {"type": "integer"},
                "language": {"type": "string"},
                "input_type": {"type": "string"},
                "created_at": {
                    "type": "string",
                    "format": "date-time",
                    "example": "2025-07-23T10:30:00Z"
                },
                "is_processed": {
                    "type": "boolean",
                    "example": False
                }
            }
        },
        "processing_info": {
            "type": "string",
            "example": "L'analyse de sentiment se fait automatiquement en arrière-plan"
        }
    }
}

feedback_status_schema = {
    "type": "object",
    "properties": {
        "feedback_id": {
            "type": "string",
            "format": "uuid"
        },
        "is_processed": {
            "type": "boolean",
            "description": "Indique si le feedback a été traité"
        },
        "processed_at": {
            "type": "string",
            "format": "date-time",
            "nullable": True
        },
        "sentiment": {
            "type": "string",
            "enum": ["positive", "negative", "neutral"],
            "nullable": True,
            "description": "Sentiment détecté"
        },
        "sentiment_scores": {
            "type": "object",
            "properties": {
                "positive": {"type": "number", "format": "float"},
                "negative": {"type": "number", "format": "float"},
                "neutral": {"type": "number", "format": "float"}
            }
        },
        "theme": {
            "type": "string",
            "nullable": True,
            "description": "Thème extrait automatiquement"
        },
        "description": {"type": "string"},
        "rating": {"type": "integer"}
    }
}

test_feedback_schema = {
    "type": "object",
    "properties": {
        "message": {"type": "string"},
        "feedback": {"type": "object"},
        "test_info": {
            "type": "object",
            "properties": {
                "description": {"type": "string"},
                "check_status_url": {"type": "string"},
                "wait_time": {"type": "string"}
            }
        }
    }
}

# Décorateurs pour les vues avec drf_yasg
create_feedback_decorator = swagger_auto_schema(
    methods=['POST'],
    operation_id="create_patient_feedback",
    operation_summary="Créer un nouveau feedback",
    operation_description="""
    Permet à un patient authentifié de créer un nouveau feedback.
    
    **Processus automatique :**
    1. Le feedback est créé immédiatement
    2. L'analyse de sentiment se fait automatiquement en arrière-plan
    3. Un thème est extrait et assigné au feedback
    4. Le patient peut vérifier le statut via l'endpoint de statut
    
    **Champs requis :** description, rating, department_id
    **Patient_id :** Automatiquement assigné depuis l'authentification
    """,
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=['description', 'rating', 'department_id'],
        properties={
            'description': openapi.Schema(
                type=openapi.TYPE_STRING,
                description='Description du feedback du patient',
                example='Le service médical était excellent, personnel très professionnel'
            ),
            'rating': openapi.Schema(
                type=openapi.TYPE_INTEGER,
                minimum=1,
                maximum=5,
                description='Note de satisfaction (1-5)',
                example=4
            ),
            'language': openapi.Schema(
                type=openapi.TYPE_STRING,
                enum=['fr', 'en', 'dua', 'bas', 'ewo'],
                description='Langue du feedback',
                example='fr'
            ),
            'input_type': openapi.Schema(
                type=openapi.TYPE_STRING,
                enum=['text', 'audio'],
                description='Type d\'input',
                example='text'
            ),
            'department_id': openapi.Schema(
                type=openapi.TYPE_STRING,
                format=openapi.FORMAT_UUID,
                description='ID du département concerné',
                example='87654321-4321-4321-4321-cba987654321'
            )
        }
    ),
    responses={
        201: openapi.Response(
            description='Feedback créé avec succès',
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'message': openapi.Schema(type=openapi.TYPE_STRING),
                    'feedback': openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        properties={
                            'feedback_id': openapi.Schema(type=openapi.TYPE_STRING),
                            'description': openapi.Schema(type=openapi.TYPE_STRING),
                            'rating': openapi.Schema(type=openapi.TYPE_INTEGER),
                            'created_at': openapi.Schema(type=openapi.TYPE_STRING),
                            'is_processed': openapi.Schema(type=openapi.TYPE_BOOLEAN)
                        }
                    ),
                    'processing_info': openapi.Schema(type=openapi.TYPE_STRING)
                }
            )
        ),
        400: openapi.Response(description='Champs manquants'),
        403: openapi.Response(description='Accès réservé aux patients'),
        503: openapi.Response(description='Service temporairement indisponible')
    },
    tags=['Feedback Patient']
)

my_feedbacks_decorator = swagger_auto_schema(
    methods=['GET'],
    operation_id="get_my_feedbacks",
    operation_summary="Récupérer mes feedbacks",
    operation_description="Récupère tous les feedbacks du patient authentifié avec leur statut de traitement",
    manual_parameters=[
        openapi.Parameter(
            'date_from',
            openapi.IN_QUERY,
            description="Filtrer par date de début",
            type=openapi.TYPE_STRING,
            format=openapi.FORMAT_DATE
        ),
        openapi.Parameter(
            'date_to',
            openapi.IN_QUERY,
            description="Filtrer par date de fin", 
            type=openapi.TYPE_STRING,
            format=openapi.FORMAT_DATE
        )
    ],
    responses={
        200: openapi.Response(
            description='Liste des feedbacks du patient',
            schema=openapi.Schema(
                type=openapi.TYPE_ARRAY,
                items=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'feedback_id': openapi.Schema(type=openapi.TYPE_STRING),
                        'description': openapi.Schema(type=openapi.TYPE_STRING),
                        'rating': openapi.Schema(type=openapi.TYPE_INTEGER),
                        'sentiment': openapi.Schema(type=openapi.TYPE_STRING),
                        'is_processed': openapi.Schema(type=openapi.TYPE_BOOLEAN),
                        'created_at': openapi.Schema(type=openapi.TYPE_STRING)
                    }
                )
            )
        ),
        403: openapi.Response(description='Accès réservé aux patients')
    },
    tags=['Feedback Patient']
)

feedback_status_decorator = swagger_auto_schema(
    methods=['GET'],
    operation_id="get_feedback_status",
    operation_summary="Vérifier le statut d'un feedback", 
    operation_description="Vérifie le statut de traitement d'un feedback spécifique avec sentiment et thème",
    responses={
        200: openapi.Response(
            description='Statut du feedback',
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'feedback_id': openapi.Schema(type=openapi.TYPE_STRING),
                    'is_processed': openapi.Schema(type=openapi.TYPE_BOOLEAN),
                    'sentiment': openapi.Schema(type=openapi.TYPE_STRING, enum=['positive', 'negative', 'neutral']),
                    'sentiment_scores': openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        properties={
                            'positive': openapi.Schema(type=openapi.TYPE_NUMBER),
                            'negative': openapi.Schema(type=openapi.TYPE_NUMBER),
                            'neutral': openapi.Schema(type=openapi.TYPE_NUMBER)
                        }
                    ),
                    'theme': openapi.Schema(type=openapi.TYPE_STRING),
                    'processed_at': openapi.Schema(type=openapi.TYPE_STRING)
                }
            )
        ),
        403: openapi.Response(description='Accès réservé aux patients'),
        404: openapi.Response(description='Feedback non trouvé')
    },
    tags=['Feedback Patient']
)

test_feedback_decorator = swagger_auto_schema(
    methods=['POST'],
    operation_id="create_test_feedback",
    operation_summary="Créer un feedback de test",
    operation_description="Crée un feedback de test avec des données par défaut pour tester le système",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            'description': openapi.Schema(type=openapi.TYPE_STRING, description='Override description'),
            'rating': openapi.Schema(type=openapi.TYPE_INTEGER, description='Override rating'),
            'language': openapi.Schema(type=openapi.TYPE_STRING, description='Override langue'),
            'department_id': openapi.Schema(type=openapi.TYPE_STRING, description='Override département')
        }
    ),
    responses={
        201: openapi.Response(
            description='Feedback de test créé',
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'message': openapi.Schema(type=openapi.TYPE_STRING),
                    'feedback': openapi.Schema(type=openapi.TYPE_OBJECT),
                    'test_info': openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        properties={
                            'check_status_url': openapi.Schema(type=openapi.TYPE_STRING),
                            'wait_time': openapi.Schema(type=openapi.TYPE_STRING)
                        }
                    )
                }
            )
        ),
        403: openapi.Response(description='Accès réservé aux patients')
    },
    tags=['Feedback Patient - Test']
)

# Schéma pour les départements
department_schema = {
    "type": "object",
    "properties": {
        "department_id": {
            "type": "string",
            "format": "uuid",
            "description": "ID unique du département",
            "example": "87654321-4321-4321-4321-cba987654321"
        },
        "name": {
            "type": "string",
            "description": "Nom du département",
            "example": "Cardiologie"
        },
        "description": {
            "type": "string",
            "description": "Description du département",
            "example": "Service de cardiologie et maladies cardiovasculaires"
        },
        "is_active": {
            "type": "boolean",
            "description": "Indique si le département est actif",
            "example": True
        },
        "created_at": {
            "type": "string",
            "format": "date-time",
            "description": "Date de création",
            "example": "2025-07-23T10:30:00Z"
        },
        "updated_at": {
            "type": "string",
            "format": "date-time", 
            "description": "Date de dernière modification",
            "example": "2025-07-23T10:30:00Z"
        }
    }
}

departments_list_decorator = swagger_auto_schema(
    methods=['GET'],
    operation_id="list_departments",
    operation_summary="Lister les départements",
    operation_description="""
    Récupère la liste de tous les départements actifs de l'hôpital.
    
    **Utilisation :**
    - Pour afficher les départements disponibles lors de la création d'un feedback
    - Pour permettre aux patients de sélectionner le bon département
    - Seuls les départements actifs sont retournés
    
    **Filtres disponibles :**
    - Recherche par nom ou description avec le paramètre `search`
    """,
    manual_parameters=[
        openapi.Parameter(
            'search',
            openapi.IN_QUERY,
            description="Rechercher dans le nom et la description des départements",
            type=openapi.TYPE_STRING,
            required=False,
            example="cardio"
        )
    ],
    responses={
        200: openapi.Response(
            description='Liste des départements',
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'count': openapi.Schema(
                        type=openapi.TYPE_INTEGER,
                        description="Nombre total de départements"
                    ),
                    'results': openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Schema(
                            type=openapi.TYPE_OBJECT,
                            properties={
                                'department_id': openapi.Schema(
                                    type=openapi.TYPE_STRING,
                                    format=openapi.FORMAT_UUID,
                                    description="ID unique du département"
                                ),
                                'name': openapi.Schema(
                                    type=openapi.TYPE_STRING,
                                    description="Nom du département",
                                    example="Cardiologie"
                                ),
                                'description': openapi.Schema(
                                    type=openapi.TYPE_STRING,
                                    description="Description du département",
                                    example="Service de cardiologie et maladies cardiovasculaires"
                                ),
                                'is_active': openapi.Schema(
                                    type=openapi.TYPE_BOOLEAN,
                                    description="Statut actif du département"
                                ),
                                'created_at': openapi.Schema(
                                    type=openapi.TYPE_STRING,
                                    format=openapi.FORMAT_DATETIME,
                                    description="Date de création"
                                ),
                                'updated_at': openapi.Schema(
                                    type=openapi.TYPE_STRING,
                                    format=openapi.FORMAT_DATETIME,
                                    description="Date de dernière modification"
                                )
                            }
                        )
                    )
                }
            )
        ),
        503: openapi.Response(description='Service temporairement indisponible')
    },
    tags=['Départements']
)

# ========== MEDICATION SCHEMAS ==========

# Schéma pour les médicaments
medication_schema = {
    "type": "object",
    "properties": {
        "medication_id": {
            "type": "string",
            "format": "uuid",
            "description": "ID unique du médicament",
            "example": "11111111-1111-1111-1111-111111111111"
        },
        "name": {
            "type": "string",
            "description": "Nom du médicament",
            "example": "Paracétamol"
        },
        "dosage": {
            "type": "string",
            "description": "Dosage standard du médicament",
            "example": "500mg"
        },
        "frequency": {
            "type": "number",
            "format": "float",
            "description": "Fréquence recommandée par jour",
            "example": 3.0
        }
    }
}

# Décorateur pour lister les médicaments
list_medications_decorator = swagger_auto_schema(
    methods=['GET'],
    operation_id="list_medications",
    operation_summary="Lister les médicaments",
    operation_description="""
    Récupère la liste de tous les médicaments disponibles dans le système.
    
    **Utilisation :**
    - Pour afficher les médicaments disponibles lors de la création d'une prescription
    - Pour permettre aux professionnels de santé de sélectionner les bons médicaments
    - Recherche par nom de médicament disponible avec le paramètre `search`
    
    **Filtres disponibles :**
    - Recherche par nom avec le paramètre `search`
    """,
    manual_parameters=[
        openapi.Parameter(
            'search',
            openapi.IN_QUERY,
            description="Rechercher dans le nom du médicament",
            type=openapi.TYPE_STRING,
            required=False,
            example="parac"
        )
    ],
    responses={
        200: openapi.Response(
            description='Liste des médicaments',
            schema=openapi.Schema(
                type=openapi.TYPE_ARRAY,
                items=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'medication_id': openapi.Schema(
                            type=openapi.TYPE_STRING,
                            format=openapi.FORMAT_UUID,
                            description="ID unique du médicament"
                        ),
                        'name': openapi.Schema(
                            type=openapi.TYPE_STRING,
                            description="Nom du médicament",
                            example="Paracétamol"
                        ),
                        'dosage': openapi.Schema(
                            type=openapi.TYPE_STRING,
                            description="Dosage standard",
                            example="500mg"
                        ),
                        'frequency': openapi.Schema(
                            type=openapi.TYPE_NUMBER,
                            format='float',
                            description="Fréquence recommandée par jour",
                            example=3.0
                        )
                    }
                )
            )
        ),
        503: openapi.Response(description='Service temporairement indisponible')
    },
    tags=['Médicaments']
)

# Décorateur pour récupérer un médicament spécifique
get_medication_decorator = swagger_auto_schema(
    methods=['GET'],
    operation_id="get_medication",
    operation_summary="Récupérer un médicament",
    operation_description="Récupère les détails d'un médicament spécifique",
    responses={
        200: openapi.Response(
            description='Détails du médicament',
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'medication_id': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_UUID),
                    'name': openapi.Schema(type=openapi.TYPE_STRING),
                    'dosage': openapi.Schema(type=openapi.TYPE_STRING),
                    'frequency': openapi.Schema(type=openapi.TYPE_NUMBER, format='float')
                }
            )
        ),
        404: openapi.Response(description='Médicament non trouvé'),
        503: openapi.Response(description='Service temporairement indisponible')
    },
    tags=['Médicaments']
)

# Schéma pour les appointments
appointment_schema = {
    "type": "object",
    "properties": {
        "appointment_id": {
            "type": "string",
            "format": "uuid",
            "description": "ID unique du rendez-vous",
            "example": "12345678-1234-1234-1234-123456789012"
        },
        "scheduled": {
            "type": "string",
            "format": "date-time",
            "description": "Date et heure du rendez-vous",
            "example": "2025-08-01T14:30:00Z"
        },
        "type": {
            "type": "string",
            "enum": ["consultation", "suivi", "examen"],
            "description": "Type de rendez-vous",
            "example": "consultation"
        },
        "type_display": {
            "type": "string",
            "description": "Libellé du type de rendez-vous",
            "example": "Consultation"
        },
        "patient_id": {
            "type": "string",
            "format": "uuid",
            "description": "ID du patient",
            "example": "87654321-4321-4321-4321-cba987654321"
        },
        "professional_id": {
            "type": "string",
            "format": "uuid",
            "description": "ID du professionnel de santé",
            "example": "11111111-2222-3333-4444-555555555555"
        },
        "created_at": {
            "type": "string",
            "format": "date-time",
            "description": "Date de création",
            "example": "2025-07-30T10:00:00Z"
        },
        "updated_at": {
            "type": "string",
            "format": "date-time",
            "description": "Date de dernière modification",
            "example": "2025-07-30T10:00:00Z"
        }
    }
}

# Décorateurs pour les appointments
list_appointments_decorator = swagger_auto_schema(
    methods=['GET'],
    operation_id="list_appointments",
    operation_summary="Lister les rendez-vous",
    operation_description="""
    Récupère la liste des rendez-vous selon le type d'utilisateur :
    - **Patients** : leurs propres rendez-vous
    - **Professionnels** : les rendez-vous qu'ils ont programmés
    
    **Filtres disponibles :**
    - date_from : Filtrer par date de début
    - date_to : Filtrer par date de fin
    - type : Filtrer par type de rendez-vous
    """,
    manual_parameters=[
        openapi.Parameter(
            'date_from',
            openapi.IN_QUERY,
            description="Filtrer par date de début (format: YYYY-MM-DD)",
            type=openapi.TYPE_STRING,
            format=openapi.FORMAT_DATE
        ),
        openapi.Parameter(
            'date_to',
            openapi.IN_QUERY,
            description="Filtrer par date de fin (format: YYYY-MM-DD)",
            type=openapi.TYPE_STRING,
            format=openapi.FORMAT_DATE
        ),
        openapi.Parameter(
            'type',
            openapi.IN_QUERY,
            description="Filtrer par type de rendez-vous",
            type=openapi.TYPE_STRING,
            enum=['consultation', 'suivi', 'examen']
        )
    ],
    responses={
        200: openapi.Response(
            description='Liste des rendez-vous',
            schema=openapi.Schema(
                type=openapi.TYPE_ARRAY,
                items=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'appointment_id': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_UUID),
                        'scheduled': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATETIME),
                        'type': openapi.Schema(type=openapi.TYPE_STRING, enum=['consultation', 'suivi', 'examen']),
                        'type_display': openapi.Schema(type=openapi.TYPE_STRING),
                        'patient_id': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_UUID),
                        'professional_id': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_UUID),
                        'created_at': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATETIME),
                        'updated_at': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATETIME)
                    }
                )
            )
        ),
        403: openapi.Response(description='Accès non autorisé')
    },
    tags=['Appointments']
)

create_appointment_decorator = swagger_auto_schema(
    methods=['POST'],
    operation_id="create_appointment",
    operation_summary="Créer un rendez-vous",
    operation_description="""
    Crée un nouveau rendez-vous. 
    
    **Comportement selon le type d'utilisateur :**
    - **Patient** : peut créer un RDV en spécifiant le professional_id
    - **Professionnel** : peut créer un RDV en spécifiant le patient_id
    
    **Note :** Le champ patient_id ou professional_id peut être auto-assigné selon l'utilisateur connecté.
    """,
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=['scheduled', 'type'],
        properties={
            'scheduled': openapi.Schema(
                type=openapi.TYPE_STRING,
                format=openapi.FORMAT_DATETIME,
                description='Date et heure du rendez-vous (ISO 8601)',
                example='2025-08-01T14:30:00Z'
            ),
            'type': openapi.Schema(
                type=openapi.TYPE_STRING,
                enum=['consultation', 'suivi', 'examen'],
                description='Type de rendez-vous',
                example='consultation'
            ),
            'patient_id': openapi.Schema(
                type=openapi.TYPE_STRING,
                format=openapi.FORMAT_UUID,
                description='ID du patient (requis si utilisateur est professionnel)',
                example='87654321-4321-4321-4321-cba987654321'
            ),
            'professional_id': openapi.Schema(
                type=openapi.TYPE_STRING,
                format=openapi.FORMAT_UUID,
                description='ID du professionnel (requis si utilisateur est patient)',
                example='11111111-2222-3333-4444-555555555555'
            )
        }
    ),
    responses={
        201: openapi.Response(
            description='Rendez-vous créé avec succès',
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'appointment_id': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_UUID),
                    'scheduled': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATETIME),
                    'type': openapi.Schema(type=openapi.TYPE_STRING),
                    'type_display': openapi.Schema(type=openapi.TYPE_STRING),
                    'patient_id': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_UUID),
                    'professional_id': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_UUID),
                    'created_at': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATETIME),
                    'updated_at': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATETIME)
                }
            )
        ),
        400: openapi.Response(description='Données invalides'),
        403: openapi.Response(description='Accès non autorisé')
    },
    tags=['Appointments']
)

get_appointment_decorator = swagger_auto_schema(
    methods=['GET'],
    operation_id="get_appointment",
    operation_summary="Récupérer un rendez-vous",
    operation_description="Récupère les détails d'un rendez-vous spécifique",
    responses={
        200: openapi.Response(
            description='Détails du rendez-vous',
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'appointment_id': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_UUID),
                    'scheduled': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATETIME),
                    'type': openapi.Schema(type=openapi.TYPE_STRING, enum=['consultation', 'suivi', 'examen']),
                    'type_display': openapi.Schema(type=openapi.TYPE_STRING),
                    'patient_id': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_UUID),
                    'professional_id': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_UUID),
                    'created_at': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATETIME),
                    'updated_at': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATETIME)
                }
            )
        ),
        403: openapi.Response(description='Accès non autorisé'),
        404: openapi.Response(description='Rendez-vous non trouvé')
    },
    tags=['Appointments']
)

update_appointment_decorator = swagger_auto_schema(
    methods=['PUT', 'PATCH'],
    operation_id="update_appointment",
    operation_summary="Modifier un rendez-vous",
    operation_description="""
    Modifie un rendez-vous existant.
    
    **PUT** : Remplacement complet des données
    **PATCH** : Modification partielle
    """,
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            'scheduled': openapi.Schema(
                type=openapi.TYPE_STRING,
                format=openapi.FORMAT_DATETIME,
                description='Date et heure du rendez-vous',
                example='2025-08-01T15:00:00Z'
            ),
            'type': openapi.Schema(
                type=openapi.TYPE_STRING,
                enum=['consultation', 'suivi', 'examen'],
                description='Type de rendez-vous',
                example='suivi'
            )
        }
    ),
    responses={
        200: openapi.Response(
            description='Rendez-vous modifié avec succès',
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'appointment_id': openapi.Schema(type=openapi.TYPE_STRING),
                    'scheduled': openapi.Schema(type=openapi.TYPE_STRING),
                    'type': openapi.Schema(type=openapi.TYPE_STRING),
                    'type_display': openapi.Schema(type=openapi.TYPE_STRING),
                    'patient_id': openapi.Schema(type=openapi.TYPE_STRING),
                    'professional_id': openapi.Schema(type=openapi.TYPE_STRING),
                    'updated_at': openapi.Schema(type=openapi.TYPE_STRING)
                }
            )
        ),
        400: openapi.Response(description='Données invalides'),
        403: openapi.Response(description='Accès non autorisé'),
        404: openapi.Response(description='Rendez-vous non trouvé')
    },
    tags=['Appointments']
)

delete_appointment_decorator = swagger_auto_schema(
    methods=['DELETE'],
    operation_id="delete_appointment",
    operation_summary="Supprimer un rendez-vous",
    operation_description="Supprime un rendez-vous existant",
    responses={
        204: openapi.Response(description='Rendez-vous supprimé avec succès'),
        403: openapi.Response(description='Accès non autorisé'),
        404: openapi.Response(description='Rendez-vous non trouvé')
    },
    tags=['Appointments']
)

upcoming_appointments_decorator = swagger_auto_schema(
    methods=['GET'],
    operation_id="upcoming_appointments",
    operation_summary="Rendez-vous à venir",
    operation_description="Récupère les rendez-vous programmés dans le futur",
    responses={
        200: openapi.Response(
            description='Rendez-vous à venir',
            schema=openapi.Schema(
                type=openapi.TYPE_ARRAY,
                items=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'appointment_id': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_UUID),
                        'scheduled': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATETIME),
                        'type': openapi.Schema(type=openapi.TYPE_STRING),
                        'type_display': openapi.Schema(type=openapi.TYPE_STRING),
                        'patient_id': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_UUID),
                        'professional_id': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_UUID)
                    }
                )
            )
        ),
        403: openapi.Response(description='Accès non autorisé')
    },
    tags=['Appointments']
)

today_appointments_decorator = swagger_auto_schema(
    methods=['GET'],
    operation_id="today_appointments",
    operation_summary="Rendez-vous du jour",
    operation_description="Récupère les rendez-vous programmés pour aujourd'hui",
    responses={
        200: openapi.Response(
            description='Rendez-vous du jour',
            schema=openapi.Schema(
                type=openapi.TYPE_ARRAY,
                items=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'appointment_id': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_UUID),
                        'scheduled': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATETIME),
                        'type': openapi.Schema(type=openapi.TYPE_STRING),
                        'type_display': openapi.Schema(type=openapi.TYPE_STRING),
                        'patient_id': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_UUID),
                        'professional_id': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_UUID)
                    }
                )
            )
        ),
        403: openapi.Response(description='Accès non autorisé')
    },
    tags=['Appointments']
)

# ========== PRESCRIPTION DECORATORS ==========

# Schéma pour les prescriptions (basé sur le modèle feedback-service)
prescription_schema = {
    "type": "object",
    "properties": {
        "prescription_id": {
            "type": "string",
            "format": "uuid",
            "description": "ID unique de la prescription",
            "example": "12345678-1234-1234-1234-123456789012"
        },
        "appointment_id": {
            "type": "string",
            "format": "uuid",
            "description": "ID du rendez-vous associé",
            "example": "98765432-8765-4321-1234-567890abcdef"
        },
        "general_notes": {
            "type": "string",
            "description": "Notes générales de la prescription",
            "example": "Traitement pour infection respiratoire. Surveillance nécessaire."
        },
        "medications": {
            "type": "array",
            "description": "Liste des médicaments prescrits",
            "items": {
                "type": "object",
                "properties": {
                    "prescription_medication_id": {
                        "type": "string",
                        "format": "uuid",
                        "description": "ID unique de la prescription médicament"
                    },
                    "medication_name": {
                        "type": "string",
                        "description": "Nom du médicament",
                        "example": "Paracétamol"
                    },
                    "medication_dosage": {
                        "type": "string",
                        "description": "Dosage du médicament",
                        "example": "500mg"
                    },
                    "frequency": {
                        "type": "number",
                        "format": "float",
                        "description": "Fréquence par jour",
                        "example": 3.0
                    },
                    "start_date": {
                        "type": "string",
                        "format": "date",
                        "description": "Date de début du traitement",
                        "example": "2025-08-01"
                    },
                    "end_date": {
                        "type": "string",
                        "format": "date",
                        "description": "Date de fin du traitement",
                        "example": "2025-08-08"
                    },
                    "instructions": {
                        "type": "string",
                        "description": "Instructions spécifiques pour ce médicament",
                        "example": "À prendre après les repas"
                    }
                }
            }
        },
        "created_at": {
            "type": "string",
            "format": "date-time",
            "description": "Date de création",
            "example": "2025-07-30T10:00:00Z"
        },
        "updated_at": {
            "type": "string",
            "format": "date-time",
            "description": "Date de dernière modification",
            "example": "2025-07-30T10:00:00Z"
        }
    }
}

# Schéma pour la création de médicaments dans une prescription
prescription_medication_create_schema = {
    "type": "object",
    "required": ["medication_id", "frequency", "start_date", "end_date"],
    "properties": {
        "medication_id": {
            "type": "string",
            "format": "uuid",
            "description": "ID du médicament (référence vers Medication)",
            "example": "11111111-1111-1111-1111-111111111111"
        },
        "frequency": {
            "type": "number",
            "format": "float",
            "description": "Fréquence par jour (ex: 2.5 pour 2.5 fois par jour)",
            "example": 3.0
        },
        "start_date": {
            "type": "string",
            "format": "date",
            "description": "Date de début du traitement",
            "example": "2025-08-01"
        },
        "end_date": {
            "type": "string",
            "format": "date",
            "description": "Date de fin du traitement",
            "example": "2025-08-08"
        },
        "instructions": {
            "type": "string",
            "description": "Instructions spécifiques pour ce médicament",
            "example": "À prendre après les repas avec un grand verre d'eau"
        }
    }
}

list_prescriptions_decorator = swagger_auto_schema(
    methods=['GET'],
    operation_id="list_prescriptions",
    operation_summary="Lister les prescriptions",
    operation_description="""
    Récupère la liste des prescriptions selon le type d'utilisateur:
    - **Patients** : prescriptions liées à leurs rendez-vous
    - **Professionnels** : toutes les prescriptions qu'ils ont créées
    
    **Filtres disponibles :**
    - appointment_id : Filtrer par rendez-vous spécifique
    """,
    manual_parameters=[
        openapi.Parameter(
            'appointment_id',
            openapi.IN_QUERY,
            description="Filtrer par ID de rendez-vous",
            type=openapi.TYPE_STRING,
            format=openapi.FORMAT_UUID
        )
    ],
    responses={
        200: openapi.Response(
            description='Liste des prescriptions',
            schema=openapi.Schema(
                type=openapi.TYPE_ARRAY,
                items=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'prescription_id': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_UUID),
                        'appointment_id': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_UUID),
                        'general_notes': openapi.Schema(type=openapi.TYPE_STRING),
                        'medications': openapi.Schema(
                            type=openapi.TYPE_ARRAY,
                            items=openapi.Schema(
                                type=openapi.TYPE_OBJECT,
                                properties={
                                    'prescription_medication_id': openapi.Schema(type=openapi.TYPE_STRING),
                                    'medication_name': openapi.Schema(type=openapi.TYPE_STRING),
                                    'medication_dosage': openapi.Schema(type=openapi.TYPE_STRING),
                                    'frequency': openapi.Schema(type=openapi.TYPE_NUMBER),
                                    'start_date': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATE),
                                    'end_date': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATE),
                                    'instructions': openapi.Schema(type=openapi.TYPE_STRING)
                                }
                            )
                        ),
                        'created_at': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATETIME),
                        'updated_at': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATETIME)
                    }
                )
            )
        ),
        403: openapi.Response(description='Accès non autorisé')
    },
    tags=['Prescriptions']
)

create_prescription_decorator = swagger_auto_schema(
    methods=['POST'],
    operation_id="create_prescription",
    operation_summary="Créer une prescription",
    operation_description="""
    Crée une nouvelle prescription liée à un rendez-vous (réservé aux professionnels de santé).
    
    **Processus :**
    1. La prescription est créée et liée à un appointment_id
    2. Les médicaments sont ajoutés avec leurs détails de posologie
    3. Le professional_id est automatiquement assigné depuis l'authentification
    """,
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=['appointment_id', 'medications'],
        properties={
            'appointment_id': openapi.Schema(
                type=openapi.TYPE_STRING,
                format=openapi.FORMAT_UUID,
                description='ID du rendez-vous associé',
                example='98765432-8765-4321-1234-567890abcdef'
            ),
            'general_notes': openapi.Schema(
                type=openapi.TYPE_STRING,
                description='Notes générales de la prescription',
                example='Traitement pour infection respiratoire. Surveillance nécessaire.'
            ),
            'medications': openapi.Schema(
                type=openapi.TYPE_ARRAY,
                items=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    required=['medication_id', 'frequency', 'start_date', 'end_date'],
                    properties={
                        'medication_id': openapi.Schema(
                            type=openapi.TYPE_STRING,
                            format=openapi.FORMAT_UUID,
                            description='ID du médicament (référence vers Medication)',
                            example='11111111-1111-1111-1111-111111111111'
                        ),
                        'frequency': openapi.Schema(
                            type=openapi.TYPE_NUMBER,
                            format='float',
                            description='Fréquence par jour',
                            example=3.0
                        ),
                        'start_date': openapi.Schema(
                            type=openapi.TYPE_STRING,
                            format=openapi.FORMAT_DATE,
                            description='Date de début du traitement',
                            example='2025-08-01'
                        ),
                        'end_date': openapi.Schema(
                            type=openapi.TYPE_STRING,
                            format=openapi.FORMAT_DATE,
                            description='Date de fin du traitement',
                            example='2025-08-08'
                        ),
                        'instructions': openapi.Schema(
                            type=openapi.TYPE_STRING,
                            description='Instructions spécifiques pour ce médicament',
                            example='À prendre après les repas avec un grand verre d\'eau'
                        )
                    }
                ),
                description='Liste des médicaments à prescrire'
            )
        }
    ),
    responses={
        201: openapi.Response(
            description='Prescription créée avec succès',
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'message': openapi.Schema(type=openapi.TYPE_STRING, example='Prescription créée avec succès'),
                    'prescription': openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        properties={
                            'prescription_id': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_UUID),
                            'appointment_id': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_UUID),
                            'general_notes': openapi.Schema(type=openapi.TYPE_STRING),
                            'created_at': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATETIME)
                        }
                    )
                }
            )
        ),
        400: openapi.Response(description='Données invalides'),
        403: openapi.Response(description='Accès réservé aux professionnels de santé')
    },
    tags=['Prescriptions']
)

get_prescription_decorator = swagger_auto_schema(
    methods=['GET'],
    operation_id="get_prescription",
    operation_summary="Récupérer une prescription",
    operation_description="Récupère une prescription spécifique avec tous ses médicaments",
    responses={
        200: openapi.Response(
            description='Détails de la prescription',
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'prescription_id': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_UUID),
                    'appointment_id': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_UUID),
                    'general_notes': openapi.Schema(type=openapi.TYPE_STRING),
                    'medications': openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Schema(
                            type=openapi.TYPE_OBJECT,
                            properties={
                                'prescription_medication_id': openapi.Schema(type=openapi.TYPE_STRING),
                                'medication_name': openapi.Schema(type=openapi.TYPE_STRING),
                                'medication_dosage': openapi.Schema(type=openapi.TYPE_STRING),
                                'frequency': openapi.Schema(type=openapi.TYPE_NUMBER),
                                'start_date': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATE),
                                'end_date': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATE),
                                'instructions': openapi.Schema(type=openapi.TYPE_STRING)
                            }
                        )
                    ),
                    'created_at': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATETIME),
                    'updated_at': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATETIME)
                }
            )
        ),
        403: openapi.Response(description='Accès non autorisé'),
        404: openapi.Response(description='Prescription non trouvée')
    },
    tags=['Prescriptions']
)

update_prescription_decorator = swagger_auto_schema(
    methods=['PUT', 'PATCH'],
    operation_id="update_prescription",
    operation_summary="Modifier une prescription",
    operation_description="""
    Modifie une prescription existante (réservé aux professionnels de santé).
    
    **PUT** : Remplacement complet
    **PATCH** : Modification partielle
    """,
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            'general_notes': openapi.Schema(
                type=openapi.TYPE_STRING,
                description='Notes générales mises à jour',
                example='Traitement modifié suite à amélioration de l\'état du patient'
            ),
            'medications': openapi.Schema(
                type=openapi.TYPE_ARRAY,
                items=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'medication_id': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_UUID),
                        'frequency': openapi.Schema(type=openapi.TYPE_NUMBER, format='float'),
                        'start_date': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATE),
                        'end_date': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATE),
                        'instructions': openapi.Schema(type=openapi.TYPE_STRING)
                    }
                ),
                description='Liste des médicaments mis à jour'
            )
        }
    ),
    responses={
        200: openapi.Response(
            description='Prescription modifiée avec succès',
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'message': openapi.Schema(type=openapi.TYPE_STRING),
                    'prescription': openapi.Schema(type=openapi.TYPE_OBJECT)
                }
            )
        ),
        400: openapi.Response(description='Données invalides'),
        403: openapi.Response(description='Accès réservé aux professionnels de santé'),
        404: openapi.Response(description='Prescription non trouvée')
    },
    tags=['Prescriptions']
)

delete_prescription_decorator = swagger_auto_schema(
    methods=['DELETE'],
    operation_id="delete_prescription",
    operation_summary="Supprimer une prescription",
    operation_description="Supprime une prescription et tous ses médicaments associés (réservé aux professionnels de santé)", 
    responses={
        204: openapi.Response(description='Prescription supprimée avec succès'),
        403: openapi.Response(description='Accès réservé aux professionnels de santé'),
        404: openapi.Response(description='Prescription non trouvée')
    },
    tags=['Prescriptions']
)