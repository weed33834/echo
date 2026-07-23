import { defineComponent, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useEchoStore, TOOLS } from '@/stores/echo.js'
import { getCurrentJieqi } from '@/utils/engines.js'
import { TopBar } from '@/components/TabBar.jsx'
import { EchoCard, EchoButton, EchoBadge, EchoTag, EchoProgress, MingeGauge, showToast } from '@/components/EchoUI.jsx'
import { Timeline } from '@/components/Timeline.jsx'

/* === 五行建议数据（日主五行 → 四维建议） === */
const WUXING_ADVICE = {
  金: {
    diet: { yi: '银耳、百合、雪梨、白萝卜', ji: '辛辣、油炸' },
    lifestyle: '早睡早起，润肺养气',
    exercise: '八段锦·左右开弓似射雕',
    emotion: '保持豁达，戒悲伤'
  },
  木: {
    diet: { yi: '绿叶蔬菜、酸味水果、枸杞', ji: '油腻、厚味' },
    lifestyle: '春季早起，舒展筋骨',
    exercise: '太极·云手舒肝',
    emotion: '疏解郁结，戒怒'
  },
  水: {
    diet: { yi: '黑豆、黑芝麻、核桃、海带', ji: '过咸、生冷' },
    lifestyle: '冬季早睡晚起，保暖固肾',
    exercise: '站桩·培元固本',
    emotion: '沉静内敛，戒恐惧'
  },
  火: {
    diet: { yi: '红枣、莲子、苦瓜、番茄', ji: '过苦、燥热' },
    lifestyle: '夏季晚睡早起，养心安神',
    exercise: '六字诀·呵字诀',
    emotion: '保持平和，戒大喜大怒'
  },
  土: {
    diet: { yi: '山药、小米、南瓜、红薯', ji: '过甜、粘腻' },
    lifestyle: '饭后散步，健脾化湿',
    exercise: '八段锦·调理脾胃须单举',
    emotion: '心态稳重，戒忧思'
  }
}

/* 无日主时通用建议 */
const GENERIC_ADVICE = {
  diet: { yi: '当季时令食材、均衡饮食', ji: '暴饮暴食、偏食' },
  lifestyle: '日出而作，日落而息，顺应天时',
  exercise: '八段锦·太极·散步任选其一',
  emotion: '保持心境平和，戒大悲大喜'
}

/* === 雷达图配置 === */
const RADAR_CENTER = 150
const RADAR_MAX_R = 120
const RADAR_LABELS = ['金', '木', '水', '火', '土'] // 顺序：金(顶)、木(右上)、水(右下)、火(左下)、土(左上)
const RADAR_ANGLES = [-90, -18, 54, 126, 198]       // 度，从顶部起每 72°
const RADAR_GRID_RADII = [40, 80, 120]              // 3 层网格
const RADAR_COLORS = {
  '金': '#d4a843',
  '木': '#5a9e5a',
  '水': '#5a8db5',
  '火': '#d45a5a',
  '土': '#a8825a'
}

/* 极坐标 → 笛卡尔坐标 */
const polarToCartesian = (cx, cy, r, angleDeg) => {
  const rad = (angleDeg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

/* 基于日主五行，按生克关系生成默认五行分布（0-100） */
const buildDefaultWuxing = (dayMasterWx) => {
  const gen = ['木', '火', '土', '金', '水']
  const idx = gen.indexOf(dayMasterWx)
  if (idx < 0) return { '金': 50, '木': 50, '水': 50, '火': 50, '土': 50 }
  const dist = {}
  dist[gen[idx]] = 70                    // 自身（比劫）
  dist[gen[(idx + 4) % 5]] = 55          // 生我（印）
  dist[gen[(idx + 1) % 5]] = 45          // 我生（食伤）
  dist[gen[(idx + 2) % 5]] = 40          // 我克（财）
  dist[gen[(idx + 3) % 5]] = 35          // 克我（官杀）
  return dist
}

/* 相对时间格式化 */
const relativeTime = (ts) => {
  const diff = Date.now() - ts
  if (diff < 60000) return '刚刚'
  const min = Math.floor(diff / 60000)
  if (min < 60) return `${min}分钟前`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}小时前`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day}天前`
  const mo = Math.floor(day / 30)
  if (mo < 12) return `${mo}个月前`
  return `${Math.floor(mo / 12)}年前`
}

export default defineComponent({
  name: 'Dashboard',
  setup() {
    const router = useRouter()
    const store = useEchoStore()

    const hasProfile = computed(() => !!store.profile && !!store.profile.name)

    /* 最近一次八字推演记录 */
    const latestBazi = computed(() =>
      store.history.find(h => h.toolKey === 'bazi')
    )

    /* 五行分布数据（0-100） */
    const wuxingData = computed(() => {
      const empty = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 }
      // 1. 优先从八字推演记录提取 result.wuxing
      if (latestBazi.value?.result?.wuxing) {
        const wx = latestBazi.value.result.wuxing
        const total = 8 // 四柱 × 干支 = 8 字
        const dist = {}
        Object.keys(empty).forEach(k => {
          dist[k] = Math.round(((wx[k] || 0) / total) * 100)
        })
        return dist
      }
      // 2. 其次从 profileBazi.dayMasterWx 推算默认分布
      if (store.profileBazi?.dayMasterWx) {
        return buildDefaultWuxing(store.profileBazi.dayMasterWx)
      }
      // 3. 兜底：均衡分布
      return { '金': 50, '木': 50, '水': 50, '火': 50, '土': 50 }
    })

    /* 五行强弱文字解读 */
    const wuxingInterpretation = computed(() => {
      const entries = Object.entries(wuxingData.value)
      const sorted = [...entries].sort((a, b) => b[1] - a[1])
      const strongest = sorted[0]
      const weakest = sorted[sorted.length - 1]
      const parts = []
      if (strongest[1] >= 60) parts.push(`${strongest[0]}旺`)
      else if (strongest[1] >= 40) parts.push(`${strongest[0]}平`)
      if (weakest[1] <= 30) parts.push(`${weakest[0]}弱`)
      if (parts.length === 0) parts.push('五行均衡')
      return parts.join('、')
    })

    /* 雷达图几何 */
    const radarGeom = computed(() => {
      // 网格多边形（3 层）
      const grids = RADAR_GRID_RADII.map(r =>
        RADAR_ANGLES.map(a => polarToCartesian(RADAR_CENTER, RADAR_CENTER, r, a))
      )
      // 轴线终点
      const axes = RADAR_ANGLES.map(a =>
        polarToCartesian(RADAR_CENTER, RADAR_CENTER, RADAR_MAX_R, a)
      )
      // 数据顶点
      const points = RADAR_LABELS.map((label, i) => {
        const val = Math.max(0, Math.min(100, wuxingData.value[label] || 0))
        const r = (val / 100) * RADAR_MAX_R
        return polarToCartesian(RADAR_CENTER, RADAR_CENTER, r, RADAR_ANGLES[i])
      })
      const polygonStr = points.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')
      // 标签
      const labels = RADAR_LABELS.map((label, i) => ({
        label,
        color: RADAR_COLORS[label],
        pos: polarToCartesian(RADAR_CENTER, RADAR_CENTER, RADAR_MAX_R + 22, RADAR_ANGLES[i]),
        value: wuxingData.value[label] || 0
      }))
      return { grids, axes, points, polygonStr, labels }
    })

    /* 当前节气 */
    const currentJieqi = computed(() => getCurrentJieqi())

    /* 今日建议（日主五行 + 节气） */
    const todayAdvice = computed(() => {
      const wx = store.profileBazi?.dayMasterWx
      if (wx && WUXING_ADVICE[wx]) {
        return { wx, ...WUXING_ADVICE[wx] }
      }
      return { wx: null, ...GENERIC_ADVICE }
    })

    /* 最近一次老黄历推演 */
    const latestHuangli = computed(() =>
      store.history.find(h => h.toolKey === 'huangli')
    )

    /* 推演历史（store.recentHistory 已是倒序） */
    const recentHistory = computed(() => store.recentHistory)

    /* 工具使用统计（按次数降序） */
    const toolStats = computed(() => {
      const stats = store.historyStats
      const toolMap = {}
      TOOLS.forEach(t => { toolMap[t.key] = t.name })
      // 合婚匹配不是独立工具但会记录历史
      toolMap['compat'] = '合婚匹配'
      const arr = Object.entries(stats).map(([key, count]) => ({
        key,
        name: toolMap[key] || key,
        count
      }))
      arr.sort((a, b) => b.count - a.count)
      return arr
    })

    const maxToolCount = computed(() =>
      Math.max(1, ...toolStats.value.map(t => t.count))
    )

    /* 概览统计数据 */
    const totalDivinations = computed(() => store.history.length)
    const reviewedCount = computed(() => store.assumptions.filter(a => a.reviewed).length)

    /* 跳转 */
    const goToTools = () => router.push('/tools')
    const goToMe = () => router.push('/me')
    const goToHuangli = () => router.push('/tools/huangli')

    /* 删除单条推演历史 */
    const removeHistoryItem = (id) => {
      store.removeHistory(id)
      showToast('已删除该记录', 'default', 1200)
    }
    /* 清空全部推演历史 */
    const clearAllHistory = () => {
      if (store.history.length === 0) return
      if (confirm('确定清空全部推演历史？此操作不可恢复。')) {
        store.clearHistory()
        showToast('已清空推演历史', 'default', 1200)
      }
    }

    return () => (
      <div class="dashboard">
        <TopBar title="命格面板" />
        <div class="container">
          {/* === 1. 个人命格概览 === */}
          <EchoCard level="primary">
            {hasProfile.value ? (
              <div class="dashboard__overview">
                <MingeGauge value={store.accuracyRate} />
                <div class="dashboard__overview-info">
                  <div class="dashboard__overview-name">{store.profile.name}</div>
                  <div class="dashboard__overview-title">
                    <EchoBadge variant="gold">Lv.{store.minge.level} {store.mingeLevelTitle}</EchoBadge>
                  </div>
                  <div class="dashboard__overview-stats">
                    <div class="dashboard__overview-stat">
                      <span class="dashboard__overview-stat-num">{totalDivinations.value}</span>
                      <span class="dashboard__overview-stat-lbl">总推演</span>
                    </div>
                    <div class="dashboard__overview-stat">
                      <span class="dashboard__overview-stat-num">{reviewedCount.value}</span>
                      <span class="dashboard__overview-stat-lbl">已印证</span>
                    </div>
                    <div class="dashboard__overview-stat">
                      <span class="dashboard__overview-stat-num">{store.accuracyRate}%</span>
                      <span class="dashboard__overview-stat-lbl">应验率</span>
                    </div>
                    <div class="dashboard__overview-stat">
                      <span class="dashboard__overview-stat-num">{store.checkin.streak}</span>
                      <span class="dashboard__overview-stat-lbl">连签</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div class="dashboard__no-profile">
                <div class="dashboard__no-profile-text">请先在"我的"页面设置档案</div>
                <EchoButton variant="ghost" size="sm" onClick={goToMe}>去设置 →</EchoButton>
              </div>
            )}
          </EchoCard>

          {/* === 2. 五行雷达图 === */}
          <EchoCard level="secondary" title="五行雷达">
            <div class="dashboard__radar">
              <div class="dashboard__radar-svg-wrap">
                <svg viewBox="0 0 300 300" class="dashboard__radar-svg" role="img" aria-label="五行雷达图">
                  {/* 网格多边形（3 层） */}
                  {radarGeom.value.grids.map((grid, gi) => (
                    <polygon
                      key={`grid-${gi}`}
                      points={grid.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')}
                      class="dashboard__radar-grid"
                    />
                  ))}
                  {/* 5 条轴线 */}
                  {radarGeom.value.axes.map((ax, i) => (
                    <line
                      key={`axis-${i}`}
                      x1={RADAR_CENTER} y1={RADAR_CENTER}
                      x2={ax.x.toFixed(2)} y2={ax.y.toFixed(2)}
                      class="dashboard__radar-axis"
                    />
                  ))}
                  {/* 数据多边形（半透明填充 + 边框） */}
                  <polygon
                    points={radarGeom.value.polygonStr}
                    class="dashboard__radar-data"
                  />
                  {/* 顶点圆点 */}
                  {radarGeom.value.points.map((p, i) => (
                    <circle
                      key={`pt-${i}`}
                      cx={p.x.toFixed(2)} cy={p.y.toFixed(2)}
                      r={4.5}
                      fill={RADAR_COLORS[RADAR_LABELS[i]]}
                      stroke="var(--bg-2)"
                      stroke-width="1.5"
                    />
                  ))}
                  {/* 标签 + 数值 */}
                  {radarGeom.value.labels.map((l, i) => (
                    <g key={`lbl-${i}`}>
                      <text
                        x={l.pos.x.toFixed(2)} y={l.pos.y.toFixed(2)}
                        text-anchor="middle" dominant-baseline="middle"
                        class="dashboard__radar-label"
                        fill={l.color}
                      >{l.label}</text>
                      <text
                        x={l.pos.x.toFixed(2)} y={(l.pos.y + 16).toFixed(2)}
                        text-anchor="middle" dominant-baseline="middle"
                        class="dashboard__radar-value"
                      >{l.value}</text>
                    </g>
                  ))}
                </svg>
              </div>
              <div class="dashboard__radar-reading">
                <div class="dashboard__radar-reading-title">五行解读</div>
                <div class="dashboard__radar-reading-text">{wuxingInterpretation.value}</div>
                <div class="dashboard__radar-reading-source">
                  {latestBazi.value
                    ? '数据来源：最近八字推演'
                    : store.profileBazi?.dayMasterWx
                      ? `数据来源：日主${store.profileBazi.dayMasterLabel}推算`
                      : '数据来源：默认均衡分布'}
                </div>
              </div>
            </div>
          </EchoCard>

          {/* === 3. 五行生克图 === */}
          <EchoCard level="secondary" title="五行生克">
            <div class="dashboard__cycle">
              <div class="dashboard__cycle-svg-wrap">
                <svg viewBox="0 0 300 300" class="dashboard__cycle-svg" role="img" aria-label="五行生克关系图">
                  {/* 相生圈（外圈弧线） */}
                  {RADAR_LABELS.map((label, i) => {
                    const next = (i + 1) % 5
                    const p1 = polarToCartesian(150, 150, 95, RADAR_ANGLES[i])
                    const p2 = polarToCartesian(150, 150, 95, RADAR_ANGLES[next])
                    return (
                      <path
                        key={`sheng-${i}`}
                        d={`M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} A 95 95 0 0 1 ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`}
                        fill="none"
                        stroke="var(--ok)"
                        stroke-width="2"
                        stroke-dasharray="4 3"
                        opacity="0.5"
                      />
                    )
                  })}
                  {/* 相克线（星形直线） */}
                  {RADAR_LABELS.map((label, i) => {
                    const target = (i + 2) % 5
                    const p1 = polarToCartesian(150, 150, 80, RADAR_ANGLES[i])
                    const p2 = polarToCartesian(150, 150, 80, RADAR_ANGLES[target])
                    return (
                      <line
                        key={`ke-${i}`}
                        x1={p1.x.toFixed(1)} y1={p1.y.toFixed(1)}
                        x2={p2.x.toFixed(1)} y2={p2.y.toFixed(1)}
                        stroke="var(--danger)"
                        stroke-width="1.5"
                        opacity="0.35"
                      />
                    )
                  })}
                  {/* 五行节点 */}
                  {RADAR_LABELS.map((label, i) => {
                    const pos = polarToCartesian(150, 150, 95, RADAR_ANGLES[i])
                    const val = wuxingData.value[label] || 0
                    const r = 22 + (val / 100) * 8
                    return (
                      <g key={`node-${i}`}>
                        <circle
                          cx={pos.x.toFixed(1)} cy={pos.y.toFixed(1)}
                          r={r}
                          fill={RADAR_COLORS[label]}
                          fill-opacity="0.15"
                          stroke={RADAR_COLORS[label]}
                          stroke-width="2"
                        />
                        <text
                          x={pos.x.toFixed(1)} y={pos.y.toFixed(1)}
                          text-anchor="middle" dominant-baseline="middle"
                          font-family="Lora, serif"
                          font-size="18"
                          font-weight="700"
                          fill={RADAR_COLORS[label]}
                        >{label}</text>
                        <text
                          x={pos.x.toFixed(1)} y={(pos.y + r + 12).toFixed(1)}
                          text-anchor="middle" dominant-baseline="middle"
                          font-family="GeistMono, monospace"
                          font-size="10"
                          fill="var(--muted)"
                        >{val}</text>
                      </g>
                    )
                  })}
                </svg>
              </div>
              <div class="dashboard__cycle-legend">
                <div class="dashboard__cycle-legend-item">
                  <span class="dashboard__cycle-legend-line dashboard__cycle-legend-line--sheng" />
                  <span class="dashboard__cycle-legend-text">相生（虚线弧）</span>
                </div>
                <div class="dashboard__cycle-legend-item">
                  <span class="dashboard__cycle-legend-line dashboard__cycle-legend-line--ke" />
                  <span class="dashboard__cycle-legend-text">相克（直线）</span>
                </div>
              </div>
            </div>
          </EchoCard>

          {/* === 4. 今日个性化建议矩阵 === */}
          <EchoCard level="secondary" title={`今日建议 · ${currentJieqi.value.name}`}>
            <div class="dashboard__advice">
              <div class="dashboard__advice-card">
                <div class="dashboard__advice-head">
                  <span class="dashboard__advice-icon">食</span>
                  <span class="dashboard__advice-title">饮食</span>
                </div>
                <div class="dashboard__advice-body">
                  <div class="dashboard__advice-yi">宜：{todayAdvice.value.diet.yi}</div>
                  <div class="dashboard__advice-ji">忌：{todayAdvice.value.diet.ji}</div>
                </div>
              </div>
              <div class="dashboard__advice-card">
                <div class="dashboard__advice-head">
                  <span class="dashboard__advice-icon">居</span>
                  <span class="dashboard__advice-title">起居</span>
                </div>
                <div class="dashboard__advice-body">{todayAdvice.value.lifestyle}</div>
              </div>
              <div class="dashboard__advice-card">
                <div class="dashboard__advice-head">
                  <span class="dashboard__advice-icon">动</span>
                  <span class="dashboard__advice-title">运动</span>
                </div>
                <div class="dashboard__advice-body">{todayAdvice.value.exercise}</div>
              </div>
              <div class="dashboard__advice-card">
                <div class="dashboard__advice-head">
                  <span class="dashboard__advice-icon">情</span>
                  <span class="dashboard__advice-title">情志</span>
                </div>
                <div class="dashboard__advice-body">{todayAdvice.value.emotion}</div>
              </div>
            </div>
            <div class="dashboard__advice-footer">
              {todayAdvice.value.wx
                ? `基于${store.profileBazi.dayMasterLabel}日主(${todayAdvice.value.wx}行) · ${currentJieqi.value.name}调摄`
                : `通用建议 · ${currentJieqi.value.name}时令`}
            </div>
          </EchoCard>

          {/* === 5. 今日宜忌条 === */}
          <EchoCard level="secondary" title="今日宜忌">
            {latestHuangli.value ? (
              <div class="dashboard__yiji">
                <div class="dashboard__yiji-date">
                  {latestHuangli.value.result?.solarDate || '老黄历'} · {latestHuangli.value.result?.lunarGanZhi || ''}
                </div>
                <div class="dashboard__yiji-row">
                  <span class="dashboard__yiji-label dashboard__yiji-label--yi">宜</span>
                  <div class="dashboard__yiji-tags">
                    {(latestHuangli.value.result?.yi || []).map((item, i) => (
                      <EchoTag key={`yi-${i}`} variant="ok">{item}</EchoTag>
                    ))}
                  </div>
                </div>
                <div class="dashboard__yiji-row">
                  <span class="dashboard__yiji-label dashboard__yiji-label--ji">忌</span>
                  <div class="dashboard__yiji-tags">
                    {(latestHuangli.value.result?.ji || []).map((item, i) => (
                      <EchoTag key={`ji-${i}`} variant="danger">{item}</EchoTag>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div class="dashboard__yiji-empty">
                <span class="dashboard__yiji-empty-text">今日尚未查看老黄历</span>
                <EchoButton variant="ghost" size="sm" onClick={goToHuangli}>去查看 →</EchoButton>
              </div>
            )}
          </EchoCard>

          {/* === 5. 推演历史时间线 === */}
          <EchoCard level="secondary" title="推演轨迹">
            {recentHistory.value.length > 0 ? (
              <>
                <div class="dashboard__timeline">
                  {recentHistory.value.map((h, i) => (
                    <div key={h.id} class="dashboard__timeline-item">
                      <div class="dashboard__timeline-marker">
                        <div class="dashboard__timeline-dot" />
                        {i < recentHistory.value.length - 1 && (
                          <div class="dashboard__timeline-line" />
                        )}
                      </div>
                      <div class="dashboard__timeline-content">
                        <div class="dashboard__timeline-head">
                          <span class="dashboard__timeline-tool">{h.toolName || h.toolKey}</span>
                          <div class="dashboard__timeline-head-right">
                            <span class="dashboard__timeline-time">{relativeTime(h.createdAt)}</span>
                            <button
                              type="button"
                              class="dashboard__timeline-del"
                              onClick={() => removeHistoryItem(h.id)}
                              title="删除"
                              aria-label="删除该记录"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                        {h.summary && (
                          <div class="dashboard__timeline-summary">{h.summary}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div class="dashboard__timeline-clear">
                  <EchoButton variant="danger" size="sm" block onClick={clearAllHistory}>
                    清空全部历史
                  </EchoButton>
                </div>
              </>
            ) : (
              <div class="dashboard__timeline-empty">
                <span class="dashboard__timeline-empty-text">还没有推演记录</span>
                <EchoButton variant="ghost" size="sm" onClick={goToTools}>发起第一次推演 →</EchoButton>
              </div>
            )}
          </EchoCard>

          {/* === 6. 大运流年时间轴 === */}
          {store.profileBazi && (
            <EchoCard level="secondary" title="大运流年">
              <Timeline bazi={store.profileBazi} type="dayun" />
              <div style={{ marginTop: 'var(--sp-3)' }}>
                <Timeline bazi={store.profileBazi} type="liunian" />
              </div>
            </EchoCard>
          )}

          {/* === 7. 工具使用统计 === */}
          <EchoCard level="secondary" title="工具使用">
            {toolStats.value.length > 0 ? (
              <div class="dashboard__toolstats">
                {toolStats.value.map((t, idx) => (
                  <div key={t.key} class="dashboard__toolstats-row">
                    <span class="dashboard__toolstats-rank">{idx + 1}</span>
                    <span class="dashboard__toolstats-name">{t.name}</span>
                    <div class="dashboard__toolstats-bar">
                      <EchoProgress
                        value={(t.count / maxToolCount.value) * 100}
                        variant={idx === 0 ? 'gold' : 'accent'}
                      />
                    </div>
                    <span class="dashboard__toolstats-count">{t.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div class="dashboard__toolstats-empty">暂无使用记录</div>
            )}
          </EchoCard>
        </div>
      </div>
    )
  }
})
