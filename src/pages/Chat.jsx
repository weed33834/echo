/**
 * Chat · AI 对话页面（展示层）
 * Vue3 JSX · defineComponent + setup
 *
 * 依赖（接口契约）：
 *   - useChatStore  from '@/stores/chat.js'
 *   - useEchoStore  from '@/stores/echo.js'
 *   - chatCompletion from '@/services/ai.js'
 *   - getToolSchemas, executeTool, getRecentHistory, formatToolResult from '@/services/tools.js'
 *   - buildSystemPrompt from '@/prompts/system.js'
 *   - getCurrentJieqi from '@/utils/engines.js'
 */
import { defineComponent, ref, computed, onMounted, nextTick, watch } from 'vue'
import { TopBar } from '@/components/TabBar.jsx'
import {
  EchoCard,
  EchoButton,
  EchoBadge,
  EchoTag,
  EchoModal,
  showToast
} from '@/components/EchoUI.jsx'
import { useChatStore } from '@/stores/chat.js'
import { useEchoStore } from '@/stores/echo.js'
import { chatCompletion } from '@/services/ai.js'
import { getToolSchemas, executeTool, getRecentHistory, formatToolResult, loopGuard } from '@/services/tools.js'
import {
  buildSystemPrompt,
  buildGuardedMessages,
  injectFewShot,
  retrieveKnowledge,
  getCurrentJieqi,
  DEFAULT_KNOWLEDGE_BASE
} from '@/prompts/system.js'
import { sanitizeInput, validateOutput, detectInjection, escapeHtml } from '@/services/sandbox.js'

/* ============================================================
 * 快捷问题
 * ============================================================ */
const QUICK_QUESTIONS = [
  '解读我的八字，看看日主与五行平衡',
  '今天适合做什么？结合时辰宜忌给我建议',
  '帮我看看家里的风水布局，玄关放什么好',
  '最近运势如何？有哪些需要注意的节点'
]

/* ============================================================
 * Markdown 渲染器（自实现，无外部依赖）
 * 1. 先 escape HTML 防 XSS（复用 sandbox.escapeHtml）
 * 2. 再按行解析 Markdown 语法
 * 支持：代码块、行内代码、标题、引用、表格、无序/有序列表、粗体、斜体、换行
 * ============================================================ */

function inlineFmt(s) {
  // 粗体 **...**
  s = s.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>')
  // 斜体 *...*（避免与粗体冲突，要求两侧非 *）
  s = s.replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, '$1<em>$2</em>')
  return s
}

function parseTableRow(line) {
  return line
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((c) => inlineFmt(c.trim()))
}

function renderMarkdown(text) {
  if (!text) return ''

  // 1. escape
  let escaped = escapeHtml(text)

  // 2. 提取代码块 ```...```（用占位符保护，内部不做任何替换）
  const codeBlocks = []
  escaped = escaped.replace(/```([\s\S]*?)```/g, (_m, code) => {
    const idx = codeBlocks.length
    const body = code.replace(/^\n/, '').replace(/\n$/, '')
    codeBlocks.push(`<pre class="md-pre"><code>${body}</code></pre>`)
    return `\u0000CB${idx}\u0000`
  })

  // 3. 行内代码 `...`
  escaped = escaped.replace(/`([^`\n]+?)`/g, '<code class="md-code">$1</code>')

  // 4. 逐行解析块级元素
  const lines = escaped.split('\n')
  const out = []
  let i = 0
  let m
  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    // 代码块占位符（独占一行）
    if (/^\u0000CB\d+\u0000$/.test(trimmed)) {
      out.push(trimmed)
      i++
      continue
    }

    // 空行
    if (trimmed === '') {
      i++
      continue
    }

    // 标题 # ~ ######
    m = trimmed.match(/^(#{1,6})\s+(.+)$/)
    if (m) {
      out.push(`<h3 class="md-h">${inlineFmt(m[2])}</h3>`)
      i++
      continue
    }

    // 引用 > ...
    m = trimmed.match(/^&gt;\s?(.*)$/)
    if (m) {
      const quotes = []
      while (i < lines.length && (m = lines[i].trim().match(/^&gt;\s?(.*)$/))) {
        quotes.push(inlineFmt(m[1]))
        i++
      }
      out.push(`<blockquote class="md-quote">${quotes.join('<br>')}</blockquote>`)
      continue
    }

    // 表格（header | 分隔行 | body）
    if (/^\|.*\|$/.test(trimmed) && i + 1 < lines.length && /^\|[\s:\-|]+\|$/.test(lines[i + 1].trim())) {
      const header = parseTableRow(trimmed)
      i += 2 // 跳过表头与分隔行
      const rows = []
      while (i < lines.length && /^\|.*\|$/.test(lines[i].trim())) {
        rows.push(parseTableRow(lines[i].trim()))
        i++
      }
      let html = '<table class="md-table"><thead><tr>'
      header.forEach((c) => { html += `<th>${c}</th>` })
      html += '</tr></thead><tbody>'
      rows.forEach((r) => {
        html += '<tr>'
        r.forEach((c) => { html += `<td>${c}</td>` })
        html += '</tr>'
      })
      html += '</tbody></table>'
      out.push(html)
      continue
    }

    // 无序列表 - / * / +
    m = trimmed.match(/^[-*+]\s+(.+)$/)
    if (m) {
      const items = []
      while (i < lines.length && (m = lines[i].trim().match(/^[-*+]\s+(.+)$/))) {
        items.push(m[1])
        i++
      }
      out.push(`<ul class="md-ul">${items.map((it) => `<li>${inlineFmt(it)}</li>`).join('')}</ul>`)
      continue
    }

    // 有序列表 1. 2.
    m = trimmed.match(/^\d+\.\s+(.+)$/)
    if (m) {
      const items = []
      while (i < lines.length && (m = lines[i].trim().match(/^\d+\.\s+(.+)$/))) {
        items.push(m[1])
        i++
      }
      out.push(`<ol class="md-ol">${items.map((it) => `<li>${inlineFmt(it)}</li>`).join('')}</ol>`)
      continue
    }

    // 段落：收集连续非块行，行内 <br> 换行
    const para = [inlineFmt(trimmed)]
    i++
    while (i < lines.length) {
      const t = lines[i].trim()
      if (t === '') break
      if (/^\u0000CB\d+\u0000$/.test(t)) break
      if (/^#{1,6}\s+/.test(t)) break
      if (/^&gt;\s?/.test(t)) break
      if (/^\|.*\|$/.test(t)) break
      if (/^[-*+]\s+/.test(t)) break
      if (/^\d+\.\s+/.test(t)) break
      para.push(inlineFmt(t))
      i++
    }
    out.push(`<p class="md-p">${para.join('<br>')}</p>`)
  }

  // 5. 还原代码块
  let html = out.join('')
  html = html.replace(/\u0000CB(\d+)\u0000/g, (_m, idx) => codeBlocks[Number(idx)] || '')
  return html
}

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/* ============================================================
 * 页面组件
 * ============================================================ */
export default defineComponent({
  name: 'Chat',
  setup() {
    const chatStore = useChatStore()
    const echoStore = useEchoStore()

    // --- 输入与状态 ---
    const inputText = ref('')
    const includeContext = ref(true)
    const modelPickerOpen = ref(false)
    const selectedModelId = ref(chatStore.modelConfig?.modelId || 'mock-echo')
    const abortController = ref(null)
    const messagesEl = ref(null)
    const textareaEl = ref(null)
    const expandedTools = ref({})

    // --- 会话列表面板 ---
    const convListOpen = ref(false)
    const renamingId = ref(null)
    const renameText = ref('')

    // --- 自动滚动到底部 ---
    const scrollToBottom = async () => {
      await nextTick()
      const el = messagesEl.value
      if (el) el.scrollTop = el.scrollHeight
    }
    watch(() => chatStore.messages.length, () => scrollToBottom())
    watch(
      () => {
        const last = chatStore.messages[chatStore.messages.length - 1]
        return last ? last.content : ''
      },
      () => scrollToBottom()
    )

    // --- textarea 自适应高度 ---
    const autoResize = () => {
      const el = textareaEl.value
      if (!el) return
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 160) + 'px'
    }

    onMounted(() => {
      chatStore.markRead && chatStore.markRead()
      autoResize()
      scrollToBottom()
    })

    const onInput = (e) => {
      inputText.value = e.target.value
      autoResize()
    }

    const handleKeydown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        sendMessage()
      }
    }

    // --- 模型相关 ---
    const allModels = computed(() => chatStore.allModels)
    const currentModelName = computed(() => {
      const m = allModels.value.find((x) => x.id === chatStore.modelConfig?.modelId)
      return m?.label || chatStore.modelConfig?.label || '未选择'
    })
    const openModelPicker = () => {
      selectedModelId.value = chatStore.modelConfig?.modelId || 'mock-echo'
      modelPickerOpen.value = true
    }
    const pickModel = (m) => {
      selectedModelId.value = m.id
    }
    const confirmModel = () => {
      const m = allModels.value.find((x) => x.id === selectedModelId.value)
      if (!m) return
      if (m.requireKey && !chatStore.modelConfig?.apiKey && !chatStore.adminConfig?.defaultApiKey) {
        showToast('该模型需要API密钥，未配置将使用占位回复', 'warn')
      }
      chatStore.setModelConfig({
        provider: m.provider,
        baseUrl: m.baseUrl,
        model: m.model,
        modelId: m.id,
        label: m.label,
        requireKey: !!m.requireKey,
        isDefault: !!m.isDefault
      })
      modelPickerOpen.value = false
      showToast('模型已切换', 'success', 1200)
    }

    // --- 停止 / 清空 / 新会话 ---
    const stopStreaming = () => {
      try { abortController.value?.abort() } catch {}
      abortController.value = null
      chatStore.stopStreaming()
    }
    const clearChat = () => {
      if (chatStore.isStreaming) stopStreaming()
      chatStore.clearMessages()
      showToast('对话已清空', 'default', 1200)
    }
    const newConversation = () => {
      if (chatStore.isStreaming) stopStreaming()
      chatStore.newConversation()
      convListOpen.value = false
      showToast('已开启新会话', 'default', 1200)
    }

    // --- 会话列表：切换 / 删除 / 重命名 ---
    const openConvList = () => {
      renamingId.value = null
      convListOpen.value = true
    }
    const switchConv = (id) => {
      if (chatStore.isStreaming) stopStreaming()
      chatStore.switchConversation(id)
      renamingId.value = null
      convListOpen.value = false
    }
    const deleteConv = (id) => {
      if (confirm('确定删除此会话？此操作不可恢复。')) {
        chatStore.deleteConversation(id)
        renamingId.value = null
        showToast('会话已删除', 'default', 1200)
      }
    }
    const startRename = (conv) => {
      renamingId.value = conv.id
      renameText.value = conv.title || ''
    }
    const confirmRename = () => {
      const title = renameText.value.trim()
      if (title && renamingId.value) {
        chatStore.renameConversation(renamingId.value, title)
        showToast('已重命名', 'success', 1200)
      }
      renamingId.value = null
    }
    const cancelRename = () => {
      renamingId.value = null
    }

    // --- 工具气泡折叠 ---
    const toggleTool = (id) => {
      expandedTools.value = { ...expandedTools.value, [id]: !expandedTools.value[id] }
    }

    // --- 发送消息 + 多轮工具调用 ---
    const sendMessage = async (presetText) => {
      const rawContent = (presetText != null ? presetText : inputText.value).toString().trim()
      if (!rawContent || chatStore.isStreaming) return

      // 模型 Key 校验：需要 Key 且非默认模型且未配置 Key
      const cfg = chatStore.modelConfig || {}
      if (cfg.requireKey && !cfg.isDefault && !cfg.apiKey) {
        showToast('请先在设置页配置API密钥', 'warn')
        return
      }

      // 净化用户输入（防 XSS / Prompt Injection）
      const content = sanitizeInput(rawContent)

      // 检测 Prompt Injection
      const injectionCheck = detectInjection(content)
      if (injectionCheck.suspicious) {
        showToast('检测到可能的注入攻击，已拦截', 'danger', 2500)
        return
      }

      // 重置工具调用循环守卫
      loopGuard.reset()

      // 用户消息
      chatStore.addMessage({ role: 'user', content })
      if (presetText == null) {
        inputText.value = ''
        autoResize()
      }

      // 创建 AI 流式消息
      const aiMsgId = chatStore.addMessage({ role: 'assistant', content: '', isStreaming: true }).id
      chatStore.startStreaming()

      await runCompletion(aiMsgId, content)
    }

    /**
     * 调用 chatCompletion，处理流式 token 与工具调用。
     * 若 onDone 时有 pending tool_calls：执行工具 → 追加 tool 消息 → 重新发起一轮。
     *
     * 安全增强：
     * - 循环守卫检查（防无限工具调用）
     * - 知识库检索与注入
     * - Few-shot 示例注入（仅首轮）
     * - 动态安全护栏注入
     * - 输出验证（检测禁止模式）
     */
    const runCompletion = async (aiMsgId, userInput = '') => {
      // 循环守卫：检查迭代次数
      try {
        loopGuard.checkIteration()
      } catch (guardErr) {
        chatStore.updateMessage(aiMsgId, {
          content: `⚠️ ${guardErr.message}`,
          isStreaming: false
        })
        chatStore.stopStreaming()
        return
      }

      // 检索知识库（按关键词匹配）——管理员未配置时使用内置默认知识库
      const adminKB = chatStore.adminConfig?.knowledgeBase || []
      const effectiveKB = adminKB.length ? adminKB : DEFAULT_KNOWLEDGE_BASE
      const relevantKB = userInput ? retrieveKnowledge(effectiveKB, userInput) : []

      const systemPrompt = buildSystemPrompt({
        recentHistory: includeContext.value ? getRecentHistory(echoStore.history, 5) : '',
        profile: echoStore.profile,
        profileBazi: echoStore.profileBazi,
        currentJieqi: getCurrentJieqi(new Date()),
        knowledgeBase: relevantKB.length ? relevantKB : effectiveKB,
        userInput
      })

      // 构建对话上下文：system + 历史（排除正在流式的占位，但保留当前 aiMsgId 用于覆盖）
      const historyMessages = chatStore.messages
        .filter((m) => !m.isStreaming || m.id === aiMsgId)
        .map((m) => {
          const o = { role: m.role, content: m.content }
          if (m.toolCalls) o.tool_calls = m.toolCalls
          if (m.toolCallId) o.tool_call_id = m.toolCallId
          return o
        })

      let messages = [{ role: 'system', content: systemPrompt }, ...historyMessages]

      // 注入 Few-shot 示例（仅首轮对话，避免重复消耗 token）
      if (historyMessages.length <= 2) {
        messages = injectFewShot(messages)
      }

      // 注入动态安全护栏（基于用户输入检测风险）
      messages = buildGuardedMessages(messages, userInput)

      const tools = includeContext.value
        ? getToolSchemas({
            webSearchEnabled: chatStore.adminConfig?.webSearchEnabled,
            enabledTools: chatStore.adminConfig?.enabledTools || []
          })
        : []

      const controller = new AbortController()
      abortController.value = controller

      const pendingToolCalls = []

      try {
        await chatCompletion({
          messages,
          tools,
          config: chatStore.effectiveConfig,
          signal: controller.signal,
          onToken: (token) => {
            chatStore.updateMessage(aiMsgId, { appendContent: token })
          },
          onToolCall: (toolCall) => {
            pendingToolCalls.push(toolCall)
          },
          onDone: async () => {
            // 有工具调用：执行后继续新一轮
            if (pendingToolCalls.length > 0) {
              // 把 tool_calls 标记到当前 assistant 消息，并结束其流式状态
              chatStore.updateMessage(aiMsgId, { toolCalls: pendingToolCalls.slice(), isStreaming: false })

              for (const tc of pendingToolCalls) {
                let result
                try {
                  result = await executeTool(
                    tc.function?.name,
                    tc.function?.arguments,
                    {
                      signal: controller.signal,
                      webSearchApiKey: chatStore.adminConfig?.webSearchApiKey
                    }
                  )
                } catch (err) {
                  result = formatToolResult({ error: err?.message || String(err) })
                }
                chatStore.addMessage({
                  role: 'tool',
                  content: result,
                  toolCallId: tc.id,
                  toolName: tc.function?.name
                })
              }
              pendingToolCalls.length = 0
              abortController.value = null

              // 新建一条 assistant 消息承接基于工具结果的回复
              const nextId = chatStore.addMessage({ role: 'assistant', content: '', isStreaming: true }).id
              await runCompletion(nextId, userInput)
              return
            }

            // 无工具调用：结束流式
            chatStore.updateMessage(aiMsgId, { isStreaming: false })
            chatStore.stopStreaming()
            chatStore.markRead && chatStore.markRead()

            // 输出验证：检测禁止模式
            const finalMsg = chatStore.messages.find((m) => m.id === aiMsgId)
            const outputValidation = validateOutput(finalMsg?.content || '', userInput)
            if (!outputValidation.valid) {
              // 有严重问题：追加安全提示
              const safetyNote = '\n\n---\n⚠️ *以上内容已触发安全审查，请注意命理分析仅供参考，重大决策请咨询专业人士。*'
              chatStore.updateMessage(aiMsgId, { appendContent: safetyNote })
            }

            // 记录使用统计
            chatStore.recordUsage(
              chatStore.effectiveConfig?.model || 'unknown',
              Math.ceil((finalMsg?.content?.length || 0) / 4)
            )
            abortController.value = null
          },
          onError: (err) => {
            chatStore.updateMessage(aiMsgId, {
              content: `抱歉，发生了错误：${err?.message || String(err)}`,
              isStreaming: false
            })
            chatStore.stopStreaming()
            abortController.value = null
          }
        })
      } catch (err) {
        chatStore.updateMessage(aiMsgId, {
          content: `抱歉，发生了错误：${err?.message || String(err)}`,
          isStreaming: false
        })
        chatStore.stopStreaming()
        abortController.value = null
      }
    }

    // --- 渲染单条消息 ---
    const renderMessage = (m) => {
      if (m.role === 'user') {
        return (
          <div class="chat-message chat-message--user" key={m.id}>
            <div class="chat-bubble chat-bubble--user">
              <div class="chat-bubble__content" innerHTML={renderMarkdown(m.content)} />
              <div class="chat-bubble__time">{formatTime(m.createdAt)}</div>
            </div>
          </div>
        )
      }

      if (m.role === 'tool') {
        const expanded = !!expandedTools.value[m.id]
        return (
          <div class="chat-message chat-message--tool" key={m.id}>
            <button
              type="button"
              class="chat-bubble chat-bubble--tool"
              onClick={() => toggleTool(m.id)}
              aria-expanded={expanded}
            >
              <div class="chat-bubble__tool-head">
                <span class="chat-bubble__tool-name">⚒ {m.toolName || '工具调用'}</span>
                <span class="chat-bubble__tool-arrow">{expanded ? '▾ 收起' : '▸ 展开'}</span>
              </div>
              <div class={`chat-bubble__tool-body ${expanded ? 'chat-bubble__tool-body--open' : ''}`}>
                <pre>{formatToolResult(m.content)}</pre>
              </div>
              <div class="chat-bubble__time">{formatTime(m.createdAt)}</div>
            </button>
          </div>
        )
      }

      // assistant
      const html = renderMarkdown(m.content)
      return (
        <div class="chat-message chat-message--assistant" key={m.id}>
          <div class="chat-bubble chat-bubble--assistant">
            <div class="chat-bubble__content" innerHTML={html} />
            {m.isStreaming && <span class="chat-bubble__cursor">▋</span>}
            <div class="chat-bubble__time">{formatTime(m.createdAt)}</div>
          </div>
        </div>
      )
    }

    return () => (
      <div class="chat-page">
        <TopBar
          title="回响·AI对话"
          subtitle={currentModelName.value}
          vSlots={{
            right: () => (
              <div class="chat-header__actions">
                <button
                  type="button"
                  class="chat-header__btn"
                  onClick={openConvList}
                  title="会话列表"
                  aria-label="会话列表"
                >
                  ☰
                </button>
                <button
                  type="button"
                  class="chat-header__btn"
                  onClick={openModelPicker}
                  title="切换模型"
                  aria-label="切换模型"
                >
                  ⚙
                </button>
                <button
                  type="button"
                  class="chat-header__btn"
                  onClick={newConversation}
                  title="新建会话"
                  aria-label="新建会话"
                >
                  +
                </button>
              </div>
            )
          }}
        />

        {chatStore.messages.length === 0 ? (
          <div class="chat-empty">
            <div class="chat-empty__icon">回</div>
            <h2 class="chat-empty__title">你好，我是回响命理助手</h2>
            <p class="chat-empty__desc">
              基于你的推演历史与命格档案，与你共同印证命运节点。所有结论均为文化算法的可视化呈现，不构成决策依据。
            </p>
            <div class="chat-empty__quick">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  type="button"
                  key={q}
                  class="chat-empty__quick-btn"
                  onClick={() => sendMessage(q)}
                  disabled={chatStore.isStreaming}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div class="chat-messages" ref={messagesEl}>
            {chatStore.messages.map((m) => renderMessage(m))}
          </div>
        )}

        <div class="chat-input">
          <div class="chat-input__toolbar">
            <label class="chat-input__toggle">
              <input type="checkbox" checked={includeContext.value} onChange={(e) => (includeContext.value = e.target.checked)} />
              <span>带上推演上下文</span>
            </label>
            {chatStore.messages.length > 0 && (
              <button type="button" class="chat-input__clear" onClick={clearChat}>
                清空对话
              </button>
            )}
          </div>
          <div class="chat-input__row">
            <textarea
              ref={textareaEl}
              class="chat-input__textarea"
              value={inputText.value}
              onInput={onInput}
              onKeydown={handleKeydown}
              placeholder="问点什么…（Enter 发送，Shift+Enter 换行）"
              rows="1"
            />
            {chatStore.isStreaming ? (
              <button type="button" class="chat-input__btn chat-input__btn--stop" onClick={stopStreaming}>
                停止
              </button>
            ) : (
              <button
                type="button"
                class="chat-input__btn"
                disabled={!inputText.value.trim()}
                onClick={() => sendMessage()}
              >
                发送
              </button>
            )}
          </div>
        </div>

        <EchoModal
          modelValue={modelPickerOpen.value}
          onUpdate:modelValue={(v) => (modelPickerOpen.value = v)}
          title="选择模型"
          vSlots={{
            default: () => (
              <div class="chat-model-picker">
                {allModels.value.map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    class={`chat-model-item ${selectedModelId.value === m.id ? 'chat-model-item--active' : ''}`}
                    onClick={() => pickModel(m)}
                  >
                    <div class="chat-model-item__main">
                      <div class="chat-model-item__name">{m.label}</div>
                      <div class="chat-model-item__desc">{m.provider}</div>
                    </div>
                    <div class="chat-model-item__badges">
                      {m.isDefault && <span class="chat-model-item__badge chat-model-item__badge--default">默认</span>}
                      {m.requireKey ? (
                        <span class="chat-model-item__badge chat-model-item__badge--key">需 Key</span>
                      ) : (
                        <span class="chat-model-item__badge chat-model-item__badge--free">免 Key</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ),
            footer: () => [
              <EchoButton variant="ghost" key="cancel" onClick={() => (modelPickerOpen.value = false)}>
                取消
              </EchoButton>,
              <EchoButton variant="primary" key="confirm" onClick={confirmModel}>
                确认
              </EchoButton>
            ]
          }}
        />

        {/* 会话列表面板 */}
        <EchoModal
          modelValue={convListOpen.value}
          onUpdate:modelValue={(v) => (convListOpen.value = v)}
          title="会话列表"
          vSlots={{
            default: () => (
              <div class="chat-conv-list">
                {chatStore.conversations.length === 0 ? (
                  <div class="chat-conv-list__empty">暂无会话</div>
                ) : (
                  chatStore.conversations.map((conv) => (
                    <div
                      key={conv.id}
                      class={`chat-conv-item ${conv.id === chatStore.currentConversationId ? 'chat-conv-item--active' : ''}`}
                    >
                      {renamingId.value === conv.id ? (
                        <div class="chat-conv-item__rename">
                          <input
                            class="chat-conv-item__input"
                            type="text"
                            value={renameText.value}
                            onInput={(e) => (renameText.value = e.target.value)}
                            onKeydown={(e) => {
                              if (e.key === 'Enter') confirmRename()
                              if (e.key === 'Escape') cancelRename()
                            }}
                            maxlength="40"
                          />
                          <button
                            type="button"
                            class="chat-conv-item__icon-btn chat-conv-item__icon-btn--ok"
                            onClick={confirmRename}
                            title="确认"
                            aria-label="确认重命名"
                          >
                            ✓
                          </button>
                          <button
                            type="button"
                            class="chat-conv-item__icon-btn"
                            onClick={cancelRename}
                            title="取消"
                            aria-label="取消重命名"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            class="chat-conv-item__main"
                            onClick={() => switchConv(conv.id)}
                          >
                            <span class="chat-conv-item__title">{conv.title || '新对话'}</span>
                            <span class="chat-conv-item__meta">
                              {conv.messages.length} 条 · {formatTime(conv.updatedAt)}
                            </span>
                          </button>
                          <button
                            type="button"
                            class="chat-conv-item__icon-btn"
                            onClick={() => startRename(conv)}
                            title="重命名"
                            aria-label="重命名会话"
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            class="chat-conv-item__icon-btn chat-conv-item__icon-btn--danger"
                            onClick={() => deleteConv(conv.id)}
                            title="删除"
                            aria-label="删除会话"
                          >
                            🗑
                          </button>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            ),
            footer: () => [
              <EchoButton variant="ghost" key="close" onClick={() => (convListOpen.value = false)}>
                关闭
              </EchoButton>,
              <EchoButton variant="primary" key="new" onClick={newConversation}>
                + 新建会话
              </EchoButton>
            ]
          }}
        />
      </div>
    )
  }
})
