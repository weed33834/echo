/**
 * Echo 基础 UI 组件
 * 单文件集中定义，避免分散。所有组件遵循设计令牌，无硬编码。
 */
import { defineComponent, computed, ref, onMounted, onUnmounted } from 'vue'

/* === Card 卡片（三级层级） === */
export const EchoCard = defineComponent({
  name: 'EchoCard',
  props: {
    level: { type: String, default: 'secondary' }, // primary | secondary | tertiary
    title: String,
    interactive: Boolean
  },
  emits: ['click'],
  setup(props, { slots, emit }) {
    const cls = computed(() => [
      'echo-card',
      `echo-card--${props.level}`,
      { 'echo-card--interactive': props.interactive }
    ])
    return () => (
      <div class={cls.value} onClick={() => props.interactive && emit('click')}>
        {props.title && (
          <div class="echo-card__head">
            <h3 class="echo-card__title">{props.title}</h3>
            {slots.action?.()}
          </div>
        )}
        <div class="echo-card__body">{slots.default?.()}</div>
      </div>
    )
  }
})

/* === Button 按钮 === */
export const EchoButton = defineComponent({
  name: 'EchoButton',
  props: {
    variant: { type: String, default: 'primary' }, // primary | secondary | ghost | gold | danger
    size: { type: String, default: 'md' }, // sm | md | lg
    block: Boolean,
    disabled: Boolean,
    loading: Boolean
  },
  emits: ['click'],
  setup(props, { slots, emit }) {
    const cls = computed(() => [
      'echo-btn',
      `echo-btn--${props.variant}`,
      `echo-btn--${props.size}`,
      { 'echo-btn--block': props.block, 'echo-btn--disabled': props.disabled || props.loading }
    ])
    return () => (
      <button
        class={cls.value}
        disabled={props.disabled || props.loading}
        onClick={(e) => emit('click', e)}
      >
        {props.loading && <span class="echo-btn__spinner" />}
        {slots.default?.()}
      </button>
    )
  }
})

/* === Badge 徽标 === */
export const EchoBadge = defineComponent({
  name: 'EchoBadge',
  props: {
    variant: { type: String, default: 'accent' }, // accent | gold | ok | danger | warn | muted
    dot: Boolean
  },
  setup(props, { slots }) {
    const cls = computed(() => ['echo-badge', `echo-badge--${props.variant}`, { 'echo-badge--dot': props.dot }])
    return () => <span class={cls.value}>{!props.dot && slots.default?.()}</span>
  }
})

/* === Tag 标签 === */
export const EchoTag = defineComponent({
  name: 'EchoTag',
  props: {
    variant: { type: String, default: 'muted' }
  },
  setup(props, { slots }) {
    return () => <span class={`echo-tag echo-tag--${props.variant}`}>{slots.default?.()}</span>
  }
})

/* === ProgressBar 进度条 === */
export const EchoProgress = defineComponent({
  name: 'EchoProgress',
  props: {
    value: { type: Number, default: 0 }, // 0-100
    variant: { type: String, default: 'accent' }
  },
  setup(props) {
    const pct = computed(() => Math.max(0, Math.min(100, props.value)))
    return () => (
      <div class="echo-progress">
        <div
          class={`echo-progress__fill echo-progress__fill--${props.variant}`}
          style={{ width: pct.value + '%' }}
        />
      </div>
    )
  }
})

/* === Gauge 仪表（命格可信度） === */
export const MingeGauge = defineComponent({
  name: 'MingeGauge',
  props: {
    value: { type: Number, default: 0 }, // 0-100
    level: { type: Number, default: 1 },
    label: { type: String, default: '命格可信度' }
  },
  setup(props) {
    const circumference = 2 * Math.PI * 52
    const offset = computed(() => circumference * (1 - props.value / 100))
    return () => (
      <div class="minge-gauge">
        <svg viewBox="0 0 120 120" class="minge-gauge__svg">
          <circle cx="60" cy="60" r="52" class="minge-gauge__track" />
          <circle
            cx="60" cy="60" r="52"
            class="minge-gauge__value"
            stroke-dasharray={circumference}
            stroke-dashoffset={offset.value}
            transform="rotate(-90 60 60)"
          />
        </svg>
        <div class="minge-gauge__center">
          <div class="minge-gauge__num">{props.value}<span class="minge-gauge__pct">%</span></div>
          <div class="minge-gauge__label">{props.label}</div>
        </div>
      </div>
    )
  }
})

/* === Modal 弹窗 === */
export const EchoModal = defineComponent({
  name: 'EchoModal',
  props: {
    modelValue: Boolean,
    title: String
  },
  emits: ['update:modelValue'],
  setup(props, { slots, emit }) {
    const close = () => emit('update:modelValue', false)
    const onKey = (e) => { if (e.key === 'Escape' && props.modelValue) close() }
    onMounted(() => window.addEventListener('keydown', onKey))
    onUnmounted(() => window.removeEventListener('keydown', onKey))
    return () => props.modelValue ? (
      <div class="echo-modal__overlay" onClick={close}>
        <div class="echo-modal" onClick={(e) => e.stopPropagation()}>
          {props.title && (
            <div class="echo-modal__head">
              <h3 class="echo-modal__title">{props.title}</h3>
              <button class="echo-modal__close" onClick={close} aria-label="关闭">×</button>
            </div>
          )}
          <div class="echo-modal__body">{slots.default?.()}</div>
          {slots.footer && <div class="echo-modal__foot">{slots.footer()}</div>}
        </div>
      </div>
    ) : null
  }
})

/* === Toast 轻提示 === */
const toastQueue = ref([])
let toastId = 0
export function showToast(message, variant = 'default', duration = 2000) {
  const id = ++toastId
  toastQueue.value.push({ id, message, variant })
  setTimeout(() => {
    toastQueue.value = toastQueue.value.filter(t => t.id !== id)
  }, duration)
}
export const ToastHost = defineComponent({
  name: 'ToastHost',
  setup() {
    return () => (
      <div class="toast-host">
        {toastQueue.value.map(t => (
          <div key={t.id} class={`toast toast--${t.variant}`}>{t.message}</div>
        ))}
      </div>
    )
  }
})

/* === EmptyState 空状态 === */
export const EmptyState = defineComponent({
  name: 'EmptyState',
  props: { title: String, desc: String },
  setup(props, { slots }) {
    return () => (
      <div class="empty-state">
        <div class="empty-state__icon">{slots.icon?.() || '◦'}</div>
        <div class="empty-state__title">{props.title}</div>
        {props.desc && <div class="empty-state__desc">{props.desc}</div>}
        {slots.action?.()}
      </div>
    )
  }
})
