# Add indexes on Transaction for wallet/order lookups

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('wallet', '0002_add_transaction'),
    ]

    operations = [
        migrations.AlterField(
            model_name='transaction',
            name='wallet',
            field=models.ForeignKey(
                db_index=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='transactions',
                to='wallet.wallet',
            ),
        ),
        migrations.AlterField(
            model_name='transaction',
            name='order',
            field=models.ForeignKey(
                blank=True,
                db_index=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='wallet_transactions',
                to='orders.order',
            ),
        ),
        migrations.AddIndex(
            model_name='transaction',
            index=models.Index(fields=['wallet', 'order'], name='wallet_tx_wallet_order'),
        ),
    ]
