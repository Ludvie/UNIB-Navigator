class MinHeap {
  constructor() {
    this.heap = [];
  }

  push(item) {
    this.heap.push(item);
    this._bubbleUp(this.heap.length - 1);
  }

  pop() {
    const top = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this._sinkDown(0);
    }
    return top;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  _bubbleUp(i) {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.heap[parent].f <= this.heap[i].f) break;
      [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
      i = parent;
    }
  }

  _sinkDown(i) {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (left < n && this.heap[left].f < this.heap[smallest].f) smallest = left;
      if (right < n && this.heap[right].f < this.heap[smallest].f) smallest = right;
      if (smallest === i) break;
      [this.heap[smallest], this.heap[i]] = [this.heap[i], this.heap[smallest]];
      i = smallest;
    }
  }
}

const euclideanDistance = (nodeA, nodeB) => {
  const R = 6371000; // Earth radius in metres
  const lat1 = (nodeA.latitude * Math.PI) / 180;
  const lat2 = (nodeB.latitude * Math.PI) / 180;
  const dLat = ((nodeB.latitude - nodeA.latitude) * Math.PI) / 180;
  const dLng = ((nodeB.longitude - nodeA.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const reconstructPath = (cameFrom, current) => {
  const path = [current];
  while (cameFrom[current] !== undefined) {
    current = cameFrom[current];
    path.unshift(current);
  }
  return path;
};

const estimateTime = (distanceMeters) => {
  const walkingSpeedMps = 1.4; // average walking speed ~5 km/h
  const seconds = distanceMeters / walkingSpeedMps;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} menit`;
};

const astar = (nodes, edges, startId, goalId) => {
  // MENGGUNAKAN HIGH-RESOLUTION TIMER NODE.JS
  const startTime = process.hrtime();

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
      
      // KALKULASI WAKTU PRESISI TINGGI (HASIL DALAM MILIDETIK DENGAN DESIMAL)
      const diff = process.hrtime(startTime);
      const executionTime = parseFloat((diff[0] * 1000 + diff[1] / 1000000).toFixed(3));

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

  // JIKA GAGAL MENEMUKAN JALUR
  const failDiff = process.hrtime(startTime);
  const failExecutionTime = parseFloat((failDiff[0] * 1000 + failDiff[1] / 1000000).toFixed(3));

  return {
    path: [],
    totalDistance: 0,
    nodesVisited,
    executionTime: failExecutionTime,
    success: false,
    message: 'Tidak ditemukan jalur dari node awal ke tujuan',
  };
};

module.exports = { astar, estimateTime, MinHeap, euclideanDistance, reconstructPath };