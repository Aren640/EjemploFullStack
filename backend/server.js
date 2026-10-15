require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');
const { randomUUID } = require('node:crypto');

const app = express();
const PORT = Number(process.env.PORT) || 8080;
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'autoescuela',
  user: process.env.DB_USER || 'autoescuela',
  password: process.env.DB_PASSWORD,
  max: 10,
  connectionTimeoutMillis: 5000,
});

app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));

app.get('/api/health', async (_request, response) => {
  try {
    await pool.query('SELECT 1');
    response.json({ status: 'ok' });
  } catch (error) {
    console.error('Database health check failed:', error.message);
    response.status(503).json({ status: 'unavailable' });
  }
});

app.post('/api/contactos', async (request, response, next) => {
  const { nombre, apellidos, email } = request.body || {};
  const contact = {
    nombre: typeof nombre === 'string' ? nombre.trim() : '',
    apellidos: typeof apellidos === 'string' ? apellidos.trim() : '',
    email: typeof email === 'string' ? email.trim().toLowerCase() : '',
  };

  if (!contact.nombre || !contact.apellidos || !contact.email) {
    return response.status(400).json({ error: 'Completa todos los campos.' });
  }

  if (contact.nombre.length > 100 || contact.apellidos.length > 100 || contact.email.length > 254) {
    return response.status(400).json({ error: 'Uno o más campos superan la longitud permitida.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
    return response.status(400).json({ error: 'Introduce un correo electrónico válido.' });
  }

  try {
    await pool.query(
      `INSERT INTO contactos (id, nombre, apellidos, email)
       VALUES ($1, $2, $3, $4)`,
      [randomUUID(), contact.nombre, contact.apellidos, contact.email],
    );
    return response.status(201).json({ message: 'Solicitud recibida correctamente.' });
  } catch (error) {
    return next(error);
  }
});

app.use('/api', (_request, response) => {
  response.status(404).json({ error: 'Ruta API no encontrada.' });
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: 'No se pudo procesar la solicitud. Inténtalo más tarde.' });
});

async function start() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS contactos (
      id UUID PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      apellidos VARCHAR(100) NOT NULL,
      email VARCHAR(254) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`API Autoescuela Veracruz disponible en el puerto ${PORT}`);
  });

  const shutdown = () => {
    server.close(() => {
      pool.end().finally(() => process.exit(0));
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start().catch((error) => {
  console.error('No se pudo iniciar la API:', error);
  process.exit(1);
});
