/**
 * CoinToss — 物理铜钱掷卦 Canvas 动画组件
 *
 * 在 Canvas 上绘制三枚铜钱的抛掷物理动画：
 *  - 重力下落 + 多次弹跳衰减
 *  - 绕纵轴翻转（scaleX = cos(angle) 模拟 rotateY）
 *  - 阳面 = 实心圆，阴面 = 断线（爻象）
 *  - 落定后阳面鎏金光晕
 *  - 落地振动反馈 + Web Audio 铜钱清脆声
 *
 * Props:
 *  - tossing:  Boolean  为 true 时启动一次抛掷动画
 *  - result:   Array    3 个布尔，true=阳/字面，false=阴/背面（决定落定朝向）
 *  - onComplete: Function 动画结束（铜钱落定）时回调
 *
 * 逻辑画布 300×120，按 devicePixelRatio 放大保证清晰，CSS 自适应宽度。
 */
import { defineComponent, ref, onMounted, onUnmounted, watch } from 'vue'
import './coin-toss.css'

/* ---- 逻辑画布尺寸 ---- */
const W = 300
const H = 120
const FLOOR_Y = H - 28 // 铜钱静止时的圆心 Y（地面线之上）

/* ---- 物理常量（按 60fps 帧归一化） ---- */
const GRAVITY = 0.62
const DAMPING = 0.46 // 弹跳能量保留率
const SETTLE_VY = 1.4 // 垂直速度低于此值视为静止
const MAX_BOUNCES = 3

/* ---- 爻名映射 ---- */
const YAO_LABELS = {
  6: '老阴',
  7: '少阳',
  8: '少阴',
  9: '老阳'
}

/* ============================================================
 * 工具：从 CSS 变量读取调色板（适配亮/暗主题）
 * ============================================================ */
function readPalette() {
  if (typeof window === 'undefined') return null
  const cs = getComputedStyle(document.documentElement)
  const get = (name, fallback) => {
    const v = cs.getPropertyValue(name).trim()
    return v || fallback
  }
  return {
    gold: get('--gold', '#b8893a'),
    gold2: get('--gold-2', '#d4a85a'),
    ink: get('--ink', '#15131f'),
    ink2: get('--ink-2', '#2a2540'),
    ink3: get('--ink-3', '#3d3656'),
    bg2: get('--bg-2', '#16112a'),
    accent: get('--accent', '#5b3fd6'),
    accent2: get('--accent-2', '#7a5ff0'),
    muted: get('--muted', '#6b6779')
  }
}

/* ---- 预生成星点（暗色宇宙底装饰，确定性位置） ---- */
const STARS = Array.from({ length: 18 }, (_, i) => {
  const r1 = Math.sin(i * 12.9898) * 43758.5453
  const r2 = Math.sin(i * 78.233) * 43758.5453
  return {
    x: (r1 - Math.floor(r1)) * W,
    y: (r2 - Math.floor(r2)) * (H * 0.7),
    r: i % 3 === 0 ? 1.4 : 1,
    alpha: 0.12 + ((i * 37) % 18) / 100,
    twinkle: 0.8 + (i % 5) * 0.4,
    phase: (i * 1.3) % (Math.PI * 2)
  }
})

/* ============================================================
 * 单枚铜钱状态工厂
 * ============================================================ */
function makeCoin(idx, isYang) {
  const radius = 21
  const spacing = 72
  return {
    idx,
    homeX: W / 2 + (idx - 1) * spacing,
    x: W / 2 + (idx - 1) * spacing,
    y: FLOOR_Y,
    vx: (Math.random() - 0.5) * 2.4,
    vy: -(10.5 + Math.random() * 4.5),
    angle: Math.random() * Math.PI * 2,
    spinSpeed: 0.34 + Math.random() * 0.34 * (Math.random() < 0.5 ? -1 : 1),
    radius,
    face: isYang ? 'yang' : 'yin',
    settled: false,
    bounces: 0,
    landPlayed: false,
    glow: 0
  }
}

/* ============================================================
 * 组件
 * ============================================================ */
export const CoinToss = defineComponent({
  name: 'CoinToss',
  props: {
    tossing: { type: Boolean, default: false },
    result: { type: Array, default: () => [true, true, true] },
    onComplete: { type: Function, default: () => {} }
  },
  setup(props) {
    const canvasRef = ref(null)
    // 响应式状态：驱动 hint / 结果展示的 DOM 更新
    const state = ref('idle') // idle | tossing | settled
    const resultInfo = ref(null) // { label, mark, coinStr }

    let ctx = null
    let rafId = null
    let audioCtx = null
    let coins = []
    let lastTime = 0
    let time = 0
    let dpr = 1
    let palette = readPalette()
    let themeObserver = null
    let completeFired = false

    /* ---------- Web Audio：铜钱清脆声 ---------- */
    function ensureAudio() {
      if (audioCtx) {
        if (audioCtx.state === 'suspended') audioCtx.resume()
        return audioCtx
      }
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return null
      audioCtx = new AC()
      return audioCtx
    }

    function playClink(pitch = 0) {
      const ac = ensureAudio()
      if (!ac) return
      try {
        const now = ac.currentTime
        const osc = ac.createOscillator()
        const gain = ac.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(780 + pitch * 60, now)
        osc.frequency.exponentialRampToValueAtTime(540 + pitch * 40, now + 0.12)
        gain.gain.setValueAtTime(0.0001, now)
        gain.gain.exponentialRampToValueAtTime(0.28, now + 0.008)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16)
        osc.connect(gain)
        gain.connect(ac.destination)
        osc.start(now)
        osc.stop(now + 0.18)
      } catch {
        /* 忽略音频错误 */
      }
    }

    function playLandVibration() {
      if (navigator.vibrate) {
        try {
          navigator.vibrate([60, 50, 60, 50, 120])
        } catch {
          /* 忽略 */
        }
      }
    }

    /* ---------- 启动一次抛掷 ---------- */
    function startToss() {
      const res =
        props.result && props.result.length === 3
          ? props.result
          : [true, true, true]
      coins = [0, 1, 2].map((i) => makeCoin(i, !!res[i]))
      state.value = 'tossing'
      completeFired = false
      resultInfo.value = null
      ensureAudio()
    }

    /* ---------- 物理更新 ---------- */
    function updatePhysics(dt) {
      let allSettled = true
      for (const c of coins) {
        if (c.settled) {
          c.glow = Math.min(1, c.glow + dt * 0.06)
          continue
        }
        allSettled = false
        c.vy += GRAVITY * dt
        c.x += c.vx * dt
        c.y += c.vy * dt
        c.angle += c.spinSpeed * dt

        // 落地弹跳
        if (c.y >= FLOOR_Y) {
          c.y = FLOOR_Y
          if (Math.abs(c.vy) > SETTLE_VY && c.bounces < MAX_BOUNCES) {
            c.vy = -c.vy * DAMPING
            c.vx *= 0.7
            c.bounces++
            if (!c.landPlayed) {
              playClink(c.idx)
              c.landPlayed = true
            }
          } else {
            // 静止
            c.settled = true
            c.vy = 0
            c.vx = 0
            c.angle = 0
            c.x = c.homeX
            if (!c.landPlayed) {
              playClink(c.idx)
              c.landPlayed = true
            }
          }
        }

        // 水平边界软约束
        const margin = c.radius + 6
        if (c.x < margin) {
          c.x = margin
          c.vx = Math.abs(c.vx) * 0.6
        }
        if (c.x > W - margin) {
          c.x = W - margin
          c.vx = -Math.abs(c.vx) * 0.6
        }
      }

      // 全部落定 → 触发完成
      if (allSettled && !completeFired) {
        completeFired = true
        state.value = 'settled'
        playLandVibration()
        setResultInfo()
        setTimeout(() => {
          if (typeof props.onComplete === 'function') props.onComplete()
        }, 360)
      }
    }

    /* ---------- 结果信息 ---------- */
    function setResultInfo() {
      const res = props.result
      const yangCount = res.filter(Boolean).length
      const sum = yangCount * 3 + (3 - yangCount) * 2
      resultInfo.value = {
        label: YAO_LABELS[sum] || '',
        mark: sum === 9 ? '○' : sum === 6 ? '✕' : '',
        coinStr: res.map((b) => (b ? '阳' : '阴')).join(' '),
        sum
      }
    }

    /* ============================================================
     * 绘制
     * ============================================================ */

    function drawBackground() {
      if (!ctx || !palette) return
      const grad = ctx.createLinearGradient(0, 0, 0, H)
      grad.addColorStop(0, palette.ink2)
      grad.addColorStop(0.6, palette.ink)
      grad.addColorStop(1, palette.bg2)
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, W, H)

      // 星点
      for (const s of STARS) {
        const a = s.alpha * (0.45 + 0.55 * Math.sin(time * s.twinkle + s.phase))
        ctx.globalAlpha = Math.max(0, a)
        ctx.fillStyle = palette.gold2
        ctx.fillRect(s.x, s.y, s.r, s.r)
      }
      ctx.globalAlpha = 1

      // 地面线（鎏金微光）
      ctx.strokeStyle = palette.gold
      ctx.globalAlpha = 0.22
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, FLOOR_Y + 21)
      ctx.lineTo(W, FLOOR_Y + 21)
      ctx.stroke()
      ctx.globalAlpha = 1
    }

    /** 圆角矩形填充辅助 */
    function roundRect(x, y, w, h, r) {
      ctx.beginPath()
      ctx.moveTo(x + r, y)
      ctx.arcTo(x + w, y, x + w, y + h, r)
      ctx.arcTo(x + w, y + h, x, y + h, r)
      ctx.arcTo(x, y + h, x, y, r)
      ctx.arcTo(x, y, x + w, y, r)
      ctx.closePath()
      ctx.fill()
    }

    /** 绘制铜钱正面/反面符号 */
    function drawFaceSymbol(radius, isYang) {
      // 内圈装饰环
      ctx.beginPath()
      ctx.arc(0, 0, radius * 0.76, 0, Math.PI * 2)
      ctx.strokeStyle = palette.gold
      ctx.globalAlpha = 0.55
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.globalAlpha = 1

      if (isYang) {
        // 阳面：实心圆（鎏金）
        const r = radius * 0.34
        const g = ctx.createRadialGradient(0, -r * 0.3, 0, 0, 0, r)
        g.addColorStop(0, palette.gold2)
        g.addColorStop(1, palette.gold)
        ctx.beginPath()
        ctx.arc(0, 0, r, 0, Math.PI * 2)
        ctx.fillStyle = g
        ctx.fill()
      } else {
        // 阴面：断线（两段爻象）
        const barW = radius * 0.42
        const barH = radius * 0.24
        const gap = radius * 0.16
        ctx.fillStyle = palette.gold2
        roundRect(-(barW + gap / 2), -barH / 2, barW, barH, barH * 0.3)
        roundRect(gap / 2, -barH / 2, barW, barH, barH * 0.3)
      }
    }

    /** 绘制单枚铜钱（含翻转透视与阴影） */
    function drawCoin(c) {
      const cosA = Math.cos(c.angle)
      const absScale = Math.abs(cosA)
      const showFace = cosA >= 0
      const isYangFace = showFace ? c.face === 'yang' : c.face === 'yin'

      // 阴影（随高度变化）
      const heightAbove = Math.max(0, FLOOR_Y - c.y)
      const shadowScale = Math.max(0.35, 1 - heightAbove / 120)
      ctx.save()
      ctx.translate(c.x, FLOOR_Y + 21)
      ctx.scale(shadowScale, shadowScale * 0.32)
      ctx.beginPath()
      ctx.arc(0, 0, c.radius, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(0,0,0,${0.35 * shadowScale})`
      ctx.fill()
      ctx.restore()

      ctx.save()
      ctx.translate(c.x, c.y)

      // 落定后阳面光晕
      if (c.settled && c.glow > 0 && c.face === 'yang') {
        const glowR = c.radius * (1.5 + c.glow * 0.5)
        const gg = ctx.createRadialGradient(0, 0, c.radius * 0.5, 0, 0, glowR)
        gg.addColorStop(0, `rgba(201,168,76,${0.45 * c.glow})`)
        gg.addColorStop(1, 'rgba(201,168,76,0)')
        ctx.fillStyle = gg
        ctx.beginPath()
        ctx.arc(0, 0, glowR, 0, Math.PI * 2)
        ctx.fill()
      }

      // 翻转透视：横向缩放
      ctx.scale(Math.max(0.04, absScale), 1)

      // 铜钱主体（暗色径向渐变 + 鎏金描边）
      const r = c.radius
      const bodyGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.2, 0, 0, r)
      bodyGrad.addColorStop(0, palette.ink3)
      bodyGrad.addColorStop(0.7, palette.ink2)
      bodyGrad.addColorStop(1, palette.ink)
      ctx.beginPath()
      ctx.arc(0, 0, r, 0, Math.PI * 2)
      ctx.fillStyle = bodyGrad
      ctx.fill()

      // 鎏金外边
      ctx.lineWidth = 2.4
      ctx.strokeStyle = palette.gold
      ctx.stroke()

      if (absScale > 0.18) {
        drawFaceSymbol(r, isYangFace)
      }

      ctx.restore()
    }

    /** 静止占位铜钱（idle 态微光呼吸） */
    function drawIdleCoins() {
      const breath = 0.5 + 0.5 * Math.sin(time * 1.2)
      for (let i = 0; i < 3; i++) {
        const x = W / 2 + (i - 1) * 72
        ctx.save()
        ctx.translate(x, FLOOR_Y)
        ctx.globalAlpha = 0.28 + breath * 0.12
        ctx.beginPath()
        ctx.arc(0, 0, 21, 0, Math.PI * 2)
        ctx.fillStyle = palette.ink2
        ctx.fill()
        ctx.lineWidth = 1.5
        ctx.strokeStyle = palette.gold
        ctx.globalAlpha = 0.4 + breath * 0.2
        ctx.stroke()
        ctx.restore()
      }
      ctx.globalAlpha = 1
    }

    /* ---------- 主循环 ---------- */
    function loop(now) {
      rafId = requestAnimationFrame(loop)
      if (!ctx || !palette) return
      if (!lastTime) lastTime = now
      let dt = (now - lastTime) / 16.67
      lastTime = now
      if (dt > 3) dt = 3
      time += dt * 0.016

      drawBackground()

      if (state.value === 'tossing' || state.value === 'settled') {
        if (state.value === 'tossing') updatePhysics(dt)
        for (const c of coins) drawCoin(c)
      } else {
        drawIdleCoins()
      }
    }

    /* ---------- 画布初始化与尺寸 ---------- */
    function setupCanvas() {
      const canvas = canvasRef.value
      if (!canvas) return
      dpr = Math.min(window.devicePixelRatio || 1, 2.5)
      canvas.width = W * dpr
      canvas.height = H * dpr
      ctx = canvas.getContext('2d')
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.imageSmoothingEnabled = true
    }

    /* ---------- 监听主题变化刷新调色板 ---------- */
    function observeTheme() {
      themeObserver = new MutationObserver(() => {
        palette = readPalette()
      })
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme', 'class']
      })
    }

    /* ---------- 生命周期 ---------- */
    onMounted(() => {
      setupCanvas()
      palette = readPalette()
      observeTheme()
      window.addEventListener('resize', setupCanvas)
      rafId = requestAnimationFrame(loop)
    })

    onUnmounted(() => {
      if (rafId) cancelAnimationFrame(rafId)
      if (themeObserver) themeObserver.disconnect()
      window.removeEventListener('resize', setupCanvas)
      if (audioCtx) {
        try {
          audioCtx.close()
        } catch {
          /* ignore */
        }
        audioCtx = null
      }
    })

    /* ---------- 监听 tossing 启动抛掷 ---------- */
    watch(
      () => props.tossing,
      (val) => {
        if (val) {
          startToss()
        } else if (coins.length) {
          // 父组件复位 tossing，保留落定结果展示
          if (state.value !== 'idle') state.value = 'settled'
        }
      }
    )

    /* ---------- 渲染 ---------- */
    return () => {
      const info = resultInfo.value
      const showHint = state.value === 'idle'

      return (
        <div class="coin-toss-wrap">
          <canvas ref={canvasRef} class="coin-toss-canvas" aria-label="铜钱掷卦动画" />
          {info && (
            <div class="coin-toss-result">
              <span class="coin-toss-result__coins">{info.coinStr}</span>
              <span class="coin-toss-result__label">{info.label}</span>
              {info.mark && <span class="coin-toss-result__mark">{info.mark}</span>}
            </div>
          )}
          {showHint && <div class="coin-toss-hint">摇动手机或点击掷卦</div>}
        </div>
      )
    }
  }
})

export default CoinToss
