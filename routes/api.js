/**
 * routes/api.js
 * Definisi semua endpoint API REST
 *
 * Endpoints:
 * - GET  /api/nodes         → Ambil semua lokasi
 * - GET  /api/edges         → Ambil semua koneksi
 * - POST /api/shortest-path → Hitung jalur terpendek A*
 */

const express = require('express');
const router = express.Router();
const NodeModel = require('../models/nodeModel');
const EdgeModel = require('../models/edgeModel');
const { astar, estimateTime } = require('../algorithms/astar');

/**
 * GET /api/nodes
 * Mengambil semua node (lokasi) dari database
 */
router.get('/nodes', async (req, res) => {
  try {
    const nodes = await NodeModel.getAll();

    res.json({
      success: true,
      count: nodes.length,
      data: nodes,
    });
  } catch (error) {
    console.error('Error GET /api/nodes:', error.message);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data nodes',
      error: error.message,
    });
  }
});

/**
 * GET /api/edges
 * Mengambil semua edge (koneksi) dari database
 */
router.get('/edges', async (req, res) => {
  try {
    const edges = await EdgeModel.getAll();

    res.json({
      success: true,
      count: edges.length,
      data: edges,
    });
  } catch (error) {
    console.error('Error GET /api/edges:', error.message);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data edges',
      error: error.message,
    });
  }
});

/**
 * POST /api/shortest-path
 * Menghitung jalur terpendek menggunakan algoritma A*
 *
 * Request Body:
 * { "start": 1, "goal": 10 }
 *
 * Response:
 * {
 *   "path": [1, 20, 3, ...],
 *   "distance": 1850,
 *   "estimated_time": "7 menit",
 *   "nodes_visited": [...],
 *   "path_names": [...]
 * }
 */
router.post('/shortest-path', async (req, res) => {
  try {
    const { start, goal } = req.body;

    // Validasi input
    if (!start || !goal) {
      return res.status(400).json({
        success: false,
        message: 'Parameter "start" dan "goal" harus diisi',
      });
    }

    const startId = parseInt(start);
    const goalId = parseInt(goal);

    if (isNaN(startId) || isNaN(goalId)) {
      return res.status(400).json({
        success: false,
        message: 'Parameter "start" dan "goal" harus berupa angka',
      });
    }

    if (startId === goalId) {
      return res.status(400).json({
        success: false,
        message: 'Node awal dan tujuan tidak boleh sama',
      });
    }

    // Ambil data node dan edge dari database
    const [nodes, edges] = await Promise.all([NodeModel.getAll(), EdgeModel.getAll()]);

    // Jalankan algoritma A*
    const result = astar(nodes, edges, startId, goalId);

    if (!result.success || result.path.length === 0) {
      return res.status(404).json({
        success: false,
        message: result.message || 'Jalur tidak ditemukan antara dua lokasi tersebut',
      });
    }

    // Buat map node untuk referensi nama
    const nodeMap = {};
    nodes.forEach((node) => {
      nodeMap[node.id_node] = node;
    });

    // Buat array nama lokasi yang dilewati
    const pathNames = result.path.map((nodeId) => ({
      id: nodeId,
      name: nodeMap[nodeId]?.nama_tempat || `Node ${nodeId}`,
      lat: nodeMap[nodeId]?.latitude,
      lng: nodeMap[nodeId]?.longitude,
    }));

    // Hitung jarak total (dalam meter)
    const totalDistance = Math.round(result.totalDistance);

    // Estimasi waktu berjalan kaki
    const estimatedTime = estimateTime(totalDistance);

    // Format response
    const response = {
      success: true,
      path: result.path,
      path_names: pathNames,
      distance: totalDistance,
      estimated_time: estimatedTime,
      nodes_visited: result.nodesVisited,
      total_nodes_visited: result.nodesVisited.length,
      execution_time_ms: result.executionTime,
      start: {
        id: startId,
        name: nodeMap[startId]?.nama_tempat,
      },
      goal: {
        id: goalId,
        name: nodeMap[goalId]?.nama_tempat,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error POST /api/shortest-path:', error.message);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghitung jalur terpendek',
      error: error.message,
    });
  }
});

/**
 * GET /api/accuracy-test
 * Endpoint untuk menghitung akurasi sistem berdasarkan graph UNIB
 * Membandingkan hasil A* dengan jalur referensi yang diketahui
 */
router.get('/accuracy-test', async (req, res) => {
  try {
    const [nodes, edges] = await Promise.all([NodeModel.getAll(), EdgeModel.getAll()]);

    // Test cases dengan jalur referensi yang diketahui
    const testCases = [
      { start: 1, goal: 10, expectedPath: [1, 20, 3, 4, 5, 14, 15, 16, 12, 9, 13, 18, 6, 19, 11, 17, 8, 10] },
      { start: 22, goal: 7, expectedPath: [22, 21, 23, 2, 1, 20, 3, 4, 5, 14, 15, 16, 12, 9, 13, 18, 6, 19, 11, 7] },
      { start: 3, goal: 11, expectedPath: [3, 4, 5, 14, 15, 16, 12, 9, 13, 18, 6, 19, 11] },
    ];

    const results = [];
    let correctCount = 0;

    for (const tc of testCases) {
      const result = astar(nodes, edges, tc.start, tc.goal);
      const isCorrect = JSON.stringify(result.path) === JSON.stringify(tc.expectedPath);
      if (isCorrect) correctCount++;

      const nodeMap = {};
      nodes.forEach((n) => (nodeMap[n.id_node] = n));

      results.push({
        start: nodeMap[tc.start]?.nama_tempat,
        goal: nodeMap[tc.goal]?.nama_tempat,
        expected_path: tc.expectedPath,
        actual_path: result.path,
        distance: result.totalDistance,
        is_correct: isCorrect,
        status: isCorrect ? '✅ Akurat' : '❌ Berbeda',
      });
    }

    const accuracy = ((correctCount / testCases.length) * 100).toFixed(2);

    res.json({
      success: true,
      accuracy: `${accuracy}%`,
      total_tests: testCases.length,
      correct: correctCount,
      results,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
