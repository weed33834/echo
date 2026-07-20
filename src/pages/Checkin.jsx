import { defineComponent, ref, computed } from 'vue'
import { useEchoStore } from '@/stores/echo.js'
import { TopBar } from '@/components/TabBar.jsx'
import { EchoCard, EchoButton, EchoBadge, showToast } from '@/components/EchoUI.jsx'

const MILESTONES = [
  { days: 7, name: '七日一复' },
  { days: 30, name: '月圆玄明' },
  { days: 100, name: '百日筑基' },
  { days: 365, name: '周天运转' }
]

export default defineComponent({
  name: 'Checkin',
  setup() {
    const store = useEchoStore()
    const today = new Date().toISOString().slice(0, 10)
    const checkedToday = computed(() => store.checkin.lastDate === today)

    // 当月签到日历
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDay = new Date(year, month, 1).getDay()
    const calendarDays = computed(() => {
      const arr = []
      for (let i = 0; i < firstDay; i++) arr.push(null)
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        arr.push({ day: d, checked: store.checkin.dates.includes(dateStr), isToday: dateStr === today })
      }
      return arr
    })

    const doCheckin = () => {
      const r = store.doCheckin()
      showToast(r.message, r.ok ? 'success' : 'warn', 2000)
    }

    const nextMilestone = computed(() => {
      return MILESTONES.find(m => m.days > store.checkin.streak) || MILESTONES[MILESTONES.length - 1]
    })

    return () => (
      <div class="checkin-page">
        <TopBar title="每日签到" back />
        <div class="container">
          {/* 签到卡 */}
          <EchoCard level="primary">
            <div class="checkin-page__main">
              <div class="checkin-page__streak">
                <div class="checkin-page__streak-num">{store.checkin.streak}</div>
                <div class="checkin-page__streak-lbl">连续签到天数</div>
              </div>
              <EchoButton
                variant={checkedToday.value ? 'secondary' : 'primary'}
                size="lg"
                disabled={checkedToday.value}
                onClick={doCheckin}
              >
                {checkedToday.value ? '今日已签' : '立即签到'}
              </EchoButton>
              <div class="checkin-page__next">
                下一里程碑：{nextMilestone.value.name}（{nextMilestone.value.days} 天）
              </div>
            </div>
          </EchoCard>

          {/* 里程碑 */}
          <div class="checkin-page__milestones">
            {MILESTONES.map(m => {
              const reached = store.checkin.streak >= m.days
              return (
                <div class={`checkin-page__milestone ${reached ? 'checkin-page__milestone--reached' : ''}`}>
                  <div class="checkin-page__milestone-days">{m.days}</div>
                  <div class="checkin-page__milestone-name">{m.name}</div>
                  {reached && <EchoBadge variant="ok">已达成</EchoBadge>}
                </div>
              )
            })}
          </div>

          {/* 日历 */}
          <EchoCard level="secondary" title="本月签到">
            <div class="checkin-page__calendar">
              {['日', '一', '二', '三', '四', '五', '六'].map(w => (
                <div class="checkin-page__calendar-weekday">{w}</div>
              ))}
              {calendarDays.value.map((d, i) => (
                <div class={`checkin-page__calendar-day ${d ? '' : 'checkin-page__calendar-day--empty'} ${d?.checked ? 'checkin-page__calendar-day--checked' : ''} ${d?.isToday ? 'checkin-page__calendar-day--today' : ''}`}>
                  {d?.day || ''}
                </div>
              ))}
            </div>
          </EchoCard>
        </div>
      </div>
    )
  }
})
