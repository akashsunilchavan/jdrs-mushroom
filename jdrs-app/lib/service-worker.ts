// Service Worker for offline functionality
const CACHE_NAME = "jdrs-app-v1"
const STATIC_ASSETS = ["/", "/admin/dashboard", "/supervisor/dashboard", "/offline.html"]

// Install event - cache static assets
self.addEventListener("install", (event: any) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    }),
  )
})

// Fetch event - serve from cache when offline
self.addEventListener("fetch", (event: any) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return (
        response ||
        fetch(event.request).catch(() => {
          // If both cache and network fail, return offline page for navigation requests
          if (event.request.mode === "navigate") {
            return caches.match("/offline.html")
          }
        })
      )
    }),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event: any) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
})

export {}
