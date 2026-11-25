/* SEMANTA service worker: makes the whole dictionary work offline.
   Bump VERSION whenever you change any file in web/ so visitors get the update. */
const VERSION = "semanta-v11";
const SHELL = [
  "./",
  "index.html",
  "css/app.css",
  "js/app.js",
  "manifest.webmanifest",
  "icons/icon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "data/topics.json",
  "data/translations.json",
  "data/lexicon.json",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(VERSION)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== VERSION && k !== VERSION + "-audio")
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});
self.addEventListener("fetch", (e) => {
  const req = e.request,
    url = new URL(req.url);
  if (
    req.method !== "GET" ||
    url.origin !== location.origin ||
    (url.pathname.startsWith("/api/") && !url.pathname.startsWith("/api/tts"))
  )
    return; // translation API stays online-only
  if (url.pathname.startsWith("/api/tts")) {
    // spoken words: cache-first, so a word you heard once plays offline
    e.respondWith(
      caches.open(VERSION + "-audio").then(async (c) => {
        const hit = await c.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) c.put(req, res.clone());
        return res;
      }),
    );
    return;
  }
  if (
    req.mode === "navigate" ||
    /\.(js|css|html|webmanifest)$/.test(url.pathname)
  ) {
    // app files: newest first, cache when offline
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) caches.open(VERSION).then((c) => c.put(req, res.clone()));
          return res;
        })
        .catch(() =>
          caches
            .match(req, { ignoreSearch: true })
            .then((r) => r || caches.match("index.html")),
        ),
    );
    return;
  }
  // stale-while-revalidate: answer instantly from cache, refresh in the background
  e.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: true });
      const network = fetch(req)
        .then((res) => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => null);
      if (cached) {
        e.waitUntil(network);
        return cached;
      }
      return (
        (await network) ||
        (req.mode === "navigate" ? cache.match("index.html") : Response.error())
      );
    }),
  );
});
