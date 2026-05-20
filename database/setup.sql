-- ================================================================
-- database/setup.sql
-- Script setup database untuk Shortest Path UNIB
-- Jalankan: mysql -u root -p < database/setup.sql
-- ================================================================

-- Buat database
CREATE DATABASE IF NOT EXISTS shortest_path_unib
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE shortest_path_unib;

-- ================================================================
-- Tabel Node: Lokasi-lokasi di UNIB
-- ================================================================
DROP TABLE IF EXISTS edge;
DROP TABLE IF EXISTS node;

CREATE TABLE node (
    id_node   INT          PRIMARY KEY,
    nama_tempat VARCHAR(255) NOT NULL,
    latitude  DOUBLE       NOT NULL,
    longitude DOUBLE       NOT NULL,
    created_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================
-- Tabel Edge: Koneksi antar lokasi (bidirectional)
-- ================================================================
CREATE TABLE edge (
    id_edge   INT AUTO_INCREMENT PRIMARY KEY,
    from_node INT    NOT NULL,
    to_node   INT    NOT NULL,
    weight    DOUBLE NOT NULL COMMENT 'Jarak dalam meter',
    FOREIGN KEY (from_node) REFERENCES node(id_node),
    FOREIGN KEY (to_node)   REFERENCES node(id_node),
    INDEX idx_from (from_node),
    INDEX idx_to   (to_node)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================
-- Data Node: 23 Lokasi di Universitas Bengkulu
-- ================================================================
INSERT INTO node (id_node, nama_tempat, latitude, longitude) VALUES
(1,  'Fakultas Hukum',               -3.7605312536864184, 102.26847793769042),
(2,  'Fakultas Ekonomi dan Bisnis',  -3.7616617767927454, 102.26855271182856),
(3,  'Gedung Rektorat',              -3.758937446666454,  102.27227166318588),
(4,  'Gedung Layanan Terpadu',       -3.7579953866240476, 102.27192719771439),
(5,  'Danau UNIB',                   -3.758364572432455,  102.273120068887),
(6,  'Perpustakaan UNIB',            -3.756785983681448,  102.2748615332291),
(7,  'GB 5 UNIB',                    -3.7555256567637896, 102.2764626598008),
(8,  'FKIK UNIB',                    -3.7550800861944125, 102.2780382704129),
(9,  'GSG UNIB',                     -3.7575273903634456, 102.27656652603036),
(10, 'Stadion UNIB',                 -3.757510342692321,  102.27815529205822),
(11, 'FKIP UNIB',                    -3.7561795970982788, 102.27746650376268),
(12, 'FT UNIB',                      -3.758441886565752,  102.27668755108738),
(13, 'GB 3 UNIB',                    -3.7564901859145112, 102.27654051141583),
(14, 'Mushola UNIB',                 -3.757715893568994,  102.2736182830509),
(15, 'GB 2 UNIB',                    -3.758010528186283,  102.27395776427626),
(16, 'UPATIK UNIB',                  -3.758522464562341,  102.27501919160771),
(17, 'Danau FKIP UNIB',              -3.7561297281030677, 102.27796591350565),
(18, 'PKM UNIB',                     -3.756449566309567,  102.2758265394791),
(19, 'FMIPA UNIB',                   -3.7560285312312187, 102.27476313128244),
(20, 'Fakultas Pertanian UNIB',      -3.7593752084777687, 102.26922935250059),
(21, 'Lapangan Basket UNIB',         -3.7595503267493457, 102.26720511569208),
(22, 'Gerbang Keluar UNIB Depan',   -3.7591260778177786, 102.26663362932524),
(23, 'GOR UNIB',                     -3.76074773232111,   102.26750488781309);

-- ================================================================
-- Data Edge: Koneksi bidirectional antar lokasi
-- ================================================================
INSERT INTO edge (from_node, to_node, weight) VALUES
(1,2,130),   (2,1,130),
(1,20,120),  (20,1,120),
(2,23,150),  (23,2,150),
(23,21,80),  (21,23,80),
(21,22,70),  (22,21,70),
(20,3,250),  (3,20,250),
(3,4,90),    (4,3,90),
(4,5,120),   (5,4,120),
(5,14,70),   (14,5,70),
(14,15,60),  (15,14,60),
(15,16,100), (16,15,100),
(16,12,140), (12,16,140),
(12,9,110),  (9,12,110),
(9,13,90),   (13,9,90),
(13,18,80),  (18,13,80),
(18,6,100),  (6,18,100),
(6,19,70),   (19,6,70),
(19,11,160), (11,19,160),
(11,17,75),  (17,11,75),
(17,8,95),   (8,17,95),
(11,7,110),  (7,11,110),
(8,10,210),  (10,8,210);

-- Verifikasi
SELECT 'Nodes:' as Info, COUNT(*) as Jumlah FROM node
UNION ALL
SELECT 'Edges:', COUNT(*) FROM edge;

SELECT '✅ Database shortest_path_unib berhasil dibuat!' as Status;
