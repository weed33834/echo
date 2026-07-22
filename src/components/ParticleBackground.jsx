/**
 * ParticleBackground · 粒子星空背景
 * 在应用内容之后方渲染一层 Canvas 粒子星空，营造“东方暗色宇宙”氛围：
 * - 80~150 颗“星辰”（依屏幕尺寸与设备性能自适应）
 * - 回响紫(--accent) + 鎏金(--gold) 双色，低透明度柔和发光
 * - 鼠标/触摸靠近时粒子被推开，形成“能量场”扰动
 * - 邻近粒子(<80px)之间绘制极淡连线，如星座网络（仅桌面端）
 * - 遵循 prefers-reduced-motion：开启时静态渲染、不跑动画循环
 * - 粒子数据存于普通数组（非 Vue 响应式）以保证性能
 *
 * 用法：<ParticleBackground />  通常作为 App 根节点的第一个子节点，
 * Canvas 通过 position:fixed; z-index:0 铺满视口置于内容之下。
 */
import { defineComponent, ref, onMounted, onUnmounted } from 'vue'
import './particle-bg.css'

/* === 工具：hex(#7a5ff0) -> "122, 95, 240" === */
function hexToRgb(hex) {
  if (!hex) return null
  let h = String(hex).trim().replace(/^#/, '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const num = parseInt(h, 16)
  if (Number.isNaN(num) || h.length !== 6) return null
  return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`
}

/* === 读取主题色（从 CSS 变量，失败回退到暗色宇宙默认值） === */
function getThemeColors() {
  const style = getComputedStyle(document.documentElement)
  const accent = hexToRgb(style.getPropertyValue('--accent')) || '122, 95, 240'
  const gold = hexToRgb(style.getPropertyValue('--gold')) || '201, 168, 76'
  return { accent, gold }
}

/* === 粒子 === */
class Particle {
  constructor(w, h) {
    this.x = Math.random() * w
    this.y = Math.random() * h
    this.vx = (Math.random() - 0.5) * 0.3
    this.vy = (Math.random() - 0.5) * 0.3
    this.radius = Math.random() * 1.5 + 0.5 // 0.5 ~ 2px
    this.baseAlpha = Math.random() * 0.5 + 0.2
    this.alpha = this.baseAlpha
    this.twinkleSpeed = Math.random() * 0.02 + 0.005
    this.twinklePhase = Math.random() * Math.PI * 2
    this.color = Math.random() < 0.3 ? 'gold' : 'accent' // 30% 鎏金 / 70% 回响紫
  }

  update(w, h, mouseX, mouseY, dt, interactive) {
    // 闪烁（正弦波）
    this.twinklePhase += this.twinkleSpeed * dt
    this.alpha = this.baseAlpha + Math.sin(this.twinklePhase) * 0.15

    // 漂移
    this.x += this.vx * dt
    this.y += this.vy * dt

    // 边缘环绕
    if (this.x < 0) this.x = w
    if (this.x > w) this.x = 0
    if (this.y < 0) this.y = h
    if (this.y > h) this.y = 0

    // 鼠标/触摸斥力——能量场扰动
    if (interactive) {
      const dx = this.x - mouseX
      const dy = this.y - mouseY
      const distSq = dx * dx + dy * dy
      const R = 100
      if (distSq < R * R && distSq > 0.01) {
        const dist = Math.sqrt(distSq)
        const force = ((R - dist) / R) * 2
        this.x += (dx / dist) * force
        this.y += (dy / dist) * force
      }
    }
  }

  draw(ctx, accentColor, goldColor) {
    const rgb = this.color === 'gold' ? goldColor : accentColor
    const a = this.alpha < 0 ? 0 : this.alpha > 1 ? 1 : this.alpha

    // 星核
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${rgb}, ${a})`
    ctx.fill()

    // 柔光晕（仅较大星点）
    if (this.radius > 1) {
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.radius * 3, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${rgb}, ${a * 0.1})`
      ctx.fill()
    }
  }
}

/* === 自适应粒子数量 ===
 * 'auto' 时结合屏幕尺寸与 navigator.hardwareConcurrency：
 *   移动端 / 低性能：60~80 颗，不画连线
 *   桌面端：120~150 颗，画连线
 */
function resolveDensity(explicit, w, h) {
  if (explicit !== 'auto') {
    const n = parseInt(explicit, 10)
    return Number.isFinite(n) ? Math.max(0, Math.min(400, n)) : 120
  }
  const cores = (navigator && navigator.hardwareConcurrency) || 4
  const coarse =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(pointer: coarse)').matches
  const isMobile = w < 768 || (coarse && cores <= 4)
  const area = w * h

  if (isMobile) {
    const ref = 375 * 667
    const scaled = 60 + Math.min(20, Math.max(0, (area / ref - 1) * 10))
    return Math.round(Math.max(50, Math.min(80, scaled)))
  }
  const ref = 1280 * 800
  const scaled = 120 + Math.min(30, Math.max(0, (area / ref - 1) * 12))
  return Math.round(Math.max(110, Math.min(150, scaled)))
}

export const ParticleBackground = defineComponent({
  name: 'ParticleBackground',
  props: {
    density: { type: [Number, String], default: 'auto' }, // 'auto' 或显式数量
    interactive: { type: Boolean, default: true },
    color: { type: String, default: 'auto' } // 'auto' = 读取 CSS 变量 --accent
  },
  setup(props) {
    const canvasRef = ref(null)

    // —— 非响应式状态（避免 Vue 代理带来的性能损耗） ——
    let ctx = null
    let raf = 0
    let particles = []
    let mouseX = -999
    let mouseY = -999
    let width = 0
    let height = 0
    let dpr = 1
    let lastTime = 0
    let colors = { accent: '122, 95, 240', gold: '201, 168, 76' }
    let drawConnections = true
    let reducedMotion = false
    let resizeObserver = null
    let themeObserver = null
    let motionMedia = null

    function readColors() {
      if (props.color && props.color !== 'auto') {
        const c = hexToRgb(props.color)
        if (c) colors = { accent: c, gold: colors.gold }
      } else {
        colors = getThemeColors()
      }
    }

    function resize() {
      const canvas = canvasRef.value
      if (!canvas) return
      dpr = Math.min(window.devicePixelRatio || 1, 2) // 上限 2，平衡清晰度与性能
      const w = canvas.clientWidth || window.innerWidth
      const h = canvas.clientHeight || window.innerHeight
      width = w
      height = h
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      // 依尺寸重建粒子（密度随屏幕自适应）
      const count = resolveDensity(props.density, w, h)
      particles = new Array(count)
      for (let i = 0; i < count; i++) particles[i] = new Particle(w, h)

      // 仅桌面端绘制连线
      drawConnections = !reducedMotion && w >= 768

      readColors()
      if (reducedMotion) renderStatic()
    }

    /* 静态渲染（reduced-motion）：只画一帧，不跑循环 */
    function renderStatic() {
      if (!ctx) return
      ctx.clearRect(0, 0, width, height)
      for (let i = 0; i < particles.length; i++) {
        particles[i].draw(ctx, colors.accent, colors.gold)
      }
    }

    /* 动画主循环：delta-time 归一化（相对 60fps） */
    function frame(now) {
      if (!ctx) return
      const dt = Math.min(Math.max((now - lastTime) / 16.6667, 0), 3)
      lastTime = now

      ctx.clearRect(0, 0, width, height)

      const interactive = props.interactive
      const n = particles.length

      // 1) 更新位置
      for (let i = 0; i < n; i++) {
        particles[i].update(width, height, mouseX, mouseY, dt, interactive)
      }

      // 2) 星座连线（O(n²)，仅桌面端）
      if (drawConnections) {
        const maxDist = 80
        const maxDistSq = maxDist * maxDist
        ctx.lineWidth = 0.5
        for (let i = 0; i < n; i++) {
          const p1 = particles[i]
          for (let j = i + 1; j < n; j++) {
            const p2 = particles[j]
            const dx = p1.x - p2.x
            const dy = p1.y - p2.y
            const distSq = dx * dx + dy * dy
            if (distSq < maxDistSq) {
              const dist = Math.sqrt(distSq)
              const a = (1 - dist / maxDist) * 0.12
              ctx.strokeStyle = `rgba(${colors.accent}, ${a})`
              ctx.beginPath()
              ctx.moveTo(p1.x, p1.y)
              ctx.lineTo(p2.x, p2.y)
              ctx.stroke()
            }
          }
        }
      }

      // 3) 绘制星点
      for (let i = 0; i < n; i++) {
        particles[i].draw(ctx, colors.accent, colors.gold)
      }

      raf = requestAnimationFrame(frame)
    }

    function start() {
      if (reducedMotion) {
        renderStatic()
        return
      }
      if (raf) cancelAnimationFrame(raf)
      lastTime = performance.now()
      raf = requestAnimationFrame(frame)
    }

    function stop() {
      if (raf) cancelAnimationFrame(raf)
      raf = 0
    }

    /* —— 事件处理 —— */
    function onPointerMove(e) {
      const t = e.touches ? e.touches[0] : e
      if (!t) return
      mouseX = t.clientX
      mouseY = t.clientY
    }
    function onPointerLeave() {
      mouseX = -999
      mouseY = -999
    }
    function onVisibility() {
      if (document.hidden) stop()
      else if (!reducedMotion) start()
    }
    function onMotionChange(e) {
      reducedMotion = e.matches
      drawConnections = !reducedMotion && width >= 768
      if (reducedMotion) {
        stop()
        renderStatic()
      } else {
        start()
      }
    }

    onMounted(() => {
      const canvas = canvasRef.value
      if (!canvas) return
      ctx = canvas.getContext('2d')

      // 降低动态偏好
      motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)')
      reducedMotion = motionMedia.matches
      if (motionMedia.addEventListener) {
        motionMedia.addEventListener('change', onMotionChange)
      } else if (motionMedia.addListener) {
        // 旧版 Safari 兼容
        motionMedia.addListener(onMotionChange)
      }

      resize()
      start()

      // 尺寸监听
      resizeObserver = new ResizeObserver(() => resize())
      resizeObserver.observe(canvas)

      // 主题变化监听（data-theme / class 切换时刷新颜色）
      themeObserver = new MutationObserver(() => {
        readColors()
        if (reducedMotion) renderStatic()
      })
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme', 'class']
      })

      // 指针——因 canvas pointer-events:none，监听挂在 window
      window.addEventListener('mousemove', onPointerMove, { passive: true })
      window.addEventListener('touchmove', onPointerMove, { passive: true })
      window.addEventListener('touchend', onPointerLeave, { passive: true })
      window.addEventListener('blur', onPointerLeave)
      document.addEventListener('visibilitychange', onVisibility)
    })

    onUnmounted(() => {
      stop()
      resizeObserver && resizeObserver.disconnect()
      themeObserver && themeObserver.disconnect()
      if (motionMedia) {
        if (motionMedia.removeEventListener) motionMedia.removeEventListener('change', onMotionChange)
        else if (motionMedia.removeListener) motionMedia.removeListener(onMotionChange)
      }
      window.removeEventListener('mousemove', onPointerMove)
      window.removeEventListener('touchmove', onPointerMove)
      window.removeEventListener('touchend', onPointerLeave)
      window.removeEventListener('blur', onPointerLeave)
      document.removeEventListener('visibilitychange', onVisibility)
    })

    return () => <canvas ref={canvasRef} class="particle-bg" aria-hidden="true" />
  }
})

export default ParticleBackground
