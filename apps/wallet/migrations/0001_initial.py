from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True
    dependencies = [
        ('core', '0001_initial'),
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Wallet',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('balance', models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ('currency', models.CharField(default='USD', max_length=3)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='wallet', to='users.user')),
            ],
            options={
                'db_table': 'wallet_wallet',
                'verbose_name': 'Wallet',
                'verbose_name_plural': 'Wallets',
            },
        ),
    ]
