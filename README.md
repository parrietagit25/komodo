# Komodo API

Django REST API multi-tenant con JWT, roles y módulos: Organizations, Events, Stands, Products, Orders, Wallet.

## Stack

- Django 4.2 + Django REST Framework
- PostgreSQL
- Simple JWT
- Docker

## Estructura de apps

```
apps/
  core/           # Mixins (TimeStamped, SoftDelete), permisos por rol
  users/          # User custom, JWT auth, profile
  organizations/  # CRUD Organización (SuperAdmin)
  events/         # CRUD Evento (EventAdmin + SuperAdmin)
  stands/         # CRUD Stand + Product (EventAdmin)
  orders/         # CRUD Order (por rol)
  wallet/         # Wallet por usuario (lectura)
```

## Roles

- **SUPERADMIN**: Organizaciones y todo.
- **EVENT_ADMIN**: Eventos de su organización, stands y productos.
- **STAND_ADMIN**: Órdenes de su stand.
- **USER**: Órdenes propias, wallet, perfil.

## Cómo ejecutar

### Local (PostgreSQL en host)

```bash
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
# Crear DB y usuario PostgreSQL, luego:
set POSTGRES_PASSWORD=komodo
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Con Docker

```bash
docker-compose up --build
# Migraciones y servidor se ejecutan en el contenedor web.
# Crear superusuario: docker-compose exec web python manage.py createsuperuser
```

## Variables de entorno

Ver `.env.example`. En Docker, `POSTGRES_*` y `DJANGO_SECRET_KEY` se pueden definir en `.env` o en el host.

## Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/token/` | Login (JWT) |
| POST | `/api/auth/token/refresh/` | Refresh token |
| GET/PATCH | `/api/auth/profile/` | Perfil del usuario |
| CRUD | `/api/organizations/` | Organizaciones (SuperAdmin) |
| CRUD | `/api/events/` | Eventos |
| CRUD | `/api/stands/` | Stands |
| CRUD | `/api/stands/products/` | Productos |
| CRUD | `/api/orders/` | Pedidos |
| GET | `/api/wallet/` | Mi wallet |
| - | `/admin/` | Admin Django |

## Soft delete

- **Organizations**: usar `POST /api/organizations/{id}/soft_delete/` y `.../restore/`.
- **Users**: lógica en modelo (`User.soft_delete()`); exponer vía admin o endpoint según necesidad.
