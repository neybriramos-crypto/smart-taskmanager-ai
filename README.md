# Smart Task Manager AI

Pequeño gestor de tareas con API en `backend/` y frontend Next.js en `frontend/`.

**Rápido — Qué hay aquí**
- Backend: Node.js + Express + MySQL
- Frontend: Next.js (App Router)

## Requisitos
- Node.js 18+ (en el repo se usa Node 24 localmente)
- MySQL en ejecución
- Variables de entorno (ver sección "Variables de entorno")

## Ejecutar localmente

Backend

```powershell
cd backend
npm install
npm run dev    # usa nodemon
```

Frontend

```powershell
cd frontend
npm install
npm run dev    # Next dev server (3000 por defecto)
```

Si el puerto 3000 o 5000 están ocupados, Next/Express subirán en el siguiente puerto disponible.

## Variables de entorno importantes

- `PORT` (opcional) — puerto del backend (por defecto 5000)
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` — conexión MySQL
- `JWT_SECRET` — clave para JWT
- `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` — credenciales SMTP usadas por la funcionalidad de recuperación
- `GEMINI_API_KEY` — opcional; si no está definida, las funciones AI no se inicializan pero el servidor sigue arrancando
- `FRONTEND_URL` — URL del frontend para CORS (opcional)

Coloca estas variables en `backend/.env` (no comitear). Ya se añadió `.gitignore` para ignorarlo.

## Flujo de recuperación de contraseña

Endpoints principales:
- `POST /api/auth/recuperar` — solicitar código de recuperación por email
  - Body: `{ "email": "usuario@ejemplo.com" }`
- `POST /api/auth/reset-password` — restablecer contraseña
  - Body: `{ "email": "usuario@ejemplo.com", "codigo": "123456", "nuevaPassword": "nuevaClave" }`

El backend crea la tabla `codigos_recuperacion` automáticamente si no existe. También hay un script en `backend/scripts/create_recovery_table.js` para crearla manualmente.

## Base de datos

Crear la base de datos indicada en `DB_NAME` y las tablas de usuarios/tareas según tu esquema. Para desarrollo ya existen ejemplos en `backend/models/`.

## Limpieza de variables comprometidas en Git

Si `backend/.env` fue comiteado por error, ya lo he eliminado del índice en esta rama. Para aplicar lo mismo localmente:

```powershell
# Quitar del índice pero mantener el archivo local
git rm --cached backend/.env
git commit -m "chore: remove backend/.env from repo"
git push
```

## Notas y debugging

- Si el servidor Node falla en arranque por una dependencia opcional de AI, no debería ocurrir: la integración AI es opcional y el servidor sigue arrancando sin `GEMINI_API_KEY`.
- Si recibes `ER_NO_SUCH_TABLE` al enviar el código de recuperación, ejecuta:

```powershell
node backend/scripts/create_recovery_table.js
```

## Contribuir

- Añade issues o PRs para mejoras. Si necesitas que pruebe el flujo de recuperación con credenciales SMTP reales, pásamelas de forma segura fuera del repo.

---

Si quieres que extienda este README con más ejemplos de uso, pruebas o diagramas, dime qué sección prefieres.
