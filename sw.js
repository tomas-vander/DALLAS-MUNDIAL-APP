// Service Worker — Transit Guide PWA
// Version: transit-app-v4

var CACHE_NAME = 'transit-app-v12';

// index.html y trip-config.json NO se cachean — siempre se sirven frescos desde red
var APP_SHELL = [
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
];
// Nota: cities/*.json se cachean on-demand al ser solicitados (cacheFirstStatic)

// ============================================================
// INSTALL — cachear app shell completo
// ============================================================
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(APP_SHELL);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// ============================================================
// ACTIVATE — limpiar caches de versiones anteriores
// ============================================================
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) {
          // Conservar el cache actual y todos los tile caches de viajes
          return k !== CACHE_NAME && k.indexOf('transit-tiles-') !== 0;
        }).map(function(k) {
          return caches.delete(k);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// ============================================================
// FETCH — estrategia por tipo de recurso
// ============================================================
self.addEventListener('fetch', function(event) {
  var url = event.request.url;

  // Tiles CartoDB → cache-first (tile cache por viaje si disponible)
  if (url.indexOf('basemaps.cartocdn.com') !== -1 || url.indexOf('tile.openstreetmap.org') !== -1) {
    event.respondWith(cacheFirstTile(event.request));
    return;
  }

  // Open-Meteo (clima) → network-first con fallback a caché
  if (url.indexOf('api.open-meteo.com') !== -1) {
    event.respondWith(networkFirstWeather(event.request));
    return;
  }

  // index.html y trip-config.json → siempre network-first (nunca servir versión vieja)
  var urlPath = url.split('?')[0]; // ignorar query string
  var isHtml = url.indexOf('index.html') !== -1 || urlPath.charAt(urlPath.length - 1) === '/' || url === self.registration.scope;
  var isConfig = url.indexOf('trip-config.json') !== -1;
  if (isHtml || isConfig) {
    event.respondWith(networkFirstWeather(event.request));
    return;
  }

  // Resto de app shell → cache-first
  event.respondWith(cacheFirstStatic(event.request));
});

function cacheFirstTile(request) {
  // Buscar en todos los tile caches disponibles
  return caches.keys().then(function(keys) {
    var tileCaches = keys.filter(function(k) { return k.indexOf('transit-tiles-') === 0; });
    // Intentar en orden: caches de tiles, luego cache principal
    var allCaches = tileCaches.concat([CACHE_NAME]);

    function tryNext(idx) {
      if (idx >= allCaches.length) {
        // No está en ningún cache — descargar y guardar en el tile cache activo
        return fetch(request).then(function(response) {
          if (response && response.ok) {
            var targetCache = tileCaches.length > 0 ? tileCaches[0] : CACHE_NAME;
            caches.open(targetCache).then(function(cache) {
              cache.put(request, response.clone());
            });
          }
          return response;
        }).catch(function() {
          return new Response('', { status: 503 });
        });
      }
      return caches.open(allCaches[idx]).then(function(cache) {
        return cache.match(request).then(function(cached) {
          if (cached) return cached;
          return tryNext(idx + 1);
        });
      });
    }
    return tryNext(0);
  });
}

function networkFirstWeather(request) {
  return fetch(request).then(function(response) {
    if (response && response.ok) {
      caches.open(CACHE_NAME).then(function(cache) {
        cache.put(request, response.clone());
      });
    }
    return response;
  }).catch(function() {
    return caches.open(CACHE_NAME).then(function(cache) {
      return cache.match(request).then(function(cached) {
        return cached || new Response(
          JSON.stringify({ error: 'offline', message: 'Sin conexión — datos no disponibles' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      });
    });
  });
}

function cacheFirstStatic(request) {
  return caches.open(CACHE_NAME).then(function(cache) {
    return cache.match(request).then(function(cached) {
      if (cached) return cached;
      return fetch(request).then(function(response) {
        if (response && response.ok && request.method === 'GET') {
          cache.put(request, response.clone());
        }
        return response;
      }).catch(function() {
        return cache.match('./index.html');
      });
    });
  });
}

// ============================================================
// MENSAJES desde la app
// ============================================================
self.addEventListener('message', function(event) {
  if (!event.data) return;

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (event.data.type === 'PRECACHE_MAP') {
    var tripId = event.data.tripId || 'default';
    var bbox = event.data.bbox || { minLat: -1, maxLat: 1, minLng: -1, maxLng: 1 };
    var zooms = event.data.zooms || [10, 11, 12];
    precacheMapTiles(tripId, bbox, zooms);
  }

  // Limpiar tiles de un viaje específico
  if (event.data.type === 'CLEAR_TRIP_TILES') {
    var tripId = event.data.tripId;
    if (tripId) {
      caches.delete('transit-tiles-' + tripId).then(function() {
        notifyClients({ type: 'TILES_CLEARED', tripId: tripId });
      });
    }
  }
});

function precacheMapTiles(tripId, bbox, zooms) {
  var tileCacheName = 'transit-tiles-' + tripId;

  caches.open(tileCacheName).then(function(cache) {
    var urls = [];

    zooms.forEach(function(z) {
      var minX = lng2tile(bbox.minLng, z);
      var maxX = lng2tile(bbox.maxLng, z);
      var minY = lat2tile(bbox.maxLat, z);
      var maxY = lat2tile(bbox.minLat, z);
      for (var x = minX; x <= maxX; x++) {
        for (var y = minY; y <= maxY; y++) {
          var sub = 'abcd'[Math.abs(x + y) % 4];
          urls.push(
            'https://' + sub + '.basemaps.cartocdn.com/rastertiles/voyager/' + z + '/' + x + '/' + y + '.png'
          );
        }
      }
    });

    var total = urls.length;
    var done = 0;
    var batchSize = 30;
    var idx = 0;

    function nextBatch() {
      if (idx >= urls.length) {
        notifyClients({ type: 'PRECACHE_DONE', total: total, tripId: tripId });
        return;
      }
      var batch = urls.slice(idx, idx + batchSize);
      idx += batchSize;
      Promise.allSettled(
        batch.map(function(url) {
          return fetch(url).then(function(r) {
            if (r.ok) { done++; return cache.put(url, r); }
          }).catch(function(){});
        })
      ).then(function() {
        notifyClients({ type: 'PRECACHE_PROGRESS', done: done, total: total });
        setTimeout(nextBatch, 100);
      });
    }

    nextBatch();
  });
}

function notifyClients(msg) {
  self.clients.matchAll().then(function(clients) {
    clients.forEach(function(c) { c.postMessage(msg); });
  });
}

function lng2tile(lng, z) {
  return Math.floor((lng + 180) / 360 * Math.pow(2, z));
}

function lat2tile(lat, z) {
  var rad = lat * Math.PI / 180;
  return Math.floor(
    (1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2 * Math.pow(2, z)
  );
}
