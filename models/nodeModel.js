/**
 * models/nodeModel.js
 * Model untuk tabel node - lokasi-lokasi di UNIB
 */

const db = require('../database/db');

const NodeModel = {
  /**
   * Ambil semua node dari database
   * @returns {Array} Array of node objects
   */
  getAll: async () => {
    const [rows] = await db.query(
      'SELECT id_node, nama_tempat, latitude, longitude FROM node ORDER BY id_node'
    );
    return rows;
  },

  /**
   * Ambil node berdasarkan ID
   * @param {number} id - ID node
   * @returns {Object} Node object
   */
  getById: async (id) => {
    const [rows] = await db.query(
      'SELECT id_node, nama_tempat, latitude, longitude FROM node WHERE id_node = ?',
      [id]
    );
    return rows[0];
  },

  /**
   * Tambah node baru
   * @param {Object} nodeData - Data node baru
   */
  create: async ({ id_node, nama_tempat, latitude, longitude }) => {
    const [result] = await db.query(
      'INSERT INTO node (id_node, nama_tempat, latitude, longitude) VALUES (?, ?, ?, ?)',
      [id_node, nama_tempat, latitude, longitude]
    );
    return result;
  },
};

module.exports = NodeModel;
