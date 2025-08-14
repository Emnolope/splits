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
				"android-chrome-36x36.png", // Favicon, Android Chrome M39+ with 0.75 screen density
				"android-chrome-48x48.png", // Favicon, Android Chrome M39+ with 1.0 screen density
				"android-chrome-72x72.png", // Favicon, Android Chrome M39+ with 1.5 screen density
				"android-chrome-96x96.png", // Favicon, Android Chrome M39+ with 2.0 screen density
				"android-chrome-144x144.png", // Favicon, Android Chrome M39+ with 3.0 screen density
				"android-chrome-192x192.png", // Favicon, Android Chrome M39+ with 4.0 screen density
				"android-chrome-256x256.png", // Favicon, Android Chrome M47+ Splash screen with 1.5 screen density
				"android-chrome-384x384.png", // Favicon, Android Chrome M47+ Splash screen with 3.0 screen density
				"android-chrome-512x512.png", // Favicon, Android Chrome M47+ Splash screen with 4.0 screen density
				"apple-touch-icon.png", // Favicon, Apple default
				"apple-touch-icon-57x57.png", // Apple iPhone, Non-retina with iOS6 or prior
				"apple-touch-icon-60x60.png", // Apple iPhone, Non-retina with iOS7
				"apple-touch-icon-72x72.png", // Apple iPad, Non-retina with iOS6 or prior
				"apple-touch-icon-76x76.png", // Apple iPad, Non-retina with iOS7
				"apple-touch-icon-114x114.png", // Apple iPhone, Retina with iOS6 or prior
				"apple-touch-icon-120x120.png", // Apple iPhone, Retina with iOS7
				"apple-touch-icon-144x144.png", // Apple iPad, Retina with iOS6 or prior
				"apple-touch-icon-152x152.png", // Apple iPad, Retina with iOS7
				"apple-touch-icon-180x180.png", // Apple iPhone 6 Plus with iOS8
				"browserconfig.xml", // IE11 icon configuration file
				"favicon.ico", // Favicon, IE and fallback for other browsers
				"favicon-16x16.png", // Favicon, default
				"favicon-32x32.png", // Favicon, Safari on Mac OS
				"index.html", // Main HTML file
				"logo.png", // Logo
				"main.js", // Main Javascript file
				"manifest.json", // Manifest file
				"maskable_icon.png", // Favicon, maskable https://web.dev/maskable-icon
				"mstile-70x70.png", // Favicon, Windows 8 / IE11
				"mstile-144x144.png", // Favicon, Windows 8 / IE10
				"mstile-150x150.png", // Favicon, Windows 8 / IE11
				"mstile-310x150.png", // Favicon, Windows 8 / IE11
				"mstile-310x310.png", // Favicon, Windows 8 / IE11
				"safari-pinned-tab.svg", // Favicon, Safari pinned tab
				"share.jpg", // Social media sharing
				"style.css", // Main CSS file
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
