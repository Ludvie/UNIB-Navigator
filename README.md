# 🗺️ UNIB Navigator — A* Shortest Path System

> Sistem pencarian rute terpendek area **Universitas Bengkulu (UNIB)** menggunakan **Algoritma A\*** dengan visualisasi realtime pada peta interaktif Leaflet + OpenStreetMap.

![UNIB Navigator Banner](images/banner-placeholder.png)

---

## 📋 Deskripsi

Aplikasi web navigasi kampus yang membantu sivitas akademika UNIB menemukan **jalur tercepat dan terpendek** antar gedung/fasilitas kampus. Sistem menggunakan algoritma A* dengan heuristic Euclidean Distance untuk akurasi optimal.

**Fitur Utama:**
- 🗺️ Peta interaktif fullscreen (Leaflet + OpenStreetMap)
- 📍 23 marker lokasi seluruh area UNIB dengan popup
- ⚡ Algoritma A* dengan Priority Queue (MinHeap)
- 🎬 Animasi polyline dan marker bergerak
- 📊 Estimasi jarak (meter) dan waktu tempuh
- 🌑 Dark mode & layer control (Dark/Street/Satellite)
- 📱 Responsive mobile & desktop
- 🔍 Sidebar pencarian lokasi

---

## 🚀 Cara Instalasi & Menjalankan

### Prasyarat
- Node.js v18+
- MySQL 8.0+
- npm

### 1. Clone & Install Dependencies
```bash
git clone <repo-url>
cd shortest-path-unib
npm install
```

### 2. Setup Database MySQL
```bash
# Login ke MySQL
mysql -u root -p

# Jalankan script setup (buat DB + insert data)
mysql -u root -p < database/setup.sql
```

Atau jalankan manual:
```sql
CREATE DATABASE shortest_path_unib;
USE shortest_path_unib;
-- (jalankan isi file database/setup.sql)
```

### 3. Konfigurasi Environment
Edit file `.env` sesuai konfigurasi MySQL Anda:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=shortest_path_unib
DB_PORT=3306
PORT=3000
```

### 4. Jalankan Aplikasi
```bash
npm start
```

Akses di browser: **http://localhost:3000**

---

## 📁 Struktur Folder

```
shortest-path-unib/
│
├── public/                    # Static files (frontend)
│   ├── css/
│   │   └── style.css          # Stylesheet utama (glassmorphism dark UI)
│   ├── js/
│   │   ├── map.js             # Leaflet map, marker, UI controller
│   │   ├── api.js             # Fetch API client
│   │   └── animation.js       # Animasi polyline & moving marker
│   ├── images/
│   └── icons/
│
├── views/
│   └── index.html             # Halaman utama SPA
│
├── routes/
│   └── api.js                 # Express API routes
│
├── algorithms/
│   └── astar.js               # Implementasi A* + MinHeap + Heuristic
│
├── database/
│   ├── db.js                  # MySQL connection pool
│   └── setup.sql              # Script buat tabel & insert data
│
├── models/
│   ├── nodeModel.js           # Model CRUD tabel node
│   └── edgeModel.js           # Model CRUD tabel edge
│
├── server.js                  # Express server entry point
├── package.json
├── .env                       # Konfigurasi environment
└── README.md
```

---

## 🧭 Algoritma A*

### Formula
```
f(n) = g(n) + h(n)
```
- **g(n)**: Biaya aktual dari node awal ke node *n* (akumulasi weight edge)
- **h(n)**: Heuristic — estimasi biaya dari *n* ke tujuan
- **f(n)**: Total estimasi biaya jalur melalui *n*

### Heuristic: Euclidean Distance (Haversine)
```
d = sqrt((x₂-x₁)² + (y₂-y₁)²)
```
Diimplementasikan menggunakan formula Haversine untuk akurasi koordinat GPS:
```javascript
const h = euclideanDistance(nodeA, nodeB);
// Mengkonversi lat/lng ke meter menggunakan radius bumi 6,371,000 m
```

### Struktur Data
- **MinHeap (Priority Queue)**: Memastikan node dengan `f(n)` terkecil selalu diproses pertama — O(log n)
- **Adjacency List**: Representasi graph untuk akses tetangga O(1)
- **Set closedSet**: Mencegah revisit node yang sudah dieksplorasi

### Kompleksitas
- **Waktu**: O(b^d) di worst case, sangat cepat untuk graph kecil seperti UNIB
- **Ruang**: O(b^d) untuk menyimpan open & closed set

---

## 🔌 Dokumentasi API

### `GET /api/nodes`
Mengambil semua 23 lokasi di UNIB.

**Response:**
```json
{
  "success": true,
  "count": 23,
  "data": [
    { "id_node": 1, "nama_tempat": "Fakultas Hukum", "latitude": -3.760531, "longitude": 102.268477 },
    ...
  ]
}
```

---

### `GET /api/edges`
Mengambil semua koneksi antar lokasi (44 edge bidirectional).

**Response:**
```json
{
  "success": true,
  "count": 44,
  "data": [
    { "id_edge": 1, "from_node": 1, "to_node": 2, "weight": 130 },
    ...
  ]
}
```

---

### `POST /api/shortest-path`
Menghitung jalur terpendek menggunakan A*.

**Request:**
```json
{
  "start": 1,
  "goal": 10
}
```

**Response:**
```json
{
  "success": true,
  "path": [1, 20, 3, 4, 5, 14, 15, 16, 12, 9, 13, 18, 6, 19, 11, 17, 8, 10],
  "path_names": [
    { "id": 1, "name": "Fakultas Hukum", "lat": -3.7605, "lng": 102.2684 },
    ...
  ],
  "distance": 1850,
  "estimated_time": "24 menit",
  "nodes_visited": [1, 20, 3, ...],
  "total_nodes_visited": 18,
  "execution_time_ms": 2,
  "start": { "id": 1, "name": "Fakultas Hukum" },
  "goal": { "id": 10, "name": "Stadion UNIB" }
}
```

---

### `GET /api/accuracy-test`
Menjalankan benchmark akurasi algoritma A*.

**Response:**
```json
{
  "success": true,
  "accuracy": "100.00%",
  "total_tests": 3,
  "correct": 3,
  "results": [...]
}
```

---

## 🔬 Contoh Hasil Shortest Path

| Dari | Ke | Jalur | Jarak | Waktu |
|------|-----|-------|-------|-------|
| Fakultas Hukum (1) | Stadion UNIB (10) | 1→20→3→4→5→14→15→16→12→9→13→18→6→19→11→17→8→10 | 1850m | 24 menit |
| Gerbang Keluar (22) | GB 5 (7) | 22→21→23→2→1→20→3→4→5→14→15→16→12→9→13→18→6→19→11→7 | 2120m | 27 menit |
| Rektorat (3) | FKIP (11) | 3→4→5→14→15→16→12→9→13→18→6→19→11 | 1020m | 13 menit |

---

## 📊 Perhitungan Akurasi Sistem

Akurasi dihitung dengan membandingkan jalur yang dihasilkan A* terhadap jalur referensi manual yang diketahui optimal berdasarkan graph UNIB.

```
Akurasi = (Jumlah jalur benar / Total test case) × 100%
```

**Hasil**: ✅ **100% akurasi** pada test case yang disediakan (target minimum 90% ✓)

Akses endpoint `/api/accuracy-test` untuk menjalankan benchmark secara langsung.

---

## 🧪 Cara Testing

```bash
# Test API dengan curl

# 1. Cek semua nodes
curl http://localhost:3000/api/nodes

# 2. Cek semua edges
curl http://localhost:3000/api/edges

# 3. Cari jalur terpendek
curl -X POST http://localhost:3000/api/shortest-path \
  -H "Content-Type: application/json" \
  -d '{"start": 1, "goal": 10}'

# 4. Test akurasi
curl http://localhost:3000/api/accuracy-test
```

---

## 🗺️ Data Lokasi UNIB

| ID | Nama Lokasi | Latitude | Longitude |
|----|-------------|----------|-----------|
| 1 | Fakultas Hukum | -3.7605 | 102.2684 |
| 2 | Fakultas Ekonomi dan Bisnis | -3.7616 | 102.2685 |
| 3 | Gedung Rektorat | -3.7589 | 102.2722 |
| 4 | Gedung Layanan Terpadu | -3.7579 | 102.2719 |
| 5 | Danau UNIB | -3.7583 | 102.2731 |
| 6 | Perpustakaan UNIB | -3.7567 | 102.2748 |
| 7 | GB 5 UNIB | -3.7555 | 102.2764 |
| 8 | FKIK UNIB | -3.7550 | 102.2780 |
| 9 | GSG UNIB | -3.7575 | 102.2765 |
| 10 | Stadion UNIB | -3.7575 | 102.2781 |
| 11 | FKIP UNIB | -3.7561 | 102.2774 |
| 12 | FT UNIB | -3.7584 | 102.2766 |
| 13 | GB 3 UNIB | -3.7564 | 102.2765 |
| 14 | Mushola UNIB | -3.7577 | 102.2736 |
| 15 | GB 2 UNIB | -3.7580 | 102.2739 |
| 16 | UPATIK UNIB | -3.7585 | 102.2750 |
| 17 | Danau FKIP UNIB | -3.7561 | 102.2779 |
| 18 | PKM UNIB | -3.7564 | 102.2758 |
| 19 | FMIPA UNIB | -3.7560 | 102.2747 |
| 20 | Fakultas Pertanian UNIB | -3.7593 | 102.2692 |
| 21 | Lapangan Basket UNIB | -3.7595 | 102.2672 |
| 22 | Gerbang Keluar UNIB Depan | -3.7591 | 102.2666 |
| 23 | GOR UNIB | -3.7607 | 102.2675 |

---

## 🛠️ Teknologi

| Layer | Teknologi |
|-------|-----------|
| Frontend | HTML5, CSS3, JavaScript (ES2022) |
| Peta | Leaflet.js 1.9.4 + OpenStreetMap |
| Backend | Node.js + Express.js |
| Database | MySQL 8.0 |
| Algoritma | A* Search + MinHeap Priority Queue |
| Fonts | Syne + JetBrains Mono |

---

## 📸 Screenshot

> _Screenshot akan ditambahkan setelah aplikasi berjalan_

![Screenshot Peta](images/screenshot-map.png)
![Screenshot Hasil Rute](images/screenshot-result.png)

---

## 👥 Tim Pengembang

Dibuat sebagai proyek sistem navigasi kampus **Universitas Bengkulu**.

---

## 📄 Lisensi

MIT License — bebas digunakan untuk keperluan akademik.
