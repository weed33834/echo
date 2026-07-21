import { defineComponent, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useEchoStore, TOOLS } from '@/stores/echo.js'
import { TopBar } from '@/components/TabBar.jsx'
import { EchoCard, EchoBadge, EchoTag, EchoProgress, EchoModal } from '@/components/EchoUI.jsx'
import '@/designs/graph.css'

/* === 五行建议数据（与 Dashboard 的 WUXING_ADVICE 一致） === */
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

/* === 图谱几何常量 === */
const CENTER = { x: 200, y: 200 }
const WUXING_RADIUS = 80
const TOOL_RADIUS = 140
const CENTER_R = 30

// 五行排列（五边形，从顶部起每 72°）：金(顶) 木(右上) 水(右下) 火(左下) 土(左上)
const WUXING_LABELS = ['金', '木', '水', '火', '土']
const WUXING_ANGLES = [-90, -18, 54, 126, 198]
const WUXING_TOKENS = {
  金: 'var(--wuxing-metal)',
  木: 'var(--wuxing-wood)',
  水: 'var(--wuxing-water)',
  火: 'var(--wuxing-fire)',
  土: 'var(--wuxing-earth)'
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
  if (idx < 0) return { 金: 50, 木: 50, 水: 50, 火: 50, 土: 50 }
  const dist = {}
  dist[gen[idx]] = 70                    // 自身（比劫）
  dist[gen[(idx + 4) % 5]] = 55          // 生我（印）
  dist[gen[(idx + 1) % 5]] = 45          // 我生（食伤）
  dist[gen[(idx + 2) % 5]] = 40          // 我克（财）
  dist[gen[(idx + 3) % 5]] = 35          // 克我（官杀）
  return dist
}

/* 五行强弱文字 */
const wuxingStrength = (val) => {
  if (val >= 60) return '旺'
  if (val >= 45) return '平'
  return '弱'
}

export default defineComponent({
  name: 'Graph',
  setup() {
    const router = useRouter()
    const store = useEchoStore()

    /* 选中的五行节点（弹窗） */
    const selectedWuxing = ref(null)

    /* 用户名与日主 */
    const userName = computed(() => store.profile?.name || '探索者')
    const dayMasterLabel = computed(() => store.profile?.dayMaster?.label || '')

    /* 最近一次八字推演记录 */
    const latestBazi = computed(() =>
      store.history.find(h => h.toolKey === 'bazi')
    )

    /* 五行分布数据（0-100） */
    const wuxingData = computed(() => {
      const empty = { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 }
      // 1. 优先从八字推演记录提取
      if (latestBazi.value?.result?.wuxing) {
        const wx = latestBazi.value.result.wuxing
        const total = 8 // 四柱 × 干支 = 8 字
        const dist = {}
        Object.keys(empty).forEach(k => {
          dist[k] = Math.round(((wx[k] || 0) / total) * 100)
        })
        return dist
      }
      // 2. 其次从 profile.dayMaster 推算默认分布
      if (store.profile?.dayMaster?.wx) {
        return buildDefaultWuxing(store.profile.dayMaster.wx)
      }
      // 3. 兜底：均衡分布
      return { 金: 50, 木: 50, 水: 50, 火: 50, 土: 50 }
    })

    /* 五行数据来源说明 */
    const wuxingSource = computed(() => {
      if (latestBazi.value) return '最近八字推演'
      if (store.profile?.dayMaster) return `日主${store.profile.dayMaster.label}推算`
      return '默认均衡分布'
    })

    /* 五行节点（位置 + 大小 + 颜色 + 建议） */
    const wuxingNodes = computed(() =>
      WUXING_LABELS.map((label, i) => {
        const val = Math.max(0, Math.min(100, wuxingData.value[label] || 0))
        // 节点半径根据五行强度缩放：14 ~ 24
        const r = 14 + (val / 100) * 10
        const pos = polarToCartesian(CENTER.x, CENTER.y, WUXING_RADIUS, WUXING_ANGLES[i])
        return {
          label,
          value: val,
          r,
          pos,
          color: WUXING_TOKENS[label],
          advice: WUXING_ADVICE[label],
          strength: wuxingStrength(val)
        }
      })
    )

    /* 工具使用统计（按次数降序，取前 6） */
    const toolNodes = computed(() => {
      const stats = store.historyStats
      const toolMap = {}
      TOOLS.forEach(t => { toolMap[t.key] = t })
      const arr = Object.entries(stats)
        .map(([key, count]) => ({ tool: toolMap[key], key, count }))
        .filter(t => t.tool)
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)
      const n = arr.length
      if (n === 0) return []
      return arr.map((t, i) => {
        // 均匀分布外环，从顶部起
        const angle = -90 + (360 / n) * i
        const pos = polarToCartesian(CENTER.x, CENTER.y, TOOL_RADIUS, angle)
        return {
          key: t.key,
          glyph: t.tool.glyph,
          name: t.tool.name,
          count: t.count,
          pos
        }
      })
    })

    const maxToolCount = computed(() =>
      Math.max(1, ...toolNodes.value.map(t => t.count))
    )

    /* 工具连接线粗细（1 ~ 5）与透明度（0.3 ~ 0.75） */
    const toolLineWidth = (count) =>
      1 + (count / maxToolCount.value) * 4
    const toolLineOpacity = (count) =>
      0.3 + (count / maxToolCount.value) * 0.45

    /* 印证统计 */
    const totalAssumptions = computed(() => store.assumptions.length)
    const reviewedCount = computed(() => store.assumptions.filter(a => a.reviewed).length)
    const accurateCount = computed(() => store.minge.accurateCount)

    /* 点击五行节点 */
    const onWuxingClick = (node) => {
      selectedWuxing.value = node
    }

    /* 点击工具节点 */
    const onToolClick = (node) => {
      router.push(`/tools/${node.key}`)
    }

    /* 键盘交互 */
    const onNodeKeydown = (e, handler) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handler()
      }
    }

    /* 截断长名 */
    const truncate = (str, max) => {
      if (!str) return ''
      return str.length > max ? str.slice(0, max) + '…' : str
    }

    return () => (
      <div class="graph-page">
        <TopBar title="命运图谱" subtitle="Destiny Map" back />
        <div class="container">
          {/* === 图谱主体 === */}
          <EchoCard level="primary" title="命运图谱">
            <div class="graph-page__graph">
              <div class="graph-page__svg-wrap">
                <svg
                  viewBox="0 0 400 400"
                  class="graph-page__svg"
                  role="img"
                  aria-label="命运关系网络图谱"
                >
                  {/* --- 连接线（先绘制，位于节点下方） --- */}
                  {/* 五行连接线（虚线） */}
                  {wuxingNodes.value.map((n, i) => (
                    <line
                      key={`wx-line-${n.label}`}
                      x1={CENTER.x}
                      y1={CENTER.y}
                      x2={n.pos.x.toFixed(2)}
                      y2={n.pos.y.toFixed(2)}
                      class="graph-page__link graph-page__link--wuxing"
                      style={{ '--i': i }}
                    />
                  ))}
                  {/* 工具连接线（粗细=使用次数） */}
                  {toolNodes.value.map((n, i) => (
                    <line
                      key={`tool-line-${n.key}`}
                      x1={CENTER.x}
                      y1={CENTER.y}
                      x2={n.pos.x.toFixed(2)}
                      y2={n.pos.y.toFixed(2)}
                      class="graph-page__link graph-page__link--tool"
                      stroke-width={toolLineWidth(n.count).toFixed(1)}
                      stroke-opacity={toolLineOpacity(n.count).toFixed(2)}
                      style={{ '--i': 6 + i }}
                    />
                  ))}

                  {/* --- 工具节点（外环） --- */}
                  {toolNodes.value.map((n, i) => (
                    <g
                      key={`tool-${n.key}`}
                      class="graph-page__node graph-page__node--enter graph-page__node--interactive graph-page__tool-node"
                      style={{ '--i': 6 + i, color: 'var(--accent)' }}
                      role="button"
                      tabindex="0"
                      aria-label={`${n.name}，使用 ${n.count} 次`}
                      onClick={() => onToolClick(n)}
                      onKeydown={(e) => onNodeKeydown(e, () => onToolClick(n))}
                    >
                      {/* 透明命中区 */}
                      <circle
                        cx={n.pos.x.toFixed(2)}
                        cy={n.pos.y.toFixed(2)}
                        r={24}
                        class="graph-page__node-hit"
                      />
                      {/* 辉光圈 */}
                      <circle
                        cx={n.pos.x.toFixed(2)}
                        cy={n.pos.y.toFixed(2)}
                        r={20}
                        class="graph-page__node-glow"
                      />
                      {/* 主圆 */}
                      <circle
                        cx={n.pos.x.toFixed(2)}
                        cy={n.pos.y.toFixed(2)}
                        r={16}
                        class="graph-page__node-circle graph-page__tool-circle"
                      />
                      {/* 工具字 */}
                      <text
                        x={n.pos.x.toFixed(2)}
                        y={n.pos.y.toFixed(2)}
                        class="graph-page__node-label graph-page__tool-glyph"
                      >{n.glyph}</text>
                      {/* 使用次数 */}
                      <text
                        x={n.pos.x.toFixed(2)}
                        y={(n.pos.y + 28).toFixed(2)}
                        class="graph-page__tool-count"
                      >{n.count}</text>
                    </g>
                  ))}

                  {/* --- 五行节点（中环，五边形） --- */}
                  {wuxingNodes.value.map((n, i) => (
                    <g
                      key={`wx-${n.label}`}
                      class="graph-page__node graph-page__node--enter graph-page__node--interactive graph-page__wuxing-node"
                      style={{ '--i': 1 + i, color: n.color }}
                      role="button"
                      tabindex="0"
                      aria-label={`${n.label}行，强度 ${n.value}，点击查看调摄建议`}
                      onClick={() => onWuxingClick(n)}
                      onKeydown={(e) => onNodeKeydown(e, () => onWuxingClick(n))}
                    >
                      {/* 透明命中区 */}
                      <circle
                        cx={n.pos.x.toFixed(2)}
                        cy={n.pos.y.toFixed(2)}
                        r={28}
                        class="graph-page__node-hit"
                      />
                      {/* 辉光圈 */}
                      <circle
                        cx={n.pos.x.toFixed(2)}
                        cy={n.pos.y.toFixed(2)}
                        r={n.r + 8}
                        class="graph-page__node-glow"
                      />
                      {/* 主圆 */}
                      <circle
                        cx={n.pos.x.toFixed(2)}
                        cy={n.pos.y.toFixed(2)}
                        r={n.r}
                        class="graph-page__node-circle graph-page__wuxing-circle"
                        fill={n.color}
                      />
                      {/* 五行字 */}
                      <text
                        x={n.pos.x.toFixed(2)}
                        y={n.pos.y.toFixed(2)}
                        class="graph-page__node-label graph-page__wuxing-label"
                      >{n.label}</text>
                      {/* 强度数值（节点下方） */}
                      <text
                        x={n.pos.x.toFixed(2)}
                        y={(n.pos.y + n.r + 12).toFixed(2)}
                        class="graph-page__wuxing-value"
                      >{n.value}</text>
                    </g>
                  ))}

                  {/* --- 中心节点（用户） --- */}
                  <g
                    class="graph-page__node graph-page__node--enter graph-page__center"
                    style={{ '--i': 0, color: 'var(--accent)' }}
                  >
                    {/* 主圆 */}
                    <circle
                      cx={CENTER.x}
                      cy={CENTER.y}
                      r={CENTER_R}
                      class="graph-page__center-circle"
                    />
                    {/* 用户名 */}
                    <text
                      x={CENTER.x}
                      y={dayMasterLabel.value ? CENTER.y - 5 : CENTER.y}
                      class="graph-page__center-name"
                    >{truncate(userName.value, 4)}</text>
                    {/* 日主 */}
                    {dayMasterLabel.value && (
                      <text
                        x={CENTER.x}
                        y={CENTER.y + 10}
                        class="graph-page__center-dm"
                      >{dayMasterLabel.value}</text>
                    )}
                  </g>
                </svg>
              </div>

              {/* 无工具数据提示 */}
              {toolNodes.value.length === 0 && (
                <div class="graph-page__hint">
                  使用占卜工具后，工具节点将出现在外环 · 当前仅显示五行图谱
                </div>
              )}
              <div class="graph-page__hint">
                五行来源：{wuxingSource.value} · 点击节点查看详情
              </div>
            </div>
          </EchoCard>

          {/* === 印证统计 + 命格（信息卡区） === */}
          <div class="graph-page__info-grid">
            {/* 印证统计卡 */}
            <EchoCard level="secondary" title="印证图谱">
              <div class="graph-page__stats-cluster">
                <div class="graph-page__stat">
                  <div class="graph-page__stat-num">{totalAssumptions.value}</div>
                  <div class="graph-page__stat-lbl">总预测</div>
                </div>
                <div class="graph-page__stat graph-page__stat--gold">
                  <div class="graph-page__stat-num">{reviewedCount.value}</div>
                  <div class="graph-page__stat-lbl">已印证</div>
                </div>
                <div class="graph-page__stat graph-page__stat--ok">
                  <div class="graph-page__stat-num">{accurateCount.value}</div>
                  <div class="graph-page__stat-lbl">应验</div>
                </div>
              </div>
            </EchoCard>

            {/* 命格卡 */}
            <EchoCard level="secondary" title="命格图谱">
              <div class="graph-page__level-card">
                <div class="graph-page__level-head">
                  <div class="graph-page__level-title-wrap">
                    <EchoBadge variant="gold">Lv.{store.minge.level}</EchoBadge>
                    <span class="graph-page__level-title">{store.mingeLevelTitle}</span>
                  </div>
                  <EchoTag variant="muted">{store.accuracyRate}%</EchoTag>
                </div>
                <EchoProgress value={store.levelProgress} variant="gold" />
                <div class="graph-page__level-meta">
                  <span>距下一级</span>
                  <span class="graph-page__level-meta-val">{store.nextLevelExp} EXP</span>
                </div>
              </div>
            </EchoCard>
          </div>

          {/* === 图例 === */}
          <EchoCard level="tertiary">
            <div class="graph-page__legend">
              <div class="graph-page__legend-row">
                <span class="graph-page__legend-dot graph-page__legend-dot--center" />
                <span>中心：你的命格档案（{truncate(userName.value, 6)}）</span>
              </div>
              <div class="graph-page__legend-row">
                <span class="graph-page__legend-dot graph-page__legend-dot--tool" />
                <span>外环：常用工具（连线越粗 = 使用越多）</span>
              </div>
              <div class="graph-page__legend-wuxing">
                <div class="graph-page__legend-row">
                  <span class="graph-page__legend-dot graph-page__legend-dot--metal" />
                  <span>金</span>
                </div>
                <div class="graph-page__legend-row">
                  <span class="graph-page__legend-dot graph-page__legend-dot--wood" />
                  <span>木</span>
                </div>
                <div class="graph-page__legend-row">
                  <span class="graph-page__legend-dot graph-page__legend-dot--water" />
                  <span>水</span>
                </div>
                <div class="graph-page__legend-row">
                  <span class="graph-page__legend-dot graph-page__legend-dot--fire" />
                  <span>火</span>
                </div>
                <div class="graph-page__legend-row">
                  <span class="graph-page__legend-dot graph-page__legend-dot--earth" />
                  <span>土</span>
                </div>
              </div>
            </div>
          </EchoCard>
        </div>

        {/* === 五行建议弹窗 === */}
        <EchoModal
          modelValue={!!selectedWuxing.value}
          onUpdate:modelValue={(v) => { if (!v) selectedWuxing.value = null }}
          title={selectedWuxing.value ? `${selectedWuxing.value.label}行 · 调摄建议` : ''}
          vSlots={{
            default: () => selectedWuxing.value ? (
              <div class="graph-page__advice">
                {/* 五行头部 */}
                <div class="graph-page__advice-header">
                  <div
                    class="graph-page__advice-glyph"
                    style={{ background: selectedWuxing.value.color }}
                  >{selectedWuxing.value.label}</div>
                  <div class="graph-page__advice-info">
                    <div class="graph-page__advice-name">{selectedWuxing.value.label}行 · {selectedWuxing.value.strength}</div>
                    <div class="graph-page__advice-strength">
                      强度 {selectedWuxing.value.value}/100 · {selectedWuxing.value.strength}势
                    </div>
                  </div>
                </div>

                {/* 饮食 */}
                <div class="graph-page__advice-section">
                  <div class="graph-page__advice-icon">食</div>
                  <div class="graph-page__advice-body">
                    <div class="graph-page__advice-yi">宜：{selectedWuxing.value.advice.diet.yi}</div>
                    <div class="graph-page__advice-ji">忌：{selectedWuxing.value.advice.diet.ji}</div>
                  </div>
                </div>

                {/* 起居 */}
                <div class="graph-page__advice-section">
                  <div class="graph-page__advice-icon">居</div>
                  <div class="graph-page__advice-body">{selectedWuxing.value.advice.lifestyle}</div>
                </div>

                {/* 运动 */}
                <div class="graph-page__advice-section">
                  <div class="graph-page__advice-icon">动</div>
                  <div class="graph-page__advice-body">{selectedWuxing.value.advice.exercise}</div>
                </div>

                {/* 情志 */}
                <div class="graph-page__advice-section">
                  <div class="graph-page__advice-icon">情</div>
                  <div class="graph-page__advice-body">{selectedWuxing.value.advice.emotion}</div>
                </div>
              </div>
            ) : null
          }}
        />
      </div>
    )
  }
})
