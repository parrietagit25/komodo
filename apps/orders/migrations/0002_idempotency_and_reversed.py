# Generated for idempotency and reversal safety

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='idempotency_key',
            field=models.CharField(
                blank=True,
                db_index=True,
                help_text='Client-generated key to prevent duplicate charges (e.g. UUID).',
                max_length=100,
                null=True,
                unique=True,
            ),
        ),
        migrations.AddField(
            model_name='order',
            name='is_reversed',
            field=models.BooleanField(
                default=False,
                help_text='True when this order has been financially reversed (e.g. COMPLETED -> CANCELLED).',
            ),
        ),
    ]
