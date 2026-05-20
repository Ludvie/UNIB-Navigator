/**
 * models/edgeModel.js
 * Model untuk tabel edge - koneksi antar lokasi di UNIB
 */

const db = require('../database/db');

const EdgeModel = {
  /**
   * Ambil semua edge dari database
   * @returns {Array} Array of edge objects
   */
  getAll: async () => {
    const [rows] = await db.query(
      'SELECT id_edge, from_node, to_node, weight FROM edge ORDER BY id_edge'
    );
    return rows;
  },

  /**
   * Ambil edge berdasarkan node asal
   * @param {number} fromNode - ID node asal
   * @returns {Array} Array of edge objects
   */
  getByFromNode: async (fromNode) => {
    const [rows] = await db.query(
      'SELECT id_edge, from_node, to_node, weight FROM edge WHERE from_node = ?',
      [fromNode]
    );
    return rows;
  },

  /**
   * Tambah edge baru
   * @param {Object} edgeData - Data edge baru
   */
  create: async ({ from_node, to_node, weight }) => {
    const [result] = await db.query(
      'INSERT INTO edge (from_node, to_node, weight) VALUES (?, ?, ?)',
      [from_node, to_node, weight]
    );
    return result;
  },
};

module.exports = EdgeModel;
