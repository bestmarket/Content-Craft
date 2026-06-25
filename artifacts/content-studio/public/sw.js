const CACHE_VERSION = "v1";
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const FONT_CACHE = `fonts-${CACHE_VERSION}`;

const PRECACHE_URLS = ["/", "/login", "/register", "/pricing"];

// On install — precache the core shell pages
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// On activate — purge old cache versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== FONT_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept API calls or cross-origin requests
  if (url.pathname.startsWith("/api") || url.origin !== location.origin) return;

  // Fonts — cache-first forever
  if (url.pathname.match(/\.(woff2?|ttf|otf|eot)$/)) {
    event.respondWith(
      caches.open(FONT_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const fresh = await fetch(request);
        cache.put(request, fresh.clone());
        return fresh;
      })
    );
    return;
  }

  // JS / CSS / images — cache-first, revalidate in background (stale-while-revalidate)
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|webp|ico|gif)$/)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const fetchPromise = fetch(request).then((fresh) => {
          cache.put(request, fresh.clone());
          return fresh;
        });
        return cached || fetchPromise;
      })
    );
    return;
  }

  // HTML navigation — network-first, fall back to cached shell
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match("/").then((cached) => cached || fetch(request))
      )
    );
  }
});
