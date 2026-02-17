from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True
    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Organization',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(max_length=255)),
                ('plan', models.CharField(blank=True, default='', max_length=100)),
                ('commission_rate', models.DecimalField(decimal_places=2, default=0, help_text='Commission rate as percentage (e.g. 10.00 for 10%)', max_digits=5)),
                ('is_active', models.BooleanField(default=True)),
                ('is_deleted', models.BooleanField(default=False)),
                ('deleted_at', models.DateTimeField(blank=True, null=True)),
            ],
            options={
                'db_table': 'organizations_organization',
                'ordering': ['name'],
                'verbose_name': 'Organization',
                'verbose_name_plural': 'Organizations',
            },
        ),
    ]
