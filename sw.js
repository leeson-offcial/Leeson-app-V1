// ── 리즈온 Service Worker ──
// 버전만 올리면 홈화면 앱도 업데이트 배너 표시
// ★ 업데이트 시 아래 CACHE_NAME 숫자만 올리세요

const CACHE_NAME = 'leeson-v2.2.0';

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
