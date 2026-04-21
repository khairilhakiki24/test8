const CACHE_NAME = 'sketchpro-v4';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    // Cache CDN External
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://unpkg.com/lucide@latest',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                // Hapus cache lama jika ada versi baru
                if (key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            }));
        })
    );
    self.clients.claim();
});

// Cache-first strategy for bulletproof offline
self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => {
            // Jika ada di cache, gunakan cache. Jika tidak, ambil dari jaringan.
            return response || fetch(e.request).then((fetchResponse) => {
                return caches.open(CACHE_NAME).then((cache) => {
                    // Hanya simpan respon HTTP 200 yang valid ke dalam cache (Dynamic caching untuk CDN)
                    if(e.request.url.startsWith('http') && fetchResponse.status === 200) {
                        cache.put(e.request, fetchResponse.clone());
                    }
                    return fetchResponse;
                });
            });
        }).catch(() => {
            // Fallback offline sempurna jika tidak ada koneksi dan request file tidak ditemukan di cache
            if (e.request.mode === 'navigate') {
                return caches.match('./index.html');
            }
        })
    );
});