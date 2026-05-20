/**
 * database/db.js
 * Koneksi database MySQL menggunakan mysql2/promise
 * Mendukung connection pooling untuk performa optimal
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Konfigurasi koneksi database
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'shortest_path_unib',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
};

// Buat connection pool
const pool = mysql.createPool(dbConfig);

/**
 * Test koneksi database saat aplikasi dijalankan
 */
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database MySQL berhasil terkoneksi');
    connection.release();
  } catch (error) {
    console.error('❌ Gagal koneksi ke database MySQL:', error.message);
    console.error('Pastikan MySQL berjalan dan konfigurasi .env sudah benar');
  }
};

testConnection();

module.exports = pool;
