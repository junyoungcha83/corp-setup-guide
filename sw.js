const CACHE = 'corp-guide-v1';
const ASSETS = ['./','./index.html','./assets/app.css?v=1','./assets/app.js?v=1','./manifest.webmanifest','./assets/icon.svg','./data/default.json'];
self.addEventListener('install', e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).catch(()=>{})); self.skipWaiting(); });
self.addEventListener('activate', e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e=>{
  const req=e.request; if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin) return;            // API·유튜브 등은 SW 우회
  e.respondWith(fetch(req).then(res=>{ const copy=res.clone(); caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{}); return res; })
    .catch(()=>caches.match(req).then(r=>r||caches.match('./index.html'))));
});
