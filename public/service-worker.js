const assets = [
    '/',
    '/css',
    '/images/Image-Not-Available.png',
    '/images/tmdbLogo.svg',
    '/images/darkKnightTextLess.jpeg',
    '/public/javascript/script.js'
]

//install service worker
self.addEventListener("install", e =>{
    e.waitUntil(
        caches.open("static").then(cache => {
            return cache.addAll(assets);
        })
    );
})

//activate
self.addEventListener('activate', e =>{
    console.log('Service worker is activated');
})

//fetch
self.addEventListener("fetch", e => {
    console.log("Intercepting fetch request for " + e.request.url);
    // e.respondWith(
    //     caches.match(e.request).then(response => {
    //         return response || fetch(e.request);
    //     })
    // );
}) 