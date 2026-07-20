import { defineComponent, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useEchoStore } from '@/stores/echo.js'
import { TopBar } from '@/components/TabBar.jsx'
import { EchoCard, EchoButton, EchoBadge, EchoProgress, EchoTag, showToast } from '@/components/EchoUI.jsx'

export default defineComponent({
  name: 'Daily',
  setup() {
    const store = useEchoStore()
    const router = useRouter()

    const today = new Date()
    const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    const weekday = weekdays[today.getDay()]

    // 简化日运计算
    const scores = computed(() => {
      const seed = today.getDate() + today.getMonth() * 31
      const r = (n) => ((seed * (n + 1) * 9301 + 49297) % 233280) / 233280
      return {
        career: Math.round(40 + r(1) * 60),
        love: Math.round(40 + r(2) * 60),
        wealth: Math.round(40 + r(3) * 60),
        health: Math.round(40 + r(4) * 60)
      }
    })

    const yi = computed(() => {
      const all = ['决断', '签约', '会友', '静思', '出行', '学习', '祈福', '收束']
      const seed = today.getDate()
      return [all[seed % 8], all[(seed + 3) % 8], all[(seed + 5) % 8]]
    })
    const ji = computed(() => {
      const all = ['动怒', '急躁', '远行', '熬夜', '争执', '破财', '冲动', '拖延']
      const seed = today.getDate() + 7
      return [all[seed % 8], all[(seed + 2) % 8]]
    })

    const scoreList = computed(() => [
      { key: 'career', label: '事业', value: scores.value.career },
      { key: 'love', label: '感情', value: scores.value.love },
      { key: 'wealth', label: '财运', value: scores.value.wealth },
      { key: 'health', label: '健康', value: scores.value.health }
    ])

    const createDailyAssume = () => {
      store.createAssumption({
        title: `${dateStr} 今日运程`,
        desc: `宜${yi.value.join('·')}，验证今日是否应验`,
        tool: '每日运势',
        days: 1
      })
      showToast('已设节点，明日回看今日应验几分', 'success', 2000)
      setTimeout(() => router.push('/echo'), 1000)
    }

    return () => (
      <div class="daily-page">
        <TopBar title="每日渡" back />
        <div class="container">
          {/* 日期 */}
          <EchoCard level="tertiary">
            <div class="daily-page__date">
              <span class="daily-page__date-main">{dateStr}</span>
              <EchoTag variant="gold">星期{weekday}</EchoTag>
            </div>
          </EchoCard>

          {/* 四维评分 */}
          <EchoCard level="primary" title="今日运程">
            <div class="daily-page__scores">
              {scoreList.value.map(s => (
                <div class="daily-page__score">
                  <div class="daily-page__score-head">
                    <span class="daily-page__score-label">{s.label}</span>
                    <span class="daily-page__score-val">{s.value}</span>
                  </div>
                  <EchoProgress
                    value={s.value}
                    variant={s.value >= 70 ? 'gold' : s.value >= 50 ? 'accent' : 'accent'}
                  />
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
                  {yi.value.map(y => <EchoBadge variant="ok">{y}</EchoBadge>)}
                </div>
              </div>
            </EchoCard>
            <EchoCard level="secondary">
              <div class="daily-page__ji">
                <div class="daily-page__ji-label">忌</div>
                <div class="daily-page__ji-list">
                  {ji.value.map(j => <EchoBadge variant="danger">{j}</EchoBadge>)}
                </div>
              </div>
            </EchoCard>
          </div>

          {/* Echo 钩子 */}
          <EchoCard level="tertiary">
            <div class="daily-page__assume">
              <div class="daily-page__assume-title">今日运程准吗？</div>
              <p class="daily-page__assume-text">设个节点，明日此时回看今日应验几分。</p>
              <EchoButton variant="gold" size="sm" onClick={createDailyAssume}>设节点追踪</EchoButton>
            </div>
          </EchoCard>
        </div>
      </div>
    )
  }
})
