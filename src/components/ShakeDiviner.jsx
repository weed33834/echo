/**
 * ShakeDiviner — 摇卦主组件
 *
 * 结合 useShake 摇动检测 + CoinToss 铜钱物理动画，完成六爻占卜仪式：
 *  - 合掌默念 → 摇动手机（或桌面点击掷卦）→ 三枚铜钱落定 → 成一爻
 *  - 重复六次，自下而上（初爻→上爻）累积成卦
 *  - 六爻俱备后回调 onHexagramComplete([6/7/8/9, ...])
 *
 * 爻值约定（三枚铜钱：阳面=3，阴面=2，三者求和）：
 *   6 = 老阴（动）  7 = 少阳   8 = 少阴   9 = 老阳（动）
 *
 * Props:
 *  - onHexagramComplete: Function  六爻摇毕回调，参数为 6 个爻值数组（初爻在前）
 *
 * 桌面无 DeviceMotion 时自动回退为"点击掷卦"按钮。
 */
import { defineComponent, ref, computed } from 'vue'
import { useShake } from '@/composables/useShake.js'
import { CoinToss } from '@/components/CoinToss.jsx'
import './shake-diviner.css'

/* 爻位名称（自下而上） */
const YAO_NAMES = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻']
/* 显示顺序（上爻在顶部） */
const YAO_NAMES_TOP_DOWN = ['上爻', '五爻', '四爻', '三爻', '二爻', '初爻']

/* 爻象说明 */
const YAO_DESC = {
  6: '老阴 · 动',
  7: '少阳',
  8: '少阴',
  9: '老阳 · 动'
}

/**
 * 掷三枚铜钱生成一爻
 * 每枚：true=阳面(3)，false=阴面(2)；三者求和得爻值
 * @returns {{ coins: boolean[], yao: number, isYang: boolean, isMoving: boolean }}
 */
function tossCoins() {
  const coins = [
    Math.random() < 0.5,
    Math.random() < 0.5,
    Math.random() < 0.5
  ]
  const yangCount = coins.filter(Boolean).length
  const sum = yangCount * 3 + (3 - yangCount) * 2
  return {
    coins,
    yao: sum,
    isYang: sum === 7 || sum === 9,
    isMoving: sum === 6 || sum === 9
  }
}

export const ShakeDiviner = defineComponent({
  name: 'ShakeDiviner',
  props: {
    onHexagramComplete: { type: Function, default: () => {} }
  },
  setup(props) {
    /* ---- 状态 ---- */
    const yaos = ref([]) // 已摇出的爻值（初爻在前），长度 0-6
    const currentCoins = ref([true, true, true]) // 当前次抛掷的铜钱结果（传给 CoinToss）
    const tossing = ref(false) // CoinToss 动画进行中
    const resetKey = ref(0) // 用于重置时重建 CoinToss
    let pendingYao = null // 待录入的爻值（动画结束后写入）

    const currentIndex = computed(() => yaos.value.length) // 0-5
    const completed = computed(() => yaos.value.length >= 6)

    /* ---- 摇动检测 ---- */
    const handleShake = () => {
      // 摇动一次 = 掷一爻
      startToss()
    }
    const { supported, enabled, enable } = useShake(handleShake, {
      threshold: 18,
      cooldown: 1100 // 略长于一次动画，避免连摇
    })

    /* ---- 核心流程 ---- */
    function startToss() {
      if (tossing.value || completed.value) return
      const { coins, yao } = tossCoins()
      currentCoins.value = coins
      pendingYao = yao
      tossing.value = true
    }

    /** CoinToss 动画结束回调 */
    function handleTossComplete() {
      if (pendingYao != null) {
        yaos.value = [...yaos.value, pendingYao]
        pendingYao = null
      }
      tossing.value = false
      if (yaos.value.length >= 6) {
        // 六爻俱备，回调（异步以等 UI 渲染完成态）
        setTimeout(() => {
          props.onHexagramComplete([...yaos.value])
        }, 100)
      }
    }

    /** 启用摇动感应（iOS 需用户手势触发权限） */
    async function handleEnable() {
      await enable()
    }

    /** 桌面回退：点击掷卦 */
    function handleManualToss() {
      startToss()
    }

    /** 重新摇卦 */
    function handleReset() {
      yaos.value = []
      tossing.value = false
      pendingYao = null
      currentCoins.value = [true, true, true]
      resetKey.value++
    }

    /* ---- 指引文字（随状态变化） ---- */
    const hintText = computed(() => {
      if (completed.value) return '卦象已成，六爻俱备'
      if (!supported.value) {
        return '当前设备不支持摇动感应，请点击下方按钮掷卦，共需六次'
      }
      if (!enabled.value) {
        return '点击下方按钮开启摇卦感应，合掌默念所问之事'
      }
      return `合掌默念所问之事，摇动手机掷出铜钱 · 第 ${currentIndex.value + 1} 爻 / 共六爻`
    })

    /* ---- 渲染单爻行 ---- */
    function renderYaoRow(label, yaoIndex) {
      const yao = yaos.value[yaoIndex]
      const isCurrent = !completed.value && yaoIndex === currentIndex.value
      const isDone = yao != null

      const classes = [
        'shake-diviner__yao-row',
        isCurrent ? 'shake-diviner__yao-row--current' : '',
        isDone ? 'shake-diviner__yao-row--done' : ''
      ].filter(Boolean).join(' ')

      // 爻象内容
      let yaoContent
      if (isDone) {
        const isYang = yao === 7 || yao === 9
        const isMoving = yao === 6 || yao === 9
        const mark = yao === 9 ? '○' : yao === 6 ? '✕' : ''
        const yaoClasses = [
          'shake-diviner__yao',
          isYang ? 'shake-diviner__yao--yang' : 'shake-diviner__yao--yin',
          isMoving ? 'shake-diviner__yao--moving' : ''
        ].filter(Boolean).join(' ')

        yaoContent = (
          <div class={yaoClasses}>
            <div class="shake-diviner__yao-line">
              {isYang
                ? <span class="shake-diviner__yao-seg shake-diviner__yao-seg--full" />
                : <>
                    <span class="shake-diviner__yao-seg" />
                    <span class="shake-diviner__yao-seg" />
                  </>
              }
            </div>
            {mark && <span class="shake-diviner__yao-mark">{mark}</span>}
          </div>
        )
      } else {
        // 占位
        yaoContent = (
          <div class="shake-diviner__yao">
            <div class="shake-diviner__yao-line shake-diviner__yao-line--pending">
              <span class="shake-diviner__yao-seg" />
            </div>
          </div>
        )
      }

      return (
        <div class={classes} key={label}>
          <span class="shake-diviner__yao-label">{label}</span>
          {yaoContent}
        </div>
      )
    }

    /* ---- 渲染 ---- */
    return () => {
      const showEnableBtn = supported.value && !enabled.value && !completed.value
      const showManualBtn =
        (!supported.value || enabled.value) && !completed.value && !tossing.value
      const showResetBtn = completed.value

      // 完成态爻象描述
      const completeDesc = completed.value
        ? yaos.value
            .map((y, i) => `${YAO_NAMES[i]} ${YAO_DESC[y] || ''}`)
            .join('　')
        : ''

      return (
        <div class="shake-diviner">
          {/* 头部 */}
          <div class="shake-diviner__header">
            <div class="shake-diviner__title">摇 卦</div>
            <div class="shake-diviner__subtitle">金钱卦 · 六爻占卜</div>
          </div>

          {/* 铜钱动画区 */}
          <CoinToss
            key={resetKey.value}
            tossing={tossing.value}
            result={currentCoins.value}
            onComplete={handleTossComplete}
          />

          {/* 指引文字 */}
          <div class="shake-diviner__hint">{hintText.value}</div>

          {/* 感应状态徽标 */}
          {enabled.value && !completed.value && (
            <div class="shake-diviner__badge">
              <span class="shake-diviner__badge-dot" />
              感应已开启 · 第 {currentIndex.value + 1} / 6 爻
            </div>
          )}

          {/* 六爻进度（上爻在顶，初爻在底） */}
          <div class="shake-diviner__progress">
            {YAO_NAMES_TOP_DOWN.map((label, i) => {
              // i=0 → 上爻 → yaoIndex=5；i=5 → 初爻 → yaoIndex=0
              const yaoIndex = 5 - i
              return renderYaoRow(label, yaoIndex)
            })}
          </div>

          {/* 操作区 */}
          <div class="shake-diviner__actions">
            {showEnableBtn && (
              <button
                class="shake-diviner__button shake-diviner__button--ghost"
                onClick={handleEnable}
              >
                开启摇卦感应
              </button>
            )}
            {showManualBtn && (
              <button
                class="shake-diviner__button"
                onClick={handleManualToss}
                disabled={tossing.value}
              >
                点击掷卦
              </button>
            )}
          </div>

          {/* 完成态 */}
          {completed.value && (
            <div class="shake-diviner__complete">
              <div class="shake-diviner__complete-title">卦象已成</div>
              <div class="shake-diviner__complete-desc">{completeDesc}</div>
              <button
                class="shake-diviner__button"
                onClick={handleReset}
                style={{ 'margin-top': 'var(--sp-3)' }}
              >
                重新摇卦
              </button>
            </div>
          )}
        </div>
      )
    }
  }
})

export default ShakeDiviner
