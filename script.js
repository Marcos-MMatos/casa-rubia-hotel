/*
 * JavaScript for the Taganga hotel website.
 *
 * This script provides interactive functionality for the rooms
 * listing and contact form. It implements a lightweight booking
 * manager using the browser's local storage to simulate room
 * availability and reservation creation. No backend is required
 * for this demonstration. Users can pick check‑in and check‑out
 * dates, see which rooms are available and submit a reservation
 * request through a modal form. Reservations are saved locally
 * so that availability persists across page reloads.
 */

// Define the 12 rooms. Six without air conditioning and six with.
const rooms = [
  { id: 1, name: 'Habitación 1', type: 'Con ventilador', ac: false, price: 30000, capacity: 2 },
  { id: 2, name: 'Habitación 2', type: 'Con ventilador', ac: false, price: 30000, capacity: 2 },
  { id: 3, name: 'Habitación 3', type: 'Con ventilador', ac: false, price: 30000, capacity: 2 },
  { id: 4, name: 'Habitación 4', type: 'Con ventilador', ac: false, price: 30000, capacity: 2 },
  { id: 5, name: 'Habitación 5', type: 'Con ventilador', ac: false, price: 30000, capacity: 2 },
  { id: 6, name: 'Habitación 6', type: 'Con ventilador', ac: false, price: 30000, capacity: 2 },
  { id: 7, name: 'Habitación 7', type: 'Con aire acondicionado', ac: true, price: 60000, capacity: 2 },
  { id: 8, name: 'Habitación 8', type: 'Con aire acondicionado', ac: true, price: 60000, capacity: 2 },
  { id: 9, name: 'Habitación 9', type: 'Con aire acondicionado', ac: true, price: 60000, capacity: 2 },
  { id: 10, name: 'Habitación 10', type: 'Con aire acondicionado', ac: true, price: 60000, capacity: 2 },
  { id: 11, name: 'Habitación 11', type: 'Con aire acondicionado', ac: true, price: 60000, capacity: 2 },
  { id: 12, name: 'Habitación 12', type: 'Con aire acondicionado', ac: true, price: 60000, capacity: 2 }
];

/*
 * In this version we manage reservations on the server side. The
 * browser will query the backend API to determine availability
 * and store new reservations. See server.js for details.
 */

/* Format a number as Colombian Peso. */
function formatCOP(value) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
}

/* Initialise the rooms page: set up date pickers, render the table and attach event handlers. */
function initRoomsPage() {
  const tableBody = document.getElementById('rooms-table-body');
  const checkInInput = document.getElementById('checkIn');
  const checkOutInput = document.getElementById('checkOut');
  const modal = document.getElementById('reservationModal');
  const reservationForm = document.getElementById('reservationForm');
  const closeBtn = document.getElementById('modalClose');

  // Set default dates: check‑in tomorrow, check‑out day after.
  const today = new Date();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const nextDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2);
  checkInInput.valueAsDate = tomorrow;
  checkOutInput.valueAsDate = nextDay;

  // Render the table rows
  function renderRooms() {
    tableBody.innerHTML = '';
    rooms.forEach((room) => {
      const row = document.createElement('tr');
      // Room name
      const nameCell = document.createElement('td');
      nameCell.textContent = room.name;
      row.appendChild(nameCell);
      // Type (AC or not)
      const typeCell = document.createElement('td');
      typeCell.textContent = room.type;
      row.appendChild(typeCell);
      // Capacity
      const capCell = document.createElement('td');
      capCell.textContent = room.capacity;
      row.appendChild(capCell);
      // Price
      const priceCell = document.createElement('td');
      priceCell.textContent = formatCOP(room.price);
      row.appendChild(priceCell);
      // Availability
      const availCell = document.createElement('td');
      availCell.className = 'availability';
      availCell.id = `avail-${room.id}`;
      row.appendChild(availCell);
      // Action button
      const actionCell = document.createElement('td');
      const btn = document.createElement('button');
      btn.textContent = 'Reservar';
      btn.className = 'btn-primary';
      btn.addEventListener('click', () => openReservationModal(room.id));
      actionCell.appendChild(btn);
      row.appendChild(actionCell);
      tableBody.appendChild(row);
    });
    updateAvailability();
  }

  // Determine availability for each room and update the table.
  async function updateAvailability() {
    const checkInDate = new Date(checkInInput.value);
    const checkOutDate = new Date(checkOutInput.value);
    if (!checkInDate || !checkOutDate || isNaN(checkInDate) || isNaN(checkOutDate)) return;
    // Ensure check‑out is after check‑in
    if (checkOutDate <= checkInDate) {
      rooms.forEach((room) => {
        const cell = document.getElementById(`avail-${room.id}`);
        cell.textContent = 'Fechas no válidas';
        cell.className = 'availability unavailable';
      });
      return;
    }
    try {
      const params = new URLSearchParams({
        checkIn: checkInDate.toISOString(),
        checkOut: checkOutDate.toISOString()
      });
      const response = await fetch(`https://casa-rubia-hotel-production.up.railway.app?${params.toString()}`);
      const reservations = await response.json();
      rooms.forEach((room) => {
        const cell = document.getElementById(`avail-${room.id}`);
        // Check if this room appears in any overlapping reservation
        const conflict = reservations.some((res) => {
          return res.roomId === room.id;
        });
        const available = !conflict;
        cell.textContent = available ? 'Disponible' : 'No disponible';
        cell.className = available ? 'availability available' : 'availability unavailable';
      });
    } catch (err) {
      console.error('Error al consultar la disponibilidad:', err);
      rooms.forEach((room) => {
        const cell = document.getElementById(`avail-${room.id}`);
        cell.textContent = 'Error';
        cell.className = 'availability unavailable';
      });
    }
  }

  // Show the modal and prefill hidden inputs
  function openReservationModal(roomId) {
    const checkInDate = new Date(checkInInput.value);
    const checkOutDate = new Date(checkOutInput.value);
    // Validate date range before opening modal
    if (!checkInInput.value || !checkOutInput.value || checkOutDate <= checkInDate) {
      alert('Por favor seleccione una fecha de entrada y salida válida antes de reservar.');
      return;
    }
    const room = rooms.find((r) => r.id === roomId);
    document.getElementById('modalRoomName').textContent = room.name;
    document.getElementById('modalRoomType').textContent = room.type;
    document.getElementById('modalRoomPrice').textContent = formatCOP(room.price);
    document.getElementById('formRoomId').value = room.id;
    document.getElementById('formCheckIn').value = checkInInput.value;
    document.getElementById('formCheckOut').value = checkOutInput.value;
    modal.classList.add('show');
  }

  // Close modal
  function closeModal() {
    modal.classList.remove('show');
    reservationForm.reset();
  }

  // Attach event handlers
  checkInInput.addEventListener('change', updateAvailability);
  checkOutInput.addEventListener('change', updateAvailability);
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
  reservationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const roomId = parseInt(document.getElementById('formRoomId').value, 10);
    const name = document.getElementById('formName').value.trim();
    const email = document.getElementById('formEmail').value.trim();
    const phone = document.getElementById('formPhone').value.trim();
    const checkInDate = document.getElementById('formCheckIn').value;
    const checkOutDate = document.getElementById('formCheckOut').value;
    if (!name || !email || !phone) {
      alert('Por favor complete todos los campos del formulario.');
      return;
    }
    try {
      const response = await fetch('https://casa-rubia-hotel-production.up.railway.app/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, name, email, phone, checkIn: checkInDate, checkOut: checkOutDate })
      });
      if (!response.ok) {
        throw new Error('Error al enviar la reserva');
      }
      await response.json();
      alert('¡Gracias! Su solicitud de reserva ha sido registrada. Nos pondremos en contacto a la brevedad.');
      closeModal();
      updateAvailability();
    } catch (err) {
      console.error('Error al registrar la reserva:', err);
      alert('Lo sentimos, ocurrió un error al registrar la reserva. Por favor inténtelo de nuevo más tarde.');
    }
  });

  // Initial render
  renderRooms();
}

/* Initialise contact page: handle form submission to compose a mailto link.
 * The form collects name, email, phone and message. When submitted,
 * a pre‑formatted email is opened in the default mail client.
 */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const phone = document.getElementById('contactPhone').value.trim();
    const message = document.getElementById('contactMessage').value.trim();
    if (!name || !email || !message) {
      alert('Por favor complete su nombre, correo y mensaje.');
      return;
    }
    const subject = encodeURIComponent('Consulta desde el sitio web');
    const body = encodeURIComponent(`Nombre: ${name}%0ACorreo: ${email}%0ATeléfono: ${phone}%0A%0AMensaje:%0A${message}`);
    // Replace with your own contact email if deploying
    const mailtoLink = `mailto:casarubiataganga@gmail.com?subject=${subject}&body=${body}`;
    window.location.href = mailtoLink;
    alert('Gracias por contactarnos. Se abrirá su cliente de correo para enviar el mensaje.');
    form.reset();
  });
}

// Set up event listeners depending on the page
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('rooms-table-body')) {
    initRoomsPage();
  }
  if (document.getElementById('contact-form')) {
    initContactForm();
  }
});
