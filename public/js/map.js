/**
 * public/js/map.js  —  UNIB Navigator
 * Floating bottom panel, transport modes, A* + OSRM routing, Custom Dropdowns
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
  transportMode: 'foot',
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

// ==================== Marker Icons & Popup ====================
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
        font-family:var(--font-display);cursor:pointer;">${id}</div>
    </div>`,
    iconSize:[28,28], iconAnchor:[14,14], popupAnchor:[0,-16],
  });
};

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

const getNodeName = (id) => AppState.nodes.find(n => n.id_node === parseInt(id))?.nama_tempat || `Node ${id}`;

// ==================== Custom Dropdown Logic ====================
document.addEventListener('click', (e) => {
  if (!e.target.closest('.custom-wrap')) {
    document.getElementById('dropdown-start')?.classList.remove('open');
    document.getElementById('dropdown-end')?.classList.remove('open');
  }
});

window.toggleDropdown = (type) => {
  const other = type === 'start' ? 'end' : 'start';
  document.getElementById(`dropdown-${other}`).classList.remove('open');
  
  const dd = document.getElementById(`dropdown-${type}`);
  dd.classList.toggle('open');
  if (dd.classList.contains('open')) {
    const input = document.getElementById(`search-${type}`);
    input.value = '';
    filterDropdown(type);
    input.focus();
  }
};

window.selectNode = (type, id, name) => {
  if (type === 'start') AppState.startNodeId = id;
  else AppState.endNodeId = id;
  
  document.getElementById(`label-${type}`).textContent = name;
  document.getElementById(`dropdown-${type}`).classList.remove('open');
  updateMarkers();
};

window.filterDropdown = (type) => {
  const q = document.getElementById(`search-${type}`).value.toLowerCase();
  const items = document.querySelectorAll(`#list-${type} .dd-item`);
  items.forEach(item => {
    const text = item.querySelector('.dd-text').textContent.toLowerCase();
    item.style.display = text.includes(q) ? '' : 'none';
  });
};

const fillCustomDropdowns = (nodes) => {
  const ls = document.getElementById('list-start');
  const le = document.getElementById('list-end');
  const icons = ['🏛','🏢','🏗','📚','⚽','🔬','🏥','🕌','💧','🎓','🏟','⚙️','📐','🌿','🏋','🖥','🌊','💊','🔭','🌾','🏀','🚪','🏟'];
  
  let html = '';
  nodes.forEach((n, i) => {
    const icon = icons[i % icons.length];
    const safeName = n.nama_tempat.replace(/'/g, "\\'"); 
    html += `
      <div class="dd-item" onclick="selectNode('{{type}}', ${n.id_node}, '${safeName}')">
        <div class="dd-icon">${icon}</div>
        <div>
          <div class="dd-text">${n.nama_tempat}</div>
          <div class="dd-sub">NODE #${n.id_node}</div>
        </div>
      </div>
    `;
  });
  
  ls.innerHTML = html.replace(/{{type}}/g, 'start');
  le.innerHTML = html.replace(/{{type}}/g, 'end');
};

// ==================== Actions (Start, End, Swap, Reset) ====================
window.setStart = (id) => {
  AppState.startNodeId = id;
  document.getElementById('label-start').textContent = getNodeName(id);
  updateMarkers();
  showToast(`🟢 ${getNodeName(id)} Titik Awal`, 'success');
  AppState.map.closePopup();
};

window.setEnd = (id) => {
  AppState.endNodeId = id;
  document.getElementById('label-end').textContent = getNodeName(id);
  updateMarkers();
  showToast(`🟡 ${getNodeName(id)} Tujuan`, 'info');
  AppState.map.closePopup();
};

window.swapLocations = () => {
  const tmpId = AppState.startNodeId;
  AppState.startNodeId = AppState.endNodeId;
  AppState.endNodeId = tmpId;

  const lblStart = document.getElementById('label-start');
  const lblEnd = document.getElementById('label-end');
  const tmpTxt = lblStart.textContent;
  lblStart.textContent = lblEnd.textContent;
  lblEnd.textContent = tmpTxt;

  updateMarkers();
  if (AppState.startNodeId || AppState.endNodeId) showToast('↕ Lokasi ditukar', 'info');
};

window.resetRoute = () => {
  AppState.startNodeId = null;
  AppState.endNodeId   = null;
  AppState.currentPath = null;
  
  document.getElementById('label-start').textContent = 'Titik Awal';
  document.getElementById('label-end').textContent = 'Titik Tujuan';
  
  Animation.clearAll(AppState.map);
  updateMarkers();
  document.getElementById('result-panel').innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.35">
          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
          <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
        </svg>
      </div>
      <div class="empty-title">Siap Navigasi</div>
      <div class="empty-desc">Pilih titik awal & tujuan lalu tekan Cari</div>
    </div>`;
  AppState.panelExpanded = false;
  document.getElementById('panel-expanded').classList.remove('open');
  showResetFab(false);
  showToast('Rute direset', 'info');
};

// ==================== Transport Mode ====================
window.setTransportMode = (mode, btn) => {
  AppState.transportMode = mode;
  document.querySelectorAll('.transport-pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');

  const labels = { foot:'🚶 Jalan Kaki', bike:'🏍️ Motor', driving:'🚗 Mobil' };
  showToast(`Mode: ${labels[mode]}`, 'info');

  if (AppState.currentPath) {
    renderResult(AppState.currentPath);
  }
};

const osrmProfile = { foot:'foot', bike:'bike', driving:'driving' };

window.togglePanelExpand = () => {
  AppState.panelExpanded = !AppState.panelExpanded;
  document.getElementById('panel-expanded').classList.toggle('open', AppState.panelExpanded);
};

// ==================== Find Path (CORE) ====================
window.findPath = async () => {
  const startId = AppState.startNodeId;
  const endId   = AppState.endNodeId;

  if (!startId || !endId)       { showToast('⚠️ Pilih titik awal dan tujuan', 'error'); return; }
  if (startId === endId)        { showToast('⚠️ Awal dan tujuan tidak boleh sama', 'error'); return; }

  document.body.classList.add('is-searching');
  
  showLoading(true, 'Algoritma A* sedang berjalan...');
  Animation.clearAll(AppState.map);
  clearResult();

  try {
    const result = await API.findShortestPath(startId, endId);
    AppState.currentPath = result;
    updateMarkers(result.path);

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

    Animation.animatePolyline(AppState.map, roadCoords);
    setTimeout(() => Animation.zoomToRoute(AppState.map, roadCoords), 300);
    setTimeout(() => Animation.animateMarkerAlongPath(
      AppState.map, 
      roadCoords, 
      (si) => {
        const ratio = si / roadCoords.length;
        const ni = Math.floor(ratio * result.path_names.length);
        document.querySelectorAll('.path-step').forEach((el, i) => el.classList.toggle('active', i === ni));
      },
      AppState.transportMode 
    ), 1000);

    renderResult(result);
    showResetFab(true);
    
    const dynamicTime = calculateEstimatedTime(result.distance, AppState.transportMode);
    showToast(`✅ ${result.path.length} lokasi · ${result.distance}m · ${dynamicTime}`, 'success');

  } catch(err) {
    showToast(`❌ ${err.message}`, 'error');
  } finally {
    document.body.classList.remove('is-searching');
    showLoading(false);
  }
};

// ==================== Render Result ====================
const calculateEstimatedTime = (distanceMeters, mode) => {
  const speeds = {
    foot: 80,      
    bike: 300,     
    driving: 400   
  };
  
  const speed = speeds[mode] || speeds.foot;
  const minutes = Math.ceil(distanceMeters / speed);

  if (minutes < 1) return '< 1 mnt';
  if (minutes === 1) return '1 mnt';
  if (minutes < 60) return `${minutes} mnt`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `${hours} jam`;
  return `${hours} jam ${remainingMinutes} mnt`;
};

const renderResult = (result) => {
  const speedLabel = { foot:'Berjalan kaki', bike:'Berkendara motor', driving:'Berkendara mobil' };
  const panel = document.getElementById('result-panel');
  
  const dynamicTime = calculateEstimatedTime(result.distance, AppState.transportMode);

  panel.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card" style="animation-delay:.0s">
        <div class="stat-lbl">Jarak</div>
        <div class="stat-val">${result.distance}</div>
        <div class="stat-unit">meter</div>
      </div>
      <div class="stat-card" style="animation-delay:.06s">
        <div class="stat-lbl">Waktu</div>
        <div class="stat-val amber sm">${dynamicTime}</div>
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
      <div class="empty-icon">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.35">
           <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
      </div>
      <div class="empty-title">Menghitung rute optimal...</div>
    </div>`;
};

window.flyToNode = (id) => {
  const m = AppState.markers[id];
  if (!m) return;
  AppState.map.flyTo(m.getLatLng(), 17, { duration:1 });
  setTimeout(() => m.openPopup(), 1100);
};

// ==================== Location Panel ====================
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

window.toggleLocationPanel = () => {
  AppState.locationPanelOpen = !AppState.locationPanelOpen;
  document.getElementById('location-panel').classList.toggle('open', AppState.locationPanelOpen);
};

// ==================== Controls ====================
window.toggleMapLayer = () => {
  tiles[AppState.tileIndex].remove();
  AppState.tileIndex = (AppState.tileIndex + 1) % tiles.length;
  tiles[AppState.tileIndex].addTo(AppState.map);
  const names = ['Dark', 'Street', 'Satellite'];
  showToast(`Layer: ${names[AppState.tileIndex]}`, 'info');
};

window.getCurrentLocation = () => {
  if (!navigator.geolocation) { showToast(' Geolocation tidak didukung', 'error'); return; }
  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude: lat, longitude: lng } = pos.coords;
    AppState.map.flyTo([lat, lng], 17, { duration:1.5 });
    
    // Menerapkan class "std-popup" agar aman dan terbaca
    L.marker([lat, lng], { icon: L.divIcon({
      className:'',
      html:`<div style="width:14px;height:14px;background:#3b82f6;border:3px solid #fff;border-radius:50%;box-shadow:0 0 16px #3b82f6;"></div>`,
      iconSize:[14,14], iconAnchor:[7,7],
    }) }).addTo(AppState.map).bindPopup('📍 Lokasi Anda', { className: 'std-popup' }).openPopup();
    
    showToast(' Lokasi ditemukan', 'success');
  }, () => showToast(' Tidak bisa akses lokasi', 'error'));
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

window.showToast = (msg, type='info') => {
  const c = document.getElementById('toast-container');
  const ic = { success:'✅', error:'❌', info:'💡' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${ic[type]||'💬'}</span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3700);
};

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
    
    fillCustomDropdowns(nodes); 
    fillLocations(nodes);
    
    showToast(` ${nodes.length} lokasi UNIB dimuat`, 'success');
  } catch(err) {
    showToast(`Gagal memuat: ${err.message}`, 'error');
  } finally {
    showLoading(false);
  }
};

document.addEventListener('DOMContentLoaded', initApp);