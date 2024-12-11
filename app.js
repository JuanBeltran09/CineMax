const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));


// Conexión a MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Conexión exitosa a MongoDB Atlas"))
    .catch((error) => console.error("Error al conectar a MongoDB:", error));

// Modelos
const Room = require('./models/Room');
const Seat = require('./models/Seat');
const Sale = require('./models/Sale');


// Rutas
app.get('/rooms', async (req, res) => {
    const rooms = await Room.find();
    res.json(rooms);
});

app.get('/rooms/:roomId/seats', async (req, res) => {
    const { roomId } = req.params;
    const seats = await Seat.find({ roomId });
    res.json(seats);
});

app.post('/rooms/:roomId/reserve', async (req, res) => {
    const { roomId } = req.params;
    const { seatIds } = req.body;

    const reservedSeats = [];
    const sales = []; // Array para almacenar las ventas

    try {
        for (const seatId of seatIds) {
            const seat = await Seat.findById(seatId);

            // Verificar si la silla está disponible
            if (seat && seat.status === 'available') {
                // Cambiar estado a "reserved"
                seat.status = 'reserved';
                await seat.save();
                reservedSeats.push(seat);

                // Registrar la venta en la colección "Sale"
                sales.push({
                    seatId: seat._id,
                    roomId: roomId,
                    amount: 10, // Precio fijo de la boleta (puedes ajustarlo según sea necesario)
                });
            } else {
                return res.status(400).json({ error: `Seat ${seatId} is not available` });
            }
        }

        // Guardar las ventas en la base de datos
        if (sales.length > 0) {
            await Sale.insertMany(sales);
        }

        // Responder con las sillas reservadas
        res.json({ reservedSeats, message: 'Sillas reservadas con éxito.' });
    } catch (error) {
        console.error('Error al reservar sillas:', error);
        res.status(500).json({ error: 'Error al reservar sillas' });
    }
});

// Endpoint para resetear todas las sillas a "disponible"
app.post('/reset-seats', async (req, res) => {
    try {
        // Cambiar el estado de todas las sillas a "available"
        await Seat.updateMany({}, { status: 'available' });
        res.json({ message: 'Todas las sillas han sido restauradas a estado disponible.' });
    } catch (error) {
        console.error('Error al restaurar las sillas:', error);
        res.status(500).json({ error: 'Hubo un error al restaurar las sillas.' });
    }
});


// Endpoint para cerrar la taquilla y obtener informes
app.post('/close-tickets', async (req, res) => {
    try {
        // Restablecer las sillas a "disponible"
        await Seat.updateMany({}, { status: 'available' });

        // Borrar las ventas anteriores
        await Sale.deleteMany({}); // Elimina todas las ventas previas

        // Calcular el número de ventas y el total de ventas
        const sales = await Sale.aggregate([
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: "$amount" },
                    totalTickets: { $sum: 1 },
                },
            },
        ]);

        // Calcular el porcentaje de ocupación
        const totalSeats = await Seat.countDocuments({});
        const soldTickets = sales[0] ? sales[0].totalTickets : 0;
        const occupancyRate = totalSeats > 0 ? (soldTickets / totalSeats) * 100 : 0;

        res.json({
            totalTicketsSold: soldTickets,
            totalRevenue: sales[0] ? sales[0].totalSales : 0,
            occupancyRate: occupancyRate.toFixed(2),
        });
    } catch (error) {
        console.error('Error al cerrar taquilla:', error);
        res.status(500).json({ error: 'Hubo un error al cerrar la taquilla.' });
    }
});

app.get('/close-tickets', async (req, res) => {
    try {
        // Obtener todas las ventas
        const sales = await Sale.find({});
        const totalTicketsSold = sales.length;

        // Calcular el total de ventas
        const totalRevenue = sales.reduce((sum, sale) => sum + sale.amount, 0);

        // Calcular el porcentaje de ocupación
        const allRooms = await Room.find({});
        const totalSeats = allRooms.reduce((sum, room) => sum + room.capacity, 0);
        const occupiedSeats = await Seat.countDocuments({ status: 'reserved' });
        const occupancyRate = ((occupiedSeats / totalSeats) * 100).toFixed(2);

        // Enviar respuesta
        res.json({
            totalTicketsSold,
            totalRevenue,
            occupancyRate: `${occupancyRate}%`,
        });
    } catch (error) {
        console.error('Error al cerrar taquilla:', error);
        res.status(500).json({ message: 'Error al generar informes' });
    }
});

// Puerto de escucha
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
