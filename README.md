# Autoescuela Veracruz — Fullstack

Aplicación separada en frontend estático servido por Nginx, API Node.js/Express y PostgreSQL. Nginx reenvía `/api/` al backend; los contactos se almacenan en PostgreSQL.

## Despliegue en una VM con Docker Compose

Instala Docker Engine y el plugin Docker Compose en la VM. Después:

```sh
git clone https://github.com/Aren640/EjemploFullStack.git
cd EjemploFullStack
cp .env.example .env
```

Edita `.env` y cambia `DB_PASSWORD` por una contraseña aleatoria, única y privada. No subas `.env` a GitHub. Los valores `HOST_PORT` y `API_HOST_PORT` configuran los puertos públicos del frontend (3000) y API (8080).

```sh
docker compose up -d --build
docker compose ps
docker compose logs -f
```

Abre `http://IP_PUBLICA_DE_LA_VM:3000`. Permite el puerto 3000 en el firewall de la VM y en las reglas de red del proveedor. El puerto 8080 también se publica para pruebas directas de la API; si no lo necesitas, quita el bloque `ports` del servicio `backend` en `docker-compose.yml` y usa la API a través de Nginx. PostgreSQL no publica ningún puerto al exterior.

Compose espera a que PostgreSQL y la API estén saludables antes de iniciar la web. Los datos viven en el volumen persistente `contacts_data`. Para actualizar: `git pull` y `docker compose up -d --build`. Para parar: `docker compose down`. No uses `docker compose down -v` salvo que quieras borrar permanentemente la base de datos.

Para recibir datos personales desde Internet, configura HTTPS mediante un proxy inverso y limita el acceso a los puertos según sea necesario.

## Servicios y API

- `frontend/Dockerfile`: imagen Nginx que sirve los ficheros estáticos existentes en la raíz del proyecto; no hay una herramienta de compilación frontend en esta aplicación.
- `backend/Dockerfile`: imagen Node.js de producción para Express y el cliente PostgreSQL.
- `db`: PostgreSQL 15 con volumen persistente y sin puerto público.
- `GET /api/health`: estado de la API y de la conexión a la base de datos.
- `POST /api/contactos`: valida y guarda `nombre`, `apellidos` y `email`.

Los puertos, credenciales y nombre de base de datos se configuran mediante `.env`; usa `.env.example` como plantilla, nunca como contraseña de producción.
