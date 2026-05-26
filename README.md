# Smart Task Manager AI

Este repositorio contiene el backend de una API para un gestor de tareas con autenticación de usuarios y operaciones CRUD sobre tareas.

## Tecnologías

- Node.js
- Express
- MySQL
- bcryptjs
- jsonwebtoken
- dotenv
- cors

## Estructura principal

- `backend/server.js` - punto de entrada del servidor
- `backend/config/db.js` - configuración de conexión a MySQL
- `backend/routes/` - rutas de autenticación y tareas
- `backend/controllers/` - lógica de los endpoints
- `backend/models/` - acceso a la base de datos
- `backend/middlewares/` - validación de JWT

## Instalación

1. Abre la terminal en la carpeta `backend`:

```bash
cd backend
```

2. Instala dependencias:

```bash
npm install
```

3. Crea un archivo `.env` en `backend/` con las siguientes variables:

```env
PORT=5000
DB_HOST=localhost
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_NAME=tu_base_de_datos
JWT_SECRET=una_clave_secreta
```

4. Asegúrate de tener MySQL ejecutándose y la base de datos creada.

## Base de datos

Crea las tablas necesarias en MySQL. A modo de ejemplo, puedes usar algo así:

```sql
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE tareas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  estado VARCHAR(50) DEFAULT 'pendiente',
  prioridad VARCHAR(50),
  fecha_limite DATE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
```

## Ejecución

- Iniciar servidor en modo producción:

```bash
npm start
```

- Iniciar servidor en modo desarrollo con `nodemon`:

```bash
npm run dev
```

## Endpoints disponibles

### Autenticación

- `POST /api/auth/register`
  - Registra un usuario nuevo.
  - Body JSON: `{ "nombre", "email", "password" }`

- `POST /api/auth/login`
  - Inicia sesión y devuelve un token JWT.
  - Body JSON: `{ "email", "password" }`

### Tareas (requieren `Authorization: Bearer <token>`)

- `POST /api/tareas`
  - Crea una nueva tarea.
  - Body JSON: `{ "titulo", "descripcion", "prioridad", "fecha_limite" }`

- `GET /api/tareas`
  - Obtiene todas las tareas del usuario autenticado.

- `PUT /api/tareas/:id`
  - Actualiza una tarea existente.
  - Body JSON: `{ "titulo", "descripcion", "estado", "prioridad", "fecha_limite" }`

- `DELETE /api/tareas/:id`
  - Elimina una tarea.

## Nota

Este README describe el backend. Si existe una interfaz frontend en otra carpeta, conéctala a esta API usando los endpoints descritos.
