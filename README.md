# Autoescuela Veracruz — Fullstack

Sitio web servido desde Node.js y Express. El formulario de contacto se valida en cliente y servidor, y las solicitudes se guardan localmente en `data/contacts.json`.

## Requisitos

- Node.js 20 o superior
- npm

## Desarrollo local

```sh
npm install
npm start
```

Abre `http://localhost:3000`. Durante el desarrollo puedes usar `npm run dev` para reiniciar el servidor automáticamente.

Puedes copiar `.env.example` a `.env` y ajustar la configuración local. `PORT` cambia el puerto del servidor y `CONTACTS_FILE` permite elegir dónde guardar los contactos. El fichero `.env` está excluido de Git; no guardes secretos en `.env.example`.

## Desplegar en una máquina virtual con Docker Compose

La VM debe tener Docker Engine y el plugin Docker Compose instalados. Desde la VM:

```sh
git clone https://github.com/Aren640/EjemploFullStack.git
cd EjemploFullStack
cp .env.example .env
```

Edita `HOST_PORT` en `.env` si no quieres publicar el sitio en el puerto `3000` y arranca el servicio:

```sh
docker compose up -d --build
docker compose ps
docker compose logs -f web
```

La web quedará disponible en `http://IP_PUBLICA_DE_LA_VM:HOST_PORT`. Permite ese puerto en el firewall de la VM y en las reglas de red del proveedor cloud. Compose configura comprobación de salud, reinicio automático y persistencia de contactos en el volumen `contacts_data`, que sobrevive a recreaciones del contenedor. Para actualizar, ejecuta `git pull` y luego `docker compose up -d --build`.

Para cerrar los servicios usa `docker compose down`. Evita `docker compose down -v` salvo que quieras borrar también el volumen y todos los contactos guardados. El `.env` de la VM no se sube a GitHub.

Para una instalación pública, coloca un proxy inverso delante del servicio y configura HTTPS; no expongas el puerto de la aplicación sin TLS si se van a enviar datos personales.

## API

- `GET /api/health`: comprueba que el servidor responde.
- `POST /api/contactos`: valida y guarda un contacto. Espera JSON con `nombre`, `apellidos` y `email`; devuelve `201` al guardar o `400` si los datos no son válidos.

Los datos almacenados son locales al servidor. Para producción, configura un almacenamiento gestionado y HTTPS; no subas datos personales ni el fichero de contactos al repositorio.
