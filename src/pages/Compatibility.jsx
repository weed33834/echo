/**
 * Compatibility — 合婚匹配页
 *
 * 两人八字输入 → computeProfileBazi 双盘 → compatibilityCalc 匹配
 * 展示：总分环 / 等级 / 概要 / 六维分解 / 双方命盘（紧凑） / 大运流年时间轴
 */
import { defineComponent, ref, computed, onMounted } from 'vue'
import { useEchoStore } from '@/stores/echo.js'
import { TopBar } from '@/components/TabBar.jsx'
import { EchoCard, EchoButton, EchoBadge, EchoTag, EchoProgress, showToast } from '@/components/EchoUI.jsx'
import { computeProfileBazi, compatibilityCalc } from '@/utils/engines.js'
import { BaziChart } from '@/components/BaziChart.jsx'
import { Timeline } from '@/components/Timeline.jsx'

// 12 时辰：子时=23, 丑时=1, 寅时=3 ... 亥时=21（值为对应小时数）
const SHICHEN = [
  { label: '子时 23:00-01:00', value: '23' },
  { label: '丑时 01:00-03:00', value: '1' },
  { label: '寅时 03:00-05:00', value: '3' },
  { label: '卯时 05:00-07:00', value: '5' },
  { label: '辰时 07:00-09:00', value: '7' },
  { label: '巳时 09:00-11:00', value: '9' },
  { label: '午时 11:00-13:00', value: '11' },
  { label: '未时 13:00-15:00', value: '13' },
  { label: '申时 15:00-17:00', value: '15' },
  { label: '酉时 17:00-19:00', value: '17' },
  { label: '戌时 19:00-21:00', value: '19' },
  { label: '亥时 21:00-23:00', value: '21' }
]

export default defineComponent({
  name: 'Compatibility',
  setup() {
    const store = useEchoStore()

    // 两人表单（ref 持有对象，内部属性响应式）
    const person1 = ref({ birthday: '', birthTime: '', gender: 'male' })
    const person2 = ref({ birthday: '', birthTime: '', gender: 'female' })

    // 自己档案是否可用（决定是否自动填充 + 显示「自己」标签）
    const selfReady = computed(() => !!(store.profile && store.profile.birthday))

    // 推演结果
    const bazi1 = ref(null)
    const bazi2 = ref(null)
    const result = ref(null)
    const computing = ref(false)

    // 自动填充甲方为当前用户档案
    onMounted(() => {
      if (store.profile) {
        person1.value = {
          birthday: store.profile.birthday || '',
          birthTime: store.profile.birthTime || '',
          gender: store.profile.gender || 'male'
        }
      }
    })

    // 校验：双方生日均已填写
    const canCalc = computed(() => !!person1.value.birthday && !!person2.value.birthday)

    // 总分色阶：green >=65 / gold 50-64 / red <50
    const scoreVariant = computed(() => {
      const s = result.value?.score ?? 0
      if (s >= 65) return 'high'
      if (s >= 50) return 'mid'
      return 'low'
    })
    const scoreColor = (s) => {
      if (s >= 65) return '#5a9e5a'
      if (s >= 50) return '#d4a843'
      return '#d45a5a'
    }

    // 维度进度条：百分比与变体
    const dimPct = (d) => Math.max(0, Math.min(100, Math.round((d.score / d.max) * 100)))
    const dimVariant = (d) => (dimPct(d) >= 70 ? 'gold' : 'accent')
    // 维度吉凶标签
    const dimJudge = (d) => {
      const p = dimPct(d)
      if (p >= 70) return { variant: 'ok', text: '吉' }
      if (p >= 40) return { variant: 'gold', text: '平' }
      return { variant: 'danger', text: '忌' }
    }

    // 开始合婚：双方 computeProfileBazi → compatibilityCalc
    const startCalc = () => {
      if (!person1.value.birthday || !person2.value.birthday) {
        showToast('请填写双方出生日期', 'warn')
        return
      }
      computing.value = true
      result.value = null
      // 同步计算，setTimeout 营造推演节奏
      setTimeout(() => {
        try {
          const b1 = computeProfileBazi({ ...person1.value })
          const b2 = computeProfileBazi({ ...person2.value })
          if (!b1 || !b2) {
            computing.value = false
            showToast('八字推演失败，请检查日期', 'danger')
            return
          }
          const res = compatibilityCalc(b1, b2)
          bazi1.value = b1
          bazi2.value = b2
          result.value = res
          computing.value = false
          showToast('合婚推演完成', 'success', 1500)
          store.pushHistory({
            toolKey: 'compat',
            toolName: '合婚匹配',
            toolCat: 'mingli',
            form: { p1: { ...person1.value }, p2: { ...person2.value } },
            result: res,
            summary: res.summary
          })
        } catch (err) {
          computing.value = false
          showToast('推演异常：' + (err && err.message ? err.message : '未知错误'), 'danger')
        }
      }, 320)
    }

    const reset = () => {
      result.value = null
      bazi1.value = null
      bazi2.value = null
    }

    // 渲染单人输入卡（复用 profile-form 样式）
    const renderPerson = (p, opts) => (
      <div class="compat-page__person">
        <div class="compat-page__person-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          <span>{opts.label}</span>
          {opts.self && <EchoBadge variant="gold">自己</EchoBadge>}
        </div>
        <div class="profile-form__field">
          <label class="profile-form__label">出生日期 <span style="font-size: var(--fs-xs); color: var(--muted); font-weight: normal;">(年-月-日)</span></label>
          <input
            class="profile-form__input"
            type="date"
            value={p.value.birthday}
            onInput={(e) => (p.value.birthday = e.target.value)}
            min="1900-01-01"
            max="2100-12-31"
          />
        </div>
        <div class="profile-form__field">
          <label class="profile-form__label">出生时辰</label>
          <select
            class="profile-form__input"
            value={p.value.birthTime}
            onChange={(e) => (p.value.birthTime = e.target.value)}
          >
            <option value="">未知时辰</option>
            {SHICHEN.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div class="profile-form__field">
          <label class="profile-form__label">性别</label>
          <div class="profile-form__gender">
            <button
              class={`profile-form__gender-btn ${p.value.gender === 'male' ? 'profile-form__gender-btn--active' : ''}`}
              onClick={() => (p.value.gender = 'male')}
            >男</button>
            <button
              class={`profile-form__gender-btn ${p.value.gender === 'female' ? 'profile-form__gender-btn--active' : ''}`}
              onClick={() => (p.value.gender = 'female')}
            >女</button>
          </div>
        </div>
      </div>
    )

    return () => (
      <div class="compat-page">
        <TopBar title="合婚匹配" back />
        <div class="container">
          {/* ===== 输入区 ===== */}
          <EchoCard level="primary" title="双方信息">
            <div class="compat-page__input">
              {renderPerson(person1, { label: '甲方', self: selfReady.value })}
              {renderPerson(person2, { label: '乙方', self: false })}
            </div>
            <div style={{ marginTop: 'var(--sp-4)' }}>
              <EchoButton
                variant="gold"
                block
                loading={computing.value}
                disabled={!canCalc.value || computing.value}
                onClick={startCalc}
              >
                {computing.value ? '推演中…' : '开始合婚'}
              </EchoButton>
            </div>
            {selfReady.value && (
              <p class="profile-form__hint" style={{ marginTop: 'var(--sp-2)' }}>
                甲方已自动填充你的档案信息，可直接修改。
              </p>
            )}
          </EchoCard>

          {/* ===== 结果区 ===== */}
          {result.value && (
            <>
              {/* 总评 */}
              <EchoCard level="primary" title="合婚总评">
                <div class="compat-page__score-wrap">
                  <div class={`compat-page__score-circle compat-page__score-circle--${scoreVariant.value}`}>
                    {result.value.score}
                  </div>
                  <div class="compat-page__level" style={{ color: scoreColor(result.value.score) }}>
                    {result.value.level}
                  </div>
                  <div style={{ textAlign: 'center', maxWidth: '320px', color: 'var(--muted)', fontSize: 'var(--fs-sm)', lineHeight: 1.5 }}>
                    {result.value.summary}
                  </div>
                </div>
              </EchoCard>

              {/* 六维分解 */}
              <EchoCard level="secondary" title="维度分解">
                <div class="compat-page__dims">
                  {result.value.dimensions.map((d) => {
                    const judge = dimJudge(d)
                    return (
                      <div key={d.name} class="compat-page__dim">
                        <div class="compat-page__dim-head">
                          <span class="compat-page__dim-name">
                            {d.name}
                            <EchoTag variant={judge.variant} >{judge.text}</EchoTag>
                          </span>
                          <span class="compat-page__dim-score" style={{ color: scoreColor(dimPct(d)) }}>
                            {d.score}/{d.max}
                          </span>
                        </div>
                        <EchoProgress value={dimPct(d)} variant={dimVariant(d)} />
                        <div class="compat-page__dim-desc">{d.desc}</div>
                      </div>
                    )
                  })}
                </div>
              </EchoCard>

              {/* 双方命盘（紧凑） */}
              <EchoCard level="secondary" title="双方命盘">
                <div class="compat-page__input">
                  <div>
                    <div class="compat-page__person-title" style={{ marginBottom: 'var(--sp-2)', display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                      <span>甲方</span>
                      {selfReady.value && <EchoTag variant="gold">自己</EchoTag>}
                      {bazi1.value && <EchoTag variant="accent">{bazi1.value.dayMasterLabel}</EchoTag>}
                    </div>
                    <BaziChart bazi={bazi1.value} compact />
                  </div>
                  <div>
                    <div class="compat-page__person-title" style={{ marginBottom: 'var(--sp-2)', display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                      <span>乙方</span>
                      {bazi2.value && <EchoTag variant="accent">{bazi2.value.dayMasterLabel}</EchoTag>}
                    </div>
                    <BaziChart bazi={bazi2.value} compact />
                  </div>
                </div>
              </EchoCard>

              {/* 甲方大运 / 流年时间轴 */}
              <EchoCard level="tertiary" title="大运轨迹 · 甲方">
                <Timeline bazi={bazi1.value} type="dayun" />
              </EchoCard>
              <EchoCard level="tertiary" title="流年走势 · 甲方">
                <Timeline bazi={bazi1.value} type="liunian" />
              </EchoCard>

              {/* 操作 */}
              <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-3)' }}>
                <EchoButton variant="ghost" block onClick={reset}>重新推演</EchoButton>
                <EchoButton
                  variant="secondary"
                  block
                  onClick={() => showToast('AI 深度解读即将上线，敬请期待', 'default')}
                >
                  AI 深度解读
                </EchoButton>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }
})
