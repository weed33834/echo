/**
 * Timeline — 大运 / 流年时间轴组件
 *
 * Props:
 *  - bazi: Object  computeProfileBazi() 返回值
 *      含 dayuns[{name,startAge,endAge,wx,tenGod}] / currentDayun
 *          liunians[{ganzhi,tenGod,year}] / currentLiunian
 *  - type: String  'dayun' | 'liunian'，默认 'dayun'
 *
 * 大运：纵向时间轴，高亮当前大运（金色 + 「当前」徽标），每项含圆点与连接线
 * 流年：横向滚动列表，高亮当年，过去一年 + 当年 + 未来五年
 */
import { defineComponent, computed } from 'vue'
import { TIAN_GAN, DI_ZHI, GAN_WX, ZHI_WX } from '@/utils/engines.js'

// 五行配色（与 BaziChart 保持一致）
const WX_COLORS = {
  '木': '#5a9e5a',
  '火': '#d45a5a',
  '土': '#a8825a',
  '金': '#d4a843',
  '水': '#5a8db5'
}

// 「当前」徽标内联样式（金色，沿用设计令牌）
const CURRENT_BADGE_STYLE = {
  fontSize: '10px',
  lineHeight: '1.4',
  padding: '1px 6px',
  borderRadius: 'var(--r-xs)',
  background: 'var(--gold-soft)',
  color: 'var(--gold)',
  fontWeight: 600,
  whiteSpace: 'nowrap'
}

export const Timeline = defineComponent({
  name: 'Timeline',
  props: {
    bazi: { type: Object, required: true },
    type: { type: String, default: 'dayun' } // 'dayun' | 'liunian'
  },
  setup(props) {
    const isDayun = computed(() => props.type !== 'liunian')

    const dayuns = computed(() => props.bazi?.dayuns || [])
    const currentDayun = computed(() => props.bazi?.currentDayun || null)
    const liunians = computed(() => props.bazi?.liunians || [])
    const currentLiunian = computed(() => props.bazi?.currentLiunian || null)

    // 从干支反推五行（流年引擎未直接返回 wx，需自行推导：天干五行 + 地支五行）
    const wxOfGanzhi = (gz) => {
      if (!gz || gz.length < 2) return ''
      const gIdx = TIAN_GAN.indexOf(gz[0])
      const zIdx = DI_ZHI.indexOf(gz[1])
      return (GAN_WX[gIdx] || '') + (ZHI_WX[zIdx] || '')
    }

    // 取首字五行配色
    const wxColor = (wx) => (wx && WX_COLORS[wx[0]]) || 'var(--muted)'

    return () => {
      if (!props.bazi) return null

      // ===== 大运：纵向时间轴 =====
      if (isDayun.value) {
        return (
          <div class="timeline">
            {dayuns.value.map((d) => {
              const isCurrent = !!currentDayun.value &&
                currentDayun.value.startAge === d.startAge
              return (
                <div key={d.startAge} class={['timeline__item', { 'timeline__item--current': isCurrent }]}>
                  <div class="timeline__marker">
                    <div class="timeline__dot" />
                    <div class="timeline__line" />
                  </div>
                  <div class="timeline__content">
                    <div class="timeline__head">
                      <span class="timeline__age">{d.startAge}-{d.endAge}岁</span>
                      <span class="timeline__name">{d.name}</span>
                      {d.tenGod && <span class="timeline__god">{d.tenGod}</span>}
                      {isCurrent && <span style={CURRENT_BADGE_STYLE}>当前</span>}
                    </div>
                    {d.wx && (
                      <div class="timeline__wx" style={{ color: wxColor(d.wx) }}>
                        {d.wx[0]}·{d.wx[1] || ''}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      }

      // ===== 流年：横向滚动列表 =====
      const list = liunians.value
      return (
        <div
          class="timeline"
          style={{
            display: 'flex',
            flexDirection: 'row',
            overflowX: 'auto',
            gap: '0',
            paddingBottom: 'var(--sp-2)',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {list.map((l, idx) => {
            const isCurrent = !!currentLiunian.value &&
              currentLiunian.value.year === l.year
            const wx = wxOfGanzhi(l.ganzhi)
            return (
              <div
                key={idx}
                class={['timeline__item', { 'timeline__item--current': isCurrent }]}
                style={{
                  flex: '0 0 auto',
                  width: '90px',
                  flexDirection: 'column',
                  gap: 'var(--sp-2)',
                  paddingBottom: 0
                }}
              >
                <div
                  class="timeline__marker"
                  style={{ width: 'auto', flexDirection: 'row', alignItems: 'center' }}
                >
                  <div class="timeline__dot" />
                  {idx < list.length - 1 && (
                    <div
                      class="timeline__line"
                      style={{ width: 'auto', flex: 1, height: '2px', minWidth: '12px', marginTop: 0 }}
                    />
                  )}
                </div>
                <div class="timeline__content" style={{ textAlign: 'center', paddingBottom: 0 }}>
                  <div class="timeline__age" style={{ display: 'block', marginBottom: '2px' }}>
                    {l.year}
                  </div>
                  <div class="timeline__name">{l.ganzhi}</div>
                  <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '4px', margin: '4px 0' }}>
                    {l.tenGod && <span class="timeline__god">{l.tenGod}</span>}
                    {isCurrent && <span style={CURRENT_BADGE_STYLE}>当前</span>}
                  </div>
                  {wx && (
                    <div class="timeline__wx" style={{ color: wxColor(wx) }}>
                      {wx[0]}·{wx[1] || ''}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )
    }
  }
})

export default Timeline
