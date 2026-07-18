# Smart Task Manager AI

Este proyecto es un gestor de tareas simple con:
- backend en `backend/` usando Node.js, Express y MySQL
- frontend en `frontend/` usando Next.js

## Qué hace

- maneja usuarios con registro y login
- guarda tareas personales y tareas de equipo
- permite crear equipos y gestionar roles
- usa IA opcionalmente para generar subtareas, priorizar tareas y hacer chat
- envía correos para recuperar contraseña y notificaciones de tareas

## Cómo correrlo

Primero instala en cada carpeta.

Backend:
```powershell
cd backend
npm install
npm run dev
```

Frontend:
```powershell
cd frontend
npm install
npm run dev
```

Luego abre el navegador en `http://localhost:3000` si todo está bien.

## Requisitos

- Node.js 18+ (en el repo se usa Node 24)
- MySQL corriendo
- Variables de entorno en `backend/.env`

## Variables importantes

En `backend/.env` necesitas estas:

- `PORT` = puerto del backend (por defecto 5000)
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` = datos de MySQL
- `JWT_SECRET` = clave para los tokens
- `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` = para mandar correos
- `GEMINI_API_KEY` = si no lo pones, la IA no funciona pero el servidor sí
- `FRONTEND_URL` = URL del frontend para permitir CORS

## Recuperar contraseña

Rutas principales:
- `POST /api/auth/recuperar` con `{ email }`
- `POST /api/auth/reset-password` con `{ email, codigo, nuevaPassword }`

El servidor crea la tabla de códigos de recuperación si no existe. Si da error, también puedes usar:
```powershell
node backend/scripts/create_recovery_table.js
```

## Notas rápidas

- Si no tienes `GEMINI_API_KEY`, el backend arranca igual.
- Si ves errores con tablas faltantes, revisa la base de datos o ejecuta el script de creación.
- El frontend y backend son independientes, pero se comunican por API.

## Ideas para mejorar

- agregar tests
- poner migraciones reales
- mejorar el diseño del frontend
- usar una base de datos mejor estructurada

Listo. Si quieres, lo dejo aún más corto o agrego un diagrama básico de rutas. 
