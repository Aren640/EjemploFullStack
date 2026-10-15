
const contactForm = document.querySelector('#contactForm');

if (contactForm) {
  const submitButton = contactForm.querySelector('button[type="submit"]');
  let statusMessage = contactForm.querySelector('[role="status"]');

  if (!statusMessage) {
    statusMessage = document.createElement('p');
    statusMessage.setAttribute('role', 'status');
    statusMessage.setAttribute('aria-live', 'polite');
    contactForm.append(statusMessage);
  }

  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    statusMessage.textContent = '';
    submitButton.disabled = true;

    const formData = new FormData(contactForm);
    const contact = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('/api/contactos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contact),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'No se pudo enviar el formulario.');

      sessionStorage.setItem('nombre', contact.nombre);
      sessionStorage.setItem('apellidos', contact.apellidos);
      sessionStorage.setItem('email', contact.email);
      window.location.assign('formulario.html');
    } catch (error) {
      statusMessage.textContent = error.message || 'No se pudo conectar con el servidor.';
      submitButton.disabled = false;
    }
  });
}

const messageContainer = document.querySelector('#contenidoMensaje');

if (messageContainer) {
  const nombre = sessionStorage.getItem('nombre');
  const apellidos = sessionStorage.getItem('apellidos');
  const email = sessionStorage.getItem('email');

  if (nombre && apellidos && email) {
    document.querySelector('#verNombre').textContent = nombre;
    document.querySelector('#verApellidos').textContent = apellidos;
    document.querySelector('#verEmail').textContent = email;
  } else {
    messageContainer.querySelector('h1').textContent = 'Gracias por visitar Autoescuela Veracruz.';
    messageContainer.querySelector('p').textContent = 'Si necesitas información, puedes contactar con nosotros desde el formulario.';
  }

  sessionStorage.removeItem('nombre');
  sessionStorage.removeItem('apellidos');
  sessionStorage.removeItem('email');
}