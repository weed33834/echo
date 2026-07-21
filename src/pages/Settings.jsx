import { defineComponent, computed, ref, watch } from 'vue'
import { useEchoStore } from '@/stores/echo.js'
import { useChatStore } from '@/stores/chat.js'
import { DEFAULT_MODELS, testConnection } from '@/services/ai.js'
import { TopBar } from '@/components/TabBar.jsx'
import { EchoCard, EchoButton, EchoBadge, showToast } from '@/components/EchoUI.jsx'

const THEME_OPTIONS = [
  { value: 'light', label: '宣纸', desc: '日间明亮', glyph: '日' },
  { value: 'dark', label: '墨砚', desc: '夜间沉静', glyph: '月' },
  { value: 'auto', label: '随天', desc: '跟随系统', glyph: '天' }
]

const FONT_SCALE_OPTIONS = [
  { value: 'sm', label: '小', desc: '紧凑' },
  { value: 'md', label: '中', desc: '默认' },
  { value: 'lg', label: '大', desc: '宽松' }
]

export default defineComponent({
  name: 'Settings',
  setup() {
    const store = useEchoStore()
    const chatStore = useChatStore()

    const theme = computed(() => store.settings.theme)
    const fontScale = computed(() => store.settings.fontScale)

    const setTheme = (v) => {
      store.updateSettings({ theme: v })
      showToast(`主题已切换至${THEME_OPTIONS.find(t => t.value === v)?.label}`, 'success', 1500)
    }
    const setFontScale = (v) => {
      store.updateSettings({ fontScale: v })
      showToast(`字号已调整`, 'success', 1500)
    }

    /* === AI 对话设置 === */
    const apiKey = ref(chatStore.modelConfig.apiKey || '')
    const baseUrl = ref(chatStore.modelConfig.baseUrl || 'https://api.deepseek.com/v1')
    const modelName = ref(chatStore.modelConfig.model || 'deepseek-chat')
    const temperature = ref(chatStore.modelConfig.temperature ?? 0.7)
    const maxTokens = ref(chatStore.modelConfig.maxTokens ?? 2048)
    const useDefault = ref(chatStore.modelConfig.isDefault ?? true)
    const webSearch = ref(chatStore.adminConfig.webSearchEnabled ?? false)
    const testResult = ref(null)
    const testing = ref(false)

    // 当 store 外部变更时同步本地表单
    watch(() => chatStore.modelConfig, (c) => {
      apiKey.value = c.apiKey || ''
      baseUrl.value = c.baseUrl || ''
      modelName.value = c.model || ''
      temperature.value = c.temperature ?? 0.7
      maxTokens.value = c.maxTokens ?? 2048
      useDefault.value = c.isDefault ?? true
    }, { deep: true })

    const currentLabel = computed(
      () => chatStore.modelConfig.label || (chatStore.modelConfig.model ? chatStore.modelConfig.model : '未配置')
    )

    const testConn = async () => {
      if (!apiKey.value && !useDefault.value) {
        testResult.value = { success: false, message: '请先填写 API 密钥' }
        return
      }
      testing.value = true
      testResult.value = null
      const result = await testConnection({
        apiKey: apiKey.value,
        baseUrl: baseUrl.value,
        model: modelName.value
      })
      // 兼容两种返回：布尔值（旧） 或 { ok, latency, error }（新）
      const ok = typeof result === 'boolean' ? result : (result?.ok ?? false)
      const latency = typeof result === 'object' ? result?.latency : null
      const errMsg = typeof result === 'object' ? result?.error : ''
      const msg = ok
        ? `连接成功，模型可用${latency ? `（${latency}ms）` : ''}`
        : (errMsg || '连接失败，请检查密钥与地址')
      testResult.value = { success: ok, message: msg }
      testing.value = false
      showToast(ok ? '连接测试成功' : '连接测试失败', ok ? 'success' : 'danger', 2000)
    }

    const saveConfig = () => {
      // 尝试匹配预设模型，获取 provider / modelId
      const preset = DEFAULT_MODELS.find(m => m.model === modelName.value)
        || chatStore.customModels.find(m => m.model === modelName.value)
      const config = {
        apiKey: apiKey.value,
        baseUrl: baseUrl.value,
        model: modelName.value,
        modelId: preset?.id || 'custom-' + Date.now(),
        provider: preset?.provider || 'custom',
        label: preset?.label || modelName.value,
        temperature: Number(temperature.value),
        maxTokens: Number(maxTokens.value),
        isDefault: useDefault.value,
        requireKey: preset?.requireKey !== false,
        stream: true
      }
      chatStore.setModelConfig(config)
      chatStore.setAdminConfig({ webSearchEnabled: webSearch.value })
      showToast('AI 配置已保存', 'success', 2000)
    }

    const toggleDefault = () => { useDefault.value = !useDefault.value }
    const toggleWebSearch = () => { webSearch.value = !webSearch.value }

    const applyPreset = (m) => {
      baseUrl.value = m.baseUrl || baseUrl.value
      modelName.value = m.model || m.id
      apiKey.value = apiKey.value || ''
      useDefault.value = !!m.isDefault
      // 立即保存预设模型的完整配置（含 provider / modelId）
      chatStore.setModelConfig({
        apiKey: apiKey.value,
        baseUrl: m.baseUrl || baseUrl.value,
        model: m.model || m.id,
        modelId: m.id,
        provider: m.provider,
        label: m.label,
        temperature: Number(temperature.value),
        maxTokens: Number(maxTokens.value),
        isDefault: !!m.isDefault,
        requireKey: m.requireKey !== false,
        stream: true
      })
      showToast(`已切换到 ${m.label}`, 'success', 1500)
    }

    return () => (
      <div class="settings-page">
        <TopBar title="设置" back />
        <div class="container">
          {/* 主题 */}
          <section class="settings-page__section">
            <div class="settings-page__section-head">
              <h2 class="settings-page__section-title">主题</h2>
              <span class="settings-page__section-desc">选择界面色调</span>
            </div>
            <div class="settings-page__theme-grid">
              {THEME_OPTIONS.map(t => (
                <button
                  class={`settings-page__theme-card ${theme.value === t.value ? 'settings-page__theme-card--active' : ''}`}
                  onClick={() => setTheme(t.value)}
                >
                  <div class="settings-page__theme-glyph">{t.glyph}</div>
                  <div class="settings-page__theme-name">{t.label}</div>
                  <div class="settings-page__theme-desc">{t.desc}</div>
                  {theme.value === t.value && <EchoBadge variant="accent">当前</EchoBadge>}
                </button>
              ))}
            </div>
          </section>

          {/* 字号 */}
          <section class="settings-page__section">
            <div class="settings-page__section-head">
              <h2 class="settings-page__section-title">字号</h2>
              <span class="settings-page__section-desc">调整全局文字大小</span>
            </div>
            <EchoCard level="secondary">
              <div class="settings-page__font-scale">
                {FONT_SCALE_OPTIONS.map(f => (
                  <button
                    class={`settings-page__font-btn ${fontScale.value === f.value ? 'settings-page__font-btn--active' : ''}`}
                    onClick={() => setFontScale(f.value)}
                  >
                    <span class="settings-page__font-label" style={{ fontSize: f.value === 'sm' ? '14px' : f.value === 'lg' ? '20px' : '16px' }}>
                      {f.label}
                    </span>
                    <span class="settings-page__font-desc">{f.desc}</span>
                  </button>
                ))}
              </div>
            </EchoCard>
            {/* 预览 */}
            <EchoCard level="tertiary">
              <div class="settings-page__preview">
                <div class="settings-page__preview-label">预览</div>
                <h3 class="settings-page__preview-title">命运印证引擎</h3>
                <p class="settings-page__preview-text">发起预测，等待回响。每一次复盘都使命格可信度积累。</p>
              </div>
            </EchoCard>
          </section>

          {/* AI 对话设置 */}
          <section class="settings-page__section">
            <div class="settings-page__section-head">
              <h2 class="settings-page__section-title">AI 对话</h2>
              <span class="settings-page__section-desc">配置对话模型与密钥</span>
            </div>
            <EchoCard level="tertiary">
              <div class="settings-page__ai-body">
                {/* 当前模型 */}
                <div class="settings-page__ai-row">
                  <div class="settings-page__ai-row-label">当前模型</div>
                  <div class="settings-page__ai-row-value">{currentLabel.value}</div>
                </div>

                {/* API 密钥 */}
                <div class="settings-page__ai-field">
                  <label class="settings-page__ai-field-label">API 密钥</label>
                  <div class="settings-page__ai-key-input">
                    <input
                      type="password"
                      class="settings-page__ai-input"
                      value={apiKey.value}
                      onInput={(e) => apiKey.value = e.target.value}
                      placeholder="sk-..."
                    />
                    <EchoButton
                      variant="secondary"
                      size="sm"
                      loading={testing.value}
                      onClick={testConn}
                    >测试连接</EchoButton>
                  </div>
                  <div class="settings-page__ai-field-hint">密钥仅存储在本地浏览器，不会上传到任何服务器</div>
                  {testResult.value && (
                    <div class={`settings-page__ai-test-result ${testResult.value.success ? 'ok' : 'fail'}`}>
                      {testResult.value.message}
                    </div>
                  )}
                </div>

                {/* Base URL */}
                <div class="settings-page__ai-field">
                  <label class="settings-page__ai-field-label">API 地址 (Base URL)</label>
                  <input
                    class="settings-page__ai-input"
                    value={baseUrl.value}
                    onInput={(e) => baseUrl.value = e.target.value}
                    placeholder="https://api.deepseek.com/v1"
                  />
                </div>

                {/* 模型名 */}
                <div class="settings-page__ai-field">
                  <label class="settings-page__ai-field-label">模型名称</label>
                  <input
                    class="settings-page__ai-input"
                    value={modelName.value}
                    onInput={(e) => modelName.value = e.target.value}
                    placeholder="deepseek-v4-flash"
                  />
                </div>

                {/* 温度滑块 */}
                <div class="settings-page__ai-field">
                  <label class="settings-page__ai-field-label">创造性 (Temperature): {Number(temperature.value).toFixed(1)}</label>
                  <input
                    type="range"
                    class="settings-page__ai-range"
                    min="0" max="2" step="0.1"
                    value={temperature.value}
                    onInput={(e) => temperature.value = Number(e.target.value)}
                  />
                </div>

                {/* 最大 token */}
                <div class="settings-page__ai-field">
                  <label class="settings-page__ai-field-label">最大回复长度: {maxTokens.value}</label>
                  <input
                    type="range"
                    class="settings-page__ai-range"
                    min="256" max="8192" step="256"
                    value={maxTokens.value}
                    onInput={(e) => maxTokens.value = Number(e.target.value)}
                  />
                </div>

                {/* 使用默认模型开关 */}
                <div class="settings-page__ai-row">
                  <div class="settings-page__ai-row-label">使用默认模型</div>
                  <button
                    class={`settings-page__ai-toggle ${useDefault.value ? 'on' : ''}`}
                    onClick={toggleDefault}
                    type="button"
                  >{useDefault.value ? '已开启' : '已关闭'}</button>
                </div>
                <div class="settings-page__ai-field-hint">开启后使用平台提供的免费模型，无需自行配置密钥</div>

                {/* 联网搜索开关 */}
                <div class="settings-page__ai-row">
                  <div class="settings-page__ai-row-label">联网搜索</div>
                  <button
                    class={`settings-page__ai-toggle ${webSearch.value ? 'on' : ''}`}
                    onClick={toggleWebSearch}
                    type="button"
                  >{webSearch.value ? '已开启' : '已关闭'}</button>
                </div>

                {/* 保存按钮 */}
                <div class="settings-page__ai-actions">
                  <EchoButton variant="primary" block onClick={saveConfig}>保存配置</EchoButton>
                </div>
              </div>
            </EchoCard>

            {/* 快速选择预设模型 */}
            <EchoCard level="secondary" title="快速选择">
              <div class="settings-page__ai-presets-grid">
                {DEFAULT_MODELS.map(m => (
                  <button
                    key={m.id}
                    class={`settings-page__ai-preset-card ${chatStore.modelConfig.modelId === m.id ? 'active' : ''}`}
                    onClick={() => applyPreset(m)}
                    type="button"
                  >
                    <div class="settings-page__ai-preset-name">{m.label}</div>
                    <div class="settings-page__ai-preset-model">{m.model}</div>
                    {m.isDefault && <span class="settings-page__ai-preset-badge">默认</span>}
                  </button>
                ))}
              </div>
            </EchoCard>
          </section>

          {/* 关于 */}
          <section class="settings-page__section">
            <div class="settings-page__section-head">
              <h2 class="settings-page__section-title">关于</h2>
            </div>
            <EchoCard level="secondary">
              <div class="settings-page__about">
                <div class="settings-page__about-row">
                  <span class="settings-page__about-label">应用</span>
                  <span class="settings-page__about-val">Echo · 回响</span>
                </div>
                <div class="settings-page__about-row">
                  <span class="settings-page__about-label">版本</span>
                  <span class="settings-page__about-val">v0.2.0</span>
                </div>
                <div class="settings-page__about-row">
                  <span class="settings-page__about-label">定位</span>
                  <span class="settings-page__about-val">命运假设的印证引擎</span>
                </div>
                <div class="settings-page__about-row">
                  <span class="settings-page__about-label">数据</span>
                  <span class="settings-page__about-val">本地存储 · 可重置</span>
                </div>
              </div>
            </EchoCard>
            <div class="settings-page__manifesto">
              <p>所有推演结果均为文化算法的可视化呈现，不构成任何决策依据。</p>
              <p>Echo 的价值在于「设节点 → 等回响 → 复盘」，而非单次预测的准与不准。</p>
            </div>
          </section>
        </div>
      </div>
    )
  }
})
