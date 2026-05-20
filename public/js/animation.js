/**
 * public/js/animation.js
 * Modul animasi untuk visualisasi jalur terpendek
 * - Animasi polyline yang muncul perlahan
 * - Marker bergerak mengikuti jalur dengan dinamika kecepatan
 * - Smooth zoom animation
 */

const Animation = {
  movingMarker: null,
  animationFrame: null,
  isAnimating: false,

  /**
   * Buat moving marker (kendaraan yang bergerak di jalur)
   * @param {Object} map - Leaflet map instance
   * @param {string} mode - Mode kendaraan (foot, bike, driving)
   * @returns {Object} Leaflet marker
   */
  createMovingMarker: (map, mode = 'foot') => {
    if (Animation.movingMarker) {
      Animation.movingMarker.remove();
    }

    // Pemilihan Ikon berdasarkan transportMode
    const modeIcons = { foot: '🚶', bike: '🏍️', driving: '🚗' };
    const activeIcon = modeIcons[mode] || '🚶';

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
        ">${activeIcon}</div>
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
    if (window._routePolyline) {
      window._routePolyline.remove();
      window._routePolyline = null;
    }
    if (window._routePolylineBg) {
      window._routePolylineBg.remove();
      window._routePolylineBg = null;
    }

    const bgPolyline = L.polyline(latlngs, {
      color: 'rgba(20, 184, 166, 0.25)',
      weight: 12,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);
    window._routePolylineBg = bgPolyline;

    const totalPoints = latlngs.length;
    let currentSegment = 0;

    const drawNextSegment = () => {
      if (currentSegment >= totalPoints - 1) {
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

      let opacity = 0;
      const fadeIn = setInterval(() => {
        opacity += 0.1;
        segmentLine.setStyle({ opacity: Math.min(opacity, 1) });
        if (opacity >= 1) clearInterval(fadeIn);
      }, 30);

      currentSegment++;

      if (!window._routeSegments) window._routeSegments = [];
      window._routeSegments.push(segmentLine);

      if (currentSegment < totalPoints - 1) {
        setTimeout(drawNextSegment, 60);
      }
    };

    Animation.isAnimating = true;
    drawNextSegment();

    const finalPolyline = L.polyline(latlngs, {
      color: 'transparent',
      weight: 0,
    }).addTo(map);
    window._routePolyline = finalPolyline;

    return finalPolyline;
  },

  /**
   * Animasi marker bergerak mengikuti jalur dengan dinamika kecepatan
   * @param {Object} map - Leaflet map instance
   * @param {Array} coordinates - Array {lat, lng}
   * @param {Function} onProgress - Callback setiap langkah (nodeIndex)
   * @param {string} mode - Mode transportasi (foot, bike, driving)
   */
  animateMarkerAlongPath: (map, coordinates, onProgress, mode = 'foot') => {
    if (Animation.animationFrame) {
      cancelAnimationFrame(Animation.animationFrame);
    }

    const marker = Animation.createMovingMarker(map, mode);
    marker.setLatLng([coordinates[0].lat, coordinates[0].lng]);

    let segmentIndex = 0;
    let t = 0; // 0 to 1, progress dalam segmen saat ini
    
    // Setup kecepatan sesuai mode transportasi
    const modeSpeeds = {
      foot: 0.008,     // Paling lambat
      bike: 0.022,     // Sedang
      driving: 0.038   // Paling cepat
    };
    
    const speed = modeSpeeds[mode] || 0.008;

    const animate = () => {
      if (segmentIndex >= coordinates.length - 1) {
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

      const lat = from.lat + (to.lat - from.lat) * t;
      const lng = from.lng + (to.lng - from.lng) * t;

      marker.setLatLng([lat, lng]);

      if (onProgress) onProgress(segmentIndex);

      t += speed;

      if (t >= 1) {
        t = 0;
        segmentIndex++;
        if (onProgress) onProgress(segmentIndex);
      }

      Animation.animationFrame = requestAnimationFrame(animate);
    };

    setTimeout(animate, 500);
  },

  zoomToRoute: (map, latlngs) => {
    if (!latlngs || latlngs.length === 0) return;
    const bounds = L.latLngBounds(latlngs.map((c) => [c.lat, c.lng]));
    map.flyToBounds(bounds, {
      padding: [80, 80],
      duration: 1.5,
      easeLinearity: 0.25,
    });
  },

  clearAll: (map) => {
    if (Animation.animationFrame) {
      cancelAnimationFrame(Animation.animationFrame);
      Animation.animationFrame = null;
    }

    if (Animation.movingMarker) {
      Animation.movingMarker.remove();
      Animation.movingMarker = null;
    }

    if (window._routePolyline) {
      window._routePolyline.remove();
      window._routePolyline = null;
    }
    if (window._routePolylineBg) {
      window._routePolylineBg.remove();
      window._routePolylineBg = null;
    }

    if (window._routeSegments) {
      window._routeSegments.forEach((s) => s.remove());
      window._routeSegments = [];
    }

    Animation.isAnimating = false;
  },
};

window.Animation = Animation;