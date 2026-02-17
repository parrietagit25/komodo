# Generated for entity ownership (owner limited to STAND_ADMIN in serializer)

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
        ('stands', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='stand',
            name='owner',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='owned_stands',
                to='users.user',
            ),
        ),
    ]
