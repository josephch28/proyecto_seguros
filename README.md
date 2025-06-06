# Sistema de Gestión de Seguros

Este es un sistema completo para la gestión de seguros, incluyendo frontend y backend.

## Requisitos Previos

- Node.js (versión 14 o superior)
- MySQL (versión 8.0 o superior)
- npm o yarn

## Configuración del Backend

1. Navega al directorio del backend:
```bash
cd seguros-backend
```

2. Instala las dependencias:
```bash
npm install
```

3. Crea un archivo `.env` en el directorio `seguros-backend` con las siguientes variables:
```env
DB_HOST=localhost
DB_USER=tu_usuario_mysql
DB_PASSWORD=tu_contraseña_mysql
DB_NAME=seguros_db
JWT_SECRET=tu_secreto_jwt
PORT=3001
```

4. Crea la base de datos en MySQL:
```sql
CREATE DATABASE seguros_db;
```

5. Inicia el servidor de desarrollo:
```bash
npm run dev
```

## Configuración del Frontend

1. Navega al directorio del frontend:
```bash
cd seguros-frontend
```

2. Instala las dependencias:
```bash
npm install
```

3. Inicia el servidor de desarrollo:
```bash
npm start
```

## Estructura del Proyecto

### Backend (seguros-backend)
- `index.js`: Punto de entrada principal
- `config/`: Configuración de la base de datos y variables de entorno
- `controllers/`: Controladores de la aplicación
- `models/`: Modelos de Sequelize
- `routes/`: Rutas de la API
- `middleware/`: Middleware de autenticación y validación
- `uploads/`: Directorio para archivos subidos (PDFs, etc.)

### Frontend (seguros-frontend)
- `src/`: Código fuente
  - `components/`: Componentes de React
  - `context/`: Contextos de React (Auth, etc.)
  - `App.js`: Componente principal
  - `index.js`: Punto de entrada

## Scripts Disponibles

### Backend
- `npm run dev`: Inicia el servidor en modo desarrollo con nodemon
- `npm start`: Inicia el servidor en modo producción

### Frontend
- `npm start`: Inicia el servidor de desarrollo
- `npm build`: Construye la aplicación para producción
- `npm test`: Ejecuta las pruebas

## Variables de Entorno

### Backend (.env)
- `DB_HOST`: Host de la base de datos
- `DB_USER`: Usuario de MySQL
- `DB_PASSWORD`: Contraseña de MySQL
- `DB_NAME`: Nombre de la base de datos
- `JWT_SECRET`: Secreto para firmar tokens JWT
- `PORT`: Puerto del servidor (default: 3001)

## Dependencias Principales

### Backend
- express: Framework web
- sequelize: ORM para MySQL
- mysql2: Driver de MySQL
- jsonwebtoken: Manejo de tokens JWT
- bcrypt: Encriptación de contraseñas
- multer: Manejo de archivos
- cors: Middleware para CORS
- dotenv: Variables de entorno

### Frontend
- react: Biblioteca UI
- react-router-dom: Enrutamiento
- @mui/material: Componentes UI
- axios: Cliente HTTP
- react-signature-canvas: Firma digital

## Notas Importantes

1. Asegúrate de que MySQL esté corriendo antes de iniciar el backend
2. El frontend se ejecuta en el puerto 3000 por defecto
3. El backend se ejecuta en el puerto 3001 por defecto
4. Los archivos subidos se guardan en la carpeta `uploads` del backend
5. La base de datos debe ser creada antes de iniciar el backend

## Solución de Problemas

1. Si el backend no puede conectarse a la base de datos:
   - Verifica que MySQL esté corriendo
   - Confirma las credenciales en el archivo .env
   - Asegúrate de que la base de datos existe

2. Si el frontend no puede conectarse al backend:
   - Verifica que el backend esté corriendo
   - Confirma que el proxy en package.json apunta al puerto correcto
   - Revisa la consola del navegador para errores CORS

3. Si hay problemas con las dependencias:
   - Elimina node_modules y package-lock.json
   - Ejecuta npm install nuevamente 