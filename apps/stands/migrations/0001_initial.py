from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True
    dependencies = [
        ('core', '0001_initial'),
        ('events', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Stand',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True, default='')),
                ('is_active', models.BooleanField(default=True)),
                ('event', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='stands', to='events.event')),
            ],
            options={
                'db_table': 'stands_stand',
                'ordering': ['name'],
                'verbose_name': 'Stand',
                'verbose_name_plural': 'Stands',
            },
        ),
        migrations.CreateModel(
            name='Product',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True, default='')),
                ('price', models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ('stock_quantity', models.PositiveIntegerField(default=0)),
                ('is_available', models.BooleanField(default=True)),
                ('stand', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='products', to='stands.stand')),
            ],
            options={
                'db_table': 'stands_product',
                'ordering': ['name'],
                'verbose_name': 'Product',
                'verbose_name_plural': 'Products',
            },
        ),
    ]
