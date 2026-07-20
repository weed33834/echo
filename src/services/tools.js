/**
 * 工具桥接 — 将 18 个本地 calc 函数注册为 OpenAI Function Calling 格式
 *
 * 职责：
 * 1. getToolSchemas()        — 生成 OpenAI tools 数组（function schema）
 * 2. executeTool(name, args) — 安全执行 calc 并返回 AI 可读文本
 * 3. formatToolResult()      — 将 calc 结果对象格式化为文本
 * 4. getRecentHistory()      — 格式化推演历史为上下文文本
 *
 * 安全：不使用 eval，直接调用已注册的 calc 函数；异常全捕获。
 */

import { ENGINES } from '@/utils/engines.js'
import { TOOLS } from '@/stores/echo.js'
import { validateArgs, executeWithTimeout, ToolLoopGuard } from '@/services/sandbox.js'
import { searchWeb, formatSearchResults, webSearchTool } from '@/services/webSearch.js'

/* ============================================================
 * 工具调用循环守卫（单例，每次对话 reset）
 * ============================================================ */
export const loopGuard = new ToolLoopGuard({
  maxIterations: 6,
  maxCallsPerTool: 3,
  maxTotalTokens: 50000
})

/* ============================================================
 * 一、JSON Schema 构造
 * ============================================================ */

/**
 * 把 inputConfig 数组转为 JSON Schema properties
 * @param {Array} inputConfig - 引擎的 inputConfig 字段定义数组
 * @returns {Object} JSON Schema { type, properties, required }
 */
export function buildSchemaFromInputConfig(inputConfig) {
  const properties = {}
  const required = []

  for (const field of inputConfig || []) {
    const prop = { description: field.label || field.key }

    switch (field.type) {
      case 'number': {
        prop.type = 'number'
        if (field.min != null) prop.minimum = field.min
        if (field.max != null) prop.maximum = field.max
        if (field.unit) prop.description += `（单位：${field.unit}）`
        if (field.default != null) prop.default = field.default
        break
      }
      case 'select':
      case 'radio': {
        prop.type = 'string'
        const options = field.options || []
        prop.enum = options.map(o => o.value)
        prop.description += '：' + options.map(o => `${o.value}(${o.label})`).join('、')
        if (field.default != null) prop.default = field.default
        break
      }
      case 'checkbox': {
        prop.type = 'boolean'
        if (field.default != null) prop.default = field.default
        break
      }
      case 'date': {
        prop.type = 'string'
        prop.format = 'date'
        if (field.default) prop.default = field.default
        break
      }
      case 'textarea': {
        prop.type = 'string'
        if (field.placeholder) prop.description += `（${field.placeholder}）`
        if (field.default != null) prop.default = field.default
        break
      }
      case 'text':
      default: {
        prop.type = 'string'
        if (field.placeholder) prop.description += `（${field.placeholder}）`
        if (field.default != null) prop.default = field.default
        break
      }
    }

    // 标注条件显示字段（showIf），供 AI 参考
    if (field.showIf) {
      const cond = field.showIf
      prop.description += ` [仅当 ${cond.key} 为 ${Array.isArray(cond.in) ? cond.in.join('/') : cond.value} 时需要]`
    }

    properties[field.key] = prop
    // 无 default 且非条件字段 → required
    if (field.default == null && !field.showIf) {
      required.push(field.key)
    }
  }

  return {
    type: 'object',
    properties,
    required: required.length ? required : Object.keys(properties)
  }
}

/* ============================================================
 * 二、工具 Schema 生成
 * ============================================================ */

// 缓存命理工具的基础 schema（不含 web_search，因为 TOOLS 与 ENGINES 为模块常量）
let _baseSchemaCache = null

/**
 * 生成命理工具的基础 schema 数组（缓存）
 * 不包含联网搜索工具，因为后者需要根据启用状态动态追加
 * @returns {Array<{ type: 'function', function: { name, description, parameters } }>}
 */
function getBaseSchemas() {
  if (_baseSchemaCache) return _baseSchemaCache

  _baseSchemaCache = TOOLS
    .filter(t => t.ready !== false)
    .map(tool => {
      const engine = ENGINES[tool.key]
      const parameters = engine?.inputConfig
        ? buildSchemaFromInputConfig(engine.inputConfig)
        : { type: 'object', properties: {} }

      return {
        type: 'function',
        function: {
          name: tool.key,
          description: `${tool.name} — ${tool.desc}（分类：${tool.cat}）`,
          parameters
        }
      }
    })

  return _baseSchemaCache
}

/**
 * 返回 OpenAI Function Calling 格式的工具数组
 * 每个工具对应 TOOLS 中的一个命理工具；
 * 当 options.webSearchEnabled 为真时，在末尾追加 web_search 工具。
 *
 * @param {Object} [options]
 * @param {boolean} [options.webSearchEnabled=false] - 是否启用联网搜索
 * @returns {Array<{ type: 'function', function: { name, description, parameters } }>}
 */
export function getToolSchemas(options = {}) {
  const base = getBaseSchemas()
  // 仅在启用时追加 web_search，避免 AI 调用未开启的工具
  if (options.webSearchEnabled) {
    return [...base, webSearchTool]
  }
  return base
}

/**
 * 按工具名获取单个 schema
 * @param {string} name - 工具 key
 * @returns {Object|null}
 */
export function getToolSchema(name) {
  if (name === webSearchTool.function.name) return webSearchTool
  return getBaseSchemas().find(t => t.function.name === name) || null
}

/* ============================================================
 * 三、结果格式化
 * ============================================================ */

/**
 * 将 calc 结果对象格式化为 AI 可读文本
 *
 * 兼容两种调用方式：
 *   formatToolResult(toolKey, result)  — 推荐，带工具名
 *   formatToolResult(result)          — 兼容旧接口，仅传结果对象
 *
 * @param {string|Object} toolKeyOrResult - 工具 key 或直接传 result
 * @param {Object} [result] - calc 返回的结果对象
 * @returns {string} AI 可读的文本
 */
export function formatToolResult(toolKeyOrResult, result) {
  // 兼容：只传一个参数时，视为 result
  let toolKey, res
  if (result === undefined) {
    toolKey = null
    res = toolKeyOrResult
  } else {
    toolKey = toolKeyOrResult
    res = result
  }

  if (res == null) return ''
  if (typeof res === 'string') return res
  if (res.error) return `[执行失败] ${res.message || '未知错误'}`

  const tool = toolKey ? TOOLS.find(t => t.key === toolKey) : null
  const toolName = tool?.name || (res.resultType ? res.resultType : '工具')
  const summary = res.summary || ''
  const lines = []

  // 按结果类型提取关键字段
  switch (res.resultType) {
    case 'bazi': {
      lines.push(`【${toolName}】${summary}`)
      lines.push(`日主：${res.dayMaster}（${res.dayMasterWx}），日主偏${res.dayMasterStrength}`)
      if (res.wuxing) {
        lines.push(`五行分布：${Object.entries(res.wuxing).map(([k, v]) => `${k}${v}`).join(' ')}`)
      }
      lines.push(`最旺：${res.strongest || ''}，最弱：${res.weakest || ''}`)
      if (res.favorable) lines.push(`喜用神：${res.favorable.join('、')}`)
      if (res.currentDayun) lines.push(`当前大运：${res.currentDayun.name}（${res.currentDayun.tenGod || ''}）`)
      if (res.liunian) lines.push(`流年：${res.liunian.ganzhi}（${res.liunian.tenGod || ''}）`)
      if (res.pillars) {
        lines.push(`四柱：${res.pillars.map(p => `${p.gan}${p.zhi}`).join(' ')}`)
      }
      if (res.focusReading) lines.push(`关注解读：${res.focusReading}`)
      break
    }
    case 'ziwei': {
      lines.push(`【${toolName}】${summary}`)
      if (res.wuxingJu || res.juName) lines.push(`五行局：${res.wuxingJu || res.juName}`)
      if (res.palaces && res.palaces.length) {
        const main = res.palaces.find(p => p.name === '命宫')
        if (main) lines.push(`命宫主星：${main.mainStar || '空宫'}`)
        lines.push(`宫位摘要：${res.palaces.slice(0, 6).map(p => `${p.name}:${p.mainStar || '空'}`).join('，')}`)
      }
      if (res.focusReading) lines.push(`关注解读：${res.focusReading}`)
      break
    }
    case 'liuyao': {
      lines.push(`【${toolName}】${summary}`)
      if (res.benGua && res.bianGua) lines.push(`本卦→变卦：${res.benGua} → ${res.bianGua}`)
      if (res.yongShen) lines.push(`用神：${res.yongShen}`)
      lines.push(`吉凶：${res.verdict || ''}（${res.score ?? ''}分）`)
      if (res.yingqi) lines.push(`应期：${res.yingqi}`)
      if (res.reading) lines.push(`解读：${res.reading}`)
      break
    }
    case 'meihua': {
      lines.push(`【${toolName}】${summary}`)
      if (res.guaName) lines.push(`卦象：${res.guaName}`)
      if (res.relation) lines.push(`体用关系：${res.relation}`)
      lines.push(`吉凶：${res.verdict || ''}`)
      if (res.reading) lines.push(`解读：${res.reading}`)
      break
    }
    case 'gua': {
      lines.push(`【${toolName}】${summary}`)
      if (res.guaName) lines.push(`卦名：${res.guaName}`)
      if (res.verdict) lines.push(`吉凶：${res.verdict}`)
      if (res.reading) lines.push(`解读：${res.reading}`)
      break
    }
    case 'qimen': {
      lines.push(`【${toolName}】${summary}`)
      if (res.palaces && res.palaces.length) {
        lines.push(`九宫摘要：${res.palaces.slice(0, 8).map(p => `${p.num}宫${p.star}/${p.door}`).join('，')}`)
      }
      if (res.verdict) lines.push(`吉凶：${res.verdict}`)
      if (res.reading) lines.push(`解读：${res.reading}`)
      break
    }
    case 'liuren': {
      lines.push(`【${toolName}】${summary}`)
      if (res.verdict) lines.push(`吉凶：${res.verdict}`)
      if (res.reading) lines.push(`解读：${res.reading}`)
      break
    }
    case 'ziwu': {
      lines.push(`【${toolName}】${summary}`)
      if (res.reading) lines.push(`解读：${res.reading}`)
      break
    }
    case 'yangsheng': {
      lines.push(`【${toolName}】${summary}`)
      if (res.suggestions) lines.push(`建议：${Array.isArray(res.suggestions) ? res.suggestions.join('；') : res.suggestions}`)
      if (res.reading) lines.push(`解读：${res.reading}`)
      break
    }
    case 'huangli': {
      lines.push(`【${toolName}】${summary}`)
      if (res.yi) lines.push(`宜：${Array.isArray(res.yi) ? res.yi.join('、') : res.yi}`)
      if (res.ji) lines.push(`忌：${Array.isArray(res.ji) ? res.ji.join('、') : res.ji}`)
      break
    }
    case 'jiri': {
      lines.push(`【${toolName}】${summary}`)
      if (res.recommendedDate) lines.push(`推荐日期：${res.recommendedDate}`)
      if (res.yi) lines.push(`宜：${Array.isArray(res.yi) ? res.yi.join('、') : res.yi}`)
      if (res.ji) lines.push(`忌：${Array.isArray(res.ji) ? res.ji.join('、') : res.ji}`)
      break
    }
    case 'yunshi': {
      lines.push(`【${toolName}】${summary}`)
      if (res.score != null) lines.push(`运势评分：${res.score}`)
      if (res.reading) lines.push(`解读：${res.reading}`)
      break
    }
    case 'astro': {
      lines.push(`【${toolName}】${summary}`)
      if (res.sunSign) lines.push(`太阳：${res.sunSign}（${res.sunTrait || ''}）`)
      if (res.moonSign) lines.push(`月亮：${res.moonSign}（${res.moonTrait || ''}）`)
      if (res.ascSign) lines.push(`上升：${res.ascSign}（${res.ascTrait || ''}）`)
      if (res.focusReading) lines.push(`关注解读：${res.focusReading}`)
      break
    }
    case 'maya': {
      lines.push(`【${toolName}】${summary}`)
      if (res.seal) lines.push(`主图腾：${res.seal}（${res.color || ''}）`)
      if (res.tone) lines.push(`银河音调：${res.tone}`)
      if (res.focusReading) lines.push(`解读：${res.focusReading}`)
      break
    }
    case 'tarot': {
      lines.push(`【${toolName}】${summary}`)
      if (res.cards && res.cards.length) {
        lines.push(`牌阵：${res.cards.map(c => `${c.name}${c.reversed ? '（逆位）' : ''}`).join(' → ')}`)
      }
      if (res.reading) lines.push(`解读：${res.reading}`)
      break
    }
    case 'fengshui': {
      lines.push(`【${toolName}】${summary}`)
      if (res.reading) lines.push(`解读：${res.reading}`)
      break
    }
    case 'nameology': {
      lines.push(`【${toolName}】${summary}`)
      if (res.reading) lines.push(`解读：${res.reading}`)
      break
    }
    case 'dream': {
      lines.push(`【${toolName}】${summary}`)
      if (res.overallVerdict) lines.push(`吉凶：${res.overallVerdict}（${res.overallScore ?? ''}分）`)
      if (res.keywords && res.keywords.length) lines.push(`关键词：${res.keywords.join('、')}`)
      if (res.reading) lines.push(`解读：${res.reading}`)
      break
    }
    default: {
      // 兜底：summary + reading
      lines.push(`【${toolName}】${summary}`)
      if (res.reading) lines.push(`解读：${res.reading}`)
      lines.push(`[完整数据] ${safeStringify(res)}`)
      return lines.join('\n')
    }
  }

  // 追加 JSON 全量数据供 AI 深入分析
  lines.push(`[完整数据] ${safeStringify(res)}`)
  return lines.join('\n')
}

/**
 * 安全 JSON 序列化，截断过长字符串
 */
function safeStringify(obj, maxLen = 2000) {
  try {
    const str = JSON.stringify(obj)
    return str.length > maxLen ? str.slice(0, maxLen) + '...' : str
  } catch {
    return String(obj)
  }
}

/* ============================================================
 * 四、工具执行（安全沙箱）
 * ============================================================ */

/**
 * 执行命理工具并返回 AI 可读文本
 *
 * 安全流程：
 * 1. 循环守卫检查（防无限调用）
 * 2. 参数校验（JSON Schema 验证）
 * 3. 合并默认值
 * 4. 超时控制执行（Promise.race）
 * 5. 结果格式化
 *
 * @param {string} name - 工具 key
 * @param {Object} args - 参数对象
 * @param {Object} [options] - 执行选项
 * @param {number} [options.timeoutMs=10000] - 超时毫秒
 * @param {AbortSignal} [options.signal] - 外部取消信号
 * @param {string} [options.webSearchApiKey] - 联网搜索 Tavily API Key（仅 web_search 工具使用）
 * @returns {Promise<string>} AI 可读的结果文本
 */
export async function executeTool(name, args = {}, options = {}) {
  // 1. 循环守卫
  try {
    loopGuard.checkToolCall(name)
  } catch (guardErr) {
    return `[循环守卫] ${guardErr.message}`
  }

  // 特殊工具：联网搜索（不走引擎，直接调用 Tavily API）
  if (name === webSearchTool.function.name) {
    const parsedArgs = safeParseArgs(args)
    const query = parsedArgs?.query != null ? String(parsedArgs.query) : ''
    if (!query.trim()) {
      return '[参数校验失败] 工具 web_search：缺少必填参数 query'
    }
    const searchResult = await searchWeb(query, {
      apiKey: options.webSearchApiKey,
      signal: options.signal
    })
    return formatSearchResults(searchResult)
  }

  const engine = ENGINES[name]
  if (!engine || typeof engine.calc !== 'function') {
    return `[工具不存在] 未注册的工具：${name}。可用工具：${TOOLS.map(t => t.key).join('、')}`
  }

  // 2. 参数校验
  const schema = getToolSchema(name)
  const parsedArgs = safeParseArgs(args)
  if (schema?.function?.parameters) {
    const validation = validateArgs(parsedArgs, schema.function.parameters)
    if (!validation.valid) {
      return `[参数校验失败] 工具 ${name}：\n${validation.errors.join('\n')}\n请检查参数格式后重试。`
    }
    // 使用校验后的数据（含默认值填充）
    Object.assign(parsedArgs, validation.data)
  }

  // 3. 合并默认值 + 校验后参数
  const form = {}
  if (Array.isArray(engine.inputConfig)) {
    for (const field of engine.inputConfig) {
      form[field.key] = field.default != null ? field.default : null
    }
  }
  for (const [k, v] of Object.entries(parsedArgs)) {
    if (v !== undefined && v !== null && v !== '') {
      form[k] = v
    }
  }

  // 4. 超时控制执行
  try {
    const result = await executeWithTimeout(
      async () => engine.calc(form),
      { timeoutMs: options.timeoutMs ?? 10000, signal: options.signal }
    )
    return formatToolResult(name, result)
  } catch (err) {
    if (err.message?.includes('超时')) {
      return `[执行超时] 工具 ${name} 执行超时，请简化参数或稍后重试。`
    }
    return `[执行失败] 工具 ${name} 执行出错：${err.message || err}`
  }
}

/**
 * 执行工具并返回原始结果对象（供 UI 渲染）
 * 不含循环守卫（UI 直接触发，非 AI 调用）
 * 但包含参数校验
 * @param {string} name
 * @param {Object} args
 * @returns {{ ok: boolean, result?: Object, text?: string, error?: string }}
 */
export function executeToolRaw(name, args = {}) {
  const engine = ENGINES[name]
  if (!engine || typeof engine.calc !== 'function') {
    return { ok: false, error: `未注册的工具：${name}` }
  }

  // 参数校验
  const schema = getToolSchema(name)
  const parsedArgs = safeParseArgs(args)
  if (schema?.function?.parameters) {
    const validation = validateArgs(parsedArgs, schema.function.parameters)
    if (!validation.valid) {
      return { ok: false, error: `参数校验失败：${validation.errors.join('；')}` }
    }
    Object.assign(parsedArgs, validation.data)
  }

  try {
    const form = {}
    if (Array.isArray(engine.inputConfig)) {
      for (const field of engine.inputConfig) {
        form[field.key] = field.default != null ? field.default : null
      }
    }
    for (const [k, v] of Object.entries(parsedArgs)) {
      if (v !== undefined && v !== null && v !== '') {
        form[k] = v
      }
    }
    const result = engine.calc(form)
    return { ok: true, result, text: formatToolResult(name, result) }
  } catch (err) {
    return { ok: false, error: err.message || String(err) }
  }
}

/**
 * 安全解析 args（可能是对象或 JSON 字符串）
 */
function safeParseArgs(args) {
  if (args == null) return {}
  if (typeof args === 'object') return args
  try {
    return JSON.parse(args)
  } catch {
    return { _raw: String(args) }
  }
}

/* ============================================================
 * 五、推演历史格式化
 * ============================================================ */

/**
 * 格式化最近的推演历史为 AI 上下文文本
 *
 * @param {Array} history - echo store 的 history 数组
 * @param {number} [limit=5] - 取最近 N 条
 * @returns {string} 格式化的历史文本
 */
export function getRecentHistory(history, limit = 5) {
  if (!Array.isArray(history) || !history.length) {
    return ''
  }

  const recent = history.slice(0, limit)
  const lines = recent.map((h, i) => {
    const time = h.createdAt
      ? new Date(h.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
      : ''
    const toolName = h.toolName || h.toolKey || '未知工具'
    const summary = h.summary || (h.result?.summary) || ''
    return `${i + 1}. [${time}] ${toolName}：${summary}`
  })

  return `最近 ${recent.length} 条推演记录：\n${lines.join('\n')}`
}
