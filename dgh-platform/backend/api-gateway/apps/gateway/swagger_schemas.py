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