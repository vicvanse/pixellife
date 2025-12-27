// Service Worker básico para PWA
// Protege contra limpeza de dados do Safari quando instalado

const CACHE_NAME = 'pixel-life-v1';
const RUNTIME_CACHE = 'pixel-life-runtime-v1';

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  // Não espera por cache na instalação - instalação rápida
  self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  // Assume controle imediato de todas as páginas
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            // Remove caches antigos
            return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
          })
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  // Assume controle imediato
  return self.clients.claim();
});

// Estratégia: Network First para dados dinâmicos
// Cache apenas para assets estáticos
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora requisições não-GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignora requisições com schemes não suportados (chrome-extension, etc)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  // Ignora requisições para Supabase (sempre network)
  if (url.hostname.includes('supabase.co')) {
    return;
  }

  // Cache apenas assets estáticos (imagens, fonts, etc)
  if (
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.pathname.startsWith('/_next/static')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          // Cache apenas respostas válidas
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              // Verificar novamente se o request é válido antes de fazer cache
              try {
                cache.put(request, responseToCache).catch((error) => {
                  // Ignorar erros de cache silenciosamente (especialmente para chrome-extension)
                  if (!error.message.includes('chrome-extension')) {
                    console.warn('[SW] Cache error:', error);
                  }
                });
              } catch (error) {
                // Ignorar erros silenciosamente
              }
            });
          }
          return response;
        }).catch((error) => {
          // Se falhar, retornar erro silenciosamente
          console.warn('[SW] Fetch error:', error);
          throw error;
        });
      })
    );
  }
});

