/**
 * Onboarding 新手引导
 * 首次访问时显示的 3 步引导弹窗：发起预测 → 等待回响 → 复盘印证
 * 设计参考 Linear / Vercel 极简风格，纯色背景、SVG 线条插图、左对齐排版
 * 完成后调用 store.completeOnboarding() 并写入 localStorage 标记，不再重复显示
 */
import { defineComponent, ref, onMounted, onUnmounted, Fragment } from 'vue'
import { useEchoStore } from '@/stores/echo.js'

const ONBOARDING_KEY = 'echo_onboarding_done'

/* === SVG 线条插图（无 emoji，纯 stroke 线条艺术） === */

// 步骤1：罗盘 / 星盘
const CompassIllustration = () => (
  <svg
    class="ob-illust__svg"
    viewBox="0 0 120 120"
    fill="none"
    stroke="currentColor"
    stroke-width="1.4"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <circle cx="60" cy="60" r="48" />
    <circle cx="60" cy="60" r="36" stroke-opacity="0.35" />
    <circle cx="60" cy="60" r="22" stroke-opacity="0.2" />
    {/* 四方刻度 */}
    <line x1="60" y1="6" x2="60" y2="18" />
    <line x1="60" y1="102" x2="60" y2="114" />
    <line x1="6" y1="60" x2="18" y2="60" />
    <line x1="102" y1="60" x2="114" y2="60" />
    {/* 四隅刻度 */}
    <line x1="21.6" y1="21.6" x2="30" y2="30" stroke-opacity="0.4" />
    <line x1="90" y1="90" x2="98.4" y2="98.4" stroke-opacity="0.4" />
    <line x1="98.4" y1="21.6" x2="90" y2="30" stroke-opacity="0.4" />
    <line x1="30" y1="90" x2="21.6" y2="98.4" stroke-opacity="0.4" />
    {/* 指针（菱形） */}
    <path d="M60 26 L67 60 L60 94 L53 60 Z" />
    <circle cx="60" cy="60" r="2.6" fill="currentColor" stroke="none" />
  </svg>
)

// 步骤2：沙漏 / 时钟
const HourglassIllustration = () => (
  <svg
    class="ob-illust__svg"
    viewBox="0 0 120 120"
    fill="none"
    stroke="currentColor"
    stroke-width="1.4"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    {/* 上下框 */}
    <line x1="28" y1="12" x2="92" y2="12" />
    <line x1="28" y1="108" x2="92" y2="108" />
    {/* 沙漏两侧曲线 */}
    <path d="M34 12 L34 26 Q34 50 60 60 Q34 70 34 94 L34 108" />
    <path d="M86 12 L86 26 Q86 50 60 60 Q86 70 86 94 L86 108" />
    {/* 上层余沙 */}
    <path d="M42 22 Q60 40 78 22" stroke-opacity="0.55" />
    {/* 流沙 */}
    <line x1="60" y1="60" x2="60" y2="84" stroke-opacity="0.55" stroke-dasharray="2 3.5" />
    {/* 底部沙堆 */}
    <path d="M44 98 Q60 84 76 98" stroke-opacity="0.55" />
  </svg>
)

// 步骤3：回响波纹
const RippleIllustration = () => (
  <svg
    class="ob-illust__svg"
    viewBox="0 0 120 120"
    fill="none"
    stroke="currentColor"
    stroke-width="1.4"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <circle cx="60" cy="60" r="8" />
    <path d="M44 60 A16 16 0 0 1 76 60" stroke-opacity="0.75" />
    <path d="M34 60 A26 26 0 0 1 86 60" stroke-opacity="0.5" />
    <path d="M24 60 A36 36 0 0 1 96 60" stroke-opacity="0.3" />
    <path d="M14 60 A46 46 0 0 1 106 60" stroke-opacity="0.18" />
    {/* 源点 */}
    <circle cx="60" cy="60" r="2.6" fill="currentColor" stroke="none" />
  </svg>
)

const STEPS = [
  {
    label: '步骤一 · 发起',
    title: '发起预测',
    desc: '选择命理工具，输入生辰信息，生成推演结果。每一次起卦，都是对未来的一次假设。',
    Illustration: CompassIllustration
  },
  {
    label: '步骤二 · 等待',
    title: '等待回响',
    desc: '预测记录会进入待印证队列。设定复盘日期，然后回到日常里，等待事件发生。',
    Illustration: HourglassIllustration
  },
  {
    label: '步骤三 · 印证',
    title: '复盘印证',
    desc: '事件发生后回来复盘，记录实际结果。系统计算应验率，命格等级随之提升。',
    Illustration: RippleIllustration
  }
]

const STYLES = `
.ob-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--sp-4);
  background: rgba(0, 0, 0, 0.62);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
  animation: fadeIn var(--dur-normal) var(--ease-out) both;
}
.ob-card {
  width: 100%;
  max-width: 420px;
  max-height: 90vh;
  overflow-y: auto;
  background: var(--bg-2);
  border: 1px solid var(--rule-2);
  border-radius: var(--r-xl);
  padding: var(--sp-6) var(--sp-5) var(--sp-5);
  box-shadow: var(--shadow-lg);
  animation: fadeInUp var(--dur-slow) var(--ease-out) both;
}
/* 内容区随步骤切换重新淡入上移 */
.ob-step {
  animation: fadeInUp var(--dur-slow) var(--ease-out) both;
}
.ob-illust {
  display: flex;
  justify-content: flex-start;
  margin-bottom: var(--sp-5);
  color: var(--accent);
}
.ob-illust__svg {
  width: 56px;
  height: 56px;
  display: block;
}
.ob-label {
  font-size: var(--fs-xs);
  letter-spacing: var(--ls-xwide);
  text-transform: uppercase;
  color: var(--muted);
  font-weight: var(--fw-medium);
  margin-bottom: var(--sp-2);
}
.ob-title {
  font-family: 'Lora', 'Noto Serif CJK SC', serif;
  font-size: var(--fs-xl);
  font-weight: var(--fw-medium);
  color: var(--ink);
  letter-spacing: var(--ls-tight);
  line-height: var(--lh-tight);
  text-align: left;
  margin: 0 0 var(--sp-3);
}
.ob-desc {
  font-size: var(--fs-sm);
  line-height: var(--lh-relaxed);
  color: var(--ink-2);
  text-align: left;
  margin: 0 0 var(--sp-6);
}
.ob-dots {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  margin-bottom: var(--sp-5);
}
.ob-dot {
  width: 6px;
  height: 6px;
  border-radius: var(--r-full);
  background: var(--rule-strong);
  transition: width var(--dur-normal) var(--ease-smooth),
              background var(--dur-normal) var(--ease-smooth);
}
.ob-dot--active {
  width: 20px;
  background: var(--accent);
}
.ob-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
}
.ob-skip {
  background: none;
  border: none;
  color: var(--muted);
  font-size: var(--fs-sm);
  font-family: inherit;
  padding: var(--sp-2) var(--sp-1);
  cursor: pointer;
  transition: color var(--dur-fast) var(--ease-smooth);
}
.ob-skip:hover { color: var(--ink-2); }
.ob-next {
  background: var(--accent);
  color: var(--bg);
  border: none;
  border-radius: var(--r-md);
  padding: var(--sp-3) var(--sp-5);
  font-size: var(--fs-sm);
  font-weight: var(--fw-medium);
  font-family: inherit;
  cursor: pointer;
  transition: background var(--dur-fast) var(--ease-smooth),
              transform var(--dur-fast) var(--ease-smooth);
}
.ob-next:hover { background: var(--accent-2); }
.ob-next:active { transform: scale(0.98); }
@media (prefers-reduced-motion: reduce) {
  .ob-overlay, .ob-card, .ob-step { animation: none; }
}
`

export const Onboarding = defineComponent({
  name: 'Onboarding',
  setup() {
    const store = useEchoStore()
    const visible = ref(false)
    const step = ref(0)

    onMounted(() => {
      // 已完成引导则不再显示
      let done = false
      try { done = localStorage.getItem(ONBOARDING_KEY) === '1' } catch {}
      if (!done) visible.value = true
      window.addEventListener('keydown', onKey)
    })
    onUnmounted(() => window.removeEventListener('keydown', onKey))

    function onKey(e) {
      if (!visible.value) return
      if (e.key === 'Escape') finish()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
    }

    function next() {
      if (step.value < STEPS.length - 1) step.value++
      else finish()
    }
    function prev() {
      if (step.value > 0) step.value--
    }

    function finish() {
      try { localStorage.setItem(ONBOARDING_KEY, '1') } catch {}
      // store 侧记录完成状态（含命格经验奖励），失败不阻断关闭
      try { store.completeOnboarding() } catch {}
      visible.value = false
    }

    return () => {
      const current = STEPS[step.value]
      const Illustration = current.Illustration
      const isLast = step.value === STEPS.length - 1

      return (
        <Fragment>
          <style>{STYLES}</style>
          {visible.value && (
            <div
              class="ob-overlay"
              role="dialog"
              aria-modal="true"
              aria-label="新手引导"
              onClick={finish}
            >
              <div class="ob-card" onClick={(e) => e.stopPropagation()}>
                <div class="ob-step" key={step.value}>
                  <div class="ob-illust">
                    <Illustration />
                  </div>
                  <div class="ob-label">{current.label}</div>
                  <h2 class="ob-title">{current.title}</h2>
                  <p class="ob-desc">{current.desc}</p>
                </div>

                <div class="ob-dots" role="tablist" aria-label="引导进度">
                  {STEPS.map((s, i) => (
                    <span
                      key={i}
                      class={['ob-dot', i === step.value && 'ob-dot--active']}
                      role="tab"
                      aria-selected={i === step.value}
                    />
                  ))}
                </div>

                <div class="ob-actions">
                  <button class="ob-skip" onClick={finish}>跳过</button>
                  <button class="ob-next" onClick={next}>
                    {isLast ? '开始探索' : '下一步'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </Fragment>
      )
    }
  }
})
