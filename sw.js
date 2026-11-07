/* Overnia PWA: network-first HTML, offline fallback; never cache update-check requests. */
const CACHE = 'overnia-app-v4-version-json-20261107';
const APP_FILES = ['./','./index.html','./manifest.webmanifest','./version.json','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP_FILES)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('overnia-app-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return;
  // Explicit version probes must reach GitHub Pages, never a cached copy.
  if(url.pathname.endsWith('/version.json') || url.searchParams.has('overnia_update_check')){
    event.respondWith(fetch(new Request(req,{cache:'no-store'})));
    return;
  }
  if(req.mode==='navigate'||url.pathname.endsWith('/index.html')){
    event.respondWith(fetch(new Request(req,{cache:'no-store'})).then(response=>{
      if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(c=>c.put('./index.html',copy)));}
      return response;
    }).catch(async()=>(await caches.match('./index.html'))||Response.error()));
    return;
  }
  event.respondWith(caches.match(req).then(cached=>cached||fetch(req)));
});
