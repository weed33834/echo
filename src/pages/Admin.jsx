import { defineComponent, ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useChatStore, DEFAULT_PROMPTS } from '@/stores/chat.js'
import { useEchoStore, TOOLS } from '@/stores/echo.js'
import { DEFAULT_MODELS, testConnection } from '@/services/ai.js'
import { TopBar } from '@/components/TabBar.jsx'
import { EchoCard, EchoButton, EchoBadge, EchoTag, EchoModal, showToast } from '@/components/EchoUI.jsx'

const TABS = [
  { key: 'models', label: '模型管理' },
  { key: 'prompts', label: '提示词管理' },
  { key: 'usage', label: '用量统计' },
  { key: 'system', label: '系统配置' }
]

const PROMPT_TEMPLATES = [
  { key: 'mingli', label: '命理顾问', glyph: '命' },
  { key: 'fengshui', label: '风水师', glyph: '风' },
  { key: 'general', label: '通用助手', glyph: '通' }
]

export default defineComponent({
  name: 'Admin',
  setup() {
    const router = useRouter()
    const chatStore = useChatStore()
    const echoStore = useEchoStore()

    /* === 登录态 === */
    const authed = ref(false)
    const passwordInput = ref('')
    const loginError = ref('')
    // 首次设置密码（adminPassword 为空时进入设置模式）
    const setupPassword = ref('')
    const setupConfirm = ref('')
    const isFirstTime = computed(() => !chatStore.adminConfig.adminPassword)

    const tryLogin = () => {
      const pwd = chatStore.adminConfig.adminPassword || ''
      if (!pwd) {
        loginError.value = '首次使用，请在下方设置管理员密码'
        return
      }
      if (passwordInput.value === pwd) {
        authed.value = true
        loginError.value = ''
        showToast('登录成功', 'success', 1500)
      } else {
        loginError.value = '密码错误，请重试'
        showToast('密码错误', 'danger', 1500)
      }
    }

    const doFirstTimeSetup = () => {
      if (!setupPassword.value || setupPassword.value.length < 4) {
        showToast('密码至少 4 位', 'warn', 1500)
        return
      }
      if (setupPassword.value !== setupConfirm.value) {
        showToast('两次输入不一致', 'danger', 1500)
        return
      }
      chatStore.setAdminConfig({ adminPassword: setupPassword.value })
      authed.value = true
      setupPassword.value = ''
      setupConfirm.value = ''
      showToast('密码设置成功，已进入管理后台', 'success', 2000)
    }
    const logout = () => {
      authed.value = false
      passwordInput.value = ''
      showToast('已退出管理后台', 'default', 1500)
    }

    /* === Tab 切换 === */
    const activeTab = ref('models')
    const switchTab = (k) => { activeTab.value = k }

    /* === 模型管理 === */
    const defaultApiKey = ref(chatStore.adminConfig.defaultApiKey || '')
    const defaultBaseUrl = ref(chatStore.modelConfig.baseUrl || 'https://api.deepseek.com/v1')
    const defaultModelName = ref(chatStore.adminConfig.defaultModel || 'deepseek-chat')
    const modelTestResult = ref(null)
    const modelTesting = ref(false)

    // 预设启用列表（默认全部启用）
    const enabledPresets = ref(chatStore.adminConfig.enabledPresets || DEFAULT_MODELS.map(m => m.id))
    const isPresetEnabled = (id) => enabledPresets.value.includes(id)
    const togglePreset = (id) => {
      if (enabledPresets.value.includes(id)) {
        enabledPresets.value = enabledPresets.value.filter(x => x !== id)
      } else {
        enabledPresets.value = [...enabledPresets.value, id]
      }
      chatStore.setAdminConfig({ enabledPresets: enabledPresets.value })
    }

    // 自定义模型表单
    const modelForm = reactive({ label: '', provider: 'custom', model: '', baseUrl: '', apiKey: '' })
    const editingModelId = ref(null)
    const modelModalOpen = ref(false)

    const openAddModel = () => {
      editingModelId.value = null
      modelForm.label = ''
      modelForm.provider = 'custom'
      modelForm.model = ''
      modelForm.baseUrl = ''
      modelForm.apiKey = ''
      modelModalOpen.value = true
    }
    const openEditModel = (m) => {
      editingModelId.value = m.id
      modelForm.label = m.label
      modelForm.provider = m.provider
      modelForm.model = m.model
      modelForm.baseUrl = m.baseUrl
      modelForm.apiKey = m.apiKey || ''
      modelModalOpen.value = true
    }
    const submitModel = () => {
      if (!modelForm.label || !modelForm.model) {
        showToast('请填写模型名称和标识', 'warn', 1500)
        return
      }
      if (editingModelId.value) {
        chatStore.updateCustomModel(editingModelId.value, { ...modelForm })
        showToast('模型已更新', 'success', 1500)
      } else {
        chatStore.addCustomModel({ ...modelForm })
        showToast('模型已添加', 'success', 1500)
      }
      modelModalOpen.value = false
    }
    const removeModel = (m) => {
      if (confirm(`确认删除模型「${m.label}」？`)) {
        chatStore.removeCustomModel(m.id)
        showToast('模型已删除', 'default', 1500)
      }
    }

    const testDefaultConn = async () => {
      if (!defaultApiKey.value) {
        modelTestResult.value = { success: false, message: '请先填写 API 密钥' }
        return
      }
      modelTesting.value = true
      modelTestResult.value = null
      const result = await testConnection({
        apiKey: defaultApiKey.value,
        baseUrl: defaultBaseUrl.value,
        model: defaultModelName.value
      })
      // 兼容两种返回：布尔值 或 { ok, latency }
      const ok = typeof result === 'boolean' ? result : (result?.ok ?? false)
      modelTestResult.value = {
        success: ok,
        message: ok ? '连接成功' : '连接失败，请检查配置'
      }
      modelTesting.value = false
      showToast(ok ? '连接成功' : '连接失败', ok ? 'success' : 'danger', 1500)
    }
    const saveDefaultModel = () => {
      chatStore.setAdminConfig({
        defaultApiKey: defaultApiKey.value,
        defaultModel: defaultModelName.value
      })
      chatStore.setModelConfig({
        baseUrl: defaultBaseUrl.value,
        apiKey: defaultApiKey.value,
        model: defaultModelName.value
      })
      showToast('默认模型已保存', 'success', 1500)
    }

    /* === 提示词管理 === */
    const activePromptKey = ref('mingli')
    const promptDraft = ref(chatStore.adminConfig.prompts?.mingli || DEFAULT_PROMPTS.mingli)
    const systemOverride = ref(chatStore.adminConfig.systemPromptOverride || '')

    const selectPromptTemplate = (key) => {
      // 先保存当前草稿
      saveCurrentPrompt()
      activePromptKey.value = key
      promptDraft.value = chatStore.adminConfig.prompts?.[key] || DEFAULT_PROMPTS[key] || ''
    }
    const saveCurrentPrompt = () => {
      chatStore.setPrompt(activePromptKey.value, promptDraft.value)
    }
    const restorePrompts = () => {
      if (confirm('确认恢复所有提示词为默认值？当前编辑将被覆盖。')) {
        chatStore.restoreDefaultPrompts()
        promptDraft.value = chatStore.adminConfig.prompts[activePromptKey.value]
        systemOverride.value = ''
        chatStore.setAdminConfig({ systemPromptOverride: '' })
        showToast('已恢复默认提示词', 'success', 1500)
      }
    }
    const saveSystemOverride = () => {
      chatStore.setAdminConfig({ systemPromptOverride: systemOverride.value })
      showToast('系统提示词已保存', 'success', 1500)
    }

    // 知识库
    const kbForm = reactive({ title: '', content: '' })
    const editingKbId = ref(null)
    const kbModalOpen = ref(false)
    const openAddKb = () => {
      editingKbId.value = null
      kbForm.title = ''
      kbForm.content = ''
      kbModalOpen.value = true
    }
    const openEditKb = (k) => {
      editingKbId.value = k.id
      kbForm.title = k.title
      kbForm.content = k.content
      kbModalOpen.value = true
    }
    const submitKb = () => {
      if (!kbForm.title || !kbForm.content) {
        showToast('请填写标题与内容', 'warn', 1500)
        return
      }
      if (editingKbId.value) {
        chatStore.updateKnowledge(editingKbId.value, { ...kbForm })
        showToast('片段已更新', 'success', 1500)
      } else {
        chatStore.addKnowledge(kbForm.title, kbForm.content)
        showToast('片段已添加', 'success', 1500)
      }
      kbModalOpen.value = false
    }
    const removeKb = (k) => {
      if (confirm(`确认删除片段「${k.title}」？`)) {
        chatStore.removeKnowledge(k.id)
        showToast('片段已删除', 'default', 1500)
      }
    }

    /* === 用量统计 === */
    const totalChats = computed(() => chatStore.usageStats.totalChats || 0)
    const tokenUsage = computed(() => chatStore.usageStats.tokenUsage || 0)
    const modelStats = computed(() => {
      const arr = Object.entries(chatStore.usageStats.byModel || {}).map(([model, count]) => ({
        model, count
      }))
      arr.sort((a, b) => b.count - a.count)
      return arr
    })
    const maxModelCount = computed(() => Math.max(1, ...modelStats.value.map(m => m.count)))
    const dateStats = computed(() => {
      // 最近 7 天
      const days = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000)
        const key = d.toISOString().slice(0, 10)
        const count = chatStore.usageStats.byDate?.[key] || 0
        days.push({
          date: key,
          label: `${d.getMonth() + 1}/${d.getDate()}`,
          count
        })
      }
      return days
    })
    const maxDateCount = computed(() => Math.max(1, ...dateStats.value.map(d => d.count)))
    const clearStats = () => {
      if (confirm('确认清空所有用量统计？此操作不可恢复。')) {
        chatStore.clearUsageStats()
        showToast('统计已清空', 'default', 1500)
      }
    }

    /* === 系统配置 === */
    const newPassword = ref('')
    const confirmPassword = ref('')
    const webSearchApiKey = ref(chatStore.adminConfig.webSearchApiKey || '')
    const webSearchEnabled = ref(chatStore.adminConfig.webSearchEnabled || false)
    const rateLimit = ref(chatStore.adminConfig.rateLimit ?? 20)
    // 工具启用列表：空数组在 getToolSchemas 中表示"全部启用"，但 UI toggle 需要显式列表
    // 因此初始化时如果为空，填充为所有工具 key
    const allToolKeys = TOOLS.map(t => t.key)
    const enabledTools = ref(
      (chatStore.adminConfig.enabledTools && chatStore.adminConfig.enabledTools.length > 0)
        ? [...chatStore.adminConfig.enabledTools]
        : [...allToolKeys]
    )

    const changePassword = () => {
      if (!newPassword.value) {
        showToast('请输入新密码', 'warn', 1500)
        return
      }
      if (newPassword.value !== confirmPassword.value) {
        showToast('两次输入不一致', 'danger', 1500)
        return
      }
      chatStore.setAdminConfig({ adminPassword: newPassword.value })
      newPassword.value = ''
      confirmPassword.value = ''
      showToast('密码已修改', 'success', 1500)
    }
    const saveWebSearch = () => {
      chatStore.setAdminConfig({
        webSearchApiKey: webSearchApiKey.value,
        webSearchEnabled: webSearchEnabled.value
      })
      showToast('联网搜索配置已保存', 'success', 1500)
    }
    const toggleWebSearch = () => {
      webSearchEnabled.value = !webSearchEnabled.value
      chatStore.setAdminConfig({ webSearchEnabled: webSearchEnabled.value })
      showToast(webSearchEnabled.value ? '联网搜索已启用' : '联网搜索已禁用', 'success', 1500)
    }
    const saveRateLimit = () => {
      chatStore.setAdminConfig({ rateLimit: Number(rateLimit.value) })
      showToast('速率限制已保存', 'success', 1500)
    }
    const toggleTool = (key) => {
      if (enabledTools.value.includes(key)) {
        enabledTools.value = enabledTools.value.filter(k => k !== key)
      } else {
        enabledTools.value = [...enabledTools.value, key]
      }
      chatStore.setAdminConfig({ enabledTools: enabledTools.value })
    }
    const isToolEnabled = (key) => enabledTools.value.includes(key)

    const exportData = () => {
      const data = chatStore.exportData()
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `echo-admin-export-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      showToast('数据已导出', 'success', 1500)
    }
    const clearAllData = () => {
      if (confirm('确认清空所有 AI 配置与用量数据？此操作不可恢复！')) {
        if (confirm('再次确认：这将删除所有模型配置、提示词、统计。')) {
          chatStore.clearUsageStats()
          chatStore.setAdminConfig({
            defaultApiKey: '',
            systemPromptOverride: '',
            webSearchApiKey: '',
            knowledgeBase: []
          })
          showToast('数据已清空', 'default', 1500)
        }
      }
    }

    /* === 渲染：登录页 === */
    const renderLogin = () => (
      <div class="admin-login">
        <TopBar title="管理后台" back />
        <div class="admin-login__wrap">
          <div class="admin-login__card">
            <div class="admin-login__icon">管</div>
            <div class="admin-login__title">管理后台</div>
            {isFirstTime.value ? (
              <>
                <div class="admin-login__subtitle">首次使用，请设置管理员密码</div>
                <input
                  type="password"
                  class="admin-login__input"
                  placeholder="设置密码（至少 4 位）"
                  value={setupPassword.value}
                  onInput={(e) => setupPassword.value = e.target.value}
                  onKeyup={(e) => { if (e.key === 'Enter') doFirstTimeSetup() }}
                />
                <input
                  type="password"
                  class="admin-login__input"
                  placeholder="确认密码"
                  value={setupConfirm.value}
                  onInput={(e) => setupConfirm.value = e.target.value}
                  onKeyup={(e) => { if (e.key === 'Enter') doFirstTimeSetup() }}
                />
                {loginError.value && <div class="admin-login__error">{loginError.value}</div>}
                <EchoButton variant="primary" block onClick={doFirstTimeSetup}>设置密码并进入</EchoButton>
                <div class="admin-login__hint">密码仅存储在本地浏览器，用于保护管理后台</div>
              </>
            ) : (
              <>
                <div class="admin-login__subtitle">请输入管理员密码以继续</div>
                <input
                  type="password"
                  class="admin-login__input"
                  placeholder="管理员密码"
                  value={passwordInput.value}
                  onInput={(e) => passwordInput.value = e.target.value}
                  onKeyup={(e) => { if (e.key === 'Enter') tryLogin() }}
                />
                {loginError.value && <div class="admin-login__error">{loginError.value}</div>}
                <EchoButton variant="primary" block onClick={tryLogin}>验证登录</EchoButton>
                <div class="admin-login__hint">忘记密码可在浏览器 localStorage 中重置</div>
              </>
            )}
          </div>
        </div>
      </div>
    )

    /* === 渲染：模型管理 Tab === */
    const renderModelsTab = () => (
      <div class="admin-panel">
        {/* 默认模型配置 */}
        <EchoCard level="secondary" title="默认模型配置">
          <div class="admin-form">
            <div class="admin-form__row">
              <label class="admin-form__label">默认 API Key</label>
              <input
                type="password"
                class="admin-form__input"
                value={defaultApiKey.value}
                onInput={(e) => defaultApiKey.value = e.target.value}
                placeholder="sk-..."
              />
            </div>
            <div class="admin-form__row">
              <label class="admin-form__label">Base URL</label>
              <input
                class="admin-form__input"
                value={defaultBaseUrl.value}
                onInput={(e) => defaultBaseUrl.value = e.target.value}
                placeholder="https://api.deepseek.com/v1"
              />
            </div>
            <div class="admin-form__row">
              <label class="admin-form__label">默认模型名</label>
              <input
                class="admin-form__input"
                value={defaultModelName.value}
                onInput={(e) => defaultModelName.value = e.target.value}
                placeholder="deepseek-chat"
              />
            </div>
            {modelTestResult.value && (
              <div class={`admin-test-result ${modelTestResult.value.success ? 'ok' : 'fail'}`}>
                {modelTestResult.value.message}
              </div>
            )}
            <div class="admin-form__actions">
              <EchoButton variant="secondary" size="sm" loading={modelTesting.value} onClick={testDefaultConn}>测试连接</EchoButton>
              <EchoButton variant="primary" size="sm" onClick={saveDefaultModel}>保存</EchoButton>
            </div>
          </div>
        </EchoCard>

        {/* 预设模型列表 */}
        <EchoCard level="secondary" title="预设模型">
          <div class="admin-list">
            {DEFAULT_MODELS.map(m => (
              <div key={m.id} class="admin-list__item">
                <div class="admin-list__main">
                  <div class="admin-list__title">
                    {m.name || m.label}
                    {m.isDefault && <EchoBadge variant="gold">默认</EchoBadge>}
                  </div>
                  <div class="admin-list__sub">{m.model || m.id} · {m.provider}</div>
                </div>
                <div class="admin-list__actions">
                  <button
                    class={`admin-toggle ${isPresetEnabled(m.id) ? 'on' : ''}`}
                    onClick={() => togglePreset(m.id)}
                  >{isPresetEnabled(m.id) ? '已启用' : '已禁用'}</button>
                </div>
              </div>
            ))}
          </div>
        </EchoCard>

        {/* 自定义模型管理 */}
        <EchoCard level="secondary" title="自定义模型">
          <div class="admin-section__head">
            <span class="admin-section__title">已添加模型 ({chatStore.customModels.length})</span>
            <EchoButton variant="primary" size="sm" onClick={openAddModel}>+ 添加模型</EchoButton>
          </div>
          {chatStore.customModels.length === 0 ? (
            <div class="admin-empty">暂无自定义模型，点击「添加模型」创建</div>
          ) : (
            <div class="admin-list">
              {chatStore.customModels.map(m => (
                <div key={m.id} class="admin-list__item">
                  <div class="admin-list__main">
                    <div class="admin-list__title">{m.label}</div>
                    <div class="admin-list__sub">{m.model} · {m.provider}</div>
                  </div>
                  <div class="admin-list__actions">
                    <button class="admin-btn admin-btn--ghost" onClick={() => openEditModel(m)}>编辑</button>
                    <button class="admin-btn admin-btn--danger" onClick={() => removeModel(m)}>删除</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </EchoCard>
      </div>
    )

    /* === 渲染：提示词管理 Tab === */
    const renderPromptsTab = () => (
      <div class="admin-panel">
        {/* System Prompt 编辑器 */}
        <EchoCard level="secondary" title="System Prompt 覆盖">
          <div class="admin-prompt-editor">
            <div class="admin-prompt-editor__hint">
              此内容将覆盖所有场景的默认系统提示词。留空则使用分场景模板。
            </div>
            <textarea
              class="admin-prompt-editor__textarea"
              rows="6"
              value={systemOverride.value}
              onInput={(e) => systemOverride.value = e.target.value}
              placeholder="输入全局系统提示词覆盖..."
            />
            <div class="admin-prompt-editor__count">
              字数：{systemOverride.value.length}
            </div>
            <EchoButton variant="primary" size="sm" onClick={saveSystemOverride}>保存覆盖</EchoButton>
          </div>
        </EchoCard>

        {/* 预设提示词模板 */}
        <EchoCard level="secondary" title="预设提示词模板">
          <div class="admin-prompt-templates">
            {PROMPT_TEMPLATES.map(t => (
              <button
                key={t.key}
                class={`admin-prompt-tab ${activePromptKey.value === t.key ? 'active' : ''}`}
                onClick={() => selectPromptTemplate(t.key)}
              >
                <span class="admin-prompt-tab__glyph">{t.glyph}</span>
                <span class="admin-prompt-tab__label">{t.label}</span>
              </button>
            ))}
          </div>
          <div class="admin-prompt-editor">
            <textarea
              class="admin-prompt-editor__textarea"
              rows="8"
              value={promptDraft.value}
              onInput={(e) => promptDraft.value = e.target.value}
            />
            <div class="admin-prompt-editor__count">
              字数：{promptDraft.value.length}
            </div>
            <div class="admin-form__actions">
              <EchoButton variant="primary" size="sm" onClick={saveCurrentPrompt}>保存当前</EchoButton>
              <EchoButton variant="ghost" size="sm" onClick={restorePrompts}>恢复默认</EchoButton>
            </div>
          </div>
        </EchoCard>

        {/* 知识库片段管理 */}
        <EchoCard level="secondary" title="知识库片段">
          <div class="admin-section__head">
            <span class="admin-section__title">已添加片段 ({chatStore.adminConfig.knowledgeBase?.length || 0})</span>
            <EchoButton variant="primary" size="sm" onClick={openAddKb}>+ 添加片段</EchoButton>
          </div>
          {(!chatStore.adminConfig.knowledgeBase || chatStore.adminConfig.knowledgeBase.length === 0) ? (
            <div class="admin-empty">暂无知识库片段</div>
          ) : (
            <div class="admin-list">
              {chatStore.adminConfig.knowledgeBase.map(k => (
                <div key={k.id} class="admin-list__item admin-list__item--col">
                  <div class="admin-list__main">
                    <div class="admin-list__title">{k.title}</div>
                    <div class="admin-list__sub">{k.content.slice(0, 60)}{k.content.length > 60 ? '...' : ''}</div>
                  </div>
                  <div class="admin-list__actions">
                    <button class="admin-btn admin-btn--ghost" onClick={() => openEditKb(k)}>编辑</button>
                    <button class="admin-btn admin-btn--danger" onClick={() => removeKb(k)}>删除</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </EchoCard>
      </div>
    )

    /* === 渲染：用量统计 Tab === */
    const renderUsageTab = () => (
      <div class="admin-panel">
        <div class="admin-stats-grid">
          <div class="admin-stat">
            <div class="admin-stat__num">{totalChats.value}</div>
            <div class="admin-stat__label">总对话次数</div>
          </div>
          <div class="admin-stat">
            <div class="admin-stat__num">{tokenUsage.value.toLocaleString()}</div>
            <div class="admin-stat__label">Token 消耗</div>
          </div>
          <div class="admin-stat">
            <div class="admin-stat__num">{modelStats.value.length}</div>
            <div class="admin-stat__label">使用模型数</div>
          </div>
        </div>

        {/* 按模型统计 */}
        <EchoCard level="secondary" title="按模型统计">
          {modelStats.value.length === 0 ? (
            <div class="admin-empty">暂无使用记录</div>
          ) : (
            <div class="admin-chart">
              {modelStats.value.map((m, idx) => (
                <div key={m.model} class="admin-chart__row">
                  <span class="admin-chart__name" title={m.model}>{m.model}</span>
                  <div class="admin-chart__bar">
                    <div
                      class={`admin-chart__fill ${idx === 0 ? 'gold' : 'accent'}`}
                      style={{ width: (m.count / maxModelCount.value * 100) + '%' }}
                    />
                  </div>
                  <span class="admin-chart__count">{m.count}</span>
                </div>
              ))}
            </div>
          )}
        </EchoCard>

        {/* 按日期统计（最近7天） */}
        <EchoCard level="secondary" title="最近 7 天">
          <div class="admin-chart admin-chart--date">
            {dateStats.value.map(d => (
              <div key={d.date} class="admin-chart__col">
                <div class="admin-chart__bar-vertical">
                  <div
                    class="admin-chart__fill-vertical"
                    style={{ height: (d.count / maxDateCount.value * 100) + '%' }}
                    title={`${d.date}: ${d.count} 次`}
                  />
                </div>
                <span class="admin-chart__date-label">{d.label}</span>
                <span class="admin-chart__date-count">{d.count}</span>
              </div>
            ))}
          </div>
        </EchoCard>

        <EchoButton variant="danger" block onClick={clearStats}>清空统计</EchoButton>
      </div>
    )

    /* === 渲染：系统配置 Tab === */
    const renderSystemTab = () => (
      <div class="admin-panel">
        {/* 管理员密码修改 */}
        <EchoCard level="secondary" title="管理员密码">
          <div class="admin-form">
            <div class="admin-form__row">
              <label class="admin-form__label">新密码</label>
              <input
                type="password"
                class="admin-form__input"
                value={newPassword.value}
                onInput={(e) => newPassword.value = e.target.value}
                placeholder="输入新密码"
              />
            </div>
            <div class="admin-form__row">
              <label class="admin-form__label">确认密码</label>
              <input
                type="password"
                class="admin-form__input"
                value={confirmPassword.value}
                onInput={(e) => confirmPassword.value = e.target.value}
                placeholder="再次输入新密码"
              />
            </div>
            <EchoButton variant="primary" size="sm" onClick={changePassword}>修改密码</EchoButton>
          </div>
        </EchoCard>

        {/* 联网搜索配置 */}
        <EchoCard level="secondary" title="联网搜索 (Tavily)">
          <div class="admin-form">
            <div class="admin-form__row">
              <label class="admin-form__label">启用状态</label>
              <button
                type="button"
                class={`admin-tool-toggle ${webSearchEnabled.value ? 'admin-tool-toggle--on' : ''}`}
                onClick={toggleWebSearch}
              >
                {webSearchEnabled.value ? '✓ 已启用' : '× 已禁用'}
              </button>
            </div>
            <div class="admin-form__row">
              <label class="admin-form__label">Tavily API Key</label>
              <input
                type="password"
                class="admin-form__input"
                value={webSearchApiKey.value}
                onInput={(e) => webSearchApiKey.value = e.target.value}
                placeholder="tvly-..."
              />
            </div>
            <div class="admin-form__hint">联网搜索需要 Tavily API Key，可在 tavily.com 申请（免费 1000 次/月）</div>
            <EchoButton variant="primary" size="sm" onClick={saveWebSearch}>保存</EchoButton>
          </div>
        </EchoCard>

        {/* 速率限制 */}
        <EchoCard level="secondary" title="速率限制">
          <div class="admin-form">
            <div class="admin-form__row">
              <label class="admin-form__label">每分钟最大请求数: {rateLimit.value}</label>
              <input
                type="range"
                class="admin-form__range"
                min="5" max="60" step="5"
                value={rateLimit.value}
                onInput={(e) => rateLimit.value = Number(e.target.value)}
              />
            </div>
            <EchoButton variant="primary" size="sm" onClick={saveRateLimit}>保存</EchoButton>
          </div>
        </EchoCard>

        {/* 工具启用/禁用 */}
        <EchoCard level="secondary" title="工具启用">
          <div class="admin-tools-grid">
            {TOOLS.map(t => (
              <button
                key={t.key}
                class={`admin-tool-chip ${isToolEnabled(t.key) ? 'active' : ''}`}
                onClick={() => toggleTool(t.key)}
              >
                <span class="admin-tool-chip__glyph">{t.glyph}</span>
                <span class="admin-tool-chip__name">{t.name}</span>
                <span class="admin-tool-chip__status">{isToolEnabled(t.key) ? '✓' : '×'}</span>
              </button>
            ))}
          </div>
        </EchoCard>

        {/* 数据导出/清空 */}
        <EchoCard level="secondary" title="数据管理">
          <div class="admin-form__actions admin-form__actions--col">
            <EchoButton variant="secondary" block onClick={exportData}>导出配置数据</EchoButton>
            <EchoButton variant="danger" block onClick={clearAllData}>清空所有 AI 数据</EchoButton>
          </div>
        </EchoCard>
      </div>
    )

    /* === 主渲染 === */
    return () => {
      if (!authed.value) return renderLogin()
      return (
        <div class="admin-page">
          <TopBar title="管理后台" back vSlots={{
            right: () => (
              <button class="admin-logout" onClick={logout} type="button">退出</button>
            )
          }} />
          <div class="container">
            {/* Tab 栏 */}
            <div class="admin-tabs">
              {TABS.map(t => (
                <button
                  key={t.key}
                  class={`admin-tab ${activeTab.value === t.key ? 'admin-tab--active' : ''}`}
                  onClick={() => switchTab(t.key)}
                  type="button"
                >{t.label}</button>
              ))}
            </div>

            {/* 面板 */}
            {activeTab.value === 'models' && renderModelsTab()}
            {activeTab.value === 'prompts' && renderPromptsTab()}
            {activeTab.value === 'usage' && renderUsageTab()}
            {activeTab.value === 'system' && renderSystemTab()}
          </div>

          {/* 模型编辑弹窗 */}
          <EchoModal
            modelValue={modelModalOpen.value}
            onUpdate:modelValue={(v) => modelModalOpen.value = v}
            title={editingModelId.value ? '编辑模型' : '添加模型'}
          >
            <div class="admin-form">
              <div class="admin-form__row">
                <label class="admin-form__label">显示名称</label>
                <input
                  class="admin-form__input"
                  value={modelForm.label}
                  onInput={(e) => modelForm.label = e.target.value}
                  placeholder="如：我的 DeepSeek"
                />
              </div>
              <div class="admin-form__row">
                <label class="admin-form__label">提供商</label>
                <input
                  class="admin-form__input"
                  value={modelForm.provider}
                  onInput={(e) => modelForm.provider = e.target.value}
                  placeholder="如：deepseek"
                />
              </div>
              <div class="admin-form__row">
                <label class="admin-form__label">模型标识</label>
                <input
                  class="admin-form__input"
                  value={modelForm.model}
                  onInput={(e) => modelForm.model = e.target.value}
                  placeholder="如：deepseek-chat"
                />
              </div>
              <div class="admin-form__row">
                <label class="admin-form__label">Base URL</label>
                <input
                  class="admin-form__input"
                  value={modelForm.baseUrl}
                  onInput={(e) => modelForm.baseUrl = e.target.value}
                  placeholder="https://api.deepseek.com/v1"
                />
              </div>
              <div class="admin-form__row">
                <label class="admin-form__label">API Key</label>
                <input
                  type="password"
                  class="admin-form__input"
                  value={modelForm.apiKey}
                  onInput={(e) => modelForm.apiKey = e.target.value}
                  placeholder="sk-..."
                />
              </div>
            </div>
            <div class="admin-modal__footer">
              <EchoButton variant="ghost" size="sm" onClick={() => modelModalOpen.value = false}>取消</EchoButton>
              <EchoButton variant="primary" size="sm" onClick={submitModel}>保存</EchoButton>
            </div>
          </EchoModal>

          {/* 知识库编辑弹窗 */}
          <EchoModal
            modelValue={kbModalOpen.value}
            onUpdate:modelValue={(v) => kbModalOpen.value = v}
            title={editingKbId.value ? '编辑片段' : '添加片段'}
          >
            <div class="admin-form">
              <div class="admin-form__row">
                <label class="admin-form__label">标题</label>
                <input
                  class="admin-form__input"
                  value={kbForm.title}
                  onInput={(e) => kbForm.title = e.target.value}
                  placeholder="片段标题"
                />
              </div>
              <div class="admin-form__row">
                <label class="admin-form__label">内容</label>
                <textarea
                  class="admin-form__textarea"
                  rows="5"
                  value={kbForm.content}
                  onInput={(e) => kbForm.content = e.target.value}
                  placeholder="片段内容..."
                />
              </div>
            </div>
            <div class="admin-modal__footer">
              <EchoButton variant="ghost" size="sm" onClick={() => kbModalOpen.value = false}>取消</EchoButton>
              <EchoButton variant="primary" size="sm" onClick={submitKb}>保存</EchoButton>
            </div>
          </EchoModal>
        </div>
      )
    }
  }
})
