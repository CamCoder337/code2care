"""
Migration pour créer des départements d'hôpital par défaut
"""
from django.db import migrations
import uuid


def create_default_departments(apps, schema_editor):
    """Crée les départements d'hôpital par défaut"""
    Department = apps.get_model('feedback', 'Department')
    
    departments = [
        {
            'department_id': '11111111-1111-1111-1111-111111111111',
            'name': 'Accueil et Admission',
            'description': 'Service d\'accueil des patients, admission et orientation'
        },
        {
            'department_id': '22222222-2222-2222-2222-222222222222',
            'name': 'Urgences',
            'description': 'Service des urgences médicales et traumatologiques'
        },
        {
            'department_id': '33333333-3333-3333-3333-333333333333',
            'name': 'Cardiologie',
            'description': 'Service de cardiologie et chirurgie cardiovasculaire'
        },
        {
            'department_id': '44444444-4444-4444-4444-444444444444',
            'name': 'Pédiatrie',
            'description': 'Service de pédiatrie et soins aux enfants'
        },
        {
            'department_id': '55555555-5555-5555-5555-555555555555',
            'name': 'Gynécologie-Obstétrique',
            'description': 'Service de gynécologie, obstétrique et maternité'
        },
        {
            'department_id': '66666666-6666-6666-6666-666666666666',
            'name': 'Chirurgie Générale',
            'description': 'Service de chirurgie générale et spécialisée'
        },
        {
            'department_id': '77777777-7777-7777-7777-777777777777',
            'name': 'Médecine Interne',
            'description': 'Service de médecine interne et pathologies générales'
        },
        {
            'department_id': '88888888-8888-8888-8888-888888888888',
            'name': 'Radiologie',
            'description': 'Service d\'imagerie médicale et radiologie'
        },
        {
            'department_id': '99999999-9999-9999-9999-999999999999',
            'name': 'Laboratoire',
            'description': 'Laboratoire d\'analyses médicales et biologie'
        },
        {
            'department_id': 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            'name': 'Pharmacie',
            'description': 'Pharmacie hospitalière et distribution médicaments'
        },
        {
            'department_id': 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
            'name': 'Kinésithérapie',
            'description': 'Service de kinésithérapie et rééducation'
        },
        {
            'department_id': 'cccccccc-cccc-cccc-cccc-cccccccccccc',
            'name': 'Psychiatrie',
            'description': 'Service de psychiatrie et santé mentale'
        },
        {
            'department_id': 'dddddddd-dddd-dddd-dddd-dddddddddddd',
            'name': 'Ophtalmologie',
            'description': 'Service d\'ophtalmologie et soins oculaires'
        },
        {
            'department_id': 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
            'name': 'ORL',
            'description': 'Service d\'oto-rhino-laryngologie'
        },
        {
            'department_id': 'ffffffff-ffff-ffff-ffff-ffffffffffff',
            'name': 'Néphrologie',
            'description': 'Service de néphrologie et dialyse'
        }
    ]
    
    for dept_data in departments:
        Department.objects.get_or_create(
            department_id=dept_data['department_id'],
            defaults={
                'name': dept_data['name'],
                'description': dept_data['description'],
                'is_active': True
            }
        )
        print(f"Département créé: {dept_data['name']}")


def remove_default_departments(apps, schema_editor):
    """Supprime les départements par défaut (rollback)"""
    Department = apps.get_model('feedback', 'Department')
    
    default_uuids = [
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222',
        '33333333-3333-3333-3333-333333333333',
        '44444444-4444-4444-4444-444444444444',
        '55555555-5555-5555-5555-555555555555',
        '66666666-6666-6666-6666-666666666666',
        '77777777-7777-7777-7777-777777777777',
        '88888888-8888-8888-8888-888888888888',
        '99999999-9999-9999-9999-999999999999',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        'ffffffff-ffff-ffff-ffff-ffffffffffff'
    ]
    
    Department.objects.filter(department_id__in=default_uuids).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('feedback', '0002_create_admin_user'),
    ]

    operations = [
        migrations.RunPython(create_default_departments, remove_default_departments),
    ]