/**
 * server.js
 * Entry point aplikasi Shortest Path UNIB
 * Menggunakan Express.js sebagai web framework
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== Middleware ====================
app.use(cors()); // Izinkan cross-origin requests
app.use(express.json()); // Parse JSON body
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded body

// Serve static files dari folder public
app.use(express.static(path.join(__dirname, 'public')));

// ==================== Routes ====================
// API Routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Serve halaman utama
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} tidak ditemukan`,
  });
});

// Error handler global
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: err.message,
  });
});

// ==================== Start Server ====================
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║     🗺️  SHORTEST PATH UNIB - A* Algorithm     ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`✅ Server berjalan di: http://localhost:${PORT}`);
  console.log(`📍 API Nodes:          http://localhost:${PORT}/api/nodes`);
  console.log(`🔗 API Edges:          http://localhost:${PORT}/api/edges`);
  console.log(`🧭 API Shortest Path:  http://localhost:${PORT}/api/shortest-path`);
  console.log(`📊 Accuracy Test:      http://localhost:${PORT}/api/accuracy-test`);
  console.log('');
});

module.exports = app;
