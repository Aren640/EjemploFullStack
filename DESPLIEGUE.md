# Levantar una aplicación FullStack con PHP y MongoDB mediante SSH y Docker Compose

## 1. Objetivo

Desplegar la aplicación Autoescuela Veracruz en una máquina virtual Ubuntu. La web usa PHP para la API y MongoDB para guardar las solicitudes de contacto. Docker Compose crea y conecta los servicios sin instalar PHP ni MongoDB directamente en Ubuntu.

## 2. Arquitectura

```text
Navegador
   │ HTTP :3000
   ▼
Nginx (frontend) ── /api/* ──► PHP 8.3 + Apache (backend)
                                      │
                                      ▼
                                MongoDB 8
```

- **Frontend:** Nginx sirve los archivos HTML, CSS y JavaScript.
- **Backend:** PHP valida las solicitudes y guarda los contactos en MongoDB.
- **Base de datos:** MongoDB conserva los datos en el volumen Docker `mongo_data`.
- **Red:** la API y MongoDB se comunican dentro de Docker. Solo se publica la web en el puerto `3000`. MongoDB se enlaza únicamente a `localhost` de la VM para que, si se desea, se acceda mediante un túnel SSH.

## 3. Requisitos

- Una VM con Ubuntu y acceso SSH.
- Docker Engine y el complemento Docker Compose instalados en la VM.
- El puerto TCP `3000` permitido en el firewall de Ubuntu y en las reglas de red del proveedor.
- Git instalado en la VM.

Comprueba la instalación después de entrar por SSH:

```sh
docker --version
docker compose version
git --version
```

## 4. Conectarse por SSH

Desde un terminal de tu ordenador, sustituye `USUARIO` e `IP_PUBLICA` por los datos de la VM:

```sh
ssh USUARIO@IP_PUBLICA
```

A partir de aquí, los comandos se ejecutan en el terminal de Ubuntu, dentro de la sesión SSH.

## 5. Descargar el proyecto

Si todavía no está clonado en la VM:

```sh
git clone https://github.com/Aren640/EjemploFullStack.git
cd EjemploFullStack
```

Si ya existe la carpeta del proyecto:

```sh
cd ~/EjemploFullStack
git pull origin main
```

Verifica que estás en la raíz del repositorio y que Compose encuentra su configuración:

```sh
ls docker-compose.yml .env.example
docker compose config -q
```

## 6. Crear la configuración privada `.env`

La aplicación usa dos contraseñas MongoDB diferentes: una para la cuenta administradora y otra para la cuenta de la aplicación. Genéralas directamente en la VM para que no tengas que copiarlas ni publicarlas.

En la **primera configuración**, copia la plantilla, genera ambas contraseñas y limita los permisos del fichero:

```sh
cp .env.example .env
sed -i "s|^MONGO_ROOT_PASSWORD=.*|MONGO_ROOT_PASSWORD=$(openssl rand -hex 32)|; s|^MONGO_APP_PASSWORD=.*|MONGO_APP_PASSWORD=$(openssl rand -hex 32)|" .env
chmod 600 .env
```

El fichero ya contiene los nombres de usuario, el nombre de la base de datos y los puertos. No compartas `.env` ni lo subas a GitHub: está excluido del repositorio.

**Importante:** conserva este `.env` mientras exista la base MongoDB. No vuelvas a generar las contraseñas después de inicializar la base, porque MongoDB conservaría las credenciales anteriores y la API dejaría de conectarse. Si `.env` ya contiene `MONGO_ROOT_PASSWORD` y `MONGO_APP_PASSWORD` de un despliegue MongoDB previo, no lo sobrescribas.

## 7. Construir e iniciar los contenedores

Desde la carpeta donde está `docker-compose.yml`:

```sh
docker compose up -d --build
```

La opción `--build` crea las imágenes y `-d` deja los servicios ejecutándose en segundo plano. Compose espera a que MongoDB y el backend estén listos antes de iniciar el frontend.

Comprueba el estado:

```sh
docker compose ps
```

Los servicios deberían aparecer como `running` o `healthy`. Para consultar sus registros:

```sh
docker compose logs --tail=100
docker compose logs -f web backend db
```

Pulsa `Ctrl+C` para salir del seguimiento de registros; eso no detiene los contenedores.

## 8. Comprobar el sitio y la API

Desde la VM, comprueba la API y la conexión con MongoDB:

```sh
curl http://localhost:3000/api/health
```

La respuesta esperada es `{"status":"ok"}`. Luego abre en el navegador de tu ordenador:

```text
http://IP_PUBLICA:3000
```

Completa el formulario para comprobar que se guarda un contacto. La API devuelve `201` cuando lo guarda y `400` si los datos no son válidos.

## 9. Abrir el puerto en los firewalls

Permite el puerto `3000/tcp` en el firewall de Ubuntu, si UFW está activo:

```sh
sudo ufw allow 3000/tcp
sudo ufw status
```

También permite TCP `3000` en el firewall o grupo de seguridad del proveedor cloud. No abras MongoDB (`27017`) ni la API directamente a Internet. La web sirve de entrada y Nginx reenvía las llamadas `/api/` al backend.

## 10. MongoDB Compass (opcional)

No necesitas Compass para desplegar o usar la aplicación. Si quieres explorar la base visualmente, instala Compass en tu ordenador. Deja abierta una sesión SSH inversa en un terminal de tu ordenador:

```sh
ssh -L 27017:127.0.0.1:27017 USUARIO@IP_PUBLICA
```

Con el túnel activo, crea una conexión en Compass con esta URI, sustituyendo `CONTRASEÑA_ROOT` por `MONGO_ROOT_PASSWORD` del `.env` de la VM:

```text
mongodb://mongo_admin:CONTRASEÑA_ROOT@127.0.0.1:27017/?authSource=admin
```

El túnel es solo para administración. Cierra la sesión SSH con `Ctrl+C` al terminar. La base no queda expuesta públicamente.

## 11. Actualizar, parar y conservar los datos

Para actualizar a la última versión:

```sh
git pull origin main
docker compose up -d --build
```

Para detener los contenedores sin eliminar la base de datos:

```sh
docker compose down
```

Los contactos permanecen en el volumen `mongo_data` y estarán disponibles al volver a iniciar con `docker compose up -d`. **No uses `docker compose down -v`** salvo que quieras borrar también la base y todos sus datos.

## 12. Problemas frecuentes

- **`no configuration file found`:** entra en la carpeta del repositorio con `cd ~/EjemploFullStack` y verifica con `ls docker-compose.yml`.
- **Falta `MONGO_ROOT_PASSWORD` o `MONGO_APP_PASSWORD`:** crea o actualiza `.env` según el paso 6. No uses `.env.example` directamente en un despliegue.
- **La API no está saludable:** consulta `docker compose logs backend db`. MongoDB debe estar saludable antes de que la API arranque.
- **El sitio no abre desde el ordenador:** revisa `docker compose ps`, el puerto configurado como `HOST_PORT` en `.env`, UFW y el firewall del proveedor.
- **Se cambiaron las contraseñas y Mongo ya tenía datos:** restaura en `.env` las credenciales con las que se inicializó el volumen; cambiar las variables no cambia automáticamente las credenciales ya creadas en MongoDB.

## 13. Ficheros principales

- `docker-compose.yml`: servicios, redes, volúmenes, puertos y comprobaciones de salud.
- `frontend/Dockerfile` y `frontend/nginx.conf`: servidor web y proxy hacia la API PHP.
- `backend/Dockerfile`: PHP 8.3, Apache, driver MongoDB y dependencias Composer.
- `backend/public/index.php`: validación, estado de salud y almacenamiento de contactos.
- `backend/mongo-init/01-create-app-user.js`: crea el usuario MongoDB de la aplicación con permisos de lectura y escritura solo en su base.
- `.env.example`: plantilla pública de variables; las contraseñas reales van únicamente en `.env`.
