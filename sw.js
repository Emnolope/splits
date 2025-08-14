const cacheName = "cache1"; // Change value to force update

self.addEventListener("install", event => {
	console.log('SW INSTALL: Starting installation, cacheName:', cacheName);
	// Kick out the old service worker
	self.skipWaiting();

	event.waitUntil(
		caches.open(cacheName).then(cache => {
			console.log('SW INSTALL: Cache opened, adding files...');
			return cache.addAll([
				"/",
				"apple-touch-icon.png", // Favicon, Apple default
				"favicon.ico", // Favicon, IE and fallback for other browsers
				"favicon.svg", // Favicon, SVG
				"favicon-96x96.png", // Favicon, 96x96
				"index.html", // Main HTML file
				"main.js", // Main Javascript file
				"manifest.json", // Manifest file
				"maskable_icon.png", // Favicon, maskable https://web.dev/maskable-icon
				"robots.txt", // Robots file
				"safari-pinned-tab.svg", // Favicon, Safari pinned tab
				"site.webmanifest", // Site webmanifest
				"sitemap.xml", // Sitemap file
				"style.css", // Main CSS file
				"web-app-manifest-192x192.png", // Web app manifest icon 192x192
				"web-app-manifest-512x512.png", // Web app manifest icon 512x512
			]).then(() => {
				console.log('SW INSTALL: All files cached successfully');
			}).catch(error => {
				console.log('SW INSTALL ERROR:', error.message);
				throw error;
			});
		})
	);
});

self.addEventListener("activate", event => {
	// Delete any non-current cache
	event.waitUntil(
		caches.keys().then(keys => {
			Promise.all(
				keys.map(key => {
					if (![cacheName].includes(key)) {
						return caches.delete(key);
					}
				})
			)
		})
	);
});

// Offline-first, cache-first strategy
// Kick off two asynchronous requests, one to the cache and one to the network
// If there's a cached version available, use it, but fetch an update for next time.
// Gets data on screen as quickly as possible, then updates once the network has returned the latest data. 
self.addEventListener("fetch", event => {
	console.log('SW FETCH:', event.request.url, 'Method:', event.request.method, 'Destination:', event.request.destination);
	
	event.respondWith(
		caches.open(cacheName).then(cache => {
			console.log('SW: Cache opened:', cacheName);
			return cache.match(event.request).then(response => {
				if (response) {
					console.log('SW CACHE HIT:', event.request.url);
					return response;
				} else {
					console.log('SW CACHE MISS:', event.request.url);
					return fetch(event.request).then(networkResponse => {
						console.log('SW NETWORK SUCCESS:', event.request.url, 'Status:', networkResponse.status);
						cache.put(event.request, networkResponse.clone());
						return networkResponse;
					}).catch(error => {
						console.log('SW NETWORK FAIL:', event.request.url, 'Error:', error.message);
						// Return a basic offline response for HTML requests
						if (event.request.destination === 'document') {
							console.log('SW: Returning offline fallback for document');
							return new Response('App is offline', { 
								status: 200, 
								headers: { 'Content-Type': 'text/plain' } 
							});
						}
						throw new Error('Network unavailable');
					});
				}
			}).catch(error => {
				console.log('SW CACHE ERROR:', event.request.url, 'Error:', error.message);
				throw error;
			});
		}).catch(error => {
			console.log('SW CACHE OPEN ERROR:', error.message);
			throw error;
		})
	);
});
