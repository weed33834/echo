/**
 * Echo · 回响 — Service Worker
 *
 * 策略：
 *  - 静态资源（JS / CSS / 字体 / 图片 / manifest）：cache-first
 *  - API 请求（跨域或 /api/ 路径）：network-first，不缓存
 *  - 页面导航（HTML document）：network-first，离线时回退到缓存的 index.html
 *
 * 作用域自适应：基于 self.registration.scope 推导 base 路径，
 * 因此本地开发（base '/'）与生产部署（base '/echo/'）均可工作。
 */

const CACHE_VERSION = 'echo-v1'
const CACHE_NAME = `echo-cache-${CACHE_VERSION}`

/* 由 SW 作用域推导出应用 base 路径（结尾带 /） */
const BASE = self.registration.scope.endsWith('/')
  ? self.registration.scope
  : self.registration.scope + '/'

/* 预缓存的核心资源（相对于 base） */
const PRECACHE_URLS = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.json'
]

/* 静态资源后缀（命中则走 cache-first） */
const STATIC_ASSET_RE = /\.(?:js|css|woff2?|ttf|otf|eot|png|jpe?g|gif|webp|svg|ico|json|wasm)$/i

/* 判定是否为 API 请求（跨域或路径含 /api/） */
function isApiRequest(url, request) {
  if (url.origin !== self.location.origin) return true
  if (url.pathname.includes('/api/')) return true
  // LLM 流式请求通常通过 fetch + ReadableStream，无 destination
  if (request.mode === 'cors') return true
  return false
}

/* 判定是否为静态资源请求 */
function isStaticAsset(url, request) {
  if (request.method !== 'GET') return false
  if (url.origin !== self.location.origin) return false
  if (STATIC_ASSET_RE.test(url.pathname)) return true
  // Vite 资源常见于 /assets/ 目录
  if (url.pathname.includes('/assets/')) return true
  return false
}

/* ============================================================
 * Install：预缓存核心资源
 * ============================================================ */
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      // 逐个添加，单个失败不影响整体安装
      await Promise.all(
        PRECACHE_URLS.map(async (url) => {
          try {
            const res = await fetch(url, { cache: 'reload' })
            if (res && res.ok) await cache.put(url, res.clone())
          } catch (_) {
            /* 忽略网络失败 */
          }
        })
      )
      // 安装完成立即激活，便于首次注册即生效
      await self.skipWaiting()
    })()
  )
})

/* ============================================================
 * Activate：清理旧版本缓存
 * ============================================================ */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
      await self.clients.claim()
    })()
  )
})

/* ============================================================
 * Fetch：分策略响应
 * ============================================================ */
self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  let url
  try {
    url = new URL(request.url)
  } catch (_) {
    return
  }

  // 只处理 http/https
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return

  // 1) 页面导航：network-first，离线回退到缓存的 index.html
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request))
    return
  }

  // 2) API 请求：network-first，失败时不缓存、返回网络错误
  if (isApiRequest(url, request)) {
    event.respondWith(fetch(request).catch(() => new Response('', { status: 504, statusText: 'Gateway Timeout' })))
    return
  }

  // 3) 静态资源：cache-first，回退到网络并缓存
  if (isStaticAsset(url, request)) {
    event.respondWith(cacheFirst(request))
    return
  }

  // 4) 其它同源 GET：stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request))
})

/* ---------- 策略实现 ---------- */

async function networkFirstNavigation(request) {
  const cache = await caches.open(CACHE_NAME)
  try {
    const fresh = await fetch(request)
    // 缓存最新的 index 页面
    if (fresh && fresh.ok && fresh.type === 'basic') {
      cache.put(request, fresh.clone()).catch(() => {})
    }
    return fresh
  } catch (_) {
    // 离线：尝试匹配缓存的导航请求，否则回退到 BASE / index.html
    const cached =
      (await cache.match(request)) ||
      (await cache.match(BASE)) ||
      (await cache.match(BASE + 'index.html'))
    if (cached) return cached
    return new Response(offlineFallbackHtml(), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)
  if (cached) return cached
  try {
    const fresh = await fetch(request)
    if (fresh && fresh.ok && fresh.type === 'basic') {
      cache.put(request, fresh.clone()).catch(() => {})
    }
    return fresh
  } catch (_) {
    return cached || new Response('', { status: 504 })
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)
  const network = fetch(request)
    .then((fresh) => {
      if (fresh && fresh.ok && fresh.type === 'basic') {
        cache.put(request, fresh.clone()).catch(() => {})
      }
      return fresh
    })
    .catch(() => cached)
  return cached || network
}

/* ---------- 离线兜底页面 ---------- */
function offlineFallbackHtml() {
  return [
    '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '<meta name="theme-color" content="#15131f">',
    '<title>Echo · 回响 — 离线</title>',
    '<style>',
    'html,body{margin:0;height:100%;background:#15131f;color:#c9c3d6;',
    'font-family:system-ui,-apple-system,"PingFang SC","Microsoft YaHei",serif;}',
    '.wrap{min-height:100%;display:flex;flex-direction:column;align-items:center;',
    'justify-content:center;text-align:center;padding:32px;box-sizing:border-box;}',
    '.glyph{font-size:64px;color:#5b3fd6;font-weight:bold;margin-bottom:12px;}',
    'h1{font-size:20px;margin:8px 0 4px;color:#e8e4f0;}',
    'p{font-size:14px;color:#8a85a0;margin:4px 0 24px;max-width:320px;line-height:1.6;}',
    'button{background:#5b3fd6;color:#fff;border:none;padding:10px 20px;border-radius:999px;',
    'font-size:14px;cursor:pointer;}',
    '</style></head><body><div class="wrap">',
    '<div class="glyph">回</div>',
    '<h1>当前处于离线状态</h1>',
    '<p>命运印证引擎暂未连接网络。已缓存的页面仍可使用，重新连接后即可查看每日运势与 AI 对话。</p>',
    '<button onclick="location.reload()">重新连接</button>',
    '</div></body></html>'
  ].join('')
}

/* ---------- 接收前端控制消息 ---------- */
self.addEventListener('message', (event) => {
  const data = event.data || {}
  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
