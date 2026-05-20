/**
 * public/js/map.js  —  UNIB Navigator
 * Floating bottom panel, transport modes, A* + OSRM routing
 */

// ==================== State ====================
const AppState = {
  map: null,
  nodes: [],
  edges: [],
  markers: {},
  startNodeId: null,
  endNodeId: null,
  currentPath: null,
  transportMode: 'foot',   // foot | bike | driving
  panelExpanded: false,
  locationPanelOpen: false,
  tileIndex: 0,
};

// ==================== Tile Layers ====================
const tiles = [
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    { attribution:'©OpenStreetMap ©CartoDB', maxZoom:19, subdomains:'abcd' }),
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    { attribution:'©OpenStreetMap', maxZoom:19 }),
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    { attribution:'©Esri', maxZoom:19 }),
];

// ==================== Init Map ====================
const initMap = () => {
  AppState.map = L.map('map', {
    center: [-3.7578, 102.2722],
    zoom: 15,
    zoomControl: false,
    attributionControl: false,
  });
  tiles[0].addTo(AppState.map);
  L.control.attribution({ prefix:false, position:'bottomleft' }).addTo(AppState.map);
};

// ==================== Marker Icons ====================
const makeIcon = (type, id) => {
  const cfg = {
    default:  { bg:'rgba(0,210,180,0.8)',  border:'#00d2b4', shadow:'rgba(0,210,180,0.5)',  txt:'#021510' },
    start:    { bg:'#00d2b4',              border:'#00f5d4', shadow:'rgba(0,210,180,0.8)',  txt:'#021510' },
    end:      { bg:'#f59e0b',              border:'#fcd34d', shadow:'rgba(245,158,11,0.7)', txt:'#1a0a00' },
    path:     { bg:'rgba(0,210,180,0.55)', border:'#00d2b4', shadow:'rgba(0,210,180,0.3)', txt:'#021510' },
  }[type] || { bg:'rgba(0,210,180,0.8)', border:'#00d2b4', shadow:'rgba(0,210,180,0.5)', txt:'#021510' };

  const pulse = (type === 'start' || type === 'end') ? `
    <div style="position:absolute;width:30px;height:30px;border-radius:50%;
      border:2px solid ${cfg.border};
      animation:pulseRing 1.8s ease infinite;
      top:50%;left:50%;transform:translate(-50%,-50%);"></div>` : '';

  return L.divIcon({
    className:'',
    html:`<div style="position:relative;display:flex;align-items:center;justify-content:center;">
      ${pulse}
      <div style="width:28px;height:28px;background:${cfg.bg};border:2px solid ${cfg.border};
        border-radius:50%;box-shadow:0 0 14px ${cfg.shadow},0 2px 6px rgba(0,0,0,0.4);
        display:flex;align-items:center;justify-content:center;
        font-size:10px;font-weight:700;color:${cfg.txt};
        font-family:'Poppins',sans-serif;cursor:pointer;">${id}</div>
    </div>`,
    iconSize:[28,28], iconAnchor:[14,14], popupAnchor:[0,-16],
  });
};

// ==================== Popup ====================
const makePopup = (node) => `
  <div class="popup-body">
    <div class="popup-badge">NODE #${node.id_node}</div>
    <div class="popup-name">${node.nama_tempat}</div>
    <div class="popup-coord">${node.latitude.toFixed(6)}, ${node.longitude.toFixed(6)}</div>
    <div class="popup-actions">
      <button class="pbtn ps" onclick="setStart(${node.id_node})">▶ Awal</button>
      <button class="pbtn pe" onclick="setEnd(${node.id_node})">⚑ Tujuan</button>
    </div>
  </div>`;

const addMarkers = (nodes) => {
  nodes.forEach(node => {
    const m = L.marker([node.latitude, node.longitude], { icon: makeIcon('default', node.id_node) });
    m.bindPopup(makePopup(node), { maxWidth:240, className:'', closeButton:true });
    m.addTo(AppState.map);
    AppState.markers[node.id_node] = m;
  });
};

const updateMarkers = (pathIds = []) => {
  const ps = new Set(pathIds);
  Object.entries(AppState.markers).forEach(([id, m]) => {
    const nid = parseInt(id);
    let t = 'default';
    if (nid === AppState.startNodeId) t = 'start';
    else if (nid === AppState.endNodeId) t = 'end';
    else if (ps.has(nid)) t = 'path';
    m.setIcon(makeIcon(t, nid));
  });
};

// ==================== Global popup handlers ====================
window.setStart = (id) => {
  AppState.startNodeId = id;
  document.getElementById('select-start').value = id;
  updateMarkers();
  showToast(`🟢 ${getNodeName(id)} → Titik Awal`, 'success');
  AppState.map.closePopup();
};
window.setEnd = (id) => {
  AppState.endNodeId = id;
  document.getElementById('select-end').value = id;
  updateMarkers();
  showToast(`🟡 ${getNodeName(id)} → Tujuan`, 'info');
  AppState.map.closePopup();
};

const getNodeName = (id) => AppState.nodes.find(n => n.id_node === parseInt(id))?.nama_tempat || `Node ${id}`;

// ==================== Transport Mode ====================
window.setTransportMode = (mode, btn) => {
  AppState.transportMode = mode;
  document.querySelectorAll('.transport-pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');

  const labels = { foot:'🚶 Jalan Kaki', bike:'🏍️ Motor', driving:'🚗 Mobil' };
  showToast(`Mode: ${labels[mode]}`, 'info');
};

// OSRM profile mapping
const osrmProfile = { foot:'foot', bike:'bike', driving:'driving' };

// ==================== Swap locations ====================
window.swapLocations = () => {
  const tmp = AppState.startNodeId;
  AppState.startNodeId = AppState.endNodeId;
  AppState.endNodeId = tmp;
  document.getElementById('select-start').value = AppState.startNodeId || '';
  document.getElementById('select-end').value   = AppState.endNodeId   || '';
  updateMarkers();
  if (AppState.startNodeId || AppState.endNodeId) showToast('↕ Lokasi ditukar', 'info');
};

// ==================== Panel expand ====================
window.togglePanelExpand = () => {
  AppState.panelExpanded = !AppState.panelExpanded;
  document.getElementById('panel-expanded').classList.toggle('open', AppState.panelExpanded);
};

const openPanel = () => {
  AppState.panelExpanded = true;
  document.getElementById('panel-expanded').classList.add('open');
};

// ==================== Find Path ====================
window.findPath = async () => {
  const startId = parseInt(document.getElementById('select-start').value);
  const endId   = parseInt(document.getElementById('select-end').value);

  if (!startId || !endId)       { showToast('⚠️ Pilih titik awal dan tujuan', 'error'); return; }
  if (startId === endId)        { showToast('⚠️ Awal dan tujuan tidak boleh sama', 'error'); return; }

  AppState.startNodeId = startId;
  AppState.endNodeId   = endId;
  showLoading(true, 'Algoritma A* sedang berjalan...');
  Animation.clearAll(AppState.map);
  clearResult();

  try {
    // 1. A* backend
    const result = await API.findShortestPath(startId, endId);
    AppState.currentPath = result;
    updateMarkers(result.path);

    // 2. OSRM — hanya start & goal untuk rute jalan nyata
    const sn = result.path_names[0];
    const gn = result.path_names[result.path_names.length - 1];
    const profile = osrmProfile[AppState.transportMode] || 'foot';
    const osrmUrl = `https://router.project-osrm.org/route/v1/${profile}/${sn.lng},${sn.lat};${gn.lng},${gn.lat}?overview=full&geometries=geojson`;

    let roadCoords;
    try {
      showLoading(true, 'Mengambil jalur jalan nyata...');
      const r = await fetch(osrmUrl);
      const d = await r.json();
      if (d.code === 'Ok' && d.routes[0]) {
        roadCoords = d.routes[0].geometry.coordinates.map(c => ({ lat:c[1], lng:c[0] }));
      } else throw new Error('no route');
    } catch {
      roadCoords = result.path_names.map(p => ({ lat:p.lat, lng:p.lng }));
    }

    // 3. Animasi
    Animation.animatePolyline(AppState.map, roadCoords);
    setTimeout(() => Animation.zoomToRoute(AppState.map, roadCoords), 300);
    setTimeout(() => Animation.animateMarkerAlongPath(AppState.map, roadCoords, (si) => {
      const ratio = si / roadCoords.length;
      const ni = Math.floor(ratio * result.path_names.length);
      document.querySelectorAll('.path-step').forEach((el, i) => el.classList.toggle('active', i === ni));
    }), 1000);

    // 4. Render result
    renderResult(result);
    openPanel();
    showResetFab(true);
    showToast(`✅ ${result.path.length} lokasi · ${result.distance}m · ${result.estimated_time}`, 'success');

  } catch(err) {
    showToast(`❌ ${err.message}`, 'error');
  } finally {
    showLoading(false);
  }
};

// ==================== Render Result ====================
const renderResult = (result) => {
  const speedLabel = { foot:'Berjalan kaki', bike:'Berkendara motor', driving:'Berkendara mobil' };
  const panel = document.getElementById('result-panel');

  panel.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card" style="animation-delay:.0s">
        <div class="stat-lbl">Jarak</div>
        <div class="stat-val">${result.distance}</div>
        <div class="stat-unit">meter</div>
      </div>
      <div class="stat-card" style="animation-delay:.06s">
        <div class="stat-lbl">Waktu</div>
        <div class="stat-val amber sm">${result.estimated_time}</div>
        <div class="stat-unit">${speedLabel[AppState.transportMode]}</div>
      </div>
      <div class="stat-card" style="animation-delay:.12s">
        <div class="stat-lbl">Simpul</div>
        <div class="stat-val">${result.path.length}</div>
        <div class="stat-unit">lokasi</div>
      </div>
      <div class="stat-card" style="animation-delay:.18s">
        <div class="stat-lbl">Runtime</div>
        <div class="stat-val sm">${result.execution_time_ms}ms</div>
        <div class="stat-unit">A* algo</div>
      </div>
    </div>
    <div class="path-label">Rute Perjalanan</div>
    <div class="path-steps">
      ${result.path_names.map((n, i) => {
        const isS = i === 0, isE = i === result.path_names.length - 1;
        return `<div class="path-step" style="animation-delay:${i*.04}s" onclick="flyToNode(${n.id})">
          <div class="step-num ${isS?'s':isE?'e':''}">${i+1}</div>
          <div class="step-name">${n.name}</div>
          ${!isE ? '<div class="step-arr">↓</div>' : ''}
        </div>`;
      }).join('')}
    </div>`;
};

const clearResult = () => {
  document.getElementById('result-panel').innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">⚡</div>
      <div class="empty-title">Menghitung...</div>
    </div>`;
};

window.flyToNode = (id) => {
  const m = AppState.markers[id];
  if (!m) return;
  AppState.map.flyTo(m.getLatLng(), 17, { duration:1 });
  setTimeout(() => m.openPopup(), 1100);
};

// ==================== Reset ====================
window.resetRoute = () => {
  AppState.startNodeId = null;
  AppState.endNodeId   = null;
  AppState.currentPath = null;
  document.getElementById('select-start').value = '';
  document.getElementById('select-end').value   = '';
  Animation.clearAll(AppState.map);
  updateMarkers();
  document.getElementById('result-panel').innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">🗺️</div>
      <div class="empty-title">Siap Navigasi</div>
      <div class="empty-desc">Pilih titik awal & tujuan lalu tekan Cari</div>
    </div>`;
  AppState.panelExpanded = false;
  document.getElementById('panel-expanded').classList.remove('open');
  showResetFab(false);
  showToast('🔄 Rute direset', 'info');
};

// ==================== Dropdowns ====================
const fillDropdowns = (nodes) => {
  const s = document.getElementById('select-start');
  const e = document.getElementById('select-end');
  const def = '<option value="">Pilih Lokasi</option>';
  s.innerHTML = def; e.innerHTML = def;
  nodes.forEach(n => {
    const o = `<option value="${n.id_node}">${n.id_node}. ${n.nama_tempat}</option>`;
    s.innerHTML += o; e.innerHTML += o;
  });
  s.addEventListener('change', () => { AppState.startNodeId = parseInt(s.value)||null; updateMarkers(); });
  e.addEventListener('change', () => { AppState.endNodeId   = parseInt(e.value)||null; updateMarkers(); });
};

// ==================== Location List ====================
const fillLocations = (nodes) => {
  const icons = ['🏛','🏢','🏗','📚','⚽','🔬','🏥','🕌','💧','🎓','🏟','⚙️','📐','🌿','🏋','🖥','🌊','💊','🔭','🌾','🏀','🚪','🏟'];
  document.getElementById('location-list').innerHTML = nodes.map((n,i) => `
    <div class="location-item" onclick="flyToNode(${n.id_node})">
      <div class="loc-icon">${icons[i % icons.length]}</div>
      <div>
        <div class="loc-name">${n.nama_tempat}</div>
        <div class="loc-id">NODE #${n.id_node}</div>
      </div>
    </div>`).join('');

  document.getElementById('location-search').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('.location-item').forEach(el => {
      el.style.display = el.querySelector('.loc-name').textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });
};

// ==================== UI helpers ====================
window.toggleLocationPanel = () => {
  AppState.locationPanelOpen = !AppState.locationPanelOpen;
  document.getElementById('location-panel').classList.toggle('open', AppState.locationPanelOpen);
};

window.toggleMapLayer = () => {
  tiles[AppState.tileIndex].remove();
  AppState.tileIndex = (AppState.tileIndex + 1) % tiles.length;
  tiles[AppState.tileIndex].addTo(AppState.map);
  const names = ['🌑 Dark', '🗺️ Street', '🛰️ Satellite'];
  showToast(`Layer: ${names[AppState.tileIndex]}`, 'info');
};

window.getCurrentLocation = () => {
  if (!navigator.geolocation) { showToast('❌ Geolocation tidak didukung', 'error'); return; }
  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude: lat, longitude: lng } = pos.coords;
    AppState.map.flyTo([lat, lng], 17, { duration:1.5 });
    L.marker([lat, lng], { icon: L.divIcon({
      className:'',
      html:`<div style="width:14px;height:14px;background:#3b82f6;border:3px solid #fff;border-radius:50%;box-shadow:0 0 16px #3b82f6;"></div>`,
      iconSize:[14,14], iconAnchor:[7,7],
    }) }).addTo(AppState.map).bindPopup('📍 Lokasi Anda').openPopup();
    showToast('📡 Lokasi ditemukan', 'success');
  }, () => showToast('❌ Tidak bisa akses lokasi', 'error'));
};

window.zoomToRoute = () => {
  if (AppState.currentPath) {
    const coords = AppState.currentPath.path_names.map(p => ({ lat:p.lat, lng:p.lng }));
    Animation.zoomToRoute(AppState.map, coords);
  } else {
    AppState.map.flyTo([-3.7578, 102.2722], 15, { duration:1.5 });
  }
};

const showResetFab = (v) => {
  document.getElementById('reset-fab').classList.toggle('visible', v);
};

// ==================== Toast ====================
window.showToast = (msg, type='info') => {
  const c = document.getElementById('toast-container');
  const ic = { success:'✅', error:'❌', info:'💡' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${ic[type]||'💬'}</span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3700);
};

// ==================== Loading ====================
const showLoading = (show, sub='') => {
  document.getElementById('loading-overlay').classList.toggle('active', show);
  document.getElementById('search-btn').disabled = show;
  if (sub) document.getElementById('loading-sub').textContent = sub;
};

// ==================== Init App ====================
const initApp = async () => {
  showLoading(true, 'Memuat data kampus UNIB...');
  try {
    initMap();
    const [nodes, edges] = await Promise.all([API.getNodes(), API.getEdges()]);
    AppState.nodes = nodes;
    AppState.edges = edges;
    addMarkers(nodes);
    fillDropdowns(nodes);
    fillLocations(nodes);
    showToast(`🗺️ ${nodes.length} lokasi UNIB dimuat`, 'success');
  } catch(err) {
    showToast(`❌ Gagal memuat: ${err.message}`, 'error');
  } finally {
    showLoading(false);
  }
};

document.addEventListener('DOMContentLoaded', initApp);
