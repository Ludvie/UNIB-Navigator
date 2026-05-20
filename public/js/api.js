/**
 * public/js/api.js
 * Modul untuk komunikasi dengan backend API
 * Menggunakan Fetch API dengan async/await
 */

const BASE_URL = window.location.origin;

const API = {
  /**
   * Fetch semua node/lokasi dari server
   * @returns {Array} Array of node objects
   */
  getNodes: async () => {
    const response = await fetch(`${BASE_URL}/api/nodes`);
    if (!response.ok) throw new Error(`HTTP ${response.status}: Gagal mengambil data nodes`);
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  /**
   * Fetch semua edge dari server
   * @returns {Array} Array of edge objects
   */
  getEdges: async () => {
    const response = await fetch(`${BASE_URL}/api/edges`);
    if (!response.ok) throw new Error(`HTTP ${response.status}: Gagal mengambil data edges`);
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  /**
   * Request shortest path dari server
   * @param {number} startId - ID node awal
   * @param {number} goalId - ID node tujuan
   * @returns {Object} Result dengan path, distance, dll
   */
  findShortestPath: async (startId, goalId) => {
    const response = await fetch(`${BASE_URL}/api/shortest-path`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start: startId, goal: goalId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    if (!data.success) {
      throw new Error(data.message || 'Jalur tidak ditemukan');
    }

    return data;
  },

  /**
   * Ambil hasil accuracy test
   * @returns {Object} Accuracy test results
   */
  getAccuracyTest: async () => {
    const response = await fetch(`${BASE_URL}/api/accuracy-test`);
    const data = await response.json();
    return data;
  },
};

window.API = API;
