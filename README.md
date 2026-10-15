# Autoescuela Veracruz — FullStack con PHP y MongoDB

Aplicación desplegable en Ubuntu mediante SSH y Docker Compose. Incluye un frontend servido por Nginx, una API PHP/Apache y MongoDB para almacenar los contactos.

## Despliegue

Sigue la guía paso a paso en [DESPLIEGUE.md](DESPLIEGUE.md). Cubre conexión SSH, descarga del repositorio, creación segura del `.env`, inicio con Docker Compose, apertura del puerto web, comprobaciones y uso opcional de MongoDB Compass por túnel SSH.

## API

- `GET /api/health`: comprueba la disponibilidad de la API y la conexión a MongoDB.
- `POST /api/contactos`: valida y guarda un contacto con `nombre`, `apellidos` y `email`.

MongoDB se conserva en un volumen Docker y no se publica directamente en Internet. No subas el fichero `.env` con credenciales al repositorio.
