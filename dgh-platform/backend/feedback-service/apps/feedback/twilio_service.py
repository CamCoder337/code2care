"""
Service Twilio pour l'envoi de SMS et d'appels vocaux de rappels médicamenteux
"""
from twilio.rest import Client
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def get_twilio_client():
    """Initialise et retourne le client Twilio"""
    try:
        account_sid = settings.TWILIO_ACCOUNT_SID
        auth_token = settings.TWILIO_AUTH_TOKEN
        
        if not account_sid or not auth_token:
            logger.error("Credentials Twilio manquants dans les settings")
            return None
            
        return Client(account_sid, auth_token)
    except Exception as e:
        logger.error(f"Erreur lors de l'initialisation du client Twilio: {e}")
        return None


def format_sms_reminder(medication_name: str, dosage: str, instructions: str, language: str = 'fr') -> str:
    """
    Formate un message SMS de rappel médicamenteux
    Limité à 160 caractères pour optimiser les coûts
    """
    if language == 'en':
        message = f"💊 REMINDER: {medication_name} {dosage}. {instructions[:40]}... - DGH"
    else:  # français par défaut
        message = f"💊 RAPPEL: {medication_name} {dosage}. {instructions[:40]}... - DGH"
    
    # Limiter à 160 caractères
    return message[:160]


def format_voice_reminder(medication_name: str, dosage: str, instructions: str, language: str = 'fr') -> str:
    """
    Formate un message vocal de rappel médicamenteux
    Plus détaillé que les SMS
    """
    if language == 'en':
        message = f"""Hello. This is a medication reminder from DGH Platform. 
        Please take your {medication_name}, {dosage}. 
        Instructions: {instructions}. 
        Thank you and take care."""
    else:  # français par défaut
        message = f"""Bonjour. Ceci est un rappel médicamenteux de la plateforme DGH. 
        Veuillez prendre votre {medication_name}, {dosage}. 
        Instructions: {instructions}. 
        Merci et prenez soin de vous."""
    
    return message


def send_sms_reminder(phone_number: str, message: str, language: str = 'fr') -> dict:
    """
    Envoie un SMS de rappel via Twilio
    
    Args:
        phone_number: Numéro de téléphone au format international
        message: Message à envoyer
        language: Langue du message
        
    Returns:
        dict: Résultat de l'envoi avec statut et SID Twilio
    """
    try:
        client = get_twilio_client()
        if not client:
            return {
                'success': False,
                'error_message': 'Client Twilio non disponible'
            }
        
        from_number = settings.TWILIO_PHONE_NUMBER
        if not from_number:
            return {
                'success': False,
                'error_message': 'Numéro Twilio non configuré'
            }
        
        # Envoi du SMS
        twilio_message = client.messages.create(
            body=message,
            from_=from_number,
            to=phone_number
        )
        
        logger.info(f"SMS envoyé avec succès à {phone_number}, SID: {twilio_message.sid}")
        
        return {
            'success': True,
            'twilio_sid': twilio_message.sid,
            'status': twilio_message.status,
            'message': 'SMS envoyé avec succès'
        }
        
    except Exception as e:
        error_msg = f"Erreur Twilio lors de l'envoi SMS à {phone_number}:\n{str(e)}"
        logger.error(error_msg)
        
        return {
            'success': False,
            'error_message': f"Échec de l'envoi SMS",
            'twilio_error': str(e)
        }


def send_voice_reminder(phone_number: str, message: str, language: str = 'fr') -> dict:
    """
    Effectue un appel vocal de rappel via Twilio
    
    Args:
        phone_number: Numéro de téléphone au format international
        message: Message vocal à synthétiser
        language: Langue du message (fr ou en)
        
    Returns:
        dict: Résultat de l'appel avec statut et SID Twilio
    """
    try:
        client = get_twilio_client()
        if not client:
            return {
                'success': False,
                'error_message': 'Client Twilio non disponible'
            }
        
        from_number = settings.TWILIO_PHONE_NUMBER
        if not from_number:
            return {
                'success': False,
                'error_message': 'Numéro Twilio non configuré'
            }
        
        # Configuration de la voix selon la langue
        voice_config = {
            'fr': 'alice',  # Voix française
            'en': 'alice'   # Voix anglaise
        }
        
        # URL TwiML pour la synthèse vocale
        twiml_url = f"http://twimlets.com/message?Message={message.replace(' ', '%20')}"
        
        # Effectuer l'appel
        call = client.calls.create(
            to=phone_number,
            from_=from_number,
            url=twiml_url,
            method='GET'
        )
        
        logger.info(f"Appel vocal initié vers {phone_number}, SID: {call.sid}")
        
        return {
            'success': True,
            'twilio_sid': call.sid,
            'status': call.status,
            'message': 'Appel vocal initié avec succès'
        }
        
    except Exception as e:
        error_msg = f"Erreur Twilio lors de l'appel vocal à {phone_number}:\n{str(e)}"
        logger.error(error_msg)
        
        return {
            'success': False,
            'error_message': f"Échec de l'appel vocal",
            'twilio_error': str(e)
        }


def get_message_status(twilio_sid: str) -> dict:
    """
    Récupère le statut d'un message/appel Twilio
    
    Args:
        twilio_sid: SID du message ou appel Twilio
        
    Returns:
        dict: Statut du message/appel
    """
    try:
        client = get_twilio_client()
        if not client:
            return {
                'success': False,
                'error_message': 'Client Twilio non disponible'
            }
        
        # Essayer d'abord comme message SMS
        try:
            message = client.messages(twilio_sid).fetch()
            return {
                'success': True,
                'status': message.status,
                'error_code': message.error_code,
                'error_message': message.error_message
            }
        except:
            # Si ce n'est pas un message, essayer comme appel
            call = client.calls(twilio_sid).fetch()
            return {
                'success': True,
                'status': call.status,
                'duration': call.duration
            }
            
    except Exception as e:
        logger.error(f"Erreur lors de la récupération du statut Twilio {twilio_sid}: {e}")
        return {
            'success': False,
            'error_message': str(e)
        }