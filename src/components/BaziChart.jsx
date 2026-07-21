/**
 * BaziChart — 八字四柱 SVG 图表组件
 *
 * 以竖排四柱形式展示八字命盘，含天干/地支/五行/十神/纳音，
 * 并标注当前大运与流年。
 *
 * Props:
 *  - bazi: Object  computeProfileBazi() 或 bazi 引擎 calc() 的返回值
 *  - compact: Boolean  紧凑模式（隐藏纳音与十神行）
 */
import { defineComponent, computed } from 'vue'
import { TIAN_GAN, DI_ZHI, GAN_WX, ZHI_WX } from '@/utils/engines.js'

const WX_COLORS = {
  '木': '#5a9e5a',
  '火': '#d45a5a',
  '土': '#a8825a',
  '金': '#d4a843',
  '水': '#5a8db5'
}

export const BaziChart = defineComponent({
  name: 'BaziChart',
  props: {
    bazi: { type: Object, required: true },
    compact: { type: Boolean, default: false }
  },
  setup(props) {
    const pillars = computed(() => props.bazi?.pillars || [])
    const dayMaster = computed(() => props.bazi?.dayMaster || '')
    const dayMasterWx = computed(() => props.bazi?.dayMasterWx || '')
    const dayMasterStrength = computed(() => props.bazi?.dayMasterStrength || '')
    const favorable = computed(() => props.bazi?.favorable || [])
    const currentDayun = computed(() => props.bazi?.currentDayun || null)
    const currentLiunian = computed(() => props.bazi?.currentLiunian || null)
    const nayin = computed(() => props.bazi?.nayin || '')
    const wuxing = computed(() => props.bazi?.wuxing || {})
    const strongest = computed(() => props.bazi?.strongest || '')
    const weakest = computed(() => props.bazi?.weakest || '')

    const ganWxOf = (gan) => GAN_WX[TIAN_GAN.indexOf(gan)] || ''
    const zhiWxOf = (zhi) => ZHI_WX[DI_ZHI.indexOf(zhi)] || ''
    const wxColor = (wx) => WX_COLORS[wx] || 'var(--muted)'

    // 五行条数据
    const wuxingBars = computed(() => {
      const total = Object.values(wuxing.value).reduce((a, b) => a + b, 0) || 8
      return Object.entries(wuxing.value).map(([wx, count]) => ({
        wx,
        count,
        pct: Math.round((count / total) * 100)
      }))
    })

    return () => {
      if (!pillars.value.length) return null
      return (
        <div class="bazi-chart">
          {/* 四柱竖排 */}
          <div class="bazi-chart__pillars">
            {pillars.value.map((p, i) => {
              const isDay = i === 2
              const ganWx = ganWxOf(p.gan)
              const zhiWx = zhiWxOf(p.zhi)
              return (
                <div class={`bazi-chart__pillar ${isDay ? 'bazi-chart__pillar--day' : ''}`}>
                  <div class="bazi-chart__pillar-label">{p.name}</div>
                  {!props.compact && (
                    <div class="bazi-chart__pillar-god">{isDay ? '日主' : p.tenGod}</div>
                  )}
                  <div class="bazi-chart__pillar-gan" style={{ color: wxColor(ganWx) }}>
                    {p.gan}
                  </div>
                  <div class="bazi-chart__pillar-gan-wx">{ganWx}</div>
                  <div class="bazi-chart__pillar-zhi" style={{ color: wxColor(zhiWx) }}>
                    {p.zhi}
                  </div>
                  <div class="bazi-chart__pillar-zhi-wx">{zhiWx}</div>
                  {!props.compact && (
                    <div class="bazi-chart__pillar-nayin">{p.nayin}</div>
                  )}
                </div>
              )
            })}
          </div>

          {/* 日主信息 */}
          <div class="bazi-chart__daymaster">
            <span class="bazi-chart__dm-label">日主</span>
            <span class="bazi-chart__dm-val" style={{ color: wxColor(dayMasterWx.value) }}>
              {dayMaster.value}{dayMasterWx.value}
            </span>
            <span class={`bazi-chart__dm-str ${dayMasterStrength.value === '强' ? 'bazi-chart__dm-str--strong' : 'bazi-chart__dm-str--weak'}`}>
              {dayMasterStrength.value}
            </span>
            <span class="bazi-chart__dm-fav">喜用：{favorable.value.join('')}</span>
            {!props.compact && nayin.value && (
              <span class="bazi-chart__dm-nayin">纳音 {nayin.value}</span>
            )}
          </div>

          {/* 五行分布条 */}
          {!props.compact && (
            <div class="bazi-chart__wuxing">
              <div class="bazi-chart__wx-title">
                五行分布 · 最旺{strongest.value} · 最弱{weakest.value}
              </div>
              <div class="bazi-chart__wx-bars">
                {wuxingBars.value.map(b => (
                  <div class="bazi-chart__wx-bar">
                    <span class="bazi-chart__wx-label" style={{ color: wxColor(b.wx) }}>{b.wx}</span>
                    <div class="bazi-chart__wx-track">
                      <div
                        class="bazi-chart__wx-fill"
                        style={{ width: `${b.pct}%`, background: wxColor(b.wx) }}
                      />
                    </div>
                    <span class="bazi-chart__wx-count">{b.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 当前大运 + 流年 */}
          {currentDayun.value && (
            <div class="bazi-chart__current">
              <div class="bazi-chart__current-row">
                <span class="bazi-chart__current-label">当前大运</span>
                <span class="bazi-chart__current-val">{currentDayun.value.name}</span>
                <span class="bazi-chart__current-age">
                  {currentDayun.value.startAge}-{currentDayun.value.endAge}岁
                </span>
                <span class="bazi-chart__current-god">{currentDayun.value.tenGod}</span>
              </div>
              {currentLiunian.value && (
                <div class="bazi-chart__current-row">
                  <span class="bazi-chart__current-label">今年流年</span>
                  <span class="bazi-chart__current-val">{currentLiunian.value.ganzhi}</span>
                  <span class="bazi-chart__current-god">{currentLiunian.value.tenGod}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )
    }
  }
})

export default BaziChart
