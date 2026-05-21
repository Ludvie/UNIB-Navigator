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