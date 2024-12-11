const mongoose = require('mongoose');
const Room = require('./models/Room');
const Seat = require('./models/Seat');
require('dotenv').config();


mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log("Conectado a MongoDB");

        // Crear una sala
        const room = new Room({ name: "Sala 1", capacity: 50 });
        await room.save();

        // Crear asientos para la sala
        const seats = [];
        const rows = ['A', 'B', 'C', 'D', 'E']; // Puedes personalizar la cantidad de filas
        const seatsPerRow = Math.ceil(room.capacity / rows.length);

        for (let i = 0; i < rows.length; i++) {
            for (let j = 1; j <= seatsPerRow; j++) {
                const seatNumber = i * seatsPerRow + j; // Asignación del número único del asiento
                if (seatNumber > room.capacity) break; // No superar la capacidad de la sala
                seats.push({
                    roomId: room._id,
                    number: seatNumber, // O usa `j` si prefieres reiniciar en cada fila
                    row: rows[i], // Asigna la fila actual
                    status: 'available',
                });
            }
        }
        await Seat.insertMany(seats);

        console.log("Datos de prueba insertados");
        mongoose.connection.close();
    })
    .catch((error) => console.error("Error:", error));
