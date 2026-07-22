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
import {
  computeProfileBazi,
  compatibilityCalc,
  TIAN_GAN,
  DI_ZHI,
  GAN_WX,
  ZHI_WX,
  ganHeOf,
  heOf,
  sanheOf,
  chongOf,
  xingOf,
  haiOf
} from '@/utils/engines.js'
import { BaziChart } from '@/components/BaziChart.jsx'
import { Timeline } from '@/components/Timeline.jsx'

// 五行颜色映射（与 BaziChart 一致）
const WX_COLORS = {
  '木': '#5a9e5a',
  '火': '#d45a5a',
  '土': '#a8825a',
  '金': '#d4a843',
  '水': '#5a8db5'
}
const WUXING_LIST = ['木', '火', '土', '金', '水']
const wxColor = (wx) => WX_COLORS[wx] || 'var(--muted)'
const ganWxOf = (gan) => GAN_WX[TIAN_GAN.indexOf(gan)] || ''
const zhiWxOf = (zhi) => ZHI_WX[DI_ZHI.indexOf(zhi)] || ''

// 五行序号：木0 火1 土2 金3 水4
// 相生：(i+1)%5  相克：(i+2)%5
const wxRelation = (wx1, wx2) => {
  const i = WUXING_LIST.indexOf(wx1), j = WUXING_LIST.indexOf(wx2)
  if (i < 0 || j < 0) return { type: 'unknown', label: '未知' }
  if (i === j) return { type: 'same', label: '比和' }
  if ((i + 1) % 5 === j) return { type: 'generate', label: `${wx1}生${wx2}` }
  if ((j + 1) % 5 === i) return { type: 'generated', label: `${wx2}生${wx1}` }
  if ((i + 2) % 5 === j) return { type: 'restrain', label: `${wx1}克${wx2}` }
  return { type: 'restrained', label: `${wx2}克${wx1}` }
}

// 我克者为财 — 返回日主的财星五行
const wealthWxOf = (dayMasterWx) => {
  const i = WUXING_LIST.indexOf(dayMasterWx)
  if (i < 0) return ''
  return WUXING_LIST[(i + 2) % 5]
}

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

    // ===== 合婚多维评分（性格匹配 / 情感和谐 / 财运互助 / 家庭和睦） =====
    const matchScores = computed(() => {
      const b1 = bazi1.value, b2 = bazi2.value
      if (!b1 || !b2) return null
      const scores = []

      // --- 1. 性格匹配（日主五行 + 生肖配对） ---
      const dmRel = wxRelation(b1.dayMasterWx, b2.dayMasterWx)
      let dmScore = 50
      if (dmRel.type === 'same') dmScore = 80
      else if (dmRel.type === 'generate' || dmRel.type === 'generated') dmScore = 90
      else dmScore = 45
      // 生肖配对（年支关系）
      const yearZhi1 = b1.pillars[0].zhi, yearZhi2 = b2.pillars[0].zhi
      let zodiacScore = 55
      if (chongOf(yearZhi1) === yearZhi2) zodiacScore = 30
      else if (xingOf(yearZhi1, yearZhi2)) zodiacScore = 35
      else if (haiOf(yearZhi1, yearZhi2)) zodiacScore = 40
      else {
        const he1 = heOf(yearZhi1)
        if (he1 && he1.partner === yearZhi2) zodiacScore = 85
        else {
          const s1 = sanheOf(yearZhi1), s2 = sanheOf(yearZhi2)
          if (s1 && s2 && s1.name === s2.name) zodiacScore = 80
        }
      }
      const personalityScore = Math.round(dmScore * 0.55 + zodiacScore * 0.45)
      scores.push({
        name: '性格匹配',
        score: personalityScore,
        desc: `日主${dmRel.label}，生肖${b1.zodiac}与${b2.zodiac}${zodiacScore >= 75 ? '相合' : zodiacScore >= 50 ? '平和' : '相冲'}`
      })

      // --- 2. 情感和谐（日支关系） ---
      const dayZhi1 = b1.pillars[2].zhi, dayZhi2 = b2.pillars[2].zhi
      let harmonyScore = 55, harmonyDesc = '日支无明显合冲'
      if (chongOf(dayZhi1) === dayZhi2) {
        harmonyScore = 25; harmonyDesc = `日支${dayZhi1}${dayZhi2}相冲，易有摩擦`
      } else if (xingOf(dayZhi1, dayZhi2)) {
        harmonyScore = 35; harmonyDesc = `日支${dayZhi1}${dayZhi2}相刑，需多包容`
      } else if (haiOf(dayZhi1, dayZhi2)) {
        harmonyScore = 40; harmonyDesc = `日支${dayZhi1}${dayZhi2}相害，需多沟通`
      } else {
        const dhe = heOf(dayZhi1)
        if (dhe && dhe.partner === dayZhi2) {
          harmonyScore = 90; harmonyDesc = `日支${dayZhi1}${dayZhi2}六合，感情深厚`
        } else {
          const ds1 = sanheOf(dayZhi1), ds2 = sanheOf(dayZhi2)
          if (ds1 && ds2 && ds1.name === ds2.name) {
            harmonyScore = 80; harmonyDesc = `日支同属${ds1.name}，气场相合`
          }
        }
      }
      scores.push({ name: '情感和谐', score: harmonyScore, desc: harmonyDesc })

      // --- 3. 财运互助（财星互补 + 五行平衡） ---
      const wealth1 = wealthWxOf(b1.dayMasterWx), wealth2 = wealthWxOf(b2.dayMasterWx)
      const s1Strong = b1.strongest, s2Strong = b2.strongest
      let wealthMutual = 0
      let wealthDescParts = []
      if (s1Strong === wealth2) { wealthMutual += 1; wealthDescParts.push('甲方旺气助乙方财运') }
      if (s2Strong === wealth1) { wealthMutual += 1; wealthDescParts.push('乙方旺气助甲方财运') }
      // 合并五行方差越小越均衡
      const merged = {}
      WUXING_LIST.forEach(k => { merged[k] = (b1.wuxing[k] || 0) + (b2.wuxing[k] || 0) })
      const vals = Object.values(merged)
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length
      const variance = vals.reduce((a, b) => a + (b - avg) ** 2, 0) / vals.length
      const balanceBonus = Math.max(0, Math.round(20 - variance * 2.5))
      let financeScore
      if (wealthMutual === 2) financeScore = 85 + balanceBonus
      else if (wealthMutual === 1) financeScore = 65 + balanceBonus
      else financeScore = 45 + balanceBonus
      financeScore = Math.min(100, financeScore)
      const financeDesc = wealthDescParts.length
        ? wealthDescParts.join('；') + (variance < 1.5 ? '，合并五行均衡' : '')
        : '财星无互补' + (variance < 1.5 ? '，但合并五行均衡' : '，合并五行偏枯')
      scores.push({ name: '财运互助', score: financeScore, desc: financeDesc })

      // --- 4. 家庭和睦（喜用互补 + 无严重冲刑 + 五行平衡） ---
      const fav1 = b1.favorable || [], fav2 = b2.favorable || []
      const favComplement = fav1.some(f => fav2.includes(f))
      let familyScore = 0
      let familyDescParts = []
      // 喜用互补 +35
      if (favComplement) { familyScore += 35; familyDescParts.push('喜用神互补') }
      else { familyScore += 15; familyDescParts.push('喜用神无互补') }
      // 无严重冲刑（日支+年支） +35
      const hasChong = chongOf(dayZhi1) === dayZhi2 || chongOf(yearZhi1) === yearZhi2
      const hasXing = !!xingOf(dayZhi1, dayZhi2) || !!xingOf(yearZhi1, yearZhi2)
      if (!hasChong && !hasXing) { familyScore += 35; familyDescParts.push('无冲无刑') }
      else if (hasChong) { familyScore += 10; familyDescParts.push('有相冲需化解') }
      else { familyScore += 18; familyDescParts.push('有相刑需包容') }
      // 合并五行均衡 +30
      familyScore += Math.round(Math.max(0, 30 - variance * 3))
      familyScore = Math.min(100, familyScore)
      scores.push({ name: '家庭和睦', score: familyScore, desc: familyDescParts.join('，') })

      const total = Math.round(scores.reduce((a, s) => a + s.score, 0) / scores.length)
      return { scores, total }
    })

    // ===== 五行互补分析数据 =====
    const wuxingCompare = computed(() => {
      const b1 = bazi1.value, b2 = bazi2.value
      if (!b1 || !b2) return null
      const wx1 = b1.wuxing || {}, wx2 = b2.wuxing || {}
      const total1 = Object.values(wx1).reduce((a, b) => a + b, 0) || 8
      const total2 = Object.values(wx2).reduce((a, b) => a + b, 0) || 8
      const rows = WUXING_LIST.map(wx => {
        const c1 = wx1[wx] || 0, c2 = wx2[wx] || 0
        const pct1 = Math.round((c1 / total1) * 100)
        const pct2 = Math.round((c2 / total2) * 100)
        // 互补：一方偏弱（≤1）另一方偏强（≥3）→ 互补
        // 冲突：双方都偏强（≥3）→ 过旺冲突
        let tag = null
        if (c1 >= 3 && c2 >= 3) tag = { variant: 'danger', text: '过旺' }
        else if (c1 <= 1 && c2 >= 3) tag = { variant: 'ok', text: '乙方补' }
        else if (c2 <= 1 && c1 >= 3) tag = { variant: 'ok', text: '甲方补' }
        else if (c1 <= 1 && c2 <= 1) tag = { variant: 'gold', text: '偏弱' }
        return { wx, c1, c2, pct1, pct2, tag }
      })
      // 整体互补判定
      const fav1 = b1.favorable || [], fav2 = b2.favorable || []
      const complementary = fav1.some(f => fav2.includes(f))
      return { rows, complementary, fav1, fav2, strongest1: b1.strongest, strongest2: b2.strongest }
    })

    // ===== 四柱对比数据 =====
    const pillarCompare = computed(() => {
      const b1 = bazi1.value, b2 = bazi2.value
      if (!b1 || !b2) return null
      return b1.pillars.map((p1, i) => {
        const p2 = b2.pillars[i]
        // 天干关系
        const ganHe1 = ganHeOf(p1.gan)
        const ganMatch = ganHe1 && ganHe1.partner === p2.gan
          ? { type: '合', label: `${p1.gan}${p2.gan}合化${ganHe1.wx}`, tone: 'pos' }
          : null
        // 地支关系
        const z1 = p1.zhi, z2 = p2.zhi
        let zhiMatch = null
        if (chongOf(z1) === z2) zhiMatch = { type: '冲', label: `${z1}${z2}冲`, tone: 'neg' }
        else if (xingOf(z1, z2)) zhiMatch = { type: '刑', label: `${z1}${z2}刑`, tone: 'neg' }
        else if (haiOf(z1, z2)) zhiMatch = { type: '害', label: `${z1}${z2}害`, tone: 'neg' }
        else {
          const he = heOf(z1)
          if (he && he.partner === z2) zhiMatch = { type: '合', label: `${z1}${z2}六合`, tone: 'pos' }
          else {
            const s1 = sanheOf(z1), s2 = sanheOf(z2)
            if (s1 && s2 && s1.name === s2.name) zhiMatch = { type: '合', label: `同属${s1.name}`, tone: 'pos' }
          }
        }
        return {
          name: p1.name,
          gan1: p1.gan, gan2: p2.gan,
          ganWx1: ganWxOf(p1.gan), ganWx2: ganWxOf(p2.gan),
          zhi1: z1, zhi2: z2,
          zhiWx1: zhiWxOf(z1), zhiWx2: zhiWxOf(z2),
          ganMatch, zhiMatch
        }
      })
    })

    // 评分色阶
    const scoreBarColor = (s) => {
      if (s >= 75) return '#5a9e5a'
      if (s >= 55) return '#d4a843'
      return '#d45a5a'
    }
    const scoreJudge = (s) => {
      if (s >= 75) return { variant: 'ok', text: '吉' }
      if (s >= 55) return { variant: 'gold', text: '平' }
      return { variant: 'danger', text: '忌' }
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

              {/* 合婚多维评分 */}
              {matchScores.value && (
                <EchoCard level="primary" title="合婚评分">
                  <div class="compat-page__mscore-total">
                    <div class="compat-page__mscore-total-num" style={{ color: scoreColor(matchScores.value.total) }}>
                      {matchScores.value.total}
                    </div>
                    <div class="compat-page__mscore-total-label">综合均分</div>
                  </div>
                  <div class="compat-page__mscores">
                    {matchScores.value.scores.map((s) => {
                      const judge = scoreJudge(s.score)
                      return (
                        <div key={s.name} class="compat-page__mscore">
                          <div class="compat-page__mscore-head">
                            <span class="compat-page__mscore-name">
                              {s.name}
                              <EchoTag variant={judge.variant}>{judge.text}</EchoTag>
                            </span>
                            <span class="compat-page__mscore-val" style={{ color: scoreBarColor(s.score) }}>
                              {s.score}<span class="compat-page__mscore-unit">分</span>
                            </span>
                          </div>
                          <div class="compat-page__mscore-bar">
                            <div
                              class="compat-page__mscore-fill"
                              style={{ width: `${s.score}%`, background: scoreBarColor(s.score) }}
                            />
                          </div>
                          <div class="compat-page__mscore-desc">{s.desc}</div>
                        </div>
                      )
                    })}
                  </div>
                </EchoCard>
              )}

              {/* 八字四柱对比 */}
              {pillarCompare.value && (
                <EchoCard level="secondary" title="八字四柱对比">
                  <div class="compat-page__pcmp">
                    <div class="compat-page__pcmp-header">
                      <span class="compat-page__pcmp-col-label">柱位</span>
                      <span class="compat-page__pcmp-col-mid">甲方</span>
                      <span class="compat-page__pcmp-col-mid">乙方</span>
                      <span class="compat-page__pcmp-col-rel">干支关系</span>
                    </div>
                    {pillarCompare.value.map((row) => (
                      <div key={row.name} class="compat-page__pcmp-row">
                        <span class="compat-page__pcmp-col-label">{row.name}</span>
                        <div class="compat-page__pcmp-col-mid">
                          <span class="compat-page__pcmp-gan" style={{ color: wxColor(row.ganWx1) }}>{row.gan1}</span>
                          <span class="compat-page__pcmp-zhi" style={{ color: wxColor(row.zhiWx1) }}>{row.zhi1}</span>
                        </div>
                        <div class="compat-page__pcmp-col-mid">
                          <span class="compat-page__pcmp-gan" style={{ color: wxColor(row.ganWx2) }}>{row.gan2}</span>
                          <span class="compat-page__pcmp-zhi" style={{ color: wxColor(row.zhiWx2) }}>{row.zhi2}</span>
                        </div>
                        <div class="compat-page__pcmp-col-rel">
                          {row.ganMatch && (
                            <EchoTag variant={row.ganMatch.tone === 'pos' ? 'ok' : 'danger'}>{row.ganMatch.label}</EchoTag>
                          )}
                          {row.zhiMatch && (
                            <EchoTag variant={row.zhiMatch.tone === 'pos' ? 'ok' : 'danger'}>{row.zhiMatch.label}</EchoTag>
                          )}
                          {!row.ganMatch && !row.zhiMatch && (
                            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>—</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </EchoCard>
              )}

              {/* 五行互补分析 */}
              {wuxingCompare.value && (
                <EchoCard level="secondary" title="五行互补分析">
                  <div class="compat-page__wxcmp-summary">
                    {wuxingCompare.value.complementary ? (
                      <EchoBadge variant="ok">喜用神互补 · 五行可互济</EchoBadge>
                    ) : (
                      <EchoBadge variant="gold">喜用神无互补 · 五行各自独立</EchoBadge>
                    )}
                    <span class="compat-page__wxcmp-info">
                      甲方最旺{wuxingCompare.value.strongest1} · 乙方最旺{wuxingCompare.value.strongest2}
                    </span>
                  </div>
                  <div class="compat-page__wxcmp-legend">
                    <span class="compat-page__wxcmp-legend-item">
                      <span class="compat-page__wxcmp-dot" style={{ background: 'var(--accent)' }} />甲方
                    </span>
                    <span class="compat-page__wxcmp-legend-item">
                      <span class="compat-page__wxcmp-dot" style={{ background: '#b07acc' }} />乙方
                    </span>
                  </div>
                  {wuxingCompare.value.rows.map((r) => (
                    <div key={r.wx} class="compat-page__wxcmp-row">
                      <span class="compat-page__wxcmp-wx" style={{ color: wxColor(r.wx) }}>{r.wx}</span>
                      <div class="compat-page__wxcmp-bars">
                        <div class="compat-page__wxcmp-bar-row">
                          <div class="compat-page__wxcmp-track">
                            <div class="compat-page__wxcmp-fill" style={{ width: `${r.pct1}%`, background: 'var(--accent)' }} />
                          </div>
                          <span class="compat-page__wxcmp-count">{r.c1}</span>
                        </div>
                        <div class="compat-page__wxcmp-bar-row">
                          <div class="compat-page__wxcmp-track">
                            <div class="compat-page__wxcmp-fill" style={{ width: `${r.pct2}%`, background: '#b07acc' }} />
                          </div>
                          <span class="compat-page__wxcmp-count">{r.c2}</span>
                        </div>
                      </div>
                      {r.tag && <EchoTag variant={r.tag.variant}>{r.tag.text}</EchoTag>}
                    </div>
                  ))}
                </EchoCard>
              )}

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
