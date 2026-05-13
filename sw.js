// ── 리즈온 Service Worker ──
// ★ 업데이트 시 아래 CACHE_NAME을 index.html의 CACHE_VERSION과 동일하게 올리세요
//   index.html: const CACHE_VERSION = 'leeson-v2.3.0'
//   sw.js:      const CACHE_NAME    = 'leeson-v2.3.0'  ← 반드시 일치

const CACHE_NAME = 'leeson-v2.3.0';

// 캐시할 파일 목록
const CACHE_FILES = [
  '/',
  '/index.html'
];

// ── 설치 ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CACHE_FILES);
    }).then(() => {
      // 대기 없이 바로 활성화
      return self.skipWaiting();
    })
  );
});

// ── 활성화 ──
// 이전 버전 캐시 삭제 → 새 버전으로 교체
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    }).then(() => {
      // 열려있는 모든 탭에 즉시 적용
      return self.clients.claim();
    })
  );
});

// ── fetch ──
// 네트워크 우선 → 실패 시 캐시 반환
// (항상 최신 index.html을 받아오되, 오프라인이면 캐시 사용)
self.addEventListener('fetch', event => {
  // GAS API 요청은 캐시하지 않음 (식단이 매번 같아지는 원인 차단)
  if (event.request.url.includes('script.google.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // html 요청은 항상 네트워크 우선
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // 새 응답을 캐시에도 저장
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // 나머지 리소스는 캐시 우선
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request);
    })
  );
});

// ── 새 버전 감지 시 클라이언트에 알림 ──
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
