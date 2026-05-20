/**
 * public/js/animation.js
 * Modul animasi untuk visualisasi jalur terpendek
 * - Animasi polyline yang muncul perlahan
 * - Marker bergerak mengikuti jalur
 * - Smooth zoom animation
 */

const Animation = {
  movingMarker: null,
  animationFrame: null,
  isAnimating: false,

  /**
   * Buat moving marker (kendaraan yang bergerak di jalur)
   * @param {Object} map - Leaflet map instance
   * @returns {Object} Leaflet marker
   */
  createMovingMarker: (map) => {
    if (Animation.movingMarker) {
      Animation.movingMarker.remove();
    }

    const icon = L.divIcon({
      className: 'moving-marker',
      html: `
        <div style="
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #14b8a6, #2dd4bf);
          border: 3px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 20px rgba(20,184,166,0.8), 0 2px 8px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          animation: markerBounce 1s ease infinite;
        ">🚶</div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    Animation.movingMarker = L.marker([0, 0], { icon, zIndexOffset: 1000 });
    Animation.movingMarker.addTo(map);
    return Animation.movingMarker;
  },

  /**
   * Animasi polyline yang muncul perlahan (stroke animation)
   * @param {Object} map - Leaflet map instance
   * @param {Array} latlngs - Array koordinat [{lat, lng}]
   * @returns {Object} Leaflet polyline
   */
  animatePolyline: (map, latlngs) => {
    // Hapus polyline lama jika ada
    if (window._routePolyline) {
      window._routePolyline.remove();
      window._routePolyline = null;
    }
    if (window._routePolylineBg) {
      window._routePolylineBg.remove();
      window._routePolylineBg = null;
    }

    // Background polyline (glowing effect)
    const bgPolyline = L.polyline(latlngs, {
      color: 'rgba(20, 184, 166, 0.25)',
      weight: 12,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);
    window._routePolylineBg = bgPolyline;

    // Animasi polyline utama menggunakan segmen bertahap
    const totalPoints = latlngs.length;
    let currentSegment = 0;

    const drawNextSegment = () => {
      if (currentSegment >= totalPoints - 1) {
        // Animasi selesai
        Animation.isAnimating = false;
        return;
      }

      const segmentLine = L.polyline(
        [latlngs[currentSegment], latlngs[currentSegment + 1]],
        {
          color: '#14b8a6',
          weight: 5,
          lineCap: 'round',
          lineJoin: 'round',
          opacity: 0,
        }
      ).addTo(map);

      // Fade in segment
      let opacity = 0;
      const fadeIn = setInterval(() => {
        opacity += 0.1;
        segmentLine.setStyle({ opacity: Math.min(opacity, 1) });
        if (opacity >= 1) clearInterval(fadeIn);
      }, 30);

      currentSegment++;

      // Simpan referensi untuk cleanup
      if (!window._routeSegments) window._routeSegments = [];
      window._routeSegments.push(segmentLine);

      if (currentSegment < totalPoints - 1) {
        setTimeout(drawNextSegment, 60);
      }
    };

    Animation.isAnimating = true;
    drawNextSegment();

    // Buat polyline final untuk referensi
    const finalPolyline = L.polyline(latlngs, {
      color: 'transparent',
      weight: 0,
    }).addTo(map);
    window._routePolyline = finalPolyline;

    return finalPolyline;
  },

  /**
   * Animasi marker bergerak mengikuti jalur
   * @param {Object} map - Leaflet map instance
   * @param {Array} coordinates - Array {lat, lng}
   * @param {Function} onProgress - Callback setiap langkah (nodeIndex)
   */
  animateMarkerAlongPath: (map, coordinates, onProgress) => {
    if (Animation.animationFrame) {
      cancelAnimationFrame(Animation.animationFrame);
    }

    const marker = Animation.createMovingMarker(map);
    marker.setLatLng([coordinates[0].lat, coordinates[0].lng]);

    let segmentIndex = 0;
    let t = 0; // 0 to 1, progress dalam segmen saat ini
    const speed = 0.02; // Kecepatan animasi

    const animate = () => {
      if (segmentIndex >= coordinates.length - 1) {
        // Animasi selesai, tunjukkan marker tujuan
        setTimeout(() => {
          if (Animation.movingMarker) {
            Animation.movingMarker.remove();
            Animation.movingMarker = null;
          }
        }, 1000);
        return;
      }

      const from = coordinates[segmentIndex];
      const to = coordinates[segmentIndex + 1];

      // Interpolasi posisi antara dua node
      const lat = from.lat + (to.lat - from.lat) * t;
      const lng = from.lng + (to.lng - from.lng) * t;

      marker.setLatLng([lat, lng]);

      // Notifikasi progress
      if (onProgress) onProgress(segmentIndex);

      t += speed;

      if (t >= 1) {
        t = 0;
        segmentIndex++;
        if (onProgress) onProgress(segmentIndex);
      }

      Animation.animationFrame = requestAnimationFrame(animate);
    };

    // Delay sebelum animasi mulai (biarkan polyline selesai dulu)
    setTimeout(animate, 500);
  },

  /**
   * Smooth zoom ke bounding box jalur
   * @param {Object} map - Leaflet map instance
   * @param {Array} latlngs - Array koordinat
   */
  zoomToRoute: (map, latlngs) => {
    if (!latlngs || latlngs.length === 0) return;
    const bounds = L.latLngBounds(latlngs.map((c) => [c.lat, c.lng]));
    map.flyToBounds(bounds, {
      padding: [80, 80],
      duration: 1.5,
      easeLinearity: 0.25,
    });
  },

  /**
   * Hapus semua layer animasi
   */
  clearAll: (map) => {
    // Stop animasi berjalan
    if (Animation.animationFrame) {
      cancelAnimationFrame(Animation.animationFrame);
      Animation.animationFrame = null;
    }

    // Hapus moving marker
    if (Animation.movingMarker) {
      Animation.movingMarker.remove();
      Animation.movingMarker = null;
    }

    // Hapus polylines
    if (window._routePolyline) {
      window._routePolyline.remove();
      window._routePolyline = null;
    }
    if (window._routePolylineBg) {
      window._routePolylineBg.remove();
      window._routePolylineBg = null;
    }

    // Hapus semua segment
    if (window._routeSegments) {
      window._routeSegments.forEach((s) => s.remove());
      window._routeSegments = [];
    }

    Animation.isAnimating = false;
  },
};

window.Animation = Animation;
