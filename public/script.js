const API_URL = "http://localhost:5000";
let currentRoomId = null; // Para almacenar el id de la sala actual

// Función para cargar las salas
async function fetchRooms() {
    const response = await fetch(`${API_URL}/rooms`);
    const rooms = await response.json();
    const container = document.getElementById('rooms-container');
    container.innerHTML = ''; // Limpiar el contenedor antes de agregar elementos

    // Crear un botón de cerrar taquilla
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Cerrar Taquilla';
    closeButton.classList.add('btn', 'btn-danger', 'mt-3');
    closeButton.addEventListener('click', closeTickets);
    container.appendChild(closeButton);

    // Mostrar las salas
    rooms.forEach(room => {
        const roomDiv = document.createElement('div');
        roomDiv.classList.add('card', 'mb-3');
        roomDiv.innerHTML = `
            <div class="card-body">
                <h5 class="card-title">${room.name}</h5>
                <p class="card-text">Capacidad: ${room.capacity}</p>
                <button class="btn btn-primary" onclick="viewSeats('${room._id}')">Ver Sillas</button>
            </div>
        `;
        container.appendChild(roomDiv);
    });
}

// Función para ver las sillas de la sala
async function viewSeats(roomId) {
    currentRoomId = roomId; // Guardar el ID de la sala actual
    const response = await fetch(`${API_URL}/rooms/${roomId}/seats`);
    const seats = await response.json();

    const container = document.getElementById('rooms-container');
    container.innerHTML = `<h2>Sillas de la sala</h2>`;
    
    // Crear un contenedor para las sillas
    const seatsContainer = document.createElement('div');
    seatsContainer.classList.add('grid-container');

    // Renderizar cada silla
    seats.forEach(seat => {
        const seatDiv = document.createElement('div');
        seatDiv.classList.add('seat', seat.status === 'reserved' ? 'occupied' : 'available');
        seatDiv.textContent = `${seat.row}${seat.number}`;
        seatDiv.dataset.id = seat._id;

        // Evento de selección
        seatDiv.addEventListener('click', () => {
            if (!seatDiv.classList.contains('occupied')) {
                seatDiv.classList.toggle('selected');
            }
        });

        seatsContainer.appendChild(seatDiv);
    });

    container.appendChild(seatsContainer);

    // Botón para confirmar la reserva
    const reserveButton = document.createElement('button');
    reserveButton.textContent = 'Reservar Sillas';
    reserveButton.classList.add('btn', 'btn-success', 'mt-3');
    reserveButton.addEventListener('click', () => reserveSeats(roomId));
    container.appendChild(reserveButton);

    // Botón de volver a la selección de la sala
    const backButton = document.createElement('button');
    backButton.textContent = 'Volver a seleccionar sala';
    backButton.classList.add('btn', 'btn-secondary', 'mt-3');
    backButton.addEventListener('click', fetchRooms);
    container.appendChild(backButton);
}

// Función para reservar las sillas seleccionadas
async function reserveSeats(roomId) {
    const selectedSeats = Array.from(document.querySelectorAll('.seat.selected'))
        .map(seat => seat.dataset.id);

    if (selectedSeats.length === 0) {
        alert('Por favor selecciona al menos una silla.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/rooms/${roomId}/reserve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ seatIds: selectedSeats }),
        });

        const result = await response.json();
        alert(result.message);

        // Volver a cargar las sillas
        viewSeats(roomId);
    } catch (error) {
        console.error('Error al reservar las sillas:', error);
    }
}

// Función para cerrar taquilla y mostrar informes
// Función para cerrar taquilla y mostrar informes
async function closeTickets() {
    try {
        const response = await fetch(`${API_URL}/close-tickets`);
        const report = await response.json();

        // Crear y mostrar los informes
        const container = document.getElementById('rooms-container');
        container.innerHTML = `
            <h2>Informe de Ventas</h2>
            <p><strong>Boletas Vendidas:</strong> ${report.totalTicketsSold}</p>
            <p><strong>Total de Ventas:</strong> $${report.totalRevenue}</p>
            <p><strong>Porcentaje de Ocupación:</strong> ${report.occupancyRate}%</p>
        `;

        // Botón de volver a la selección de la sala
        const backButton = document.createElement('button');
        backButton.textContent = 'Volver a seleccionar sala';
        backButton.classList.add('btn', 'btn-secondary', 'mt-3');
        backButton.addEventListener('click', fetchRooms);
        container.appendChild(backButton);

        // Restaurar las sillas a su estado disponible
        await fetch(`${API_URL}/reset-seats`, { method: 'POST' });

    } catch (error) {
        console.error('Error al cerrar taquilla:', error);
        alert('Error al generar informes.');
    }
}


// Cargar las salas inicialmente
fetchRooms();
