const CACHE_NAME = 'nursery-erp-cache-v6'; // قم بترقيتها إلى v6 ليقوم المتصفح بتحديث الملفات فوراً
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

// تثبيت السيرفس وركر وحفظ الواجهات الأساسية
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// تنظيف ملفات الكاش القديمة لضمان تحديث النظام
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// إدارة الطلبات أثناء انقطاع الإنترنت (أوفلاين)
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // إذا كان هناك إنترنت، يتم حفظ نسخة احتياطية من الملفات المستدعاة
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // في حال عدم وجود إنترنت، يتم سحب البيانات المقابلة من الكاش فوراً
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // توجيه تلقائي للصفحة الرئيسية للمشتل عند تعذر طلب التنقل
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
