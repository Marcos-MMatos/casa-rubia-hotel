/*
 * Simple Express server for Casa Rubia.
 *
 * This server exposes a minimal REST API to manage reservations
 * and provide room data. It uses SQLite for persistence. To run
 * the server locally you will need Node.js installed along with
 * the dependencies listed in package.json (express, sqlite3 and
 * cors). After starting the server with `node server.js`, the
 * API will be available at http://localhost:3000.
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize SQLite database
const db = new sqlite3.Database('reservas.db');

db.serialize(() => {
  // Create reservations table if it doesn't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      roomId INTEGER NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      checkIn TEXT NOT NULL,
      checkOut TEXT NOT NULL,
      created TEXT NOT NULL
    );
  `);
});

// Define the rooms available in the hotel
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

// Endpoint to list all rooms
app.get('/api/rooms', (req, res) => {
  res.json(rooms);
});

// Endpoint to fetch reservations. Optionally accepts query
// parameters `checkIn` and `checkOut` (ISO date strings) to
// filter reservations that overlap a date range.
app.get('/api/reservations', (req, res) => {
  let sql = 'SELECT * FROM reservations';
  const params = [];
  const { checkIn, checkOut } = req.query;
  if (checkIn && checkOut) {
    sql += ' WHERE NOT (checkOut <= ? OR checkIn >= ?)';
    params.push(checkIn, checkOut);
  }
  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Endpoint to create a new reservation. Expects JSON body
// { roomId, name, email, phone, checkIn, checkOut }.
app.post('/api/reservations', (req, res) => {
  const { roomId, name, email, phone, checkIn, checkOut } = req.body;
  if (!roomId || !name || !email || !phone || !checkIn || !checkOut) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }
  const stmt = db.prepare(`
    INSERT INTO reservations (roomId, name, email, phone, checkIn, checkOut, created)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `);
  stmt.run(roomId, name, email, phone, checkIn, checkOut, function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al guardar la reserva' });
    }
    res.json({ id: this.lastID });
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor Casa Rubia escuchando en el puerto ${PORT}`);
});