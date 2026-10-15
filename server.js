require('dotenv').config();

const express = require('express');
const path = require('node:path');
const fs = require('node:fs/promises');
const { randomUUID } = require('node:crypto');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DATA_FILE = process.env.CONTACTS_FILE || path.join(__dirname, 'data', 'contacts.json');

app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));
app.use(['/data', '/server.js', '/package.json', '/package-lock.json', '/README.md'], (_request, response) => {
  response.sendStatus(404);
});
app.use(express.static(__dirname, { extensions: ['html'] }));

let writeQueue = Promise.resolve();

async function saveContact(contact) {
  writeQueue = writeQueue.then(async () => {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    let contacts = [];

    try {
      contacts = JSON.parse(await fs.readFile(DATA_FILE, 'utf8'));
      if (!Array.isArray(contacts)) contacts = [];
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    contacts.push(contact);
    const temporaryFile = `${DATA_FILE}.tmp`;
    await fs.writeFile(temporaryFile, `${JSON.stringify(contacts, null, 2)}\n`);
    await fs.rename(temporaryFile, DATA_FILE);
  });

  return writeQueue;
}

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' });
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
    const savedContact = { id: randomUUID(), ...contact, createdAt: new Date().toISOString() };
    await saveContact(savedContact);
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

app.listen(PORT, () => {
  console.log(`Autoescuela Veracruz disponible en http://localhost:${PORT}`);
});
