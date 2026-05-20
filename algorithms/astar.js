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

class MinHeap {
  constructor() {
    this.heap = [];
  }

  push(node) {
    this.heap.push(node);
    this._bubbleUp(this.heap.length - 1);
  }

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

  isEmpty() {
    return this.heap.length === 0;
  }

  _bubbleUp(index) {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.heap[parentIndex].f <= this.heap[index].f) break;
      [this.heap[parentIndex], this.heap[index]] = [this.heap[index], this.heap[parentIndex]];
      index = parentIndex;
    }
  }

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

const euclideanDistance = (nodeA, nodeB) => {
  const toRad = (deg) => deg * (Math.PI / 180);
  const R = 6371000; 
  const dLat = toRad(nodeB.latitude - nodeA.latitude);
  const dLon = toRad(nodeB.longitude - nodeA.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(nodeA.latitude)) *
      Math.cos(toRad(nodeB.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const astar = (nodes, edges, startId, goalId) => {
  const startTime = Date.now();

  if (!startId || !goalId) throw new Error('Start dan goal node harus ditentukan');
  if (startId === goalId) throw new Error('Node awal dan tujuan tidak boleh sama');

  const nodeMap = {};
  nodes.forEach((node) => { nodeMap[node.id_node] = node; });

  if (!nodeMap[startId]) throw new Error(`Node awal dengan ID ${startId} tidak ditemukan`);
  if (!nodeMap[goalId]) throw new Error(`Node tujuan dengan ID ${goalId} tidak ditemukan`);

  const adjacency = {};
  nodes.forEach((node) => { adjacency[node.id_node] = []; });

  edges.forEach((edge) => {
    if (adjacency[edge.from_node]) {
      adjacency[edge.from_node].push({
        nodeId: edge.to_node,
        weight: edge.weight,
      });
    }
  });

  const openSet = new MinHeap();
  const closedSet = new Set();
  const gScore = {};
  const fScore = {};
  const cameFrom = {};

  nodes.forEach((node) => {
    gScore[node.id_node] = Infinity;
    fScore[node.id_node] = Infinity;
  });

  gScore[startId] = 0;
  const hStart = euclideanDistance(nodeMap[startId], nodeMap[goalId]);
  fScore[startId] = hStart;

  openSet.push({ id: startId, f: fScore[startId], g: 0 });

  const nodesVisited = [];

  while (!openSet.isEmpty()) {
    const current = openSet.pop();
    const currentId = current.id;

    nodesVisited.push(currentId);

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

    closedSet.add(currentId);
    const neighbors = adjacency[currentId] || [];

    for (const neighbor of neighbors) {
      const neighborId = neighbor.nodeId;
      if (closedSet.has(neighborId)) continue;

      const tentativeG = gScore[currentId] + neighbor.weight;

      if (tentativeG < gScore[neighborId]) {
        cameFrom[neighborId] = currentId;
        gScore[neighborId] = tentativeG;

        const h = euclideanDistance(nodeMap[neighborId], nodeMap[goalId]);
        fScore[neighborId] = tentativeG + h;

        openSet.push({
          id: neighborId,
          f: fScore[neighborId],
          g: tentativeG,
        });
      }
    }
  }

  return {
    path: [],
    totalDistance: 0,
    nodesVisited,
    executionTime: Date.now() - startTime,
    success: false,
    message: 'Tidak ditemukan jalur dari node awal ke tujuan',
  };
};

const reconstructPath = (cameFrom, currentId) => {
  const path = [currentId];
  while (cameFrom[currentId] !== undefined) {
    currentId = cameFrom[currentId];
    path.unshift(currentId);
  }
  return path;
};

/**
 * Menghitung estimasi waktu berdasarkan jarak dan mode transportasi
 *
 * @param {number} distanceMeters - Jarak dalam meter
 * @param {string} mode - Mode transportasi ('foot', 'bike', 'driving')
 * @returns {string} Estimasi waktu dalam format string
 */
const estimateTime = (distanceMeters, mode = 'foot') => {
  // Kecepatan rata-rata (meter per menit) di lingkungan kampus/kota
  const speeds = {
    foot: 80,      // ~4.8 km/jam (Jalan kaki biasa)
    bike: 300,     // ~18 km/jam (Motor santai dalam kampus)
    driving: 400   // ~24 km/jam (Mobil dalam kampus)
  };

  const speed = speeds[mode] || speeds.foot;
  const minutes = Math.ceil(distanceMeters / speed);

  if (minutes < 1) return 'Kurang dari 1 menit';
  if (minutes === 1) return '1 menit';
  if (minutes < 60) return `${minutes} menit`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `${hours} jam`;
  return `${hours} jam ${remainingMinutes} menit`;
};

module.exports = { astar, euclideanDistance, estimateTime };