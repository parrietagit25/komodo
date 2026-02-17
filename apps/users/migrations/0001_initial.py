from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True
    run_before = [
        ('admin', '0001_initial'),
    ]
    dependencies = [
        ('auth', '0001_initial'),
        ('core', '0001_initial'),
        ('organizations', '0001_initial'),
        ('events', '0001_initial'),
        ('stands', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='User',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('is_superuser', models.BooleanField(default=False, verbose_name='superuser status')),
                ('username', models.CharField(max_length=150, unique=True)),
                ('first_name', models.CharField(blank=True, max_length=150)),
                ('last_name', models.CharField(blank=True, max_length=150)),
                ('email', models.EmailField(blank=True, max_length=254)),
                ('is_staff', models.BooleanField(default=False)),
                ('is_active', models.BooleanField(default=True)),
                ('date_joined', models.DateTimeField(auto_now_add=True)),
                ('role', models.CharField(choices=[('SUPERADMIN', 'Super Admin'), ('EVENT_ADMIN', 'Event Admin'), ('STAND_ADMIN', 'Stand Admin'), ('USER', 'User')], default='USER', max_length=20)),
                ('status', models.CharField(choices=[('PENDING', 'Pending'), ('ACTIVE', 'Active'), ('SUSPENDED', 'Suspended'), ('DELETED', 'Deleted')], default='PENDING', max_length=20)),
                ('is_deleted', models.BooleanField(default=False)),
                ('deleted_at', models.DateTimeField(blank=True, null=True)),
                ('event', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='users', to='events.event')),
                ('organization', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='users', to='organizations.organization')),
                ('stand', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='users', to='stands.stand')),
                ('groups', models.ManyToManyField(blank=True, related_name='user_set', to='auth.group')),
                ('user_permissions', models.ManyToManyField(blank=True, related_name='user_set', to='auth.permission')),
            ],
            options={
                'db_table': 'users_user',
                'verbose_name': 'User',
                'verbose_name_plural': 'Users',
            },
        ),
    ]
