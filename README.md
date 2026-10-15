# Autoescuela Veracruz — Fullstack

Sitio web servido desde Node.js y Express. El formulario de contacto se valida en cliente y servidor, y las solicitudes se guardan localmente en `data/contacts.json`.

## Requisitos

- Node.js 20 o superior
- npm

## Iniciar en local

```sh
npm install
npm start
```

Abre `http://localhost:3000`. Durante el desarrollo puedes usar `npm run dev` para reiniciar el servidor automáticamente.

Puedes copiar `.env.example` a `.env` y ajustar la configuración local. `PORT` cambia el puerto del servidor y `CONTACTS_FILE` permite elegir dónde guardar los contactos. El fichero `.env` está excluido de Git; no guardes secretos en `.env.example`.

## API

- `GET /api/health`: comprueba que el servidor responde.
- `POST /api/contactos`: valida y guarda un contacto. Espera JSON con `nombre`, `apellidos` y `email`; devuelve `201` al guardar o `400` si los datos no son válidos.

Los datos almacenados son locales al servidor. Para producción, configura un almacenamiento gestionado y HTTPS; no subas datos personales ni el fichero de contactos al repositorio.
