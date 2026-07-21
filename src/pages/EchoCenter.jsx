import { defineComponent, ref, computed } from 'vue'
import { useEchoStore } from '@/stores/echo.js'
import { TopBar } from '@/components/TabBar.jsx'
import { EchoCard, EchoButton, EchoBadge, EchoTag, MingeGauge, EchoProgress, EchoModal, EmptyState, showToast } from '@/components/EchoUI.jsx'

export default defineComponent({
  name: 'EchoCenter',
  setup() {
    const store = useEchoStore()
    const activeTab = ref('pending') // pending | reviewed | all
    const reviewModal = ref(null) // 当前复盘的 assumption
    const reviewForm = ref({ actualEvent: '', dimensions: { timing: 0.3, direction: 0.3, degree: 0.3 } })

    const tabs = computed(() => [
      { key: 'pending', label: '待印证', count: store.pendingAssumptions.length },
      { key: 'reviewed', label: '已印证', count: store.reviewedAssumptions.length },
      { key: 'all', label: '全部', count: store.assumptions.length }
    ])

    const list = computed(() => {
      if (activeTab.value === 'pending') return store.pendingAssumptions
      if (activeTab.value === 'reviewed') return store.reviewedAssumptions
      return store.assumptions
    })

    const openReview = (a) => {
      reviewModal.value = a
      reviewForm.value = { actualEvent: '', dimensions: { timing: 0.3, direction: 0.3, degree: 0.3 } }
    }

    const submitReview = () => {
      if (!reviewModal.value) return
      if (!reviewForm.value.actualEvent.trim()) {
        showToast('请描述实际发生了什么', 'warn')
        return
      }
      const score = (reviewForm.value.dimensions.timing + reviewForm.value.dimensions.direction + reviewForm.value.dimensions.degree) / 3
      const result = store.reviewAssumption(reviewModal.value.id, {
        actualEvent: reviewForm.value.actualEvent,
        matchScore: score,
        dimensions: reviewForm.value.dimensions
      })
      if (!result) {
        showToast('复盘失败：找不到对应的预测记录', 'error')
        return
      }
      showToast(`复盘完成 · 获得 ${result.expGain} 经验`, 'success', 2000)
      reviewModal.value = null
    }

    const scoreLabels = [
      { v: 0, l: '未应验' },
      { v: 0.3, l: '部分' },
      { v: 0.6, l: '基本' },
      { v: 1, l: '应验' }
    ]

    const formatTime = (ts) => {
      const d = new Date(ts)
      return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    }

    return () => (
      <div class="echo-center">
        <TopBar title="印证中心" subtitle="Echo Engine" />
        
        <div class="container">
          {/* 命格仪表 */}
          <section class="echo-center__gauge-section">
            <EchoCard level="primary">
              <div class="echo-center__gauge-wrap">
                <MingeGauge value={store.accuracyRate} label="命格可信度" />
              </div>
              <div class="echo-center__gauge-stats">
                <div class="echo-center__stat">
                  <span class="echo-center__stat-num">{store.mingeLevelTitle}</span>
                  <span class="echo-center__stat-lbl">命格等级</span>
                </div>
                <div class="echo-center__stat">
                  <span class="echo-center__stat-num">{store.minge.totalReviews}</span>
                  <span class="echo-center__stat-lbl">总印证</span>
                </div>
                <div class="echo-center__stat">
                  <span class="echo-center__stat-num">{store.accuracyRate}%</span>
                  <span class="echo-center__stat-lbl">应验率</span>
                </div>
              </div>
              <div class="echo-center__level-bar">
                <div class="echo-center__level-info">
                  <EchoBadge variant="gold">Lv.{store.minge.level}</EchoBadge>
                  <span class="echo-center__level-exp">距 Lv.{store.minge.level + 1} 还需 {store.nextLevelExp} 经验</span>
                </div>
                <EchoProgress value={store.levelProgress} variant="gold" />
              </div>
            </EchoCard>
          </section>

          {/* Tab 切换 */}
          <div class="echo-center__tabs">
            {tabs.value.map(t => (
              <button
                key={t.key}
                class={`echo-center__tab ${activeTab.value === t.key ? 'echo-center__tab--active' : ''}`}
                onClick={() => activeTab.value = t.key}
              >
                {t.label}
                <span class="echo-center__tab-count">{t.count}</span>
              </button>
            ))}
          </div>

          {/* 列表 */}
          <section class="echo-center__list">
            {list.value.length === 0 ? (
              <EmptyState
                title={activeTab.value === 'pending' ? '暂无待印证' : '还没有印证记录'}
                desc="用工具发起一个预测，到期后回来复盘"
              />
            ) : (
              list.value.map((a, i) => (
                <EchoCard key={a.id} level="secondary" class="stagger" style={{ '--i': i }}>
                  <div class="echo-item">
                    <div class="echo-item__main">
                      <div class="echo-item__title">{a.title}</div>
                      {a.desc && <div class="echo-item__desc">{a.desc}</div>}
                      <div class="echo-item__meta">
                        <EchoTag variant="muted">{a.tool}</EchoTag>
                        <span class="echo-item__time">设于 {formatTime(a.createdAt)}</span>
                      </div>
                    </div>
                    <div class="echo-item__action">
                      {a.reviewed ? (
                        <EchoBadge variant={a.matchScore >= 0.7 ? 'ok' : a.matchScore >= 0.4 ? 'gold' : 'muted'}>
                          {a.matchScore >= 0.7 ? '应验' : a.matchScore >= 0.4 ? '部分' : '未验'}
                        </EchoBadge>
                      ) : (
                        <EchoButton variant="primary" size="sm" onClick={() => openReview(a)}>复盘</EchoButton>
                      )}
                    </div>
                  </div>
                  {a.reviewed && a.actualEvent && (
                    <div class="echo-item__review">
                      <div class="echo-item__review-label">实际：</div>
                      <div class="echo-item__review-text">{a.actualEvent}</div>
                    </div>
                  )}
                </EchoCard>
              ))
            )}
          </section>
        </div>

        {/* 复盘弹窗 */}
        <EchoModal
          modelValue={!!reviewModal.value}
          onUpdate:modelValue={(v) => { if (!v) reviewModal.value = null }}
          title="复盘预测"
          vSlots={{
            default: () => reviewModal.value && (
              <div class="review-form">
                <div class="review-form__title">{reviewModal.value.title}</div>
                <div class="review-form__field">
                  <label class="review-form__label">实际发生了什么</label>
                  <textarea
                    class="review-form__textarea"
                    value={reviewForm.value.actualEvent}
                    onInput={(e) => reviewForm.value.actualEvent = e.target.value}
                    placeholder="如实记录实际情况，越具体越好…"
                    rows="3"
                  />
                </div>
                <div class="review-form__field">
                  <label class="review-form__label">应期吻合度</label>
                  <div class="review-form__scores">
                    {scoreLabels.map(s => (
                      <button
                        key={`timing-${s.v}`}
                        class={`review-form__score ${reviewForm.value.dimensions.timing === s.v ? 'review-form__score--active' : ''}`}
                        onClick={() => reviewForm.value.dimensions.timing = s.v}
                      >{s.l}</button>
                    ))}
                  </div>
                </div>
                <div class="review-form__field">
                  <label class="review-form__label">方向吻合度</label>
                  <div class="review-form__scores">
                    {scoreLabels.map(s => (
                      <button
                        key={`direction-${s.v}`}
                        class={`review-form__score ${reviewForm.value.dimensions.direction === s.v ? 'review-form__score--active' : ''}`}
                        onClick={() => reviewForm.value.dimensions.direction = s.v}
                      >{s.l}</button>
                    ))}
                  </div>
                </div>
                <div class="review-form__field">
                  <label class="review-form__label">程度吻合度</label>
                  <div class="review-form__scores">
                    {scoreLabels.map(s => (
                      <button
                        key={`degree-${s.v}`}
                        class={`review-form__score ${reviewForm.value.dimensions.degree === s.v ? 'review-form__score--active' : ''}`}
                        onClick={() => reviewForm.value.dimensions.degree = s.v}
                      >{s.l}</button>
                    ))}
                  </div>
                </div>
              </div>
            ),
            footer: () => [
              <EchoButton variant="ghost" onClick={() => reviewModal.value = null}>取消</EchoButton>,
              <EchoButton variant="primary" onClick={submitReview}>提交复盘</EchoButton>
            ]
          }}
        />
      </div>
    )
  }
})
