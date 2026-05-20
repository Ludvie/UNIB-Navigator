/**
 * algorithms/astar.js
 * Implementasi Algoritma A* (A-Star Search Algorithm)
 * untuk mencari jalur terpendek pada graph UNIB
 *
 * Formula: f(n) = g(n) + h(n)
 * - g(n): biaya aktual dari node awal ke node n
 * - h(n): estimasi biaya dari node n ke tujuan (heuristic)
 * - f(n): total estimasi biaya jalur melalui node n
 *
 * Heuristic: Euclidean Distance
 * d = sqrt((x2-x1)^2 + (y2-y1)^2)
 */

/**
 * Kelas MinHeap (Priority Queue) untuk efisiensi A*
 * Menyimpan node berdasarkan nilai f(n) terkecil
 */
class MinHeap {
  constructor() {
    this.heap = [];
  }

  // Tambah node ke heap
  push(node) {
    this.heap.push(node);
    this._bubbleUp(this.heap.length - 1);
  }

  // Ambil node dengan f(n) terkecil
  pop() {
    if (this.heap.length === 0) return null;
    const min = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this._sinkDown(0);
    }
    return min;
  }

  // Cek apakah heap kosong
  isEmpty() {
    return this.heap.length === 0;
  }

  // Bubble up untuk mempertahankan properti min-heap
  _bubbleUp(index) {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.heap[parentIndex].f <= this.heap[index].f) break;
      [this.heap[parentIndex], this.heap[index]] = [this.heap[index], this.heap[parentIndex]];
      index = parentIndex;
    }
  }

  // Sink down untuk mempertahankan properti min-heap
  _sinkDown(index) {
    const length = this.heap.length;
    while (true) {
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      let smallest = index;

      if (left < length && this.heap[left].f < this.heap[smallest].f) {
        smallest = left;
      }
      if (right < length && this.heap[right].f < this.heap[smallest].f) {
        smallest = right;
      }
      if (smallest === index) break;
      [this.heap[smallest], this.heap[index]] = [this.heap[index], this.heap[smallest]];
      index = smallest;
    }
  }
}

/**
 * Menghitung jarak Euclidean antara dua titik koordinat
 * Mengkonversi koordinat lat/lng ke meter (aproksimasi)
 *
 * @param {Object} nodeA - Node A dengan latitude dan longitude
 * @param {Object} nodeB - Node B dengan latitude dan longitude
 * @returns {number} Jarak dalam meter
 */
const euclideanDistance = (nodeA, nodeB) => {
  // Konversi derajat ke radian
  const toRad = (deg) => deg * (Math.PI / 180);

  const R = 6371000; // Radius bumi dalam meter
  const dLat = toRad(nodeB.latitude - nodeA.latitude);
  const dLon = toRad(nodeB.longitude - nodeA.longitude);

  // Haversine formula untuk jarak geodetik yang lebih akurat
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(nodeA.latitude)) *
      Math.cos(toRad(nodeB.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Algoritma A* untuk mencari jalur terpendek
 *
 * @param {Array} nodes - Array semua node [{id_node, nama_tempat, latitude, longitude}]
 * @param {Array} edges - Array semua edge [{from_node, to_node, weight}]
 * @param {number} startId - ID node awal
 * @param {number} goalId - ID node tujuan
 * @returns {Object} Hasil: {path, totalDistance, nodesVisited, executionTime}
 */
const astar = (nodes, edges, startId, goalId) => {
  const startTime = Date.now();

  // Validasi input
  if (!startId || !goalId) {
    throw new Error('Start dan goal node harus ditentukan');
  }

  if (startId === goalId) {
    throw new Error('Node awal dan tujuan tidak boleh sama');
  }

  // Buat map node berdasarkan ID untuk akses cepat O(1)
  const nodeMap = {};
  nodes.forEach((node) => {
    nodeMap[node.id_node] = node;
  });

  // Validasi node awal dan tujuan ada di graph
  if (!nodeMap[startId]) {
    throw new Error(`Node awal dengan ID ${startId} tidak ditemukan`);
  }
  if (!nodeMap[goalId]) {
    throw new Error(`Node tujuan dengan ID ${goalId} tidak ditemukan`);
  }

  // Buat adjacency list dari edges untuk akses cepat
  const adjacency = {};
  nodes.forEach((node) => {
    adjacency[node.id_node] = [];
  });

  edges.forEach((edge) => {
    if (adjacency[edge.from_node]) {
      adjacency[edge.from_node].push({
        nodeId: edge.to_node,
        weight: edge.weight,
      });
    }
  });

  // Inisialisasi data struktur A*
  const openSet = new MinHeap(); // Priority queue untuk node yang akan dieksplorasi
  const closedSet = new Set(); // Set node yang sudah dieksplorasi
  const gScore = {}; // g(n): biaya aktual dari start ke node n
  const fScore = {}; // f(n) = g(n) + h(n)
  const cameFrom = {}; // Untuk rekonstruksi jalur

  // Inisialisasi semua score sebagai Infinity
  nodes.forEach((node) => {
    gScore[node.id_node] = Infinity;
    fScore[node.id_node] = Infinity;
  });

  // Set nilai awal untuk node start
  gScore[startId] = 0;
  const hStart = euclideanDistance(nodeMap[startId], nodeMap[goalId]);
  fScore[startId] = hStart;

  // Masukkan node start ke open set
  openSet.push({
    id: startId,
    f: fScore[startId],
    g: 0,
  });

  const nodesVisited = []; // Catat urutan node yang dikunjungi

  // Loop utama A*
  while (!openSet.isEmpty()) {
    const current = openSet.pop();
    const currentId = current.id;

    // Catat node yang dikunjungi
    nodesVisited.push(currentId);

    // Jika sudah mencapai tujuan, rekonstruksi jalur
    if (currentId === goalId) {
      const path = reconstructPath(cameFrom, currentId);
      const executionTime = Date.now() - startTime;

      return {
        path,
        totalDistance: gScore[goalId],
        nodesVisited,
        executionTime,
        success: true,
      };
    }

    // Tandai node sebagai sudah dieksplorasi
    closedSet.add(currentId);

    // Eksplorasi tetangga (neighbor nodes)
    const neighbors = adjacency[currentId] || [];

    for (const neighbor of neighbors) {
      const neighborId = neighbor.nodeId;

      // Skip jika tetangga sudah dieksplorasi
      if (closedSet.has(neighborId)) continue;

      // Hitung g(n) untuk tetangga melalui node saat ini
      const tentativeG = gScore[currentId] + neighbor.weight;

      // Jika jalur ini lebih baik dari sebelumnya
      if (tentativeG < gScore[neighborId]) {
        // Update jalur terbaik
        cameFrom[neighborId] = currentId;
        gScore[neighborId] = tentativeG;

        // Hitung h(n) menggunakan Euclidean distance
        const h = euclideanDistance(nodeMap[neighborId], nodeMap[goalId]);

        // Hitung f(n) = g(n) + h(n)
        fScore[neighborId] = tentativeG + h;

        // Masukkan ke open set
        openSet.push({
          id: neighborId,
          f: fScore[neighborId],
          g: tentativeG,
        });
      }
    }
  }

  // Jika open set kosong dan tujuan belum tercapai
  return {
    path: [],
    totalDistance: 0,
    nodesVisited,
    executionTime: Date.now() - startTime,
    success: false,
    message: 'Tidak ditemukan jalur dari node awal ke tujuan',
  };
};

/**
 * Rekonstruksi jalur dari node tujuan ke node awal
 * Menggunakan backtracking dari map cameFrom
 *
 * @param {Object} cameFrom - Map parent setiap node
 * @param {number} currentId - Node tujuan
 * @returns {Array} Array ID node yang membentuk jalur
 */
const reconstructPath = (cameFrom, currentId) => {
  const path = [currentId];
  while (cameFrom[currentId] !== undefined) {
    currentId = cameFrom[currentId];
    path.unshift(currentId);
  }
  return path;
};

/**
 * Menghitung estimasi waktu berdasarkan jarak
 * Kecepatan rata-rata berjalan kaki: 80 meter/menit
 *
 * @param {number} distanceMeters - Jarak dalam meter
 * @returns {string} Estimasi waktu dalam format string
 */
const estimateTime = (distanceMeters) => {
  const walkingSpeed = 80; // meter per menit
  const minutes = Math.ceil(distanceMeters / walkingSpeed);

  if (minutes < 1) return 'Kurang dari 1 menit';
  if (minutes === 1) return '1 menit';
  if (minutes < 60) return `${minutes} menit`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `${hours} jam`;
  return `${hours} jam ${remainingMinutes} menit`;
};

module.exports = { astar, euclideanDistance, estimateTime };
