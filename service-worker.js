const CACHE = 'adv-calc-v1';
const ASSETS = [
  '.',
  './index.html',
  './style.css',
  './script.js',
  './ai.js',
  './theme.js',
  './pwa.js',
  './manifest.json'
];

// install
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});

// activate
self.addEventListener('activate', e=>{
  e.waitUntil(clients.claim());
});

// fetch
self.addEventListener('fetch', e=>{
  e.respondWith(caches.match(e.request).then(r=> r ? r : fetch(e.request)));
});
