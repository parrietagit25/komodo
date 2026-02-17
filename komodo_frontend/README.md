# Komodo Frontend

React + Vite PWA con tema oscuro neon, JWT y rutas por rol.

## Stack

- React 18 + Vite 5
- React Router 6
- Axios + Context API (auth)
- vite-plugin-pwa (manifest + service worker)

## Estructura

```
src/
  auth/          # Re-exports de auth (context + service)
  context/       # AuthContext
  services/      # api (axios), authService
  routes/        # Rutas, ProtectedRoute, role redirect
  pages/         # Login, dashboards por rol
  components/    # Card, Button
  layout/         # MainLayout, Sidebar
  theme/         # variables.css, glow.css
```

## Tema

- **Primary:** `#00FF88` (neon green)
- **Secondary:** `#FF3366` (neon pink)
- **Info:** `#00D4FF` (cyan)
- **Background:** `#0A0A0B`, cards `#141416`
- Variables CSS en `src/theme/variables.css`; efectos glow en `glow.css`.

## Rutas

| Ruta | Acceso |
|------|--------|
| `/login` | Solo invitados |
| `/superadmin/dashboard` | SUPERADMIN |
| `/eventadmin/dashboard` | EVENT_ADMIN |
| `/stand/dashboard` | STAND_ADMIN |
| `/user/home` | USER |

Tras login se redirige al dashboard según `user.role`.

## PWA

- Manifest y service worker generados por `vite-plugin-pwa`.
- Instalable; actualización automática (`autoUpdate`).
- Para iconos 192x192 y 512x512: añade `public/icon-192.png` y `public/icon-512.png` (PNG) para mejor instalación.

## Cómo ejecutar

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
npm run preview
```

Configura la API con `VITE_API_URL` (ver `.env.example`).
