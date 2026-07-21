import { defineComponent, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEchoStore } from '@/stores/echo.js'
import { useChatStore } from '@/stores/chat.js'
import { TopBar } from '@/components/TabBar.jsx'
import { EchoCard, EchoButton, EchoBadge, EchoTag, EchoProgress, showToast } from '@/components/EchoUI.jsx'
import { generateDailyFortune } from '@/services/fortune.js'
import { getCurrentJieqi, solarToLunar } from '@/utils/engines.js'
import { chatCompletion } from '@/services/ai.js'

export default defineComponent({
  name: 'Daily',
  setup() {
    const store = useEchoStore()
    const chatStore = useChatStore()
    const router = useRouter()

    const today = new Date()
    const y = today.getFullYear()
    const m = today.getMonth() + 1
    const d = today.getDate()
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    const dateStr = `${y}年${m}月${d}日`
    const weekday = weekdays[today.getDay()]

    // 农历 + 节气
    const lunar = solarToLunar(y, m, d)
    const lunarStr = `农历${lunar.month}月${lunar.day}日`
    const jieqi = getCurrentJieqi(today)

    // 八字（getter）
    const bazi = computed(() => store.profileBazi)
    const hasProfile = computed(() => !!bazi.value)

    // 运势（缓存优先；缓存与当前档案状态不一致时重新生成）
    const fortune = ref(null)
    const loadFortune = () => {
      const cached = store.getFortuneCache()
      if (cached && cached.personalized === hasProfile.value) {
        fortune.value = cached
        return
      }
      const f = generateDailyFortune(bazi.value, today)
      fortune.value = f
      store.setFortuneCache(f)
    }
    onMounted(loadFortune)

    // 四维列表
    const scoreList = computed(() => {
      const f = fortune.value
      if (!f) return []
      return [
        { key: 'career', label: '事业', value: f.dimensions.career },
        { key: 'love', label: '感情', value: f.dimensions.love },
        { key: 'wealth', label: '财运', value: f.dimensions.wealth },
        { key: 'health', label: '健康', value: f.dimensions.health }
      ]
    })

    // 幸运项
    const luckyItems = computed(() => {
      const f = fortune.value
      if (!f) return []
      return [
        { key: 'color', icon: '色', label: '幸运色', val: f.luckyColor },
        { key: 'number', icon: '数', label: '幸运数', val: f.luckyNumber },
        { key: 'dir', icon: '方', label: '吉方', val: f.luckyDirection },
        { key: 'time', icon: '时', label: '吉时', val: f.luckyTime }
      ]
    })

    // 综合分档位标签
    const overallGrade = computed(() => {
      const v = fortune.value?.overall ?? 0
      if (v >= 85) return { text: '大吉', variant: 'gold' }
      if (v >= 70) return { text: '吉', variant: 'gold' }
      if (v >= 50) return { text: '平', variant: 'accent' }
      return { text: '慎', variant: 'muted' }
    })

    // --- AI 解读 ---
    const aiReading = ref('')
    const aiLoading = ref(false)
    const aiError = ref('')

    // AI 是否已配置：有 apiKey，或为无需密钥的本地模型
    const aiConfigured = computed(() => {
      const cfg = chatStore.modelConfig || {}
      return !!cfg.apiKey || cfg.requireKey === false
    })

    const runAiReading = async () => {
      if (aiLoading.value) return
      const f = fortune.value
      if (!f) return
      const cfg = chatStore.modelConfig || {}
      const bz = bazi.value
      const dayMaster = f.dayMaster || (bz && bz.dayMaster) || '未提供'
      const wuxing = f.wuxing || (bz && bz.dayMasterWx) || '未提供'
      const prompt =
        '作为命理顾问，基于以下八字和今日运势数据，给出简短的今日建议（3-4句话）：' +
        `日主：${dayMaster}，五行：${wuxing}，今日综合运势：${f.overall}分，` +
        `事业：${f.dimensions.career}，感情：${f.dimensions.love}，` +
        `财运：${f.dimensions.wealth}，健康：${f.dimensions.health}`

      aiLoading.value = true
      aiReading.value = ''
      aiError.value = ''

      try {
        await chatCompletion({
          messages: [
            {
              role: 'system',
              content: '你是"回响"命理顾问，擅长结合八字与每日运势给出简短、具体、可执行的当日建议。回答控制在3-4句话，语气温和笃定，避免迷信绝对化。'
            },
            { role: 'user', content: prompt }
          ],
          config: { ...cfg, stream: true, maxTokens: 512, temperature: 0.7 },
          onToken: (token) => { aiReading.value += token },
          onDone: () => { aiLoading.value = false },
          onError: (err) => {
            aiLoading.value = false
            aiError.value = (err && err.message) || 'AI 解读失败，请稍后重试'
            // 出错且无任何输出时，回退到本地解读
            if (!aiReading.value) aiReading.value = f.reading
          }
        })
      } catch (e) {
        aiLoading.value = false
        aiError.value = (e && e.message) || 'AI 解读失败，请稍后重试'
        if (!aiReading.value) aiReading.value = f.reading
      }
    }

    // --- 设节点追踪（保留）---
    const createDailyAssume = () => {
      const f = fortune.value
      store.createAssumption({
        title: `${dateStr} 今日运程`,
        desc: `综合${f ? f.overall : '--'}分，宜${f ? f.yi.join('·') : '—'}，忌${f ? f.ji.join('·') : '—'}。明日回看今日应验几分。`,
        tool: '每日运势',
        days: 1
      })
      showToast('已设节点，明日回看今日应验几分', 'success', 2000)
      setTimeout(() => router.push('/echo'), 1000)
    }

    const goSetup = () => router.push('/me')
    const goSettings = () => router.push('/settings')

    return () => {
      const f = fortune.value
      return (
        <div class="daily-page">
          <TopBar title="每日渡" back />
          <div class="container">
            {/* Hero：公历 + 农历 + 节气 */}
            <div class="daily-page__hero">
              <div class="daily-page__hero-date">{dateStr} · 星期{weekday}</div>
              <div class="daily-page__hero-lunar">
                {lunarStr}{jieqi && jieqi.name ? ` · ${jieqi.name}` : ''}
              </div>
            </div>

            {/* 无档案提示 */}
            {!hasProfile.value && (
              <EchoCard level="tertiary">
                <div class="daily-page__assume">
                  <div class="daily-page__assume-title">尚未建立命主档案</div>
                  <p class="daily-page__assume-text">建立档案后可获得基于八字的个性化每日运势与 AI 解读。以下为通用日运参考。</p>
                  <EchoButton variant="gold" size="sm" onClick={goSetup}>去建立档案</EchoButton>
                </div>
              </EchoCard>
            )}

            {/* 运势主体 */}
            {f && (
              <>
                {/* 综合分 */}
                <EchoCard
                  level="primary"
                  title={hasProfile.value && f.dayMaster ? `今日运程 · ${f.dayMaster}${f.wuxing}日主` : '今日运程'}
                >
                  <div class="daily-page__overall">
                    <div class="daily-page__overall-score">{f.overall}</div>
                    <div>
                      <div class="daily-page__overall-label">{f.summary}</div>
                      <EchoTag variant={overallGrade.value.variant}>{overallGrade.value.text}</EchoTag>
                    </div>
                  </div>
                </EchoCard>

                {/* 四维评分 */}
                <EchoCard level="secondary" title="四维运势">
                  <div class="daily-page__scores">
                    {scoreList.value.map((s) => (
                      <div class="daily-page__score" key={s.key}>
                        <div class="daily-page__score-head">
                          <span class="daily-page__score-label">{s.label}</span>
                          <span class="daily-page__score-val">{s.value}</span>
                        </div>
                        <EchoProgress
                          value={s.value}
                          variant={s.value >= 70 ? 'gold' : 'accent'}
                        />
                      </div>
                    ))}
                  </div>
                </EchoCard>

                {/* 幸运项 */}
                <EchoCard level="secondary" title="今日幸运">
                  <div class="daily-page__lucky">
                    {luckyItems.value.map((item) => (
                      <div class="daily-page__lucky-item" key={item.key}>
                        <span class="daily-page__lucky-icon">{item.icon}</span>
                        <div>
                          <div class="daily-page__lucky-label">{item.label}</div>
                          <div class="daily-page__lucky-val">{item.val}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </EchoCard>

                {/* 宜忌 */}
                <div class="daily-page__yiji">
                  <EchoCard level="secondary">
                    <div class="daily-page__yi">
                      <div class="daily-page__yi-label">宜</div>
                      <div class="daily-page__yi-list">
                        {f.yi.map((yiItem) => (
                          <EchoBadge variant="ok" key={yiItem}>{yiItem}</EchoBadge>
                        ))}
                      </div>
                    </div>
                  </EchoCard>
                  <EchoCard level="secondary">
                    <div class="daily-page__ji">
                      <div class="daily-page__ji-label">忌</div>
                      <div class="daily-page__ji-list">
                        {f.ji.map((jiItem) => (
                          <EchoBadge variant="danger" key={jiItem}>{jiItem}</EchoBadge>
                        ))}
                      </div>
                    </div>
                  </EchoCard>
                </div>

                {/* AI 解读（仅在有档案时） */}
                {hasProfile.value && (
                  <EchoCard level="secondary" title="AI 解读今日">
                    {aiConfigured.value ? (
                      <div>
                        <div class="daily-page__ai-reading-title">命理顾问 · 流式解读</div>
                        {aiReading.value ? (
                          <div class="daily-page__ai-reading">
                            {aiReading.value}{aiLoading.value && <span class="daily-page__cursor">▍</span>}
                          </div>
                        ) : (
                          !aiLoading.value && (
                            <p class="daily-page__assume-text">点击下方按钮，让 AI 结合你的八字解读今日运势。</p>
                          )
                        )}
                        {aiError.value && (
                          <p class="daily-page__assume-text" style={{ color: 'var(--danger)' }}>{aiError.value}</p>
                        )}
                        <div class="daily-page__assume" style={{ marginTop: 'var(--sp-2)' }}>
                          <EchoButton variant="gold" size="sm" loading={aiLoading.value} onClick={runAiReading}>
                            {aiReading.value ? '重新解读' : 'AI 解读今日'}
                          </EchoButton>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div class="daily-page__ai-reading">{f.reading}</div>
                        <p class="daily-page__assume-text" style={{ marginTop: 'var(--sp-2)' }}>
                          未配置 AI，以上为本地命理引擎生成的解读。前往「设置」配置模型后可获取 AI 个性化解读。
                        </p>
                        <div class="daily-page__assume" style={{ marginTop: 'var(--sp-2)' }}>
                          <EchoButton variant="ghost" size="sm" onClick={goSettings}>去配置 AI</EchoButton>
                        </div>
                      </div>
                    )}
                  </EchoCard>
                )}

                {/* Echo 钩子（仅在有档案时） */}
                {hasProfile.value && (
                  <EchoCard level="tertiary">
                    <div class="daily-page__assume">
                      <div class="daily-page__assume-title">今日运程准吗？</div>
                      <p class="daily-page__assume-text">设个节点，明日此时回看今日应验几分，校准你的命格可信度。</p>
                      <EchoButton variant="gold" size="sm" onClick={createDailyAssume}>设节点追踪</EchoButton>
                    </div>
                  </EchoCard>
                )}
              </>
            )}
          </div>
        </div>
      )
    }
  }
})
