// ================================
// 리즈온 Service Worker
// 버전 올릴 때 CACHE_NAME만 바꾸면 돼
// ================================
const CACHE_NAME = 'leeson-v2.4.0';

const CACHE_FILES = [
  '/',
  '/index.html'
];

// 설치 — 새 캐시 생성
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CACHE_FILES))
  );
});

// 활성화 — 이전 캐시 삭제
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// fetch — 캐시 우선, 없으면 네트워크
self.addEventListener('fetch', e => {
  // API 요청은 캐시 안 함
  if (e.request.url.includes('script.google.com') ||
      e.request.url.includes('googleapis.com')) {
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

// 업데이트 메시지 수신 → 즉시 활성화
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
