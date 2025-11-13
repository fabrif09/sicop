📘 README_DEPLOY.md – Guía de Deploy para SICOP (Producción)

Este documento explica cómo instalar, configurar y ejecutar SICOP en un entorno de producción dentro de la universidad.
Está pensado para el equipo técnico o el área de sistemas.

📌 1. Requisitos del Sistema
✔ Hardware mínimo recomendado
Recurso	Recomendado	Mínimo
CPU	2–4 vCPU	2 vCPU
RAM	8 GB	4 GB
Disco	100 GB SSD	40 GB
Red	IP fija interna o pública	—
📌 2. Software Necesario (versiones exactas)

Instalar en el servidor Linux (Ubuntu recomendado):

Software	Versión recomendada	Notas
Ubuntu Server	22.04 LTS	también funciona en 20.04
Docker	27.x	paquete oficial de Docker
Docker Compose	v2.x	integrado a Docker (plugin)
Node.js	v20.x LTS	solo necesario si NO se dockeriza Next.js
Nginx	1.18+	reverse proxy + HTTPS
Certbot	última versión	para obtener certificados SSL
Git	2.x	clonar el repo
📌 3. Servicios Dockerizados

SICOP usa los siguientes servicios dentro de Docker:

Servicio	Imagen	Puerto	Descripción
PostgreSQL 15	postgres:15	5432	Base de datos
Adminer	adminer:latest	8080	UI para administrar DB
MinIO (S3)	minio/minio:latest	9000 / 9001	Almacenamiento de PDFs
(Opcional) Next.js	imagen personalizada	3000	App web

Tu docker-compose.yml actual ya levanta Postgres, Adminer y MinIO.

📌 4. Directorio de instalación recomendado

En el servidor:

/opt/sicop


Contenido sugerido:

/opt/sicop/
  ├── app/                 (código Next.js)
  ├── docker/              (docker-compose + volúmenes)
  ├── .env.production
  └── README_DEPLOY.md

📌 5. Volúmenes Persistentes (importante)

Para no perder datos, se recomienda:

volumes:
  postgres_data:
  minio_data:


Estos volúmenes deben estar montados en disco y respaldados periódicamente.

📌 6. Variables de Entorno (Producción)

Crear el archivo:

.env.production


Contenido estándar (adaptar según la infraestructura):

# ===== BASE DE DATOS =====
DATABASE_URL="postgresql://sicop_user:password@postgres:5432/sicopdb?schema=public"

# ===== NextAuth =====
NEXTAUTH_URL="https://sicop.universidad.edu"
NEXTAUTH_SECRET="_GENERAR_UNA_SECRET_SEGURA_"

# ===== SMTP real =====
SMTP_HOST="smtp.universidad.edu"
SMTP_PORT=587
SMTP_USER="sicop@universidad.edu"
SMTP_PASS="contraseñaReal"
SMTP_FROM="SICOP <sicop@universidad.edu>"

# ===== MinIO (S3) =====
S3_ENDPOINT="http://minio:9000"
S3_BUCKET="proyectos"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
S3_REGION="us-east-1"

# ===== Config MinIO Panel =====
MINIO_ROOT_USER="minioadmin"
MINIO_ROOT_PASSWORD="minioadmin"


⚠ IMPORTANTE:
NEXTAUTH_SECRET debe ser generado así:

openssl rand -base64 32

📌 7. Deploy Paso por Paso (para Infraestructura)
✅ 1) Clonar el repositorio
cd /opt
sudo mkdir sicop
sudo chown $USER:$USER sicop
cd sicop
git clone https://github.com/tu-repo.git app

✅ 2) Crear archivo .env.production
cp app/.env.example .env.production
nano .env.production


Completar con los valores reales.

✅ 3) Levantar la base de datos + MinIO

Desde /opt/sicop/app o donde esté el compose:

docker compose up -d


Verificar:

docker ps

✅ 4) Construir y ejecutar la app Next.js
Opción A – Dockerizar Next.js (recomendada)

Crear Dockerfile:

FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]


Agregar al docker-compose.yml:

services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - ../.env.production
    depends_on:
      - postgres
      - minio


Y ejecutar:

docker compose up -d --build

Opción B – Ejecutar Next.js fuera de Docker

Instalar Node 20:

sudo apt install nodejs npm


Instalar dependencias:

cd /opt/sicop/app
npm install
npm run build
npm run start

✅ 5) Configurar Nginx + HTTPS

Archivo ejemplo:

/etc/nginx/sites-available/sicop


Contenido:

server {
    server_name sicop.universidad.edu;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}


Activar:

sudo ln -s /etc/nginx/sites-available/sicop /etc/nginx/sites-enabled/
sudo systemctl restart nginx


Agregar HTTPS:

sudo certbot --nginx -d sicop.universidad.edu

📌 8. Sistema de Emails (Producción)

Para producción se necesita:

✔ SMTP real de la universidad
✔ Configuración de SPF/DKIM/DMARC
✔ Cuenta propia: sicop@universidad.edu
✔ Puerto 587 (TLS)

El sistema actual funciona igual, solo se cambia la configuración del .env.

📌 9. Sistema de PDFs con MinIO
✔ Requisitos para producción

Volumen persistente minio_data

Acceso restringido (ideal firewall interno)

HTTPS si se expone público

Backup diario de:

minio_data

Base de datos Postgres

El código ya está preparado para usar MinIO en producción.

📌 10. Backups (obligatorio en entorno académico)
Base de datos:
docker exec postgres pg_dump -U sicop_user sicopdb > backup.sql

MinIO (archivos PDF):

Usar:

mc mirror minio/proyectos /backups/proyectos


(O usar snapshots del servidor)

📌 11. Actualizaciones del sistema

Para actualizar el sistema:

cd /opt/sicop/app
git pull
docker compose down
docker compose up -d --build

📌 12. Checklist para producción (resumen)
Infraestructura

 Servidor Linux activo

 Docker + Compose instalados

 Nginx + HTTPS configurado

 Dominios apuntados correctamente

App

 .env.production listo

 DB y MinIO con volúmenes persistentes

 App Next.js build final

 SMTP real configurado

Seguridad

 Contraseñas seguras

 Puertos internos cerrados (Adminer / MinIO)

 Backups configurados

📌 13. Contacto técnico (para universidad)

Este proyecto fue desarrollado en Next.js + PostgreSQL + MinIO y es totalmente portable.
Soporta cualquier infraestructura universal: Docker, VPS, servidores de facultad, etc.
