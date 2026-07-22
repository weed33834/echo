/**
 * useShake — 设备摇动检测 composable
 *
 * 基于 DeviceMotion API 检测手机摇动手势，用于"摇卦"仪式。
 *
 * 用法（在 setup 中）:
 *   const { supported, enabled, shakeCount, enable, disable } = useShake(onShake, {
 *     threshold: 18,   // 加速度增量阈值（m/s²）
 *     cooldown: 800    // 两次摇动最小间隔（ms）
 *   })
 *
 * 注意:
 *  - iOS 13+ 需用户手势触发 requestPermission，故 enable() 须在点击/摇动回调中调用。
 *  - onUnmounted 自动解绑监听，避免内存泄漏。
 *  - 首帧采样不触发误判（lastX/Y/Z 初始为 0，首帧 delta 极大）。
 */
import { ref, onUnmounted } from 'vue'

export function useShake(onShake, options = {}) {
  const { threshold = 18, cooldown = 800 } = options
  const supported = ref(false)
  const enabled = ref(false)
  const shakeCount = ref(0)

  let lastShake = 0
  let lastX = 0, lastY = 0, lastZ = 0
  let firstSample = true
  let handler = null

  // 能力探测：仅浏览器环境且存在 DeviceMotionEvent
  supported.value =
    typeof window !== 'undefined' && 'DeviceMotionEvent' in window

  /**
   * 启用摇动监听
   * iOS 13+ 需异步请求权限；其余平台直接挂载监听。
   * @returns {Promise<boolean>} 是否成功启用
   */
  async function enable() {
    if (!supported.value) return false
    // 已启用则幂等返回
    if (enabled.value && handler) return true

    // iOS 13+ 权限请求
    if (
      typeof DeviceMotionEvent !== 'undefined' &&
      typeof DeviceMotionEvent.requestPermission === 'function'
    ) {
      try {
        const result = await DeviceMotionEvent.requestPermission()
        if (result !== 'granted') return false
      } catch {
        return false
      }
    }

    firstSample = true
    handler = (e) => {
      const a = e.accelerationIncludingGravity
      if (!a || a.x == null || a.y == null || a.z == null) return

      // 首帧仅记录基准，避免初始 0 值造成误判
      if (firstSample) {
        lastX = a.x; lastY = a.y; lastZ = a.z
        firstSample = false
        return
      }

      const dx = a.x - lastX
      const dy = a.y - lastY
      const dz = a.z - lastZ
      const delta = Math.sqrt(dx * dx + dy * dy + dz * dz)
      const now = Date.now()

      if (delta > threshold && now - lastShake > cooldown) {
        lastShake = now
        shakeCount.value++
        // 透传增量幅度，便于调用方做力度反馈
        if (typeof onShake === 'function') onShake(delta)
      }

      lastX = a.x; lastY = a.y; lastZ = a.z
    }

    window.addEventListener('devicemotion', handler)
    enabled.value = true
    return true
  }

  /** 关闭摇动监听 */
  function disable() {
    if (handler) {
      window.removeEventListener('devicemotion', handler)
      handler = null
    }
    enabled.value = false
  }

  // 组件卸载时自动清理
  onUnmounted(disable)

  return { supported, enabled, shakeCount, enable, disable }
}

export default useShake
