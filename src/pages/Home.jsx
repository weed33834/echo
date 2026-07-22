import { defineComponent, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useEchoStore, TOOLS } from '@/stores/echo.js'
import { EchoCard, EchoButton, EchoBadge, EchoTag, MingeGauge, EchoProgress, showToast } from '@/components/EchoUI.jsx'
import { ToolIcon, UIIcon } from '@/components/ToolIcons.jsx'

// 时辰宜忌计算（简化版，基于当下时辰）
const SHICHEN = [
  { name: '子时', hours: [23, 0], yi: '安眠藏神', ji: '剧烈运动' },
  { name: '丑时', hours: [1, 2], yi: '深睡养肝', ji: '熬夜' },
  { name: '寅时', hours: [3, 4], yi: '静坐调息', ji: '用力' },
  { name: '卯时', hours: [5, 6], yi: '起身舒展', ji: '赖床' },
  { name: '辰时', hours: [7, 8], yi: '进食温补', ji: '空腹' },
  { name: '巳时', hours: [9, 10], yi: '决断理事', ji: '久坐' },
  { name: '午时', hours: [11, 12], yi: '小憩养心', ji: '动怒' },
  { name: '未时', hours: [13, 14], yi: '细察微理', ji: '急躁' },
  { name: '申时', hours: [15, 16], yi: '签约决断', ji: '拖延' },
  { name: '酉时', hours: [17, 18], yi: '收束归家', ji: '远行' },
  { name: '戌时', hours: [19, 20], yi: '静思复盘', ji: '喧闹' },
  { name: '亥时', hours: [21, 22], yi: '安神准备', ji: '兴奋' }
]
function getCurrentShichen() {
  const h = new Date().getHours()
  for (const s of SHICHEN) {
    if (s.hours[0] > s.hours[1]) {
      if (h >= s.hours[0] || h <= s.hours[1]) return s
    } else if (h >= s.hours[0] && h <= s.hours[1]) return s
  }
  return SHICHEN[0]
}

export default defineComponent({
  name: 'Home',
  setup() {
    const router = useRouter()
    const store = useEchoStore()
    const shichen = ref(getCurrentShichen())

    const pending = computed(() => store.pendingAssumptions.slice(0, 3))
    const dueToday = computed(() => pending.value.filter(a => a.overdue || a.dueIn < 86400000).length)

    const greeting = computed(() => {
      const h = new Date().getHours()
      if (h < 6) return '夜深了'
      if (h < 12) return '早安'
      if (h < 18) return '午安'
      return '晚上好'
    })

    const dateStr = computed(() => {
      const d = new Date()
      return `${d.getMonth() + 1}月${d.getDate()}日`
    })
    const dailyInsight = computed(() => {
      // 基于日期生成每日一句话洞察
      const insights = [
        '今日宜静观其变，不宜急于决断。',
        '变化中藏着机遇，保持开放的心态。',
        '细节决定成败，留意身边的征兆。',
        '内省的时刻，答案在心中而非外求。',
        '顺时而动，量力而行。',
        '旧事有回响，留意过去的线索。',
        '能量充沛，适合推进搁置的计划。',
        '宜独处思考，不宜群体决策。',
        '直觉敏锐，信任第一感觉。',
        '稳扎稳打，不追求速成。',
      ]
      const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000)
      return insights[dayOfYear % insights.length]
    })

    const goCreateAssumption = () => {
      router.push('/tools')
      showToast('选一个工具发起预测', 'default', 1500)
    }

    const goReview = () => {
      router.push('/echo')
    }

    const goCheckin = () => {
      const r = store.doCheckin()
      showToast(r.message, r.ok ? 'success' : 'warn', 1800)
    }

    return () => (
      <div class="home">
        {/* Hero —— 左对齐编辑式 */}
        <section class="home__hero" style={{ textAlign: 'left' }}>
          <div class="home__brand">
            <span class="home__brand-name">Echo</span>
            <span class="home__brand-dot">·</span>
            <span class="home__brand-sub">回响</span>
          </div>
          <p class="home__slogan">{greeting.value}，{store.profile?.name || '探索者'}，发起预测，等待回响。</p>
        </section>

        {/* 时辰宜忌条 */}
        <div class="home__shichen">
          <span class="home__shichen-time">{shichen.value.name}</span>
          <span class="home__shichen-divider">·</span>
          <span class="home__shichen-yi">宜 {shichen.value.yi}</span>
          <span class="home__shichen-ji">忌 {shichen.value.ji}</span>
        </div>

        {/* 每日洞察 —— 首屏钩子 */}
        <section class="home__daily-hook stagger" style={{ '--i': 0 }}>
          <p class="home__hook-date">{dateStr.value}</p>
          <p class="home__hook-text">{dailyInsight.value}</p>
          <button class="home__hook-link" onClick={() => router.push('/daily')}>查看完整运势 →</button>
        </section>

        <div class="container">
          {/* 个人档案快捷卡 */}
          <section class="home__section stagger" style={{ '--i': 1 }}>
            <EchoCard level="secondary" interactive onClick={() => router.push('/profile')}>
              <div class="home__profile-card">
                <div class="home__profile-avatar">
                  {store.profile?.name?.charAt(0) || '回'}
                </div>
                <div class="home__profile-info">
                  <div class="home__profile-name">{store.profile?.name || '未设置档案'}</div>
                  <div class="home__profile-meta">
                    {store.profileBazi
                      ? `${store.profileBazi.dayMasterLabel} · 属${store.profileBazi.zodiac} · ${store.profileBazi.zodiacSign}`
                      : store.profile?.name
                        ? '档案信息不完整，请补充出生时辰'
                        : '点击设置你的出生信息，获取个性化推演'}
                  </div>
                </div>
                <span class="home__profile-arrow">→</span>
              </div>
            </EchoCard>
          </section>

          {/* EchoCard 队列 - 首屏第一卡 */}
          <section class="home__section stagger" style={{ '--i': 2 }}>
            <div class="home__section-head">
              <h2 class="home__section-title">待印证</h2>
              {dueToday.value > 0 && <EchoBadge variant="danger">{dueToday.value} 条今日到期</EchoBadge>}
            </div>
            {pending.value.length === 0 ? (
              <EchoCard level="tertiary">
                <div class="home__empty">
                  <p class="home__empty-text">还没有待印证的预测</p>
                  <EchoButton variant="primary" size="sm" onClick={goCreateAssumption}>发起第一个预测</EchoButton>
                </div>
              </EchoCard>
            ) : (
              <div class="home__echo-list">
                {pending.value.map((a, i) => (
                  <EchoCard key={a.id} level="primary" interactive class="stagger" style={{ '--i': i }} onClick={() => goReview()}>
                    <div class="echo-item">
                      <div class="echo-item__main">
                        <div class="echo-item__title">{a.title}</div>
                        <div class="echo-item__meta">
                          <EchoTag variant="muted">{a.tool}</EchoTag>
                          <span class="echo-item__due">
                            {a.overdue ? `已过期 ${Math.ceil(-a.dueIn / 86400000)} 天` : `剩 ${Math.ceil(a.dueIn / 86400000)} 天`}
                          </span>
                        </div>
                      </div>
                      {(a.overdue || a.dueIn < 86400000) && <EchoBadge variant="danger" dot />}
                    </div>
                  </EchoCard>
                ))}
              </div>
            )}
          </section>

          {/* 命格仪表 + 快捷 */}
          <section class="home__section stagger" style={{ '--i': 3 }}>
            <EchoCard level="secondary">
              <div class="home__minge">
                <div class="home__minge-gauge">
                  <MingeGauge value={store.accuracyRate} label="命格可信度" />
                </div>
                <div class="home__minge-info">
                  <div class="home__minge-level">
                    <span class="home__minge-title">{store.mingeLevelTitle}</span>
                    <EchoBadge variant="gold">Lv.{store.minge.level}</EchoBadge>
                  </div>
                  <div class="home__minge-stats">
                    <div class="home__minge-stat">
                      <div class="home__minge-stat-num">{store.minge.totalReviews}</div>
                      <div class="home__minge-stat-lbl">已印证</div>
                    </div>
                    <div class="home__minge-stat">
                      <div class="home__minge-stat-num">{store.minge.accurateCount}</div>
                      <div class="home__minge-stat-lbl">应验</div>
                    </div>
                  </div>
                  <EchoProgress value={store.levelProgress} variant="gold" />
                  <div class="home__minge-next">距下一级 {store.nextLevelExp} 经验</div>
                </div>
              </div>
            </EchoCard>
          </section>

          {/* 每日快捷 —— 首项放大，形成视觉层级 */}
          <section class="home__section stagger" style={{ '--i': 4 }}>
            <div class="home__quick">
              <EchoCard level="tertiary" interactive style={{ gridColumn: 'span 2' }} onClick={() => router.push('/dashboard')}>
                <div class="home__quick-item">
                  <div class="home__quick-icon home__quick-icon--gold">
                    <UIIcon name="dashboard" size={20} />
                  </div>
                  <div class="home__quick-label">命格面板</div>
                  <div class="home__quick-sub">五行·建议</div>
                </div>
              </EchoCard>
              <EchoCard level="tertiary" interactive onClick={() => router.push('/daily')}>
                <div class="home__quick-item">
                  <div class="home__quick-icon">
                    <UIIcon name="daily" size={20} />
                  </div>
                  <div class="home__quick-label">今日运势</div>
                </div>
              </EchoCard>
              <EchoCard level="tertiary" interactive onClick={goCheckin}>
                <div class="home__quick-item">
                  <div class="home__quick-icon home__quick-icon--gold">
                    <UIIcon name="checkin" size={20} />
                  </div>
                  <div class="home__quick-label">每日签到</div>
                  {store.checkin.streak > 0 && <div class="home__quick-sub">{store.checkin.streak} 天</div>}
                </div>
              </EchoCard>
              <EchoCard level="tertiary" interactive onClick={() => router.push('/graph')}>
                <div class="home__quick-item">
                  <div class="home__quick-icon">
                    <UIIcon name="graph" size={20} />
                  </div>
                  <div class="home__quick-label">命运图谱</div>
                  <div class="home__quick-sub">关系网络</div>
                </div>
              </EchoCard>
              <EchoCard level="tertiary" interactive onClick={() => router.push('/compatibility')}>
                <div class="home__quick-item">
                  <div class="home__quick-icon home__quick-icon--gold">
                    <UIIcon name="compatibility" size={20} />
                  </div>
                  <div class="home__quick-label">合婚匹配</div>
                  <div class="home__quick-sub">六维分析</div>
                </div>
              </EchoCard>
              <EchoCard level="tertiary" interactive onClick={() => router.push('/compass')}>
                <div class="home__quick-item">
                  <div class="home__quick-icon">
                    <UIIcon name="compass" size={20} />
                  </div>
                  <div class="home__quick-label">风水罗盘</div>
                  <div class="home__quick-sub">实时方位</div>
                </div>
              </EchoCard>
              <EchoCard level="tertiary" interactive onClick={() => router.push('/learn')}>
                <div class="home__quick-item">
                  <div class="home__quick-icon">
                    <UIIcon name="learn" size={20} />
                  </div>
                  <div class="home__quick-label">命理学堂</div>
                  <div class="home__quick-sub">入门课程</div>
                </div>
              </EchoCard>
            </div>
          </section>

          {/* 命运侦探推荐 */}
          <section class="home__section stagger" style={{ '--i': 5 }}>
            <div class="home__section-head">
              <h2 class="home__section-title">命运侦探</h2>
            </div>
            <EchoCard level="secondary">
              <div class="home__detective">
                <p class="home__detective-text">
                  排一次八字，看清你的先天命局。然后用紫微验证同一生辰的不同体系——两个体系若都指向同一种趋势，这条预测就值得设节点追踪。
                </p>
                <div class="home__detective-actions">
                  <EchoButton variant="primary" size="sm" onClick={() => router.push('/tools/bazi')}>排八字</EchoButton>
                  <EchoButton variant="ghost" size="sm" onClick={() => router.push('/tools/ziwei')}>用紫微验证</EchoButton>
                </div>
              </div>
            </EchoCard>
          </section>

          {/* 工具入口 —— 编辑式卡片：名称 + 简述 */}
          <section class="home__section stagger" style={{ '--i': 6 }}>
            <div class="home__section-head">
              <h2 class="home__section-title">工具</h2>
              <EchoButton variant="ghost" size="sm" onClick={() => router.push('/tools')}>全部 →</EchoButton>
            </div>
            <div class="tools-page__grid">
              {TOOLS.slice(0, 8).map(t => (
                <button key={t.key} class="tool-card" onClick={() => router.push(`/tools/${t.key}`)}>
                  <div class="tool-card__glyph">
                    <ToolIcon name={t.key} size={20} />
                  </div>
                  <div class="tool-card__info">
                    <div class="tool-card__name">{t.name}</div>
                    <div class="tool-card__desc">{t.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    )
  }
})
