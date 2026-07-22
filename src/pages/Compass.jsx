import { defineComponent, ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useEchoStore } from '@/stores/echo.js'
import { TopBar } from '@/components/TabBar.jsx'
import { EchoCard, EchoButton, EchoBadge, showToast } from '@/components/EchoUI.jsx'
import { dayPillar } from '@/utils/engines.js'
import '@/designs/compass.css'

/* ============================================================
 * 常量
 * ============================================================ */
const MOUNTAINS = [
  '子', '癸', '丑', '艮', '寅', '甲', '卯', '乙', '辰', '巽', '巳', '丙',
  '午', '丁', '未', '坤', '申', '庚', '酉', '辛', '戌', '乾', '亥', '壬'
]

const BAGUA = ['坎', '艮', '震', '巽', '离', '坤', '兑', '乾']

const MOUNTAIN_DIR = {
  '子': '正北', '癸': '北', '丑': '东北', '艮': '东北', '寅': '东偏北',
  '甲': '东偏北', '卯': '正东', '乙': '东', '辰': '东南', '巽': '东南',
  '巳': '南偏东', '丙': '南偏东', '午': '正南', '丁': '南', '未': '西南',
  '坤': '西南', '申': '西偏南', '庚': '西偏南', '酉': '正西', '辛': '西',
  '戌': '西北', '乾': '西北', '亥': '北偏西', '壬': '北偏西'
}

// 喜神方位（按日干）
const XI_SHEN = {
  '甲': '艮', '乙': '乾', '丙': '坎', '丁': '离', '戊': '巽',
  '己': '震', '庚': '坤', '辛': '兑', '壬': '离', '癸': '坎'
}
// 财神方位（按日干）
const CAI_SHEN = {
  '甲': '艮', '乙': '艮', '丙': '兑', '丁': '坎', '戊': '坎',
  '己': '坎', '庚': '震', '辛': '离', '壬': '离', '癸': '离'
}
// 贵神方位（按日干）
const GUI_SHEN = {
  '甲': '坤', '乙': '坤', '丙': '乾', '丁': '乾', '戊': '艮',
  '己': '坎', '庚': '艮', '辛': '震', '壬': '巽', '癸': '巽'
}

const BAGUA_LABEL = {
  '坎': '水·智慧', '艮': '山·稳健', '震': '雷·行动', '巽': '风·柔顺',
  '离': '火·光明', '坤': '地·包容', '兑': '泽·喜悦', '乾': '天·刚健'
}

/* ============================================================
 * 罗盘绘制
 * ============================================================ */
function drawCompass(ctx, size, heading, auspicious) {
  const cx = size / 2
  const cy = size / 2
  const outerR = size / 2 - 4
  const innerR = outerR * 0.72
  const baguaR = outerR * 0.52
  const centerR = outerR * 0.28

  ctx.clearRect(0, 0, size, size)

  // 外盘背景（固定）
  const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, outerR)
  bgGrad.addColorStop(0, 'rgba(22, 17, 42, 0.95)')
  bgGrad.addColorStop(0.7, 'rgba(13, 10, 26, 0.95)')
  bgGrad.addColorStop(1, 'rgba(8, 6, 18, 0.98)')
  ctx.beginPath()
  ctx.arc(cx, cy, outerR, 0, Math.PI * 2)
  ctx.fillStyle = bgGrad
  ctx.fill()

  // 外环金边
  ctx.beginPath()
  ctx.arc(cx, cy, outerR, 0, Math.PI * 2)
  ctx.strokeStyle = '#c9a84c'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(cx, cy, outerR - 2, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(201, 168, 76, 0.3)'
  ctx.lineWidth = 1
  ctx.stroke()

  // 吉神方位高亮弧（内盘旋转，但吉方位置是绝对方位，所以画在固定层）
  if (auspicious) {
    for (const [name, mountain] of auspicious) {
      const idx = MOUNTAINS.indexOf(mountain)
      if (idx < 0) continue
      const angle = (idx * 15 - 7.5 - 90) * Math.PI / 180
      const startAngle = angle - 7.5 * Math.PI / 180
      const endAngle = angle + 22.5 * Math.PI / 180

      ctx.beginPath()
      ctx.arc(cx, cy, outerR - 4, startAngle, endAngle)
      ctx.arc(cx, cy, innerR, endAngle, startAngle, true)
      ctx.closePath()

      let color
      if (name === '财神') color = 'rgba(201, 168, 76, 0.18)'
      else if (name === '喜神') color = 'rgba(45, 143, 91, 0.15)'
      else color = 'rgba(122, 95, 240, 0.15)'
      ctx.fillStyle = color
      ctx.fill()
    }
  }

  // === 内盘（随 heading 旋转） ===
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(heading * Math.PI / 180)

  // 二十四山外环
  ctx.beginPath()
  ctx.arc(0, 0, innerR, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(201, 168, 76, 0.4)'
  ctx.lineWidth = 1
  ctx.stroke()

  // 二十四山刻度与文字
  for (let i = 0; i < 24; i++) {
    const angle = (i * 15 - 90) * Math.PI / 180
    const x1 = Math.cos(angle) * (innerR - 8)
    const y1 = Math.sin(angle) * (innerR - 8)
    const x2 = Math.cos(angle) * innerR
    const y2 = Math.sin(angle) * innerR

    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.strokeStyle = i % 2 === 0 ? 'rgba(201, 168, 76, 0.6)' : 'rgba(155, 143, 181, 0.3)'
    ctx.lineWidth = i % 2 === 0 ? 1.5 : 1
    ctx.stroke()

    // 山名
    const tx = Math.cos(angle) * (innerR - 16)
    const ty = Math.sin(angle) * (innerR - 16)
    ctx.save()
    ctx.translate(tx, ty)
    ctx.rotate(angle + Math.PI / 2)
    ctx.fillStyle = i % 2 === 0 ? '#c9a84c' : 'rgba(155, 143, 181, 0.7)'
    ctx.font = `${i % 2 === 0 ? 'bold ' : ''}${size < 300 ? 10 : 12}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(MOUNTAINS[i], 0, 0)
    ctx.restore()
  }

  // 八卦环
  ctx.beginPath()
  ctx.arc(0, 0, baguaR, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(122, 95, 240, 0.3)'
  ctx.lineWidth = 1
  ctx.stroke()

  for (let i = 0; i < 8; i++) {
    const angle = (i * 45 - 90) * Math.PI / 180
    const tx = Math.cos(angle) * (baguaR - 14)
    const ty = Math.sin(angle) * (baguaR - 14)
    ctx.save()
    ctx.translate(tx, ty)
    ctx.rotate(angle + Math.PI / 2)
    ctx.fillStyle = 'rgba(122, 95, 240, 0.8)'
    ctx.font = `bold ${size < 300 ? 13 : 15}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(BAGUA[i], 0, 0)
    ctx.restore()
  }

  ctx.restore()
  // === 内盘旋转结束 ===

  // 天池中心
  const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, centerR)
  centerGrad.addColorStop(0, 'rgba(122, 95, 240, 0.2)')
  centerGrad.addColorStop(0.7, 'rgba(22, 17, 42, 0.9)')
  centerGrad.addColorStop(1, 'rgba(13, 10, 26, 1)')
  ctx.beginPath()
  ctx.arc(cx, cy, centerR, 0, Math.PI * 2)
  ctx.fillStyle = centerGrad
  ctx.fill()
  ctx.strokeStyle = 'rgba(201, 168, 76, 0.5)'
  ctx.lineWidth = 1
  ctx.stroke()

  // 指针（红色指北，金色指南）
  const needleLen = centerR * 0.8
  ctx.save()
  ctx.translate(cx, cy)
  // 北针（红/紫）
  ctx.beginPath()
  ctx.moveTo(0, -needleLen)
  ctx.lineTo(-4, 0)
  ctx.lineTo(4, 0)
  ctx.closePath()
  ctx.fillStyle = '#7a5ff0'
  ctx.fill()
  ctx.strokeStyle = '#c9a84c'
  ctx.lineWidth = 0.5
  ctx.stroke()
  // 南针（金）
  ctx.beginPath()
  ctx.moveTo(0, needleLen)
  ctx.lineTo(-3, 0)
  ctx.lineTo(3, 0)
  ctx.closePath()
  ctx.fillStyle = '#c9a84c'
  ctx.fill()
  ctx.restore()

  // 中心点
  ctx.beginPath()
  ctx.arc(cx, cy, 3, 0, Math.PI * 2)
  ctx.fillStyle = '#c9a84c'
  ctx.fill()

  // 顶部固定指针标记（当前朝向）
  ctx.beginPath()
  ctx.moveTo(cx, 2)
  ctx.lineTo(cx - 6, 14)
  ctx.lineTo(cx + 6, 14)
  ctx.closePath()
  ctx.fillStyle = '#c9a84c'
  ctx.fill()
}

/* ============================================================
 * 组件
 * ============================================================ */
export default defineComponent({
  name: 'Compass',
  setup() {
    const router = useRouter()
    const store = useEchoStore()

    const canvasRef = ref(null)
    const heading = ref(0)
    const smoothHeading = ref(0)
    const permissionState = ref('unknown') // 'unknown' | 'granted' | 'denied' | 'unsupported'
    const manualMode = ref(false)
    const manualAngle = ref(0)
    let raf = null
    let orientationHandler = null

    // 今日吉神方位
    const today = new Date()
    const dp = dayPillar(today.getFullYear(), today.getMonth() + 1, today.getDate())
    const auspicious = computed(() => {
      const list = []
      const xiMt = XI_SHEN[dp.gan]
      const caiMt = CAI_SHEN[dp.gan]
      const guiMt = GUI_SHEN[dp.gan]
      if (xiMt) list.push(['喜神', xiMt])
      if (caiMt) list.push(['财神', caiMt])
      if (guiMt) list.push(['贵神', guiMt])
      return list
    })

    const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`
    const ganZhiStr = `${dp.gan}${dp.zhi}`

    // 当前朝向山
    const currentMountain = computed(() => {
      const h = manualMode.value ? manualAngle.value : smoothHeading.value
      const idx = Math.floor(((h + 7.5) % 360) / 15)
      return MOUNTAINS[idx] || '子'
    })

    const currentDirection = computed(() => MOUNTAIN_DIR[currentMountain.value] || '正北')
    const currentBagua = computed(() => {
      const idx = Math.floor(((smoothHeading.value || manualAngle.value) + 22.5) % 360 / 45)
      return BAGUA[idx] || '坎'
    })

    // 检查当前朝向是否为吉方
    const isAuspicious = computed(() => {
      return auspicious.value.some(([_, mt]) => mt === currentMountain.value)
    })

    const auspiciousLabel = computed(() => {
      const found = auspicious.value.find(([_, mt]) => mt === currentMountain.value)
      return found ? found[0] : null
    })

    /* === 权限请求 === */
    async function requestPermission() {
      if (typeof window === 'undefined') return
      if (typeof DeviceOrientationEvent === 'undefined') {
        permissionState.value = 'unsupported'
        manualMode.value = true
        showToast('设备不支持方向感应，已切换手动模式', 'warn', 2500)
        return
      }
      // iOS 13+
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
          const result = await DeviceOrientationEvent.requestPermission()
          if (result === 'granted') {
            permissionState.value = 'granted'
            startListening()
            showToast('罗盘已开启', 'success', 1500)
          } else {
            permissionState.value = 'denied'
            manualMode.value = true
            showToast('权限被拒绝，已切换手动模式', 'warn', 2500)
          }
        } catch {
          permissionState.value = 'denied'
          manualMode.value = true
        }
      } else {
        // Android / desktop with sensor
        permissionState.value = 'granted'
        startListening()
      }
    }

    /* === 开始监听 === */
    function startListening() {
      orientationHandler = (event) => {
        let h
        if (event.webkitCompassHeading !== undefined) {
          h = event.webkitCompassHeading
        } else if (event.alpha !== null) {
          h = 360 - event.alpha
        }
        if (h !== undefined && !isNaN(h)) {
          heading.value = h
        }
      }
      window.addEventListener('deviceorientation', orientationHandler)
      window.addEventListener('deviceorientationabsolute', orientationHandler)
      startRender()
    }

    /* === 渲染循环 === */
    function startRender() {
      if (raf) cancelAnimationFrame(raf)
      function render() {
        // 低通滤波平滑
        if (!manualMode.value) {
          let diff = heading.value - smoothHeading.value
          if (diff > 180) diff -= 360
          if (diff < -180) diff += 360
          smoothHeading.value = (smoothHeading.value + diff * 0.15 + 360) % 360
        }
        const canvas = canvasRef.value
        if (canvas) {
          const ctx = canvas.getContext('2d')
          const dpr = window.devicePixelRatio || 1
          const displaySize = canvas.clientWidth
          if (canvas.width !== displaySize * dpr) {
            canvas.width = displaySize * dpr
            canvas.height = displaySize * dpr
          }
          ctx.save()
          ctx.scale(dpr, dpr)
          const drawHeading = manualMode.value ? manualAngle.value : smoothHeading.value
          drawCompass(ctx, displaySize, drawHeading, auspicious.value)
          ctx.restore()
        }
        raf = requestAnimationFrame(render)
      }
      render()
    }

    /* === 手动模式拖拽 === */
    let dragging = false
    let dragStartAngle = 0
    let dragStartHeading = 0

    function onPointerDown(e) {
      if (!manualMode.value) return
      dragging = true
      const canvas = canvasRef.value
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      dragStartAngle = Math.atan2(e.clientY - cy, e.clientX - cx)
      dragStartHeading = manualAngle.value
      e.target.setPointerCapture(e.pointerId)
    }

    function onPointerMove(e) {
      if (!dragging) return
      const canvas = canvasRef.value
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const angle = Math.atan2(e.clientY - cy, e.clientX - cx)
      const delta = (angle - dragStartAngle) * 180 / Math.PI
      manualAngle.value = (dragStartHeading + delta + 360) % 360
    }

    function onPointerUp() {
      dragging = false
    }

    /* === 切换手动模式 === */
    function switchToManual() {
      manualMode.value = true
      if (orientationHandler) {
        window.removeEventListener('deviceorientation', orientationHandler)
        window.removeEventListener('deviceorientationabsolute', orientationHandler)
      }
      startRender()
      showToast('已切换手动模式，拖动罗盘旋转', 'default', 2000)
    }

    onMounted(() => {
      // 检测是否支持
      if (typeof DeviceOrientationEvent === 'undefined') {
        permissionState.value = 'unsupported'
        manualMode.value = true
        startRender()
      } else if (typeof DeviceOrientationEvent.requestPermission !== 'function') {
        // Android: 不需要权限，但先不自动启动，等用户点击
        permissionState.value = 'unknown'
      } else {
        permissionState.value = 'unknown'
      }

      // 如果是手动模式，启动渲染
      if (manualMode.value) {
        startRender()
      }
    })

    onUnmounted(() => {
      if (raf) cancelAnimationFrame(raf)
      if (orientationHandler) {
        window.removeEventListener('deviceorientation', orientationHandler)
        window.removeEventListener('deviceorientationabsolute', orientationHandler)
      }
    })

    return () => (
      <div class="compass-page">
        <TopBar title="风水罗盘" back />
        <div class="container">
          {/* 日期与干支 */}
          <div class="compass-page__date">
            <span>{dateStr}</span>
            <span class="compass-page__ganzhi">{ganZhiStr}日</span>
          </div>

          {/* 罗盘 */}
          <div class="compass-canvas-wrap">
            {(permissionState.value === 'unknown' && !manualMode.value) ? (
              <div class="compass-permission">
                <div class="compass-permission__icon"> ⊕ </div>
                <p class="compass-permission__text">
                  开启方向感应，手机转动罗盘跟着转
                </p>
                <EchoButton variant="primary" onClick={requestPermission}>开启罗盘</EchoButton>
                <button class="compass-permission__manual" onClick={switchToManual}>
                  或使用手动模式
                </button>
              </div>
            ) : (
              <canvas
                ref={canvasRef}
                class="compass-canvas"
                onPointerdown={onPointerDown}
                onPointermove={onPointerMove}
                onPointerup={onPointerUp}
                onPointerleave={onPointerUp}
              />
            )}
          </div>

          {/* 当前朝向 */}
          <EchoCard level="primary" title="当前朝向">
            <div class="compass-info">
              <div class="compass-info__main">
                <span class="compass-info__mountain">{currentMountain.value}山</span>
                <span class="compass-info__dir">{currentDirection.value}</span>
              </div>
              {auspiciousLabel.value && (
                <EchoBadge variant="gold">{auspiciousLabel.value}方位</EchoBadge>
              )}
              <div class="compass-info__bagua">
                八宫·{currentBagua.value}：{BAGUA_LABEL[currentBagua.value]}
              </div>
              {manualMode.value && (
                <div class="compass-info__manual-hint">手动模式 · 拖动罗盘旋转</div>
              )}
            </div>
          </EchoCard>

          {/* 今日吉方 */}
          <EchoCard level="secondary" title="今日吉神方位">
            <div class="compass-directions">
              {auspicious.value.map(([name, mt]) => (
                <div class={`compass-direction compass-direction--${name === '财神' ? 'gold' : name === '喜神' ? 'green' : 'accent'}`}>
                  <div class="compass-direction__name">{name}</div>
                  <div class="compass-direction__mountain">{mt}山</div>
                  <div class="compass-direction__dir">{MOUNTAIN_DIR[mt]}</div>
                </div>
              ))}
            </div>
            <p class="compass-directions__hint">
              {dp.gan}{dp.zhi}日，{auspicious.value.map(([n, m]) => `${n}在${m}山`).join('，')}。出门办事可朝吉方先行。
            </p>
          </EchoCard>

          {/* 个人喜用方位 */}
          {store.profileBazi && (
            <EchoCard level="tertiary" title="个人喜用方位">
              <div class="compass-wx-hint">
                {store.profileBazi.dayMasterLabel}（{store.profileBazi.dayMasterWx}）的喜用方位如下，
                长期坐卧朝向喜用方有助于气场调谐。
              </div>
              <div class="compass-wx-dirs">
                {store.profileBazi.favorable && store.profileBazi.favorable.map(wx => {
                  const dirMap = { '木': '东方', '火': '南方', '土': '中央', '金': '西方', '水': '北方' }
                  return (
                    <div class="compass-wx-dir">
                      <span class="compass-wx-dir__wx">{wx}</span>
                      <span class="compass-wx-dir__dir">{dirMap[wx]}</span>
                    </div>
                  )
                })}
              </div>
            </EchoCard>
          )}
        </div>
      </div>
    )
  }
})
