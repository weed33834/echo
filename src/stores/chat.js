/**
 * Chat Store - Pinia (Composition API)
 *
 * AI 对话状态管理：多会话、流式消息、模型配置、自定义模型、管理员配置、
 * 提示词管理、知识库、使用统计。
 *
 * 持久化到 localStorage（key: echo-chat）
 *
 * 消息结构：
 * { id, role: 'user'|'assistant'|'tool', content, toolCalls?, toolCallId?, createdAt, isStreaming? }
 *
 * 会话结构：
 * { id, title, messages: [], createdAt, updatedAt }
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { DEFAULT_MODELS } from '@/services/ai.js'
import { SYSTEM_PROMPT } from '@/prompts/system.js'

const LS_KEY = 'echo-chat'

/* ============================================================
 * 默认提示词
 * ============================================================ */

const FENGSHUI_PROMPT = `你是"回响"风水顾问，专注于阳宅风水布局与堪舆指导。

【专长领域】
- 九宫飞星（年星、月星、山星、向星）
- 宅卦（东四宅 / 西四宅）
- 方位吉凶（生气、天医、延年、伏位）
- 形煞化解（路冲、角煞、穿堂煞等）
- 流年风水（每年的飞星方位变化）

【交互原则】
1. 基于用户提供的房屋坐向或出生年份给出方位建议
2. 区分"形势派"（峦头）与"理气派"（罗盘），综合判断
3. 化解建议要具体可操作（如摆放物件、颜色、材质）
4. 提醒风水为环境心理学与传统经验，非绝对决定因素
5. 涉及动土、装修等大事，建议结合实际格局与专业勘测`

const GENERAL_PROMPT = `你是"回响"通用助手，可以回答各类问题。

当用户的问题超出命理范围时，你作为通用 AI 助手正常回答。
但适时提醒用户："如需命理推演（八字、占卜、风水等），可随时使用工具面板。"

回答风格：简洁、清晰、有条理。善用 emoji 和格式化提升可读性。`

/**
 * 默认提示词模板（管理员可覆盖）
 * - mingli: 命理顾问（完整系统提示词）
 * - fengshui: 风水顾问
 * - general: 通用助手
 */
export const DEFAULT_PROMPTS = {
  mingli: SYSTEM_PROMPT,
  fengshui: FENGSHUI_PROMPT,
  general: GENERAL_PROMPT
}

/* ============================================================
 * localStorage 读写
 * ============================================================ */

function loadAll() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function saveAll(data) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data))
  } catch {
    // 忽略 quota 超限等错误
  }
}

/* ============================================================
 * 默认配置
 * ============================================================ */

function defaultModelConfig() {
  const dm = DEFAULT_MODELS.find(m => m.isDefault) || DEFAULT_MODELS[0]
  return {
    provider: dm.provider,
    baseUrl: dm.baseUrl,
    apiKey: '',
    model: dm.model,
    modelId: dm.id,
    label: dm.label,
    requireKey: dm.requireKey,
    temperature: 0.7,
    maxTokens: 2048,
    stream: true,
    isDefault: true
  }
}

function defaultAdminConfig() {
  return {
    // 管理员密码
    adminPassword: '',
    // 默认模型配置（管理员提供给用户使用的共享配置）
    enabled: false,
    baseUrl: '',
    apiKey: '',
    model: '',
    provider: 'custom',
    defaultApiKey: '',
    defaultModel: '',
    // 预设模型启用列表
    enabledPresets: DEFAULT_MODELS.map(m => m.id),
    // 提示词（管理员可覆盖）
    prompts: { ...DEFAULT_PROMPTS },
    systemPromptOverride: '',
    // 知识库
    knowledgeBase: [],
    // 联网搜索
    webSearchApiKey: '',
    webSearchEnabled: false,
    // 速率限制
    rateLimit: 20,
    // 启用的工具
    enabledTools: []
  }
}

function defaultUsageStats() {
  return {
    totalChats: 0,
    tokenUsage: 0,
    byModel: {},
    byDate: {}
  }
}

function genId(prefix) {
  return prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)
}

/* ============================================================
 * Store 定义
 * ============================================================ */

export const useChatStore = defineStore('chat', () => {
  const persisted = loadAll()

  // === 状态 ===
  const isStreaming = ref(false)
  const unreadCount = ref(persisted.unreadCount || 0)

  // 多会话
  const conversations = ref(persisted.conversations || [])
  const currentConversationId = ref(persisted.currentConversationId || null)

  // 模型配置
  const modelConfig = ref({ ...defaultModelConfig(), ...(persisted.modelConfig || {}) })
  // 用户自定义模型
  const customModels = ref(persisted.customModels || [])
  // 管理员配置
  const adminConfig = ref({ ...defaultAdminConfig(), ...(persisted.adminConfig || {}) })
  // 确保 prompts 完整
  if (!adminConfig.value.prompts) {
    adminConfig.value.prompts = { ...DEFAULT_PROMPTS }
  } else {
    adminConfig.value.prompts = { ...DEFAULT_PROMPTS, ...adminConfig.value.prompts }
  }
  // 使用统计
  const usageStats = ref({ ...defaultUsageStats(), ...(persisted.usageStats || {}) })
  if (!usageStats.value.byModel) usageStats.value.byModel = {}
  if (!usageStats.value.byDate) usageStats.value.byDate = {}

  // === 计算属性 ===

  /**
   * 当前会话的消息列表
   */
  const currentMessages = computed(() => {
    const conv = conversations.value.find(c => c.id === currentConversationId.value)
    return conv?.messages || []
  })

  /**
   * messages 是 currentMessages 的别名（供组件使用 chatStore.messages）
   */
  const messages = computed(() => currentMessages.value)

  /**
   * 合并的模型列表：预设 + 自定义
   */
  const allModels = computed(() => {
    return [...DEFAULT_MODELS, ...customModels.value]
  })

  /**
   * 生效的模型配置（若使用默认模型且管理员配置了 defaultApiKey 则覆盖）
   */
  const effectiveConfig = computed(() => {
    const base = { ...modelConfig.value }
    if (base.isDefault && adminConfig.value.defaultApiKey) {
      base.apiKey = adminConfig.value.defaultApiKey
      if (adminConfig.value.defaultModel) base.model = adminConfig.value.defaultModel
    }
    return base
  })

  // === 持久化 ===

  function persist() {
    saveAll({
      conversations: conversations.value,
      currentConversationId: currentConversationId.value,
      modelConfig: modelConfig.value,
      customModels: customModels.value,
      adminConfig: adminConfig.value,
      usageStats: usageStats.value,
      unreadCount: unreadCount.value
    })
  }

  /**
   * 仅持久化配置（流式过程中避免高频写 messages）
   */
  function persistConfig() {
    saveAll({
      conversations: conversations.value,
      currentConversationId: currentConversationId.value,
      modelConfig: modelConfig.value,
      customModels: customModels.value,
      adminConfig: adminConfig.value,
      usageStats: usageStats.value,
      unreadCount: unreadCount.value
    })
  }

  // === 消息操作 ===

  /**
   * 添加消息到当前会话
   * @param {Object} msg - { role, content, toolCalls?, toolCallId? }
   * @returns {Object} 添加后的完整消息对象
   */
  function addMessage(msg) {
    const message = {
      id: genId('m'),
      createdAt: Date.now(),
      isStreaming: false,
      ...msg
    }
    // 无当前会话时自动创建一个
    let conv = conversations.value.find(c => c.id === currentConversationId.value)
    if (!conv) {
      newConversation()
      // 重新获取响应式代理对象（不能直接用 newConversation 返回的原始对象）
      conv = conversations.value.find(c => c.id === currentConversationId.value)
    }
    conv.messages.push(message)
    conv.updatedAt = Date.now()
    // 自动生成会话标题
    if ((!conv.title || conv.title === '新对话') && msg.role === 'user' && msg.content) {
      conv.title = msg.content.slice(0, 20) + (msg.content.length > 20 ? '…' : '')
    }
    // 非流式的消息直接持久化
    if (!msg.isStreaming) {
      persist()
    }
    return message
  }

  /**
   * 更新消息（流式追加 / 状态变更）
   * @param {string} id - 消息 id
   * @param {Object} patch - 要更新的字段（支持 appendContent 追加模式）
   */
  function updateMessage(id, patch) {
    const conv = conversations.value.find(c => c.id === currentConversationId.value)
    if (!conv) return
    const msg = conv.messages.find(m => m.id === id)
    if (!msg) return
    if (patch.appendContent) {
      msg.content = (msg.content || '') + patch.appendContent
      delete patch.appendContent
    }
    Object.assign(msg, patch)
  }

  // === 流式状态 ===

  function startStreaming() {
    isStreaming.value = true
  }

  function stopStreaming() {
    isStreaming.value = false
    const conv = conversations.value.find(c => c.id === currentConversationId.value)
    if (conv) {
      conv.messages.forEach(m => {
        if (m.isStreaming) m.isStreaming = false
      })
    }
    persist()
  }

  // === 会话管理 ===

  /**
   * 清空当前会话消息
   */
  function clearMessages() {
    const conv = conversations.value.find(c => c.id === currentConversationId.value)
    if (conv) {
      conv.messages = []
      conv.updatedAt = Date.now()
    }
    persist()
  }

  /**
   * 新建会话
   * @param {string} [title='新对话']
   * @returns {Object} 新会话对象
   */
  function newConversation(title = '新对话') {
    const conv = {
      id: genId('c'),
      title,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    conversations.value.unshift(conv)
    currentConversationId.value = conv.id
    persist()
    return conv
  }

  /**
   * 切换当前会话
   * @param {string} id - 会话 id
   */
  function switchConversation(id) {
    currentConversationId.value = id
    persist()
  }

  /**
   * 删除会话
   * @param {string} id - 会话 id
   */
  function deleteConversation(id) {
    const idx = conversations.value.findIndex(c => c.id === id)
    if (idx === -1) return
    conversations.value.splice(idx, 1)
    if (currentConversationId.value === id) {
      currentConversationId.value = conversations.value[0]?.id || null
    }
    persist()
  }

  /**
   * 重命名会话
   * @param {string} id
   * @param {string} title
   */
  function renameConversation(id, title) {
    const conv = conversations.value.find(c => c.id === id)
    if (conv) {
      conv.title = title
      conv.updatedAt = Date.now()
      persist()
    }
  }

  // === 未读计数 ===

  function markRead() {
    unreadCount.value = 0
    persist()
  }

  function incrementUnread() {
    unreadCount.value += 1
  }

  // === 模型配置 ===

  /**
   * 设置模型配置
   * @param {Object} config - 部分配置
   */
  function setModelConfig(config) {
    modelConfig.value = { ...modelConfig.value, ...config }
    persistConfig()
  }

  /**
   * 添加自定义模型
   * @param {Object} model - { label, provider, model, baseUrl, apiKey? }
   * @returns {Object} 添加后的模型对象
   */
  function addCustomModel(model) {
    const m = {
      id: genId('cm'),
      provider: 'custom',
      requireKey: true,
      ...model
    }
    customModels.value.push(m)
    persistConfig()
    return m
  }

  /**
   * 更新自定义模型
   * @param {string} id
   * @param {Object} patch
   */
  function updateCustomModel(id, patch) {
    const m = customModels.value.find(x => x.id === id)
    if (m) {
      Object.assign(m, patch)
      persistConfig()
    }
  }

  /**
   * 删除自定义模型
   * @param {string} id
   */
  function removeCustomModel(id) {
    customModels.value = customModels.value.filter(m => m.id !== id)
    persistConfig()
  }

  // === 管理员配置 ===

  /**
   * 设置管理员配置
   * @param {Object} config - 部分配置
   */
  function setAdminConfig(config) {
    adminConfig.value = { ...adminConfig.value, ...config }
    persistConfig()
  }

  /**
   * 设置提示词
   * @param {string} key - 'mingli' | 'fengshui' | 'general'
   * @param {string} value - 提示词内容
   */
  function setPrompt(key, value) {
    if (!adminConfig.value.prompts) {
      adminConfig.value.prompts = { ...DEFAULT_PROMPTS }
    }
    adminConfig.value.prompts[key] = value
    persistConfig()
  }

  /**
   * 恢复默认提示词
   */
  function restoreDefaultPrompts() {
    adminConfig.value.prompts = { ...DEFAULT_PROMPTS }
    adminConfig.value.systemPromptOverride = ''
    persistConfig()
  }

  // === 知识库 ===

  /**
   * 添加知识库条目
   * @param {string} title
   * @param {string} content
   * @returns {Object} 添加后的条目
   */
  function addKnowledge(title, content) {
    const entry = {
      id: genId('kb'),
      title,
      content,
      createdAt: Date.now()
    }
    if (!adminConfig.value.knowledgeBase) {
      adminConfig.value.knowledgeBase = []
    }
    adminConfig.value.knowledgeBase.push(entry)
    persistConfig()
    return entry
  }

  /**
   * 更新知识库条目
   * @param {string} id
   * @param {Object} patch - { title?, content? }
   */
  function updateKnowledge(id, patch) {
    const entry = (adminConfig.value.knowledgeBase || []).find(k => k.id === id)
    if (entry) {
      Object.assign(entry, patch)
      persistConfig()
    }
  }

  /**
   * 删除知识库条目
   * @param {string} id
   */
  function removeKnowledge(id) {
    adminConfig.value.knowledgeBase = (adminConfig.value.knowledgeBase || []).filter(k => k.id !== id)
    persistConfig()
  }

  // === 使用统计 ===

  /**
   * 记录一次使用
   * @param {string} model - 模型名
   * @param {number} [tokens=0] - token 用量
   */
  function recordUsage(model, tokens = 0) {
    usageStats.value.totalChats += 1
    usageStats.value.tokenUsage += tokens
    if (model) {
      usageStats.value.byModel[model] = (usageStats.value.byModel[model] || 0) + 1
    }
    const today = new Date().toISOString().slice(0, 10)
    usageStats.value.byDate[today] = (usageStats.value.byDate[today] || 0) + 1
    persistConfig()
  }

  /**
   * 清空使用统计
   */
  function clearUsageStats() {
    usageStats.value = defaultUsageStats()
    persistConfig()
  }

  // === 数据导出 ===

  /**
   * 导出所有数据为 JSON 字符串
   * @returns {string} JSON 字符串
   */
  function exportData() {
    return JSON.stringify({
      modelConfig: modelConfig.value,
      customModels: customModels.value,
      adminConfig: adminConfig.value,
      usageStats: usageStats.value,
      conversations: conversations.value,
      exportedAt: new Date().toISOString()
    }, null, 2)
  }

  // === 便捷 ===

  /**
   * 重置所有数据
   */
  function resetAll() {
    conversations.value = []
    currentConversationId.value = null
    modelConfig.value = defaultModelConfig()
    customModels.value = []
    adminConfig.value = defaultAdminConfig()
    usageStats.value = defaultUsageStats()
    isStreaming.value = false
    unreadCount.value = 0
    persist()
  }

  return {
    // 状态
    messages,
    isStreaming,
    unreadCount,
    conversations,
    currentConversationId,
    modelConfig,
    customModels,
    adminConfig,
    usageStats,
    // 计算属性
    currentMessages,
    allModels,
    effectiveConfig,
    // 消息操作
    addMessage,
    updateMessage,
    incrementUnread,
    // 流式
    startStreaming,
    stopStreaming,
    // 会话
    clearMessages,
    newConversation,
    switchConversation,
    deleteConversation,
    renameConversation,
    // 未读
    markRead,
    // 模型
    setModelConfig,
    addCustomModel,
    updateCustomModel,
    removeCustomModel,
    // 管理员
    setAdminConfig,
    setPrompt,
    restoreDefaultPrompts,
    // 知识库
    addKnowledge,
    updateKnowledge,
    removeKnowledge,
    // 使用统计
    recordUsage,
    clearUsageStats,
    // 数据
    exportData,
    // 持久化
    persist,
    // 重置
    resetAll
  }
})
