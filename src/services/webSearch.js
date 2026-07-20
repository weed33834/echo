/**
 * 联网搜索服务 — Tavily API 封装
 *
 * 职责：
 * 1. searchWeb(query, options)     — 调用 Tavily Search API，返回结构化结果
 * 2. formatSearchResults(results)  — 将搜索结果格式化为 AI 可读文本
 * 3. webSearchTool                 — OpenAI Function Calling 工具 schema
 *
 * 纯前端，API Key 由管理员配置（chatStore.adminConfig.webSearchApiKey），
 * 所有请求由浏览器直接发出。
 */

/* ============================================================
 * 一、常量
 * ============================================================ */

const TAVILY_ENDPOINT = 'https://api.tavily.com/search'
const DEFAULT_TIMEOUT_MS = 10000
const DEFAULT_MAX_RESULTS = 5

/* ============================================================
 * 二、核心搜索
 * ============================================================ */

/**
 * 调用 Tavily Search API 执行联网搜索
 *
 * @param {string} query - 搜索查询字符串
 * @param {Object} [options]
 * @param {string} [options.apiKey] - Tavily API Key（tvly-...）
 * @param {number} [options.maxResults=5] - 最大返回结果数
 * @param {AbortSignal} [options.signal] - 外部取消信号
 * @param {number} [options.timeoutMs=10000] - 超时毫秒
 * @returns {Promise<{ ok: boolean, answer?: string, results?: Array, error?: string }>}
 */
export async function searchWeb(query, options = {}) {
  const apiKey = options.apiKey
  const maxResults = options.maxResults ?? DEFAULT_MAX_RESULTS
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS

  // 参数校验
  if (!query || typeof query !== 'string' || !query.trim()) {
    return { ok: false, error: '搜索查询不能为空' }
  }

  if (!apiKey) {
    return { ok: false, error: '未配置 Tavily API Key，无法执行联网搜索' }
  }

  // 超时控制：AbortController + setTimeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  // 联动外部取消信号
  if (options.signal) {
    if (options.signal.aborted) {
      controller.abort()
    } else {
      options.signal.addEventListener('abort', () => controller.abort(), { once: true })
    }
  }

  try {
    const response = await fetch(TAVILY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query: query.trim(),
        max_results: maxResults,
        include_answer: true
      }),
      signal: controller.signal
    })

    if (!response.ok) {
      const errBody = await response.text().catch(() => '')
      let detail = ''
      try {
        const json = JSON.parse(errBody)
        detail = json.detail || json.message || json.error || ''
      } catch {
        detail = typeof errBody === 'string' ? errBody.slice(0, 200) : ''
      }
      return {
        ok: false,
        error: `Tavily API 返回 HTTP ${response.status}${detail ? '：' + detail : ''}`
      }
    }

    const data = await response.json()
    return {
      ok: true,
      answer: data.answer || '',
      results: Array.isArray(data.results) ? data.results : []
    }
  } catch (err) {
    if (err?.name === 'AbortError') {
      return {
        ok: false,
        error: `联网搜索超时（${timeoutMs}ms），请稍后重试`
      }
    }
    return {
      ok: false,
      error: `联网搜索失败：${err?.message || String(err)}`
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

/* ============================================================
 * 三、结果格式化
 * ============================================================ */

/**
 * 将搜索结果格式化为 AI 可读文本
 *
 * 兼容两种入参：
 *   formatSearchResults(searchResult)  — searchWeb 返回的对象 { ok, answer, results }
 *   formatSearchResults(resultsArray)  — 仅传结果数组
 *
 * @param {Object|Array} results - searchWeb 返回对象或结果数组
 * @returns {string} AI 可读的文本
 */
export function formatSearchResults(results) {
  // 兼容：入参可能是 searchWeb 返回的对象，也可能直接是结果数组
  let answer = ''
  let items = []

  if (Array.isArray(results)) {
    items = results
  } else if (results && typeof results === 'object') {
    if (results.ok === false) {
      // 搜索失败的响应
      return `[联网搜索失败] ${results.error || '未知错误'}`
    }
    answer = results.answer || ''
    items = Array.isArray(results.results) ? results.results : []
  } else {
    return '[联网搜索] 未获取到任何结果'
  }

  if (!items.length && !answer) {
    return '[联网搜索] 未获取到任何结果'
  }

  const lines = ['[联网搜索结果]']
  if (answer) {
    lines.push(`摘要：${answer}`)
    lines.push('')
  }
  items.forEach((item, i) => {
    const title = item.title || '（无标题）'
    const url = item.url || ''
    const content = item.content || ''
    lines.push(`${i + 1}. ${title}`)
    if (url) lines.push(`   链接：${url}`)
    if (content) lines.push(`   内容：${content}`)
  })
  return lines.join('\n')
}

/* ============================================================
 * 四、OpenAI Function Calling 工具 schema
 * ============================================================ */

/**
 * web_search 工具的 OpenAI Function Calling schema
 * 供 getToolSchemas() 在启用联网搜索时追加到工具数组
 */
export const webSearchTool = {
  type: 'function',
  function: {
    name: 'web_search',
    description: '联网搜索实时信息。当用户询问最新资讯、实时数据、近期事件或你不确定的事实时调用此工具。返回搜索摘要与相关网页片段。请勿用于命理推演类问题。',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '搜索关键词，使用简洁明确的查询语句'
        }
      },
      required: ['query']
    }
  }
}

/* ============================================================
 * 五、导出汇总
 * ============================================================ */

export const WebSearch = {
  searchWeb,
  formatSearchResults,
  webSearchTool
}

export default WebSearch
