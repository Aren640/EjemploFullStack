# Autoescuela Veracruz — PHP y MongoDB

Frontend estático servido por Nginx, API PHP/Apache y MongoDB. Nginx pasa `/api/` a PHP; los contactos se guardan en MongoDB.

## Despliegue por SSH en Ubuntu

Conéctate por SSH a la VM. Si aún no clonaste el repositorio:

```sh
git clone https://github.com/Aren640/EjemploFullStack.git
cd EjemploFullStack
```

Si ya tenías el proyecto clonado, entra a su carpeta y actualízalo:

```sh
cd ~/EjemploFullStack
git pull origin main
```

Elimina el `.env` viejo de la configuración PostgreSQL y crea uno nuevo para MongoDB. El siguiente bloque genera contraseñas aleatorias en la VM, no las muestra y protege el archivo:

```sh
cp .env.example .env
sed -i "s|^MONGO_ROOT_PASSWORD=.*|MONGO_ROOT_PASSWORD=$(openssl rand -hex 32)|; s|^MONGO_APP_PASSWORD=.*|MONGO_APP_PASSWORD=$(openssl rand -hex 32)|" .env
chmod 600 .env
```

Construye e inicia los servicios:

```sh
docker compose up -d --build
docker compose ps
docker compose logs --tail=100
```

Abre `http://IP_PUBLICA_DE_LA_VM:3000` y permite TCP 3000 en el firewall de Ubuntu y las reglas de red del proveedor cloud. La API no está publicada al exterior. MongoDB solo escucha en localhost de la VM (puerto `MONGO_HOST_PORT`), nunca en una interfaz pública; Nginx retransmite `/api/` al backend dentro de la red Docker.

MongoDB Compass es opcional: no hace falta instalarlo en la VM ni usarlo para que funcione la aplicación. Si quieres inspeccionar la base, instala Compass en tu ordenador y, desde otro terminal de tu ordenador, crea un túnel SSH con `ssh -L 27017:127.0.0.1:27017 USUARIO@IP_PUBLICA_DE_LA_VM`. En Compass conecta a `mongodb://mongo_admin:CONTRASEÑA_ROOT@127.0.0.1:27017/?authSource=admin`, sustituyendo `CONTRASEÑA_ROOT` por el valor de `MONGO_ROOT_PASSWORD` en el `.env` de la VM. Cierra el túnel con Ctrl+C cuando termines.

Para actualizar, ejecuta `git pull origin main` y `docker compose up -d --build`. Para parar los servicios usa `docker compose down`. No uses `docker compose down -v`: eliminaría la base de datos persistente. Conserva `.env` en la VM y nunca lo subas a GitHub.

Si ya habías iniciado el despliegue anterior, esta versión no migra automáticamente los contactos de PostgreSQL; los guarda en una base de datos MongoDB nueva. La contraseña `.env` anterior no sirve para MongoDB: ejecuta el bloque de generación anterior. Los volúmenes PostgreSQL antiguos no se borran.

Para uso público con datos personales, añade HTTPS mediante un proxy inverso.

## Servicios y API

- `frontend/Dockerfile`: Nginx sirve los ficheros estáticos y retransmite `/api/` a PHP.
- `backend/Dockerfile`: PHP 8.3/Apache, extensión MongoDB y librería oficial Composer.
- `db`: MongoDB 8 con volumen `mongo_data` y usuario de aplicación con permisos solo de lectura/escritura en la base de datos de la app.
- `GET /api/health`: comprueba la conexión a MongoDB.
- `POST /api/contactos`: valida y guarda `nombre`, `apellidos` y `email`.
