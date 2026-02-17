# Cómo ejecutar Komodo (Backend + Frontend)

## Resumen rápido

- **Backend (API):** Django + PostgreSQL. Puedes usar **Docker** o **Python local**.
- **Frontend:** React + Vite. Se ejecuta con **npm** en tu máquina (no hay contenedor para el frontend).

---

## Opción 1: Todo con Docker (solo backend) + Frontend en local

### 1. Levantar la API y la base de datos

Abre una terminal en la carpeta del proyecto (donde está `docker-compose.yml`):

```bash
cd c:\Users\ADMIN\Desktop\komodo
docker-compose up --build
```

Esto inicia:
- **PostgreSQL** en el puerto `5432`
- **Django** (migraciones + servidor) en `http://localhost:8000`

La primera vez puede tardar un poco (build de la imagen).

### 2. Crear un usuario administrador (solo la primera vez)

En **otra terminal**:

```bash
cd c:\Users\ADMIN\Desktop\komodo
docker-compose exec web python manage.py createsuperuser
```

Te pedirá username, email y contraseña. Ese usuario puede tener rol **Superadmin** si lo asignas en el admin de Django después.

Para que ese usuario sea Superadmin y pueda hacer login en el frontend:
- Entra en `http://localhost:8000/admin/`
- Inicia sesión con el superuser
- En **Users** → elige tu usuario → en **Komodo** pon **Role** = **Super Admin** y **Status** = **Active** → Guardar

### 3. Levantar el frontend

En **otra terminal**:

```bash
cd c:\Users\ADMIN\Desktop\komodo\komodo_frontend
npm install
npm run dev
```

Abre el navegador en **http://localhost:5173**. Inicia sesión con el usuario que creaste (username + contraseña). La API está en `http://localhost:8000` por defecto.

---

## Opción 2: Sin Docker (todo en local)

Necesitas tener instalado **Python 3.11+**, **Node.js** y **PostgreSQL**.

### 1. Base de datos PostgreSQL

Crea una base de datos y un usuario, por ejemplo:

- Base de datos: `komodo_db`
- Usuario: `komodo`
- Contraseña: `komodo`

(O usa tu propio usuario/DB y ajusta las variables abajo.)

### 2. Backend (API)

```bash
cd c:\Users\ADMIN\Desktop\komodo
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
set POSTGRES_HOST=localhost
set POSTGRES_USER=komodo
set POSTGRES_PASSWORD=komodo
set POSTGRES_DB=komodo_db
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

La API queda en **http://localhost:8000**.

### 3. Frontend

En otra terminal:

```bash
cd c:\Users\ADMIN\Desktop\komodo\komodo_frontend
npm install
npm run dev
```

Frontend en **http://localhost:5173**.

---

## Variables de entorno útiles

### Backend (Django)

| Variable | Uso |
|--------|-----|
| `POSTGRES_HOST` | Donde corre PostgreSQL (`localhost` o `db` en Docker) |
| `POSTGRES_USER` | Usuario de PostgreSQL |
| `POSTGRES_PASSWORD` | Contraseña de PostgreSQL |
| `POSTGRES_DB` | Nombre de la base de datos |
| `DJANGO_SECRET_KEY` | Clave secreta (cambiar en producción) |

### Frontend (Vite)

Crea `komodo_frontend\.env` si la API no está en localhost:8000:

```env
VITE_API_URL=http://localhost:8000/api
```

Si la API está en otro equipo o puerto, cambia la URL.

---

## Comandos que usarás a menudo

| Acción | Comando |
|--------|--------|
| Levantar API + DB (Docker) | `docker-compose up --build` (desde `komodo`) |
| Parar Docker | `docker-compose down` |
| Crear superuser | `docker-compose exec web python manage.py createsuperuser` |
| Migraciones (Docker) | `docker-compose exec web python manage.py migrate` |
| Ejecutar tests (Docker) | `docker-compose exec web python manage.py test apps.orders apps.wallet apps.audit` |
| Levantar frontend | `cd komodo_frontend` → `npm run dev` |
| Build frontend para producción | `cd komodo_frontend` → `npm run build` |

**Nota:** Al hacer `docker-compose up --build`, el servicio `web` ya ejecuta `migrate --noinput` al arrancar, así que las migraciones nuevas se aplican solas. Si quieres lanzarlas a mano: `docker-compose exec web python manage.py migrate`.

---

## Resumen de puertos

- **5173** → Frontend (Vite)
- **8000** → API (Django)
- **5432** → PostgreSQL (solo si usas Docker y quieres conectarte desde fuera)

Si algo no arranca, revisa que no tengas otro programa usando esos puertos.
