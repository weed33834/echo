/**
 * 工具执行沙箱 — 安全隔离层
 *
 * 职责：
 * 1. validateArgs()     — 轻量级 JSON Schema 参数校验（无外部依赖）
 * 2. executeWithTimeout — Promise.race 超时控制
 * 3. ToolLoopGuard      — 工具调用循环守卫（防无限循环）
 * 4. sanitizeInput()    — 用户输入净化（防 XSS / Prompt Injection）
 * 5. sanitizeOutput()   — AI 输出净化（防恶意内容注入 DOM）
 * 6. detectRisks()      — 风险输入检测（医疗/法律/财务/危机）
 *
 * 设计原则：纯前端、零外部依赖、轻量高效。
 */

/* ============================================================
 * 一、轻量级 JSON Schema 参数校验
 * ============================================================ */

/**
 * 校验参数是否符合 JSON Schema
 * 支持类型：string, number, integer, boolean, array, object
 * 支持约束：enum, minimum, maximum, minLength, maxLength, required
 *
 * @param {Object} args - 待校验的参数对象
 * @param {Object} schema - JSON Schema { type, properties, required }
 * @returns {{ valid: boolean, errors: string[], data: Object }}
 */
export function validateArgs(args, schema) {
  const errors = []
  const data = {}

  if (!schema || schema.type !== 'object') {
    return { valid: true, errors: [], data: args || {} }
  }

  const properties = schema.properties || {}
  const required = schema.required || []
  const input = args || {}

  // 检查 required 字段
  for (const key of required) {
    if (input[key] === undefined || input[key] === null || input[key] === '') {
      // 检查是否有 default
      const prop = properties[key]
      if (prop && prop.default !== undefined) {
        data[key] = prop.default
      } else {
        errors.push(`缺少必填参数：${key}`)
      }
      continue
    }
  }

  if (errors.length) {
    return { valid: false, errors, data }
  }

  // 逐字段校验
  for (const [key, prop] of Object.entries(properties)) {
    let val = input[key]

    // 空值处理
    if (val === undefined || val === null || val === '') {
      if (prop.default !== undefined) {
        data[key] = prop.default
      }
      continue
    }

    // 类型校验与强制转换
    const typeResult = checkType(val, prop, key)
    if (!typeResult.valid) {
      errors.push(typeResult.error)
      continue
    }
    val = typeResult.value

    // enum 校验
    if (prop.enum && !prop.enum.includes(val)) {
      errors.push(`参数 ${key} 的值 "${val}" 不在允许范围：${prop.enum.join('、')}`)
      continue
    }

    // 数值范围校验
    if (typeof val === 'number') {
      if (prop.minimum !== undefined && val < prop.minimum) {
        errors.push(`参数 ${key} 的值 ${val} 小于最小值 ${prop.minimum}`)
      }
      if (prop.maximum !== undefined && val > prop.maximum) {
        errors.push(`参数 ${key} 的值 ${val} 大于最大值 ${prop.maximum}`)
      }
    }

    // 字符串长度校验
    if (typeof val === 'string') {
      if (prop.minLength !== undefined && val.length < prop.minLength) {
        errors.push(`参数 ${key} 长度不足，至少 ${prop.minLength} 个字符`)
      }
      if (prop.maxLength !== undefined && val.length > prop.maxLength) {
        val = val.slice(0, prop.maxLength)
      }
    }

    data[key] = val
  }

  return { valid: errors.length === 0, errors, data }
}

/**
 * 类型检查与强制转换
 */
function checkType(val, prop, key) {
  const expected = prop.type

  switch (expected) {
    case 'string':
      if (typeof val === 'string') return { valid: true, value: val }
      if (typeof val === 'number' || typeof val === 'boolean') {
        return { valid: true, value: String(val) }
      }
      return { valid: false, error: `参数 ${key} 应为字符串` }

    case 'number':
      const num = Number(val)
      if (isNaN(num)) return { valid: false, error: `参数 ${key} 应为数字` }
      return { valid: true, value: num }

    case 'integer':
      const int = parseInt(val, 10)
      if (isNaN(int) || String(int) !== String(val).trim()) {
        return { valid: false, error: `参数 ${key} 应为整数` }
      }
      return { valid: true, value: int }

    case 'boolean':
      if (typeof val === 'boolean') return { valid: true, value: val }
      if (val === 'true' || val === 1) return { valid: true, value: true }
      if (val === 'false' || val === 0) return { valid: true, value: false }
      return { valid: false, error: `参数 ${key} 应为布尔值` }

    case 'array':
      if (Array.isArray(val)) return { valid: true, value: val }
      return { valid: false, error: `参数 ${key} 应为数组` }

    case 'object':
      if (typeof val === 'object' && !Array.isArray(val)) {
        return { valid: true, value: val }
      }
      return { valid: false, error: `参数 ${key} 应为对象` }

    default:
      return { valid: true, value: val }
  }
}

/* ============================================================
 * 二、超时控制
 * ============================================================ */

/**
 * 带超时执行异步函数
 * 使用 Promise.race 实现，不阻塞主线程
 *
 * @param {Function} fn - 异步函数，接收 { signal } 参数
 * @param {Object} [options]
 * @param {number} [options.timeoutMs=10000] - 超时毫秒
 * @param {AbortSignal} [options.signal] - 外部取消信号
 * @returns {Promise<any>}
 */
export async function executeWithTimeout(fn, options = {}) {
  const timeoutMs = options.timeoutMs ?? 10000
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  // 联动外部信号
  if (options.signal) {
    if (options.signal.aborted) {
      controller.abort()
    } else {
      options.signal.addEventListener('abort', () => controller.abort(), { once: true })
    }
  }

  try {
    const result = await Promise.race([
      fn({ signal: controller.signal }),
      new Promise((_, reject) => {
        controller.signal.addEventListener('abort', () => {
          reject(new Error(`工具执行超时或被取消 (${timeoutMs}ms)`))
        })
      })
    ])
    return result
  } finally {
    clearTimeout(timeoutId)
  }
}

/* ============================================================
 * 三、工具调用循环守卫
 * ============================================================ */

/**
 * 工具调用循环守卫
 * 防止 AI 无限循环调用工具（三重限制）
 *
 * - maxIterations: 单次对话最大工具调用轮次
 * - maxCallsPerTool: 单个工具最大调用次数
 * - maxTotalTokens: 总 token 消耗上限
 */
export class ToolLoopGuard {
  constructor({
    maxIterations = 6,
    maxCallsPerTool = 3,
    maxTotalTokens = 50000
  } = {}) {
    this.maxIterations = maxIterations
    this.maxCallsPerTool = maxCallsPerTool
    this.maxTotalTokens = maxTotalTokens
    this.reset()
  }

  reset() {
    this.iterations = 0
    this.toolCallCounts = new Map()
    this.totalTokens = 0
  }

  checkIteration() {
    this.iterations++
    if (this.iterations > this.maxIterations) {
      throw new Error(
        `已达到最大工具调用轮次 (${this.maxIterations})，可能存在循环调用，已终止`
      )
    }
  }

  checkToolCall(toolName) {
    const count = (this.toolCallCounts.get(toolName) || 0) + 1
    this.toolCallCounts.set(toolName, count)
    if (count > this.maxCallsPerTool) {
      throw new Error(
        `工具 ${toolName} 已调用 ${count} 次（上限 ${this.maxCallsPerTool}），可能重复调用，已终止`
      )
    }
  }

  checkTokens(usage) {
    if (usage?.total_tokens) {
      this.totalTokens += usage.total_tokens
      if (this.totalTokens > this.maxTotalTokens) {
        throw new Error(`Token 消耗超限 (${this.totalTokens}/${this.maxTotalTokens})`)
      }
    }
  }

  getStats() {
    return {
      iterations: this.iterations,
      toolCalls: Object.fromEntries(this.toolCallCounts),
      totalTokens: this.totalTokens
    }
  }
}

/* ============================================================
 * 四、输入净化
 * ============================================================ */

/**
 * HTML 转义（防止 XSS）
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') return String(str)
  const map = {
    '&': '&amp;', '<': '&lt;', '>': '&gt;',
    '"': '&quot;', "'": '&#39;'
  }
  return str.replace(/[&<>"']/g, m => map[m])
}

/**
 * 用户输入净化（发给 AI 前）
 * - 移除控制字符
 * - 限制长度
 * - 检测 Prompt Injection 模式
 *
 * @param {string} input
 * @returns {string} 净化后的输入
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return String(input ?? '')

  // 移除控制字符（保留换行和制表符）
  let cleaned = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

  // 限制长度（防止超长输入）
  const MAX_LEN = 4000
  if (cleaned.length > MAX_LEN) {
    cleaned = cleaned.slice(0, MAX_LEN)
  }

  return cleaned
}

/**
 * 检测 Prompt Injection 模式
 * @param {string} input
 * @returns {{ suspicious: boolean, patterns: string[] }}
 */
export function detectInjection(input) {
  if (typeof input !== 'string') return { suspicious: false, patterns: [] }

  const patterns = [
    { regex: /ignore\s+(all\s+)?(previous|above)\s+instructions/i, name: 'ignore_instructions' },
    { regex: /you\s+are\s+now\s+(a|an)\s+/i, name: 'role_hijack' },
    { regex: /system\s+prompt/i, name: 'system_prompt_leak' },
    { regex: /<\/?script/i, name: 'script_tag' },
    { regex: /javascript:/i, name: 'js_protocol' },
    { regex: /reveal\s+(your|the)\s+(instructions|prompt|rules)/i, name: 'prompt_extraction' }
  ]

  const matched = patterns.filter(p => p.regex.test(input))
  return {
    suspicious: matched.length > 0,
    patterns: matched.map(p => p.name)
  }
}

/* ============================================================
 * 五、风险输入检测
 * ============================================================ */

/**
 * 风险输入模式定义
 * 用于动态安全护栏
 */
const RISK_PATTERNS = [
  {
    id: 'medical',
    pattern: /怀孕|打胎|流产|吃药|停药|换药|生病|癌症|肿瘤|精神病|抑郁症|自杀|不想活|了断|自残|轻生/,
    label: '医疗健康',
    disclaimer: '健康问题请咨询专业医师，命理分析仅供参考'
  },
  {
    id: 'legal',
    pattern: /告状|起诉|离婚协议|财产分割|官司|诉讼|犯罪|违法/,
    label: '法律纠纷',
    disclaimer: '法律问题请咨询专业律师，命理分析仅供参考'
  },
  {
    id: 'finance',
    pattern: /all\s?in|梭哈|借钱投资|贷款|炒股|期货|杠杆|赌博/,
    label: '高风险财务',
    disclaimer: '投资有风险，理财需谨慎，命理分析仅供参考'
  },
  {
    id: 'crisis',
    pattern: /自杀|不想活|了断|自残|轻生|活不下去|想死/,
    label: '心理危机',
    disclaimer: '如果您正经历心理困难，请拨打全国24小时心理援助热线：400-161-9995'
  },
  {
    id: 'absolute',
    pattern: /一定|绝对|百分之百|确切时间|什么时候死|什么时候发财/,
    label: '绝对化预测',
    disclaimer: '命理无法做出绝对化预测，人生选择比命理更重要'
  }
]

/**
 * 检测用户输入中的风险类别
 * @param {string} input
 * @returns {Array<{ id, label, disclaimer }>}
 */
export function detectRisks(input) {
  if (typeof input !== 'string') return []
  const risks = []
  const seen = new Set()
  for (const risk of RISK_PATTERNS) {
    if (risk.pattern.test(input) && !seen.has(risk.id)) {
      seen.add(risk.id)
      risks.push({ id: risk.id, label: risk.label, disclaimer: risk.disclaimer })
    }
  }
  return risks
}

/* ============================================================
 * 六、输出净化与验证
 * ============================================================ */

// 禁止的输出模式（AI 不应产生的内容）
const FORBIDDEN_OUTPUT_PATTERNS = [
  { regex: /一定会(生病|出事|发财|结婚|离婚|死)/, severity: 'high', msg: '绝对化预测' },
  { regex: /(几年|几个月|几天)内(会|必定)(生|死|病|灾)/, severity: 'high', msg: '灾难时间预测' },
  { regex: /建议(停药|换药|不吃药|停止治疗)/, severity: 'high', msg: '医疗干预建议' },
  { regex: /建议(起诉|不离婚|离婚|报警|不报警)/, severity: 'medium', msg: '法律决策建议' },
  { regex: /保证|包治|一定能/, severity: 'medium', msg: '保证性表述' }
]

/**
 * 验证 AI 输出是否合规
 * @param {string} output - AI 回复内容
 * @param {string} userInput - 原始用户输入（用于判断是否需要免责声明）
 * @returns {{ valid: boolean, issues: Array, warnings: Array }}
 */
export function validateOutput(output, userInput = '') {
  const issues = []
  const warnings = []

  if (!output || typeof output !== 'string') {
    return { valid: false, issues: ['输出为空'], warnings }
  }

  // 检查禁止模式
  for (const rule of FORBIDDEN_OUTPUT_PATTERNS) {
    if (rule.regex.test(output)) {
      if (rule.severity === 'high') {
        issues.push({ type: 'forbidden', pattern: rule.msg, severity: rule.severity })
      } else {
        warnings.push({ type: 'caution', pattern: rule.msg, severity: rule.severity })
      }
    }
  }

  // 检查必要免责声明
  const risks = detectRisks(userInput)
  for (const risk of risks) {
    if (risk.id === 'medical' && !/医(生|师)|就诊|就医/.test(output)) {
      warnings.push({ type: 'missing_disclaimer', category: 'medical' })
    }
    if (risk.id === 'legal' && !/律师|法律.*专业/.test(output)) {
      warnings.push({ type: 'missing_disclaimer', category: 'legal' })
    }
    if (risk.id === 'finance' && !/风险|谨慎/.test(output)) {
      warnings.push({ type: 'missing_disclaimer', category: 'finance' })
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    warnings
  }
}

/**
 * 净化工具返回结果（防止恶意内容注入 DOM）
 * 递归处理对象和数组
 *
 * @param {any} result
 * @returns {any}
 */
export function sanitizeToolResult(result) {
  if (typeof result === 'string') {
    return escapeHtml(result)
  }
  if (Array.isArray(result)) {
    return result.map(sanitizeToolResult)
  }
  if (typeof result === 'object' && result !== null) {
    const sanitized = {}
    for (const key of Object.keys(result)) {
      sanitized[key] = sanitizeToolResult(result[key])
    }
    return sanitized
  }
  return result
}

/* ============================================================
 * 七、导出汇总
 * ============================================================ */

export const Sandbox = {
  validateArgs,
  executeWithTimeout,
  ToolLoopGuard,
  escapeHtml,
  sanitizeInput,
  detectInjection,
  detectRisks,
  validateOutput,
  sanitizeToolResult
}

export default Sandbox
