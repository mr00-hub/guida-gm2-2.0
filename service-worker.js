const CACHE = 'guida-gm2-v19-hero-zoom';
const ASSETS = [
  './','./index.html','./style.css','./app.js','./dati/gm2-data.js','./dati/gm2-videos.js','./manifest.json','./icon.svg','./img/logo.png',
  './img/squadre/Marco/Marco-1.png','./img/squadre/Marco/Marco-2.png','./img/squadre/Marco/Marco-3.png','./img/squadre/Marco/Marco-4.png','./img/squadre/Marco/Marco-5.png','./img/squadre/Marco/Marco-6.png',
  './img/squadre/Monica/Monica-1.png','./img/squadre/Monica/Monica-2.png','./img/squadre/Monica/Monica-3.png','./img/squadre/Monica/Monica-4.png','./img/squadre/Monica/Monica-5.png','./img/squadre/Monica/Monica-6.png'
];
self.addEventListener('install', event => { self.skipWaiting(); event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', event => { event.respondWith(caches.match(event.request).then(resp => resp || fetch(event.request))); });
