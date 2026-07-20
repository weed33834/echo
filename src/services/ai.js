/**
 * AI 服务层 — 统一 OpenAI 兼容协议
 *
 * 支持 provider：deepseek / openai / anthropic / 通义 / 本地 Ollama / custom
 * 能力：SSE 流式输出、Function Calling、连接测试、请求取消
 *
 * 纯前端，API Key 存于 localStorage，所有请求由浏览器直接发出。
 */

/* ============================================================
 * 一、预设模型列表
 * ============================================================ */

export const DEFAULT_MODELS = [
  { id: 'deepseek-flash', provider: 'deepseek', label: 'DeepSeek V4 Flash（默认·快速）', model: 'deepseek-v4-flash', baseUrl: 'https://api.deepseek.com/v1', requireKey: true, isDefault: true },
  { id: 'deepseek-pro', provider: 'deepseek', label: 'DeepSeek V4 Pro（深度思考）', model: 'deepseek-v4-pro', baseUrl: 'https://api.deepseek.com/v1', requireKey: true },
  { id: 'openai-mini', provider: 'openai', label: 'OpenAI GPT-4o mini', model: 'gpt-4o-mini', baseUrl: 'https://api.openai.com/v1', requireKey: true },
  { id: 'openai-4o', provider: 'openai', label: 'OpenAI GPT-4o', model: 'gpt-4o', baseUrl: 'https://api.openai.com/v1', requireKey: true },
  { id: 'claude-haiku', provider: 'anthropic', label: 'Claude 3.5 Haiku', model: 'claude-3-5-haiku-20241022', baseUrl: 'https://api.anthropic.com/v1', requireKey: true },
  { id: 'qwen', provider: 'custom', label: '通义千问 Turbo', model: 'qwen-turbo', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', requireKey: true },
  { id: 'local', provider: 'custom', label: '本地 Ollama', model: 'llama3', baseUrl: 'http://localhost:11434/v1', requireKey: false }
]

/* ============================================================
 * 二、错误处理
 * ============================================================ */

const ERROR_MESSAGES = {
  400: '请求格式错误（400），请检查参数或模型名',
  401: 'API Key 无效或已过期（401），请检查设置',
  403: '访问被拒绝（403），可能是权限或地域限制',
  404: '接口或模型不存在（404），请检查 baseUrl 与 model',
  413: '请求体过大（413），请缩减消息长度',
  429: '请求过于频繁（429），请稍后再试或降低频率',
  500: '服务端错误（500），请稍后重试',
  502: '网关错误（502），服务暂时不可用',
  503: '服务不可用（503），请稍后重试',
  504: '网关超时（504），请稍后重试'
}

export class AIError extends Error {
  constructor(message, { status, code } = {}) {
    super(message)
    this.name = 'AIError'
    this.status = status
    this.code = code
  }
}

function mapHttpError(status, body) {
  const hint = ERROR_MESSAGES[status] || `HTTP ${status}`
  let detail = ''
  try {
    const json = JSON.parse(body)
    detail = json.error?.message || json.message || json.error || ''
  } catch {
    detail = typeof body === 'string' ? body.slice(0, 200) : ''
  }
  return new AIError(detail ? `${hint}：${detail}` : hint, { status })
}

/* ============================================================
 * 三、请求体构造
 * ============================================================ */

/**
 * 构造 OpenAI 兼容的请求体
 * @param {Array} messages - 消息数组
 * @param {Array} [tools] - OpenAI Function Calling 工具定义
 * @param {Object} config - 模型配置 { provider, baseUrl, apiKey, model, temperature, maxTokens, stream }
 * @returns {Object} 请求体
 */
export function buildRequestBody(messages, tools, config) {
  const body = {
    model: config.model,
    messages,
    temperature: config.temperature ?? 0.7,
    max_tokens: config.maxTokens ?? 2048,
    stream: config.stream !== false
  }
  if (tools && tools.length) {
    body.tools = tools
    body.tool_choice = 'auto'
  }
  return body
}

/**
 * 构造请求头（anthropic 需要 extra header）
 */
function buildHeaders(config) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.apiKey || ''}`
  }
  if (config.provider === 'anthropic') {
    headers['anthropic-version'] = '2023-06-01'
  }
  if (config.extraHeaders) {
    Object.assign(headers, config.extraHeaders)
  }
  return headers
}

/* ============================================================
 * 四、SSE 流解析
 * ============================================================ */

/**
 * 解析 SSE 流式响应
 * - 逐行解析 "data: {json}" 格式
 * - delta.content → onToken(text)
 * - delta.tool_calls → 按 index 累积，完整后 onToolCall(toolCall)
 * - "data: [DONE]" → onDone()
 *
 * @param {Response} response - fetch 返回的 Response 对象
 * @param {Object} callbacks - { onToken, onToolCall, onDone }
 */
export async function parseSSEStream(response, { onToken, onToolCall, onDone }) {
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  // 按 index 累积 tool_call 片段
  let toolCallsAccum = {}
  let toolCallsEmitted = false

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    // 按换行切分，最后一段不完整留到下次
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data: ')) continue
      const data = trimmed.slice(6)
      if (data === '[DONE]') {
        // 流结束前若有未发射的 tool_calls，补发
        if (!toolCallsEmitted && Object.keys(toolCallsAccum).length) {
          emitToolCalls(toolCallsAccum, onToolCall)
        }
        onDone?.()
        return
      }
      try {
        const json = JSON.parse(data)
        const choice = json.choices?.[0]
        if (!choice) continue
        const delta = choice.delta
        if (delta) {
          if (delta.content) onToken?.(delta.content)
          if (delta.tool_calls) {
            for (const tc of delta.tool_calls) {
              const idx = tc.index ?? 0
              if (!toolCallsAccum[idx]) {
                toolCallsAccum[idx] = { id: '', function: { name: '', arguments: '' }, index: idx }
              }
              if (tc.id) toolCallsAccum[idx].id = tc.id
              if (tc.function?.name) toolCallsAccum[idx].function.name += tc.function.name
              if (tc.function?.arguments) toolCallsAccum[idx].function.arguments += tc.function.arguments
            }
          }
        }
        // finish_reason 出现时，若有累积的 tool_calls 则发射
        if (choice.finish_reason === 'tool_calls' && !toolCallsEmitted && Object.keys(toolCallsAccum).length) {
          emitToolCalls(toolCallsAccum, onToolCall)
          toolCallsEmitted = true
        }
      } catch {
        // 忽略无法解析的行（如心跳注释）
      }
    }
  }
  // 流自然结束（未收到 [DONE]）时兜底
  if (!toolCallsEmitted && Object.keys(toolCallsAccum).length) {
    emitToolCalls(toolCallsAccum, onToolCall)
  }
  onDone?.()
}

/**
 * 将累积的 tool_calls 解析并发射
 */
function emitToolCalls(toolCallsAccum, onToolCall) {
  Object.values(toolCallsAccum).forEach(tc => {
    const out = { id: tc.id, function: { name: tc.function.name, arguments: tc.function.arguments } }
    // 尝试把 arguments 字符串解析为对象
    try {
      out.function.arguments = JSON.parse(tc.function.arguments)
    } catch {
      // 解析失败则保留原始字符串
    }
    onToolCall?.(out)
  })
}

/* ============================================================
 * 五、核心调用
 * ============================================================ */

/**
 * 发起一次聊天补全请求
 *
 * @param {Object} params
 * @param {Array} params.messages - 消息数组
 * @param {Array} [params.tools] - Function Calling 工具定义
 * @param {Object} params.config - 模型配置
 * @param {Function} [params.onToken] - 流式 token 回调
 * @param {Function} [params.onToolCall] - 工具调用回调
 * @param {Function} [params.onDone] - 完成回调
 * @param {Function} [params.onError] - 错误回调
 * @param {AbortSignal} [params.signal] - 取消信号
 * @returns {Promise<void>}
 */
export async function chatCompletion({ messages, tools, config, onToken, onToolCall, onDone, onError, signal }) {
  // 无 apiKey 且需要 key 的模型 → 走 mock 占位回复
  // requireKey !== false 意味着 requireKey 为 true 或 undefined（默认需要 key）
  if (config.provider === 'mock' || (!config.apiKey && config.requireKey !== false)) {
    await mockChat({ messages, onToken, onDone, onError, signal })
    return
  }

  const body = buildRequestBody(messages, tools, config)
  const url = `${(config.baseUrl || '').replace(/\/+$/, '')}/chat/completions`
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: buildHeaders(config),
      body: JSON.stringify(body),
      signal
    })
    if (!response.ok) {
      const errBody = await response.text()
      throw mapHttpError(response.status, errBody)
    }
    if (config.stream !== false) {
      // 流式
      await parseSSEStream(response, { onToken, onToolCall, onDone })
    } else {
      // 非流式
      const data = await response.json()
      const msg = data.choices?.[0]?.message
      if (!msg) {
        onDone?.(null)
        return
      }
      if (msg.tool_calls && msg.tool_calls.length) {
        msg.tool_calls.forEach(tc => {
          // 统一 arguments 为对象
          if (typeof tc.function?.arguments === 'string') {
            try { tc.function.arguments = JSON.parse(tc.function.arguments) } catch {}
          }
          onToolCall?.(tc)
        })
      }
      if (msg.content) onToken?.(msg.content)
      onDone?.(msg)
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      onDone?.()
      return
    }
    const wrapped = err instanceof AIError ? err : new AIError(
      err.message || '网络请求失败，请检查网络或服务地址',
      { code: err.name }
    )
    onError?.(wrapped)
  }
}

/**
 * Mock 占位回复（无 API Key 时使用，保证 UI 可用）
 */
async function mockChat({ messages, onToken, onDone, onError, signal }) {
  try {
    const lastUser = [...messages].reverse().find(m => m.role === 'user')
    const userText = (lastUser?.content || '').toString().slice(0, 60)
    const reply =
      `**（占位回复）** 我已收到你的提问：\n\n> ${userText || '（空）'}\n\n` +
      `当前未配置 API Key，使用内置占位回复。请在「设置」页配置模型密钥后体验完整 AI 对话。\n\n` +
      `- 试试在底部切换模型\n- 试试关闭"带上推演上下文"\n- 试试 Enter 发送 / Shift+Enter 换行`

    for (const ch of reply) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
      await new Promise(r => setTimeout(r, 14))
      onToken?.(ch)
    }
    onDone?.()
  } catch (err) {
    if (err?.name === 'AbortError') {
      onDone?.()
      return
    }
    onError?.(err)
  }
}

/* ============================================================
 * 六、连接测试
 * ============================================================ */

/**
 * 测试 API 连通性（发送一个最小非流式请求）
 * @param {Object} config - 模型配置 { baseUrl, apiKey, model, provider }
 * @returns {Promise<boolean>} true 表示连接成功
 */
export async function testConnection(config) {
  // mock 或无需 key 的本地模型 → 直接返回 true
  if (config.provider === 'mock') {
    await new Promise(r => setTimeout(r, 100))
    return true
  }
  try {
    const url = `${(config.baseUrl || '').replace(/\/+$/, '')}/chat/completions`
    const response = await fetch(url, {
      method: 'POST',
      headers: buildHeaders(config),
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: '测试' }],
        max_tokens: 5,
        stream: false
      })
    })
    return response.ok
  } catch {
    return false
  }
}
