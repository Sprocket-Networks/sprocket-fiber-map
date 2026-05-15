/* Shared map utilities for Sprocket Networks focused pages.
   Each page calls WGMap.init({...}) with its layer list. */
(function () {
  'use strict';

  var DOT_CANVAS = null;

  function makeDotCanvas(map) {
    if (!DOT_CANVAS) DOT_CANVAS = L.canvas({ padding: 0.25 });
    return DOT_CANVAS;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[<>&"']/g, function (c) {
      return ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c];
    });
  }

  // ── Layer kind factories ──
  function makeLayer(data, entry, map) {
    var color = entry.color || '#3b82f6';
    var kind = entry.kind || 'dot';
    var canvas = makeDotCanvas(map);

    if (kind === 'polygon') {
      return L.geoJSON(data, { style: { color: color, weight: 1.5, fillColor: color, fillOpacity: 0.10, dashArray: '4 3' } });
    }
    if (kind === 'line') {
      return L.geoJSON(data, { style: { color: color, weight: 2, opacity: 0.88, dashArray: entry.dashed ? '6 4' : null } });
    }
    if (kind === 'dot') {
      return L.geoJSON(data, {
        pointToLayer: function (_, latlng) {
          return L.circleMarker(latlng, { renderer: canvas, radius: 2, color: color, fillColor: color, fillOpacity: 0.55, weight: 0 });
        }
      });
    }
    if (kind === 'hollow-dot') {
      return L.geoJSON(data, {
        pointToLayer: function (_, latlng) {
          return L.circleMarker(latlng, { renderer: canvas, radius: 3, color: color, fillColor: color, fillOpacity: 0, weight: 1, opacity: 0.85 });
        }
      });
    }
    if (kind === 'nonfiber') {
      return L.geoJSON(data, {
        pointToLayer: function (_, latlng) {
          return L.circleMarker(latlng, { renderer: canvas, radius: 3, color: color, fillColor: color, fillOpacity: 0.7, weight: 0 });
        }
      });
    }
    if (kind === 'tower') {
      return L.geoJSON(data, {
        pointToLayer: function (_, latlng) {
          var icon = L.divIcon({
            className: '',
            html: '<div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-bottom:12px solid ' + color + ';filter:drop-shadow(0 1px 2px rgba(0,0,0,0.4));"></div>',
            iconSize: [14, 12], iconAnchor: [7, 12]
          });
          return L.marker(latlng, { icon: icon });
        },
        onEachFeature: function (f, layer) {
          var n = f.properties && f.properties.name;
          if (n) layer.bindTooltip(n, { direction: 'top', offset: [0, -12] });
        }
      });
    }
    if (kind === 'site') {
      return L.geoJSON(data, {
        pointToLayer: function (_, latlng) {
          var icon = L.divIcon({
            className: '',
            html: '<div style="width:10px;height:10px;border-radius:50%;background:' + color + ';border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>',
            iconSize: [14, 14], iconAnchor: [7, 7]
          });
          return L.marker(latlng, { icon: icon });
        },
        onEachFeature: function (f, layer) {
          var p = f.properties || {};
          var html = '';
          if (p.name) html += '<strong>' + escapeHtml(p.name) + '</strong>';
          if (p.address) html += '<br><span style="color:#475569;font-size:12px">' + escapeHtml(p.address) + '</span>';
          if (p.notes) html += '<br><span style="color:#94a3b8;font-size:11px">' + escapeHtml(p.notes) + '</span>';
          if (html) layer.bindPopup(html);
          if (p.name) layer.bindTooltip(p.name, { direction: 'top', offset: [0, -7] });
        }
      });
    }
    if (kind === 'costar') {
      return L.geoJSON(data, {
        pointToLayer: function (_, latlng) {
          var icon = L.divIcon({
            className: '',
            html: '<div style="width:8px;height:8px;background:' + color + ';transform:rotate(45deg);border:1.5px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);"></div>',
            iconSize: [12, 12], iconAnchor: [6, 6]
          });
          return L.marker(latlng, { icon: icon });
        },
        onEachFeature: function (f, layer) {
          var p = f.properties || {};
          var html = '';
          if (p.name) html += '<strong>' + escapeHtml(p.name) + '</strong>';
          if (p.addr) html += '<br><span style="color:#475569;font-size:12px">' + escapeHtml(p.addr) + '</span>';
          if (p.units) html += '<br><span style="color:#94a3b8;font-size:11px">' + p.units + ' units</span>';
          if (html) layer.bindPopup(html);
        }
      });
    }
    if (kind === 'tea-rural') {
      return L.geoJSON(data, { style: { color: '#16a34a', weight: 1, opacity: 0.5, fillColor: '#86efac', fillOpacity: 0.28 } });
    }
    if (kind === 'tea-hua') {
      return L.geoJSON(data, { style: { color: '#d97706', weight: 1, opacity: 0.5, fillColor: '#fdba74', fillOpacity: 0.28 } });
    }
    if (kind === 'tea-msa') {
      return L.geoJSON(data, {
        style: { color: '#ef4444', weight: 1.5, opacity: 0.7, fillOpacity: 0, dashArray: '4 3' },
        onEachFeature: function (f, layer) { if (f.properties && f.properties.name) layer.bindTooltip(f.properties.name); }
      });
    }
    return L.geoJSON(data, { style: { color: color, weight: 2 } });
  }

  // ── Reveal Admin link if user has admin scope ──
  function wireAdminLink() {
    var el = document.getElementById('admin-link');
    if (!el) return;
    var attempts = 0;
    function check() {
      try {
        var raw = localStorage.getItem('google_user');
        if (raw) {
          var user = JSON.parse(raw);
          if (user && Array.isArray(user.scopes) && user.scopes.indexOf('admin') !== -1) {
            el.style.display = '';
            return;
          }
        }
      } catch (e) {}
      if (++attempts < 60) setTimeout(check, 1000);
    }
    check();
  }

  // ── Build a map with the layers from the page config ──
  // config: { mapId, center, zoom, baseMap (light|sat|road), layers: [{key,url,color,kind,defaultOn,...}], onReady }
  function init(config) {
    wireAdminLink();
    var map = L.map(config.mapId || 'map', { preferCanvas: false }).setView(config.center || [32.78, -97.35], config.zoom || 10);

    // Base map toggle support
    var baseLight = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd', maxZoom: 20
    });
    var baseSat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri', maxZoom: 19
    });
    var baseRoad = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors', maxZoom: 19
    });
    (config.baseMap === 'sat' ? baseSat : config.baseMap === 'road' ? baseRoad : baseLight).addTo(map);
    L.control.layers({ 'Light gray': baseLight, 'Roadmap': baseRoad, 'Satellite': baseSat }, null, { position: 'topright', collapsed: true }).addTo(map);

    var entries = {};   // key -> {entry, layer, loaded}
    (config.layers || []).forEach(function (entry) {
      entries[entry.key] = { entry: entry, layer: null, loaded: false, on: false };
    });

    function setLayer(key, on) {
      var slot = entries[key];
      if (!slot) return;
      if (on) {
        if (!slot.loaded) {
          fetch(slot.entry.url)
            .then(function (r) { return r.json(); })
            .then(function (data) {
              slot.layer = makeLayer(data, slot.entry, map);
              slot.layer.addTo(map);
              slot.loaded = true; slot.on = true;
              if (config.onLayerLoaded) config.onLayerLoaded(key, slot, map);
            })
            .catch(function (e) { console.error('Failed to load', slot.entry.url, e); });
        } else if (!slot.on) {
          slot.layer.addTo(map);
          slot.on = true;
        }
      } else if (slot.layer && slot.on) {
        map.removeLayer(slot.layer);
        slot.on = false;
      }
    }

    // Wire all toggle rows
    document.querySelectorAll('input[type=checkbox][data-layer]').forEach(function (cb) {
      cb.addEventListener('change', function () { setLayer(this.dataset.layer, this.checked); });
      if (cb.checked) setLayer(cb.dataset.layer, true);
    });

    // Auto-load any layer marked defaultOn
    (config.layers || []).forEach(function (entry) {
      if (entry.defaultOn) {
        var cb = document.querySelector('input[type=checkbox][data-layer="' + entry.key + '"]');
        if (cb) { cb.checked = true; setLayer(entry.key, true); }
        else setLayer(entry.key, true);
      }
    });

    if (config.onReady) config.onReady(map, entries);
    return { map: map, entries: entries, setLayer: setLayer };
  }

  window.WGMap = { init: init, escapeHtml: escapeHtml };
})();
