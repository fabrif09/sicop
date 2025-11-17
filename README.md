
# 🚀 SICOP – Sistema de Control de Proyectos  
## 📘 Documentación de Deploy y Requisitos Técnicos

Este documento reúne **toda la información completa** para instalar, correr y mantener el sistema **SICOP**.

---

# 🧩 1. Descripción General del Sistema

SICOP es una plataforma web desarrollada con **Next.js Full Stack**, **Prisma ORM** y **PostgreSQL**, destinada a la gestión integral de proyectos finales de alumnos, permitiendo:

- Carga de proyectos (PDF) por parte de alumnos o profesores.
- Seguimiento del estado del proyecto (pendiente, aprobado, rechazado).
- Registro de acciones en un sistema de **auditoría (logs)**.
- Gestión de usuarios: alumnos, profesores y administradores.
- Notificaciones (email).
- Panel administrativo para la cátedra.

---

# 💻 2. Tecnologías y Versiones Utilizadas

## 🧠 2.1 Entorno General

| Componente | Versión |
|-------------|----------|
| **Node.js** | 22.14.0 |
| **npm** | 10.9.2 |
| **Docker Engine** | 28.1.1 |
| **Docker Compose (spec)** | v3 |
| **PostgreSQL (contenedor)** | 15.x |
| **Next.js** | 15.5.2 |
| **React** | 19.1.0 |
| **React DOM** | 19.1.0 |
| **Prisma ORM** | 6.15.0 |
| **TypeScript** | 5.x |
| **TailwindCSS** | 4.1.13 |
| **Autenticación** | NextAuth 4.24.11 |
| **Iconos UI** | lucide-react 0.552.0 |
| **Hashing** | bcryptjs 3.0.2 |
| **Emails** | Mailtrap + Nodemailer |
| **Almacenamiento de Archivos** | MinIO / S3 compatible |

---

# ⚙️ 3. Dependencias del Proyecto

## 3.1 Dependencias Principales (package.json)

| Paquete | Versión |
|---------|---------|
| next | 15.5.2 |
| react | 19.1.0 |
| react-dom | 19.1.0 |
| @prisma/client | 6.15.0 |
| prisma | 6.15.0 |
| next-auth | 4.24.11 |
| tailwindcss | 4.1.13 |
| bcryptjs | 3.0.2 |
| lucide-react | 0.552.0 |
| nodemailer | 6.10.1 |
| @aws-sdk/client-s3 | 3.886.0 |
| @aws-sdk/s3-request-presigner | 3.886.0 |
| postcss | 8.5.6 |
| autoprefixer | 10.4.21 |

---

## 3.2 Dependencias de Desarrollo

| Paquete | Versión |
|----------|---------|
| eslint | 9.x |
| eslint-config-next | 15.5.2 |
| @eslint/eslintrc | 3.x |
| @types/node | 20.x |
| @types/react | 19.x |
| @types/react-dom | 19.x |
| @types/bcryptjs | 2.4.6 |
| @types/nodemailer | 7.0.3 |

---

# 🐳 4. Servicios con Docker

El sistema utiliza los siguientes contenedores:

| Servicio | Imagen | Puertos | Uso |
|----------|---------|---------|-----|
| **PostgreSQL** | postgres:15 | 5432 | Base de datos |
| **Adminer** | adminer:latest | 8080 | Admin de BD |
| **MinIO** | minio/minio | 9000 / 9090 | Almacenamiento de PDFs |
| **Aplicación SICOP** | local | 3000 | Next.js |

---

# 🔧 5. Variables de Entorno

Crear un archivo:  
`./.env.local`

```bash
DATABASE_URL="postgresql://postgres:<password>@localhost:5432/sicop"
NEXTAUTH_SECRET="<clave_secreta>"
NEXTAUTH_URL="http://localhost:3000"

# Mailtrap (testing)
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=<user>
SMTP_PASS=<pass>

# MinIO / S3
OBJECT_ENDPOINT="http://localhost:9000"
OBJECT_REGION="us-east-1"
OBJECT_ACCESS_KEY="<key>"
OBJECT_SECRET_KEY="<secret>"
OBJECT_BUCKET="sicop-projects"
OBJECT_FORCE_PATH=true
```

---

# 🚀 6. Instalación y Puesta en Marcha

## 6.1 Requisitos

✔ **Docker Desktop 28+**  
✔ **Node.js 22+**  
✔ **Git**  
✔ **Navegador moderno** (Chrome recomendado)  

---

## 6.2 Pasos de despliegue

### 1️⃣ Clonar el repositorio
```bash
git clone https://github.com/fabrif09/sicop
cd sicop
```

### 2️⃣ Configurar variables
Crear archivo `.env.local` con los valores anteriores.

### 3️⃣ Levantar servicios Docker
```bash
docker compose up -d
```

### 4️⃣ Ejecutar migraciones Prisma
```bash
npx prisma migrate dev
```

### 5️⃣ Iniciar el sistema
```bash
npm install
npm run dev
```

Abrir en el navegador:  
👉 **http://localhost:3000**

---

# 📁 7. Arquitectura General

- **Next.js App Router** con Server Components.
- **Prisma ORM** para consultas SQL fuertemente tipadas.
- **PostgreSQL** como base de datos estable y relacional.
- **MinIO / S3** para almacenamiento de PDFs.
- **NextAuth** con roles *(ADMIN, PROF, ALUMNO)*.
- **Auditoría** mediante tabla `AuditLog`.
- **Filtros avanzados**, logs, paginación, búsqueda.
- **Notificaciones** (Mailtrap en desarrollo / SMTP en producción).

---

# 🔐 8. Roles del Sistema

| Rol | Permisos |
|------|-----------|
| **ADMIN** | Acceso total, crear usuarios, aprobar/rechazar proyectos |
| **PROF** | Crear alumnos, subir proyectos de alumnos, aprobar estados |
| **ALUMNO** | Subir proyecto, ver estado, recibir notificaciones |

---

# 📦 9. Datos Almacenados

### Tabla `User`
- nombre, email, dni, egresado, fechaRindio, nota
- role, passwordHash, createdAt

### Tabla `Proyecto`
- titulo, pdfKey, estado, alumnoId, feedback

### Tabla `AuditLog`
- acción, usuario, target, proyecto, metadata, fecha

---

# 📚 10. Resumen de Instalación (versión corta)

```
docker compose up -d
npx prisma migrate dev
npm install
npm run dev
http://localhost:3000
```

✔ Listo para usar en la cátedra.  
✔ Funciona igual en cualquier red Wi-Fi.  
✔ No depende de servicios externos (salvo Mailtrap opcional).  

---

# 🎓 11. Contacto y Mantenimiento

Autor: **Fabrizio Fasoli**  
Proyecto Final – Universidad Católica de Cuyo    

--- 
