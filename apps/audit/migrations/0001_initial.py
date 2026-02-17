from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True
    dependencies = [
        ('orders', '0001_initial'),
        ('organizations', '0001_initial'),
        ('stands', '0001_initial'),
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='FinancialAuditLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('total_amount', models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ('commission_amount', models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ('net_amount', models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('order', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='financial_audit_log', to='orders.order')),
                ('organization', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='financial_audit_logs', to='organizations.organization')),
                ('stand', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='financial_audit_logs', to='stands.stand')),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='financial_audit_logs', to='users.user')),
            ],
            options={
                'db_table': 'audit_financialauditlog',
                'ordering': ['-created_at'],
                'verbose_name': 'Financial Audit Log',
                'verbose_name_plural': 'Financial Audit Logs',
            },
        ),
    ]
