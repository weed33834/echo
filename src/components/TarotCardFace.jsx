/**
 * TarotCardFace — 塔罗牌面 SVG 可视化组件
 *
 * 使用纯 SVG 绘制 78 张塔罗牌的牌面设计：
 *  - 22 张大阿卡纳：每张有独特的象征性 SVG 插画
 *  - 56 张小阿卡纳：四种花色（权杖/圣杯/宝剑/星币）+ 数字排列
 *
 * 每张牌包含：上方 SVG 插画区、中间罗马数字编号、下方牌名。
 * 逆位时整个卡牌 180 度旋转（通过 CSS class 控制）。
 *
 * 颜色使用 CSS 变量：var(--accent) 紫、var(--gold) 金、var(--ink) 文字、var(--bg-2) 背景。
 *
 * Props:
 *  - card: Object    引擎返回的卡牌对象 { name, num, arcana, suit, meaning, reversed }
 *  - upright: Boolean 是否正位（默认 true）
 *  - isKeyCard: Boolean 是否关键牌（默认 false）
 */
import { defineComponent, computed } from 'vue'
import './tarot-card.css'

/* ---- 模块级 UID 计数器，为每张牌的 SVG 渐变生成唯一 ID ---- */
let _tarotUidSeq = 0

/* ============================================================
 * 工具函数
 * ============================================================ */

/** 数字转罗马数字（0-21 大阿卡纳、1-14 小阿卡纳） */
function toRoman(num) {
  if (num === 0) return '0'
  const table = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ]
  let n = num
  let out = ''
  for (const [v, s] of table) {
    while (n >= v) { out += s; n -= v }
  }
  return out
}

/** 从卡牌对象识别花色（兼容引擎的"钱币"与用户提到的"星币"） */
function detectSuit(card) {
  if (card.suit) return card.suit
  const name = card.name || ''
  if (name.includes('权杖')) return '权杖'
  if (name.includes('圣杯')) return '圣杯'
  if (name.includes('宝剑')) return '宝剑'
  if (name.includes('钱币') || name.includes('星币')) return '钱币'
  return ''
}

/** 规整显示名：Ace → 首牌 */
function displayCardName(card) {
  let n = card.name || ''
  if (n.endsWith('Ace')) n = n.replace('Ace', '首牌')
  return n
}

/* ============================================================
 * 星形/几何辅助路径
 * ============================================================ */

/** 五角星路径（外径 r，尖朝上），以 (0,0) 为中心 */
function star5Path(r) {
  const R = r, r2 = r * 0.382
  const pts = []
  for (let i = 0; i < 10; i++) {
    const angle = (-90 + i * 36) * Math.PI / 180
    const rad = i % 2 === 0 ? R : r2
    pts.push(`${(rad * Math.cos(angle)).toFixed(1)},${(rad * Math.sin(angle)).toFixed(1)}`)
  }
  return 'M' + pts.join(' L') + ' Z'
}

/** 八角星（两个正方形旋转叠加），以 (cx,cy) 为中心 */
function star8Paths(cx, cy, r) {
  const s = r * 0.92
  return [
    `M${cx},${cy - s} L${cx + s * 0.7},${cy - s * 0.7} L${cx + s},${cy} L${cx + s * 0.7},${cy + s * 0.7} L${cx},${cy + s} L${cx - s * 0.7},${cy + s * 0.7} L${cx - s},${cy} L${cx - s * 0.7},${cy - s * 0.7} Z`,
    `M${cx},${cy - s} L${cx + s * 0.7},${cy + s * 0.7} L${cx - s * 0.7},${cy + s * 0.7} Z M${cx},${cy + s} L${cx + s * 0.7},${cy - s * 0.7} L${cx - s * 0.7},${cy - s * 0.7} Z`
  ]
}

/* ============================================================
 * 小阿卡纳花色符号
 * ============================================================ */

/** 权杖符号（竖直法杖 + 顶端嫩芽） */
function renderWand() {
  return (
    <g>
      <line x1="0" y1="-14" x2="0" y2="14" class="tcf-line-accent" stroke-width="3.5" stroke-linecap="round" />
      <path d="M0,-14 Q-6,-19 -4,-25 M0,-14 Q6,-19 4,-25" class="tcf-line-accent" stroke-width="2.5" stroke-linecap="round" fill="none" />
      <circle cx="0" cy="-14" r="2.5" class="tcf-f-gold" />
    </g>
  )
}

/** 圣杯符号（高脚杯） */
function renderCup() {
  return (
    <g>
      <path d="M-9,-12 L9,-12 L7,-2 Q0,5 -7,-2 Z" class="tcf-f-accent" />
      <path d="M-9,-12 L9,-12" class="tcf-line-gold" stroke-width="1.5" />
      <rect x="-1.5" y="-3" width="3" height="8" class="tcf-f-accent" />
      <ellipse cx="0" cy="6" rx="9" ry="2.5" class="tcf-f-accent" />
      <path d="M-5,-9 Q0,-6 5,-9" class="tcf-line-gold" stroke-width="1" fill="none" opacity="0.6" />
    </g>
  )
}

/** 宝剑符号（竖直长剑，尖朝上） */
function renderSword() {
  return (
    <g>
      <path d="M0,-18 L3.5,-6 L3.5,4 L-3.5,4 L-3.5,-6 Z" class="tcf-f-gold" />
      <path d="M0,-18 L0,4" class="tcf-line-ink" stroke-width="0.8" opacity="0.3" />
      <rect x="-8" y="4" width="16" height="2.5" rx="1" class="tcf-f-gold" />
      <rect x="-1.5" y="6.5" width="3" height="7" class="tcf-f-accent" />
      <circle cx="0" cy="15" r="2.5" class="tcf-f-gold" />
    </g>
  )
}

/** 星币符号（五角星 + 圆环） */
function renderPentacle() {
  return (
    <g>
      <circle cx="0" cy="0" r="12" class="tcf-line-gold" stroke-width="2" fill="none" />
      <path d={star5Path(8)} class="tcf-f-gold" opacity="0.85" />
    </g>
  )
}

/** 根据花色返回对应符号 */
function renderSuitSymbol(suit) {
  if (suit === '权杖') return renderWand()
  if (suit === '圣杯') return renderCup()
  if (suit === '宝剑') return renderSword()
  return renderPentacle() // 钱币/星币
}

/* ============================================================
 * 小阿卡纳数字排列布局
 * ============================================================ */

/** 返回 count 个符号的 {x, y, scale} 坐标数组 */
function pipLayout(count) {
  const cx = 90
  const layouts = {
    1: [[cx, 95, 2.6]],
    2: [[cx - 28, 95, 1.7], [cx + 28, 95, 1.7]],
    3: [[cx, 50, 1.6], [cx - 32, 130, 1.6], [cx + 32, 130, 1.6]],
    4: [[cx - 30, 60, 1.5], [cx + 30, 60, 1.5], [cx - 30, 130, 1.5], [cx + 30, 130, 1.5]],
    5: [[cx, 45, 1.4], [cx - 34, 95, 1.4], [cx + 34, 95, 1.4], [cx - 30, 145, 1.4], [cx + 30, 145, 1.4]],
    6: [[cx - 30, 50, 1.3], [cx, 50, 1.3], [cx + 30, 50, 1.3], [cx - 30, 130, 1.3], [cx, 130, 1.3], [cx + 30, 130, 1.3]],
    7: [[cx - 30, 45, 1.2], [cx, 45, 1.2], [cx + 30, 45, 1.2], [cx, 95, 1.2], [cx - 30, 145, 1.2], [cx, 145, 1.2], [cx + 30, 145, 1.2]],
    8: [[cx - 30, 45, 1.1], [cx, 45, 1.1], [cx + 30, 45, 1.1], [cx - 22, 95, 1.1], [cx + 22, 95, 1.1], [cx - 30, 145, 1.1], [cx, 145, 1.1], [cx + 30, 145, 1.1]],
    9: [[cx - 30, 50, 1.1], [cx, 50, 1.1], [cx + 30, 50, 1.1], [cx - 30, 95, 1.1], [cx, 95, 1.1], [cx + 30, 95, 1.1], [cx - 30, 140, 1.1], [cx, 140, 1.1], [cx + 30, 140, 1.1]],
    10: [[cx - 34, 45, 1.0], [cx - 12, 45, 1.0], [cx + 12, 45, 1.0], [cx + 34, 45, 1.0], [cx - 22, 90, 1.0], [cx + 22, 90, 1.0], [cx - 34, 135, 1.0], [cx - 12, 135, 1.0], [cx + 12, 135, 1.0], [cx + 34, 135, 1.0]]
  }
  return layouts[count] || layouts[1]
}

/** 小阿卡纳宫廷牌（侍从/骑士/王后/国王）渲染 */
function renderCourtCard(suit, num) {
  const symbol = renderSuitSymbol(suit)
  // 王冠路径
  const crown = (
    <path d="M-14,-30 L-14,-22 L-7,-27 L0,-20 L7,-27 L14,-22 L14,-30 L10,-34 L7,-30 L3,-36 L0,-32 L-3,-36 L-7,-30 L-10,-34 Z"
      class="tcf-f-gold" transform="translate(90, 38)" />
  )
  // 侍从用小帽，骑士用马头，王后/国王用王冠
  if (num === 11) {
    // 侍从：小圆帽 + 符号
    return (
      <g>
        <path d="M-10,-8 Q0,-16 10,-8" class="tcf-line-accent" stroke-width="2" fill="none" transform="translate(90, 50)" />
        <g transform="translate(90, 100) scale(1.8)">{symbol}</g>
        <text x="90" y="160" text-anchor="middle" class="tcf-f-muted" font-size="9">侍从</text>
      </g>
    )
  }
  if (num === 12) {
    // 骑士：马头轮廓 + 符号
    return (
      <g>
        <path d="M-12,-5 Q-14,-15 -6,-18 Q0,-22 6,-18 Q14,-15 12,-5 L8,5 L-8,5 Z"
          class="tcf-line-accent" stroke-width="2" fill="none" transform="translate(90, 55)" />
        <circle cx="-4" cy="-10" r="1.5" class="tcf-f-gold" transform="translate(90, 55)" />
        <g transform="translate(90, 105) scale(1.8)">{symbol}</g>
        <text x="90" y="160" text-anchor="middle" class="tcf-f-muted" font-size="9">骑士</text>
      </g>
    )
  }
  if (num === 13) {
    // 王后：王冠 + 符号
    return (
      <g>
        <path d="M-12,-8 L-12,0 L-6,-5 L0,2 L6,-5 L12,0 L12,-8 Z" class="tcf-f-gold" transform="translate(90, 50)" />
        <circle cx="0" cy="-3" r="1.5" class="tcf-f-accent" transform="translate(90, 50)" />
        <g transform="translate(90, 110) scale(2.0)">{symbol}</g>
        <text x="90" y="170" text-anchor="middle" class="tcf-f-muted" font-size="9">王后</text>
      </g>
    )
  }
  // 国王：大王冠 + 符号
  return (
    <g>
      {crown}
      <g transform="translate(90, 110) scale(2.2)">{symbol}</g>
      <text x="90" y="170" text-anchor="middle" class="tcf-f-muted" font-size="9">国王</text>
    </g>
  )
}

/** 小阿卡纳渲染入口 */
function renderMinorArcana(suit, num) {
  if (num >= 11) {
    return renderCourtCard(suit, num)
  }
  // Ace (num=1)：单个大符号 + 放射光线
  if (num === 1) {
    return (
      <g>
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * 45) * Math.PI / 180
          return <line x1={90 + Math.cos(a) * 35} y1={100 + Math.sin(a) * 35}
            x2={90 + Math.cos(a) * 48} y2={100 + Math.sin(a) * 48}
            class="tcf-line-gold" stroke-width="1" opacity="0.4" key={i} />
        })}
        <g transform="translate(90, 100) scale(2.8)">{renderSuitSymbol(suit)}</g>
      </g>
    )
  }
  // 数字牌 2-10
  const pips = pipLayout(num)
  return (
    <g>
      {pips.map((p, i) => (
        <g transform={`translate(${p[0]},${p[1]}) scale(${p[2]})`} key={i}>{renderSuitSymbol(suit)}</g>
      ))}
    </g>
  )
}

/* ============================================================
 * 22 张大阿卡纳 SVG 插画
 * 每个函数返回一个 <g> 组，绘制在 viewBox "0 0 180 300" 上半区
 * ============================================================ */

const MAJOR_ART = {
  /* 0. 愚者 — 太阳、行走的人、悬崖、小狗 */
  0: () => (
    <g>
      {/* 太阳 */}
      <circle cx="140" cy="38" r="11" class="tcf-f-gold" />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * 45) * Math.PI / 180
        return <line x1={140 + Math.cos(a) * 14} y1={38 + Math.sin(a) * 14}
          x2={140 + Math.cos(a) * 20} y2={38 + Math.sin(a) * 20}
          class="tcf-line-gold" stroke-width="1.5" key={i} />
      })}
      {/* 人物 */}
      <circle cx="78" cy="70" r="7" class="tcf-f-accent" />
      <path d="M78,77 L72,105 L68,135 M78,77 L86,105 L92,132" class="tcf-line-accent" stroke-width="2.5" stroke-linecap="round" fill="none" />
      {/* 行囊杖 */}
      <line x1="92" y1="60" x2="100" y2="135" class="tcf-line-gold" stroke-width="2" stroke-linecap="round" />
      <circle cx="94" cy="55" r="5" class="tcf-f-gold" opacity="0.8" />
      {/* 悬崖 */}
      <path d="M10,165 L40,150 L60,160 L75,145 L90,175 L75,185 L50,180 L30,190 L10,185 Z" class="tcf-f-ink2" opacity="0.6" />
      {/* 小狗 */}
      <ellipse cx="105" cy="140" rx="6" ry="4" class="tcf-f-accent2" />
      <circle cx="111" cy="138" r="3" class="tcf-f-accent2" />
    </g>
  ),

  /* 1. 魔术师 — 无限符号、四元素工具 */
  1: () => (
    <g>
      {/* 无限符号 */}
      <path d="M75,40 Q65,30 80,30 Q95,30 85,40 Q75,50 90,50 Q105,50 95,40" class="tcf-line-gold" stroke-width="2.5" fill="none" />
      {/* 人物 */}
      <circle cx="90" cy="75" r="7" class="tcf-f-accent" />
      <path d="M90,82 L90,115 M90,90 L78,100 M90,90 L102,100 M90,115 L82,145 M90,115 L98,145" class="tcf-line-accent" stroke-width="2.5" stroke-linecap="round" fill="none" />
      {/* 桌子 */}
      <line x1="40" y1="150" x2="140" y2="150" class="tcf-line-gold" stroke-width="2" />
      {/* 四元素：圣杯、宝剑、权杖、星币 */}
      <g transform="translate(55, 168) scale(0.8)">{renderCup()}</g>
      <g transform="translate(80, 168) scale(0.8)">{renderSword()}</g>
      <g transform="translate(105, 168) scale(0.8)">{renderWand()}</g>
      <g transform="translate(128, 168) scale(0.8)">{renderPentacle()}</g>
    </g>
  ),

  /* 2. 女祭司 — 双柱、新月、卷轴 */
  2: () => (
    <g>
      {/* 左柱（暗） */}
      <rect x="24" y="35" width="14" height="150" rx="2" class="tcf-f-ink2" />
      <text x="31" y="100" text-anchor="middle" class="tcf-f-gold" font-size="12" font-weight="bold">B</text>
      {/* 右柱（明） */}
      <rect x="142" y="35" width="14" height="150" rx="2" class="tcf-f-bg3 tcf-s-gold" stroke-width="1" />
      <text x="149" y="100" text-anchor="middle" class="tcf-f-accent" font-size="12" font-weight="bold">J</text>
      {/* 新月冠 */}
      <path d="M82,42 Q90,30 98,42 Q90,38 82,42" class="tcf-f-gold" />
      <path d="M82,42 A8,8 0 0 0 98,42" class="tcf-line-gold" stroke-width="1.5" fill="none" />
      {/* 人物 */}
      <circle cx="90" cy="70" r="6" class="tcf-f-accent2" />
      <path d="M82,78 L98,78 L96,130 L84,130 Z" class="tcf-f-accent" opacity="0.7" />
      {/* 卷轴 */}
      <rect x="74" y="100" width="32" height="14" rx="2" class="tcf-f-gold" opacity="0.8" />
      <line x1="78" y1="104" x2="102" y2="104" class="tcf-line-ink" stroke-width="0.5" opacity="0.4" />
      <line x1="78" y1="108" x2="102" y2="108" class="tcf-line-ink" stroke-width="0.5" opacity="0.4" />
      <line x1="78" y1="112" x2="98" y2="112" class="tcf-line-ink" stroke-width="0.5" opacity="0.4" />
      {/* 十字 */}
      <line x1="90" y1="50" x2="90" y2="60" class="tcf-line-gold" stroke-width="1.5" />
      <line x1="86" y1="55" x2="94" y2="55" class="tcf-line-gold" stroke-width="1.5" />
    </g>
  ),

  /* 3. 皇后 — 星冠、金星符号、麦穗 */
  3: () => (
    <g>
      {/* 十二星冠 */}
      {Array.from({ length: 7 }, (_, i) => {
        const a = (-150 + i * 30) * Math.PI / 180
        return <path d={star5Path(4)} class="tcf-f-gold" transform={`translate(${90 + Math.cos(a) * 30},${45 + Math.sin(a) * 18})`} key={i} />
      })}
      {/* 人物 */}
      <circle cx="90" cy="85" r="7" class="tcf-f-accent" />
      <path d="M78,95 L102,95 L106,155 L74,155 Z" class="tcf-f-accent2" opacity="0.7" />
      {/* 金星符号 ♀ */}
      <circle cx="90" cy="125" r="10" class="tcf-line-gold" stroke-width="2" fill="none" />
      <line x1="90" y1="135" x2="90" y2="148" class="tcf-line-gold" stroke-width="2" />
      <line x1="84" y1="142" x2="96" y2="142" class="tcf-line-gold" stroke-width="2" />
      {/* 麦穗 */}
      <path d="M50,155 Q48,130 52,110" class="tcf-line-gold" stroke-width="1.5" fill="none" />
      <path d="M48,130 L44,125 M52,130 L56,125 M50,120 L46,115 M52,115 L56,110" class="tcf-line-gold" stroke-width="1" fill="none" />
      <path d="M130,155 Q132,130 128,110" class="tcf-line-gold" stroke-width="1.5" fill="none" />
      <path d="M132,130 L136,125 M128,130 L124,125 M130,120 L134,115 M128,115 L124,110" class="tcf-line-gold" stroke-width="1" fill="none" />
    </g>
  ),

  /* 4. 皇帝 — 王座、公羊角、王冠 */
  4: () => (
    <g>
      {/* 王座靠背 */}
      <rect x="60" y="50" width="60" height="120" rx="4" class="tcf-f-ink2" opacity="0.5" />
      <rect x="56" y="46" width="68" height="8" rx="2" class="tcf-f-gold" />
      {/* 公羊角 */}
      <path d="M56,55 Q40,50 36,65 Q38,72 46,68" class="tcf-line-gold" stroke-width="2" fill="none" />
      <path d="M124,55 Q140,50 144,65 Q142,72 134,68" class="tcf-line-gold" stroke-width="2" fill="none" />
      {/* 王冠 */}
      <path d="M76,40 L76,50 L84,44 L90,52 L96,44 L104,50 L104,40 Z" class="tcf-f-gold" />
      {/* 人物 */}
      <circle cx="90" cy="75" r="7" class="tcf-f-accent" />
      <path d="M82,82 L98,82 L100,120 L80,120 Z" class="tcf-f-accent2" opacity="0.8" />
      {/* 胡须 */}
      <path d="M86,82 L84,100 M90,82 L90,105 M94,82 L96,100" class="tcf-line-muted" stroke-width="1" fill="none" />
      {/* 权杖 */}
      <line x1="115" y1="85" x2="125" y2="145" class="tcf-line-gold" stroke-width="2" stroke-linecap="round" />
      <circle cx="115" cy="83" r="3" class="tcf-f-gold" />
    </g>
  ),

  /* 5. 教皇 — 三重冠、交叉钥匙 */
  5: () => (
    <g>
      {/* 三重冕 */}
      <ellipse cx="90" cy="40" rx="14" ry="5" class="tcf-f-gold" />
      <path d="M76,40 Q90,20 104,40" class="tcf-f-gold" />
      <ellipse cx="90" cy="35" rx="10" ry="4" class="tcf-f-gold" opacity="0.8" />
      <ellipse cx="90" cy="30" rx="7" ry="3" class="tcf-f-gold" opacity="0.6" />
      {/* 十字 */}
      <line x1="90" y1="20" x2="90" y2="30" class="tcf-line-gold" stroke-width="1.5" />
      <line x1="86" y1="24" x2="94" y2="24" class="tcf-line-gold" stroke-width="1.5" />
      {/* 人物 */}
      <circle cx="90" cy="65" r="6" class="tcf-f-accent" />
      <path d="M80,72 L100,72 L104,130 L76,130 Z" class="tcf-f-accent2" opacity="0.7" />
      {/* 交叉钥匙 */}
      <g transform="translate(90, 150)">
        <circle cx="-12" cy="0" r="4" class="tcf-line-gold" stroke-width="2" fill="none" />
        <line x1="-8" y1="0" x2="12" y2="0" class="tcf-line-gold" stroke-width="2.5" />
        <line x1="8" y1="0" x2="8" y2="6" class="tcf-line-gold" stroke-width="2.5" />
        <line x1="12" y1="0" x2="12" y2="6" class="tcf-line-gold" stroke-width="2.5" />
        <circle cx="12" cy="0" r="4" class="tcf-line-gold" stroke-width="2" fill="none" />
        <line x1="-12" y1="0" x2="8" y2="0" class="tcf-line-gold" stroke-width="2.5" transform="rotate(180)" />
      </g>
      {/* 两名信徒 */}
      <circle cx="50" cy="160" r="4" class="tcf-f-muted" />
      <circle cx="130" cy="160" r="4" class="tcf-f-muted" />
    </g>
  ),

  /* 6. 恋人 — 天使/太阳、双人、心形 */
  6: () => (
    <g>
      {/* 天使/太阳 */}
      <circle cx="90" cy="40" r="10" class="tcf-f-gold" />
      {Array.from({ length: 6 }, (_, i) => {
        const a = (-150 + i * 60) * Math.PI / 180
        return <line x1={90 + Math.cos(a) * 13} y1={40 + Math.sin(a) * 13}
          x2={90 + Math.cos(a) * 18} y2={40 + Math.sin(a) * 18}
          class="tcf-line-gold" stroke-width="1.5" key={i} />
      })}
      {/* 翅膀 */}
      <path d="M80,40 Q60,45 55,60 M100,40 Q120,45 125,60" class="tcf-line-accent" stroke-width="1.5" fill="none" opacity="0.6" />
      {/* 左人 */}
      <circle cx="65" cy="95" r="6" class="tcf-f-accent" />
      <path d="M59,101 L71,101 L69,145 L61,145 Z" class="tcf-f-accent2" opacity="0.7" />
      {/* 右人 */}
      <circle cx="115" cy="95" r="6" class="tcf-f-accent" />
      <path d="M109,101 L121,101 L119,145 L111,145 Z" class="tcf-f-accent2" opacity="0.7" />
      {/* 心形 */}
      <path d="M90,115 C85,108 75,108 75,118 C75,128 90,138 90,138 C90,138 105,128 105,118 C105,108 95,108 90,115 Z" class="tcf-f-gold" opacity="0.8" />
      {/* 树 */}
      <path d="M40,150 L40,120 M40,120 Q30,115 32,105 M40,120 Q50,115 48,105" class="tcf-line-accent" stroke-width="1.5" fill="none" opacity="0.5" />
      <path d="M140,150 L140,120 M140,120 Q130,115 132,105 M140,120 Q150,115 148,105" class="tcf-line-accent" stroke-width="1.5" fill="none" opacity="0.5" />
    </g>
  ),

  /* 7. 战车 — 战车、双马、星篷 */
  7: () => (
    <g>
      {/* 星形篷顶 */}
      <rect x="50" y="45" width="80" height="25" rx="3" class="tcf-f-ink2" />
      {[[60, 57], [80, 57], [100, 57], [120, 57], [70, 52], [90, 52], [110, 52]].map((p, i) => (
        <path d={star5Path(3)} class="tcf-f-gold" transform={`translate(${p[0]},${p[1]})`} key={i} />
      ))}
      {/* 战车车身 */}
      <path d="M50,70 L130,70 L125,120 L55,120 Z" class="tcf-f-accent" opacity="0.8" />
      {/* 轮子 */}
      <circle cx="65" cy="125" r="12" class="tcf-line-gold" stroke-width="2" fill="none" />
      <circle cx="115" cy="125" r="12" class="tcf-line-gold" stroke-width="2" fill="none" />
      <line x1="65" y1="113" x2="65" y2="137" class="tcf-line-gold" stroke-width="1" />
      <line x1="53" y1="125" x2="77" y2="125" class="tcf-line-gold" stroke-width="1" />
      <line x1="115" y1="113" x2="115" y2="137" class="tcf-line-gold" stroke-width="1" />
      <line x1="103" y1="125" x2="127" y2="125" class="tcf-line-gold" stroke-width="1" />
      {/* 双马头 */}
      <path d="M35,80 Q25,70 30,55 Q40,50 45,60 L42,85" class="tcf-line-accent" stroke-width="2" fill="none" />
      <circle cx="33" cy="58" r="1.5" class="tcf-f-gold" />
      <path d="M145,80 Q155,70 150,55 Q140,50 135,60 L138,85" class="tcf-line-accent" stroke-width="2" fill="none" />
      <circle cx="147" cy="58" r="1.5" class="tcf-f-gold" />
      {/* 驾驶者 */}
      <circle cx="90" cy="60" r="5" class="tcf-f-gold" />
      <line x1="90" y1="65" x2="90" y2="80" class="tcf-line-gold" stroke-width="2" />
    </g>
  ),

  /* 8. 力量 — 狮子、无限符号、女子之手 */
  8: () => (
    <g>
      {/* 无限符号 */}
      <path d="M78,45 Q68,38 78,38 Q88,38 88,45 Q88,52 78,52 Q88,52 98,45 Q98,38 88,38 Q78,38 78,45" class="tcf-line-gold" stroke-width="2" fill="none" />
      {/* 狮子鬃毛 */}
      <circle cx="90" cy="115" r="32" class="tcf-f-gold" opacity="0.5" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30) * Math.PI / 180
        return <path d={`M${90 + Math.cos(a) * 30},${115 + Math.sin(a) * 30} L${90 + Math.cos(a) * 38},${115 + Math.sin(a) * 38}`}
          class="tcf-line-gold" stroke-width="2" key={i} />
      })}
      {/* 狮子脸 */}
      <circle cx="90" cy="115" r="20" class="tcf-f-gold" />
      <ellipse cx="82" cy="110" rx="3" ry="4" class="tcf-f-ink" />
      <ellipse cx="98" cy="110" rx="3" ry="4" class="tcf-f-ink" />
      <path d="M85,122 Q90,128 95,122" class="tcf-line-ink" stroke-width="1.5" fill="none" />
      <path d="M90,118 L87,122 L93,122 Z" class="tcf-f-ink" opacity="0.6" />
      {/* 女子之手 */}
      <ellipse cx="75" cy="90" rx="6" ry="4" class="tcf-f-accent2" transform="rotate(-20 75 90)" />
      <ellipse cx="105" cy="90" rx="6" ry="4" class="tcf-f-accent2" transform="rotate(20 105 90)" />
      {/* 花环 */}
      <path d="M60,85 Q55,80 58,75 M120,85 Q125,80 122,75" class="tcf-line-accent" stroke-width="1.5" fill="none" />
    </g>
  ),

  /* 9. 隐士 — 提灯（六芒星）、手杖、兜帽 */
  9: () => (
    <g>
      {/* 兜帽人物 */}
      <path d="M75,60 Q90,40 105,60 L108,100 L72,100 Z" class="tcf-f-accent" opacity="0.7" />
      <circle cx="90" cy="65" r="6" class="tcf-f-accent2" />
      {/* 长袍 */}
      <path d="M72,100 L68,170 L112,170 L108,100 Z" class="tcf-f-accent" opacity="0.6" />
      {/* 提灯 */}
      <rect x="78" y="85" width="24" height="28" rx="3" class="tcf-line-gold" stroke-width="1.5" fill="none" />
      <line x1="90" y1="75" x2="90" y2="85" class="tcf-line-gold" stroke-width="1" />
      {/* 六芒星 */}
      <path d="M90,92 L97,104 L83,104 Z" class="tcf-f-gold" />
      <path d="M90,104 L83,92 L97,92 Z" class="tcf-f-gold" opacity="0.7" />
      {/* 光芒 */}
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * 45) * Math.PI / 180
        return <line x1={90 + Math.cos(a) * 16} y1={98 + Math.sin(a) * 16}
          x2={90 + Math.cos(a) * 22} y2={98 + Math.sin(a) * 22}
          class="tcf-line-gold" stroke-width="1" opacity="0.4" key={i} />
      })}
      {/* 手杖 */}
      <line x1="115" y1="80" x2="122" y2="170" class="tcf-line-gold" stroke-width="2.5" stroke-linecap="round" />
    </g>
  ),

  /* 10. 命运之轮 — 轮盘、辐条、外圈铭文 */
  10: () => (
    <g>
      {/* 外圈 */}
      <circle cx="90" cy="105" r="52" class="tcf-line-gold" stroke-width="3" fill="none" />
      <circle cx="90" cy="105" r="44" class="tcf-line-accent" stroke-width="1" fill="none" opacity="0.5" />
      {/* 内圈 */}
      <circle cx="90" cy="105" r="28" class="tcf-line-gold" stroke-width="2" fill="none" />
      {/* 辐条 */}
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * 45) * Math.PI / 180
        return <line x1={90 + Math.cos(a) * 28} y1={105 + Math.sin(a) * 28}
          x2={90 + Math.cos(a) * 52} y2={105 + Math.sin(a) * 52}
          class="tcf-line-accent" stroke-width="1.5" key={i} />
      })}
      {/* 中心轴 */}
      <circle cx="90" cy="105" r="6" class="tcf-f-gold" />
      <circle cx="90" cy="105" r="3" class="tcf-f-accent" />
      {/* 外圈字母 T·A·R·O */}
      <text x="90" y="62" text-anchor="middle" class="tcf-f-gold" font-size="9" font-weight="bold">T</text>
      <text x="133" y="109" text-anchor="middle" class="tcf-f-gold" font-size="9" font-weight="bold">A</text>
      <text x="90" y="155" text-anchor="middle" class="tcf-f-gold" font-size="9" font-weight="bold">R</text>
      <text x="47" y="109" text-anchor="middle" class="tcf-f-gold" font-size="9" font-weight="bold">O</text>
      {/* 四角生物（简化为小符号） */}
      <path d={star5Path(5)} class="tcf-f-accent" opacity="0.5" transform="translate(30,45)" />
      <path d={star5Path(5)} class="tcf-f-accent" opacity="0.5" transform="translate(150,45)" />
      <path d={star5Path(5)} class="tcf-f-accent" opacity="0.5" transform="translate(30,165)" />
      <path d={star5Path(5)} class="tcf-f-accent" opacity="0.5" transform="translate(150,165)" />
    </g>
  ),

  /* 11. 正义 — 天平、宝剑、王冠 */
  11: () => (
    <g>
      {/* 王冠 */}
      <path d="M74,40 L74,50 L82,44 L90,52 L98,44 L106,50 L106,40 Z" class="tcf-f-gold" />
      {/* 天平立柱 */}
      <line x1="90" y1="50" x2="90" y2="160" class="tcf-line-gold" stroke-width="2.5" />
      {/* 天平横梁 */}
      <line x1="50" y1="75" x2="130" y2="75" class="tcf-line-gold" stroke-width="2" />
      {/* 左秤盘 */}
      <line x1="55" y1="75" x2="55" y2="88" class="tcf-line-gold" stroke-width="1" />
      <path d="M45,88 Q55,98 65,88" class="tcf-line-gold" stroke-width="1.5" fill="none" />
      <path d="M45,88 L65,88" class="tcf-line-gold" stroke-width="1.5" fill="none" />
      {/* 右秤盘 */}
      <line x1="125" y1="75" x2="125" y2="88" class="tcf-line-gold" stroke-width="1" />
      <path d="M115,88 Q125,98 135,88" class="tcf-line-gold" stroke-width="1.5" fill="none" />
      <path d="M115,88 L135,88" class="tcf-line-gold" stroke-width="1.5" fill="none" />
      {/* 宝剑（竖直，叠加于立柱） */}
      <path d="M90,55 L93,68 L93,120 L87,120 L87,68 Z" class="tcf-f-accent" />
      <rect x="80" y="120" width="20" height="3" rx="1" class="tcf-f-gold" />
      <rect x="88" y="123" width="4" height="10" class="tcf-f-accent" />
      <circle cx="90" cy="135" r="3" class="tcf-f-gold" />
    </g>
  ),

  /* 12. 倒吊人 — T形十字、倒挂人、光环 */
  12: () => (
    <g>
      {/* T 形十字 */}
      <line x1="40" y1="40" x2="140" y2="40" class="tcf-line-gold" stroke-width="3" />
      <line x1="90" y1="40" x2="90" y2="55" class="tcf-line-gold" stroke-width="2" />
      {/* 绳子 */}
      <line x1="82" y1="55" x2="78" y2="68" class="tcf-line-muted" stroke-width="1.5" />
      <line x1="98" y1="55" x2="102" y2="68" class="tcf-line-muted" stroke-width="1.5" />
      {/* 倒挂人物 */}
      <circle cx="90" cy="130" r="7" class="tcf-f-accent" />
      {/* 光环 */}
      <circle cx="90" cy="130" r="11" class="tcf-line-gold" stroke-width="1.5" fill="none" opacity="0.7" />
      {/* 身体（倒置） */}
      <path d="M90,137 L90,100 M90,110 L78,95 M90,110 L102,95" class="tcf-line-accent" stroke-width="2.5" stroke-linecap="round" fill="none" />
      {/* 腿交叉 */}
      <path d="M78,95 Q70,88 75,80 M102,95 Q110,88 105,80" class="tcf-line-accent" stroke-width="2" fill="none" />
      {/* 两枚金币 */}
      <circle cx="65" cy="75" r="4" class="tcf-f-gold" opacity="0.6" />
      <circle cx="115" cy="75" r="4" class="tcf-f-gold" opacity="0.6" />
    </g>
  ),

  /* 13. 死神 — 骷髅、镰刀、旗帜 */
  13: () => (
    <g>
      {/* 骷髅头 */}
      <circle cx="90" cy="80" r="22" class="tcf-f-bg2" />
      <circle cx="90" cy="80" r="22" class="tcf-line-muted" stroke-width="1.5" fill="none" />
      {/* 眼窝 */}
      <ellipse cx="81" cy="77" rx="5" ry="6" class="tcf-f-ink" />
      <ellipse cx="99" cy="77" rx="5" ry="6" class="tcf-f-ink" />
      {/* 鼻骨 */}
      <path d="M90,85 L86,92 L90,95 L94,92 Z" class="tcf-f-ink" />
      {/* 牙齿 */}
      <line x1="82" y1="97" x2="82" y2="102" class="tcf-line-ink" stroke-width="1" />
      <line x1="86" y1="97" x2="86" y2="102" class="tcf-line-ink" stroke-width="1" />
      <line x1="90" y1="97" x2="90" y2="102" class="tcf-line-ink" stroke-width="1" />
      <line x1="94" y1="97" x2="94" y2="102" class="tcf-line-ink" stroke-width="1" />
      <line x1="98" y1="97" x2="98" y2="102" class="tcf-line-ink" stroke-width="1" />
      <path d="M78,97 L102,97" class="tcf-line-ink" stroke-width="0.8" />
      {/* 镰刀 */}
      <line x1="120" y1="40" x2="60" y2="170" class="tcf-line-gold" stroke-width="2.5" stroke-linecap="round" />
      <path d="M120,40 Q140,45 138,65 Q132,55 120,55" class="tcf-f-gold" />
      {/* 旗帜（玫瑰旗） */}
      <line x1="50" y1="45" x2="50" y2="80" class="tcf-line-gold" stroke-width="1.5" />
      <path d="M50,48 L75,52 L72,62 L50,60 Z" class="tcf-f-accent" opacity="0.7" />
      <circle cx="62" cy="55" r="3" class="tcf-f-gold" />
    </g>
  ),

  /* 14. 节制 — 双杯、水流、翅膀、三角胸饰 */
  14: () => (
    <g>
      {/* 翅膀 */}
      <path d="M90,50 Q55,45 40,65 Q55,60 70,65" class="tcf-line-accent" stroke-width="1.5" fill="none" opacity="0.6" />
      <path d="M90,50 Q125,45 140,65 Q125,60 110,65" class="tcf-line-accent" stroke-width="1.5" fill="none" opacity="0.6" />
      {/* 天使头 */}
      <circle cx="90" cy="55" r="8" class="tcf-f-gold" />
      {/* 胸前三角 */}
      <path d="M90,65 L82,85 L98,85 Z" class="tcf-line-gold" stroke-width="1.5" fill="none" />
      {/* 长袍 */}
      <path d="M78,85 L102,85 L108,160 L72,160 Z" class="tcf-f-accent2" opacity="0.6" />
      {/* 左杯 */}
      <g transform="translate(60, 100)">
        <path d="M-8,-8 L8,-8 L6,0 Q0,6 -6,0 Z" class="tcf-f-gold" />
        <rect x="-1" y="0" width="2" height="6" class="tcf-f-gold" />
      </g>
      {/* 右杯 */}
      <g transform="translate(120, 100)">
        <path d="M-8,-8 L8,-8 L6,0 Q0,6 -6,0 Z" class="tcf-f-gold" />
        <rect x="-1" y="0" width="2" height="6" class="tcf-f-gold" />
      </g>
      {/* 水流（两杯间） */}
      <path d="M68,100 Q90,115 112,100" class="tcf-line-accent" stroke-width="2" fill="none" />
      <path d="M72,103 Q90,118 108,103" class="tcf-line-accent" stroke-width="1" fill="none" opacity="0.5" />
      {/* 花朵 */}
      <circle cx="90" cy="70" r="2" class="tcf-f-gold" />
    </g>
  ),

  /* 15. 恶魔/魔鬼 — 角头、倒五芒星、锁链 */
  15: () => (
    <g>
      {/* 倒五芒星 */}
      <path d={star5Path(38)} class="tcf-line-accent" stroke-width="2" fill="none" opacity="0.3" transform="translate(90,110) rotate(180)" />
      {/* 恶魔头 */}
      <path d="M70,55 Q70,35 90,35 Q110,35 110,55 L105,70 L75,70 Z" class="tcf-f-ink2" />
      {/* 角 */}
      <path d="M72,45 Q60,30 55,40 Q60,45 70,48" class="tcf-f-gold" />
      <path d="M108,45 Q120,30 125,40 Q120,45 110,48" class="tcf-f-gold" />
      {/* 眼睛 */}
      <ellipse cx="82" cy="55" rx="3" ry="4" class="tcf-f-gold" />
      <ellipse cx="98" cy="55" rx="3" ry="4" class="tcf-f-gold" />
      <circle cx="82" cy="55" r="1.5" class="tcf-f-ink" />
      <circle cx="98" cy="55" r="1.5" class="tcf-f-ink" />
      {/* 微笑 */}
      <path d="M80,65 Q90,70 100,65" class="tcf-line-gold" stroke-width="1.5" fill="none" />
      {/* 锁链 */}
      <g transform="translate(55, 140)">
        <rect x="-5" y="-3" width="10" height="6" rx="2" class="tcf-line-gold" stroke-width="1.5" fill="none" />
        <rect x="3" y="-3" width="10" height="6" rx="2" class="tcf-line-gold" stroke-width="1.5" fill="none" transform="rotate(20)" />
      </g>
      <g transform="translate(125, 140)">
        <rect x="-5" y="-3" width="10" height="6" rx="2" class="tcf-line-gold" stroke-width="1.5" fill="none" />
        <rect x="-13" y="-3" width="10" height="6" rx="2" class="tcf-line-gold" stroke-width="1.5" fill="none" transform="rotate(-20)" />
      </g>
      {/* 两个小恶魔（被锁者） */}
      <circle cx="55" cy="160" r="5" class="tcf-f-accent" opacity="0.5" />
      <circle cx="125" cy="160" r="5" class="tcf-f-accent" opacity="0.5" />
      <path d="M52,155 L50,148 M58,155 L60,148" class="tcf-line-accent" stroke-width="1" />
      <path d="M122,155 L120,148 M128,155 L130,148" class="tcf-line-accent" stroke-width="1" />
    </g>
  ),

  /* 16. 高塔 — 塔楼、闪电、坠落王冠 */
  16: () => (
    <g>
      {/* 塔楼 */}
      <rect x="68" y="60" width="44" height="110" rx="2" class="tcf-f-ink2" />
      {/* 城垛 */}
      <rect x="66" y="55" width="10" height="8" class="tcf-f-ink2" />
      <rect x="80" y="55" width="10" height="8" class="tcf-f-ink2" />
      <rect x="94" y="55" width="10" height="8" class="tcf-f-ink2" />
      <rect x="104" y="55" width="10" height="8" class="tcf-f-ink2" />
      {/* 窗户 */}
      <rect x="84" y="80" width="12" height="16" rx="6" class="tcf-f-accent" opacity="0.6" />
      <rect x="84" y="110" width="12" height="20" rx="2" class="tcf-f-accent" opacity="0.4" />
      {/* 闪电 */}
      <path d="M120,30 L100,55 L110,60 L90,95 L100,65 L88,60 L108,30" class="tcf-f-gold" />
      <path d="M120,30 L100,55 L110,60 L90,95 L100,65 L88,60 L108,30" class="tcf-line-gold" stroke-width="1" fill="none" />
      {/* 坠落王冠 */}
      <path d="M55,42 L55,50 L59,45 L63,52 L67,45 L67,42 Z" class="tcf-f-gold" opacity="0.7" transform="rotate(-25 60 47)" />
      {/* 坠落人形 */}
      <circle cx="50" cy="75" r="3" class="tcf-f-accent" opacity="0.7" />
      <path d="M50,78 L46,88 M50,78 L54,88 M50,82 L48,90" class="tcf-line-accent" stroke-width="1.5" opacity="0.7" fill="none" />
      <circle cx="130" cy="70" r="3" class="tcf-f-accent" opacity="0.7" />
      <path d="M130,73 L134,83 M130,73 L126,83 M130,77 L132,85" class="tcf-line-accent" stroke-width="1.5" opacity="0.7" fill="none" />
      {/* 火球 */}
      <circle cx="60" cy="120" r="4" class="tcf-f-gold" opacity="0.5" />
      <circle cx="120" cy="125" r="4" class="tcf-f-gold" opacity="0.5" />
    </g>
  ),

  /* 17. 星星 — 大星、群星、水流 */
  17: () => (
    <g>
      {/* 主大星（八角） */}
      {star8Paths(90, 55, 16).map((d, i) => (
        <path d={d} class={i === 0 ? 'tcf-f-gold' : 'tcf-f-accent'} opacity="0.8" key={i} />
      ))}
      {/* 七颗小星 */}
      {[[40, 50], [60, 35], [120, 35], [140, 50], [35, 80], [145, 80], [90, 25]].map((p, i) => (
        <path d={star5Path(4)} class="tcf-f-gold" opacity="0.7" transform={`translate(${p[0]},${p[1]})`} key={i} />
      ))}
      {/* 人物（简化） */}
      <circle cx="90" cy="100" r="5" class="tcf-f-accent" />
      <path d="M85,105 L95,105 L92,130 L88,130 Z" class="tcf-f-accent2" opacity="0.5" />
      {/* 双杯倒水 */}
      <g transform="translate(75, 130)">
        <path d="M-6,-4 L6,-4 L4,4 Q0,8 -4,4 Z" class="tcf-f-gold" transform="rotate(-30)" />
      </g>
      <g transform="translate(105, 130)">
        <path d="M-6,-4 L6,-4 L4,4 Q0,8 -4,4 Z" class="tcf-f-gold" transform="rotate(30)" />
      </g>
      {/* 水流 */}
      <path d="M70,135 Q65,150 60,165" class="tcf-line-accent" stroke-width="2" fill="none" />
      <path d="M110,135 Q115,150 120,165" class="tcf-line-accent" stroke-width="2" fill="none" />
      <path d="M72,140 Q68,152 63,162" class="tcf-line-accent" stroke-width="1" fill="none" opacity="0.5" />
      <path d="M108,140 Q112,152 117,162" class="tcf-line-accent" stroke-width="1" fill="none" opacity="0.5" />
      {/* 池水 */}
      <path d="M40,170 Q90,178 140,170" class="tcf-line-accent" stroke-width="1.5" fill="none" opacity="0.4" />
    </g>
  ),

  /* 18. 月亮 — 月面、双塔、雨滴 */
  18: () => (
    <g>
      {/* 月亮 */}
      <circle cx="90" cy="55" r="20" class="tcf-f-gold" opacity="0.8" />
      {/* 月光射线 */}
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i * 22.5) * Math.PI / 180
        return <line x1={90 + Math.cos(a) * 22} y1={55 + Math.sin(a) * 22}
          x2={90 + Math.cos(a) * 28} y2={55 + Math.sin(a) * 28}
          class="tcf-line-gold" stroke-width="1" opacity="0.5" key={i} />
      })}
      {/* 月面表情 */}
      <ellipse cx="83" cy="52" rx="2" ry="3" class="tcf-f-ink" opacity="0.5" />
      <ellipse cx="97" cy="52" rx="2" ry="3" class="tcf-f-ink" opacity="0.5" />
      <path d="M84,62 Q90,66 96,62" class="tcf-line-ink" stroke-width="1" fill="none" opacity="0.4" />
      {/* 双塔 */}
      <rect x="35" y="100" width="20" height="60" rx="1" class="tcf-f-ink2" />
      <rect x="33" y="95" width="4" height="8" class="tcf-f-ink2" />
      <rect x="39" y="95" width="4" height="8" class="tcf-f-ink2" />
      <rect x="45" y="95" width="4" height="8" class="tcf-f-ink2" />
      <rect x="51" y="95" width="4" height="8" class="tcf-f-ink2" />
      <rect x="125" y="100" width="20" height="60" rx="1" class="tcf-f-ink2" />
      <rect x="123" y="95" width="4" height="8" class="tcf-f-ink2" />
      <rect x="129" y="95" width="4" height="8" class="tcf-f-ink2" />
      <rect x="135" y="95" width="4" height="8" class="tcf-f-ink2" />
      <rect x="141" y="95" width="4" height="8" class="tcf-f-ink2" />
      {/* 雨滴 */}
      {[[60, 90], [70, 95], [80, 88], [100, 88], [110, 95], [120, 90]].map((p, i) => (
        <line x1={p[0]} y1={p[1]} x2={p[0] - 2} y2={p[1] + 6} class="tcf-line-accent" stroke-width="1" opacity="0.4" key={i} />
      ))}
      {/* 狼与狗 */}
      <path d="M55,165 Q50,160 52,155 L58,155 L60,165" class="tcf-line-accent" stroke-width="1.5" fill="none" />
      <path d="M125,165 Q130,160 128,155 L122,155 L120,165" class="tcf-line-accent" stroke-width="1.5" fill="none" />
      {/* 螃蟹 */}
      <ellipse cx="90" cy="172" rx="8" ry="4" class="tcf-f-accent" opacity="0.6" />
      <path d="M82,172 L76,168 M98,172 L104,168" class="tcf-line-accent" stroke-width="1" />
    </g>
  ),

  /* 19. 太阳 — 大日、日面、向日葵 */
  19: () => (
    <g>
      {/* 大太阳 */}
      <circle cx="90" cy="60" r="22" class="tcf-f-gold" />
      {/* 光芒（三角形） */}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30) * Math.PI / 180
        const x1 = 90 + Math.cos(a) * 24, y1 = 60 + Math.sin(a) * 24
        const x2 = 90 + Math.cos(a) * 34, y2 = 60 + Math.sin(a) * 34
        const x3 = 90 + Math.cos(a + 0.15) * 24, y3 = 60 + Math.sin(a + 0.15) * 24
        return <path d={`M${x1},${y1} L${x2},${y2} L${x3},${y3} Z`} class="tcf-f-gold" key={i} />
      })}
      {/* 日面表情 */}
      <ellipse cx="83" cy="56" rx="2.5" ry="3.5" class="tcf-f-ink" opacity="0.6" />
      <ellipse cx="97" cy="56" rx="2.5" ry="3.5" class="tcf-f-ink" opacity="0.6" />
      <path d="M82,66 Q90,72 98,66" class="tcf-line-ink" stroke-width="1.5" fill="none" opacity="0.5" />
      {/* 城墙 */}
      <rect x="30" y="155" width="120" height="6" class="tcf-f-ink2" opacity="0.5" />
      <rect x="35" y="149" width="6" height="6" class="tcf-f-ink2" opacity="0.5" />
      <rect x="50" y="149" width="6" height="6" class="tcf-f-ink2" opacity="0.5" />
      <rect x="65" y="149" width="6" height="6" class="tcf-f-ink2" opacity="0.5" />
      <rect x="80" y="149" width="6" height="6" class="tcf-f-ink2" opacity="0.5" />
      <rect x="95" y="149" width="6" height="6" class="tcf-f-ink2" opacity="0.5" />
      <rect x="110" y="149" width="6" height="6" class="tcf-f-ink2" opacity="0.5" />
      <rect x="125" y="149" width="6" height="6" class="tcf-f-ink2" opacity="0.5" />
      <rect x="140" y="149" width="6" height="6" class="tcf-f-ink2" opacity="0.5" />
      {/* 向日葵 */}
      <g transform="translate(50, 140)">
        <line x1="0" y1="0" x2="0" y2="20" class="tcf-line-accent" stroke-width="1.5" />
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i * 60) * Math.PI / 180
          return <ellipse cx={Math.cos(a) * 5} cy={Math.sin(a) * 5} rx="3" ry="2" class="tcf-f-gold" transform={`rotate(${i * 60})`} key={i} />
        })}
        <circle cx="0" cy="0" r="3" class="tcf-f-ink2" />
      </g>
      <g transform="translate(130, 140)">
        <line x1="0" y1="0" x2="0" y2="20" class="tcf-line-accent" stroke-width="1.5" />
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i * 60) * Math.PI / 180
          return <ellipse cx={Math.cos(a) * 5} cy={Math.sin(a) * 5} rx="3" ry="2" class="tcf-f-gold" transform={`rotate(${i * 60})`} key={i} />
        })}
        <circle cx="0" cy="0" r="3" class="tcf-f-ink2" />
      </g>
      {/* 骑马小孩 */}
      <circle cx="90" cy="120" r="4" class="tcf-f-accent" />
      <path d="M86,124 L94,124 L92,140 L88,140 Z" class="tcf-f-accent2" opacity="0.6" />
    </g>
  ),

  /* 20. 审判 — 号角、十字旗、光芒 */
  20: () => (
    <g>
      {/* 光芒 */}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (-80 + i * 16) * Math.PI / 180
        return <line x1={90 + Math.cos(a) * 18} y1={45 + Math.sin(a) * 18}
          x2={90 + Math.cos(a) * 45} y2={45 + Math.sin(a) * 45}
          class="tcf-line-gold" stroke-width="1" opacity="0.4" key={i} />
      })}
      {/* 天使 */}
      <circle cx="90" cy="45" r="8" class="tcf-f-gold" />
      {/* 翅膀 */}
      <path d="M82,45 Q60,48 50,60 Q65,55 78,55" class="tcf-line-accent" stroke-width="1.5" fill="none" opacity="0.6" />
      <path d="M98,45 Q120,48 130,60 Q115,55 102,55" class="tcf-line-accent" stroke-width="1.5" fill="none" opacity="0.6" />
      {/* 号角 */}
      <path d="M90,55 L75,95 L70,100 L80,100 L95,60 Z" class="tcf-f-gold" />
      <path d="M90,55 L105,95 L110,100 L100,100 L85,60 Z" class="tcf-f-gold" />
      <ellipse cx="72" cy="98" rx="5" ry="3" class="tcf-f-gold" />
      <ellipse cx="108" cy="98" rx="5" ry="3" class="tcf-f-gold" />
      {/* 十字旗 */}
      <rect x="87" y="70" width="6" height="20" class="tcf-f-bg2" opacity="0.8" />
      <line x1="87" y1="76" x2="100" y2="76" class="tcf-line-accent" stroke-width="2" />
      <line x1="92" y1="72" x2="92" y2="82" class="tcf-line-accent" stroke-width="2" />
      {/* 棺中人物（复活） */}
      <rect x="55" y="130" width="70" height="30" rx="3" class="tcf-line-muted" stroke-width="1.5" fill="none" opacity="0.5" />
      <circle cx="75" cy="125" r="4" class="tcf-f-accent" opacity="0.7" />
      <circle cx="90" cy="120" r="4" class="tcf-f-accent" opacity="0.7" />
      <circle cx="105" cy="125" r="4" class="tcf-f-accent" opacity="0.7" />
      <path d="M71,129 L71,120 M89,124 L89,115 M107,129 L107,120" class="tcf-line-accent" stroke-width="1" opacity="0.5" />
    </g>
  ),

  /* 21. 世界 — 花环、舞者、四角生物 */
  21: () => (
    <g>
      {/* 花环（椭圆） */}
      <ellipse cx="90" cy="100" rx="42" ry="60" class="tcf-line-accent" stroke-width="3" fill="none" opacity="0.5" />
      <ellipse cx="90" cy="100" rx="38" ry="56" class="tcf-line-gold" stroke-width="1.5" fill="none" opacity="0.4" />
      {/* 花环上的叶子 */}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30) * Math.PI / 180
        const x = 90 + Math.cos(a) * 40, y = 100 + Math.sin(a) * 58
        return <ellipse cx={x} cy={y} rx="3" ry="2" class="tcf-f-accent" opacity="0.4" transform={`rotate(${a * 180 / Math.PI} ${x} ${y})`} key={i} />
      })}
      {/* 舞者 */}
      <circle cx="90" cy="75" r="6" class="tcf-f-gold" />
      <path d="M90,81 L90,110 M90,90 L76,80 M90,90 L104,80 M90,110 L80,135 M90,110 L100,135"
        class="tcf-line-gold" stroke-width="2.5" stroke-linecap="round" fill="none" />
      {/* 腿交叉 */}
      <path d="M80,135 Q72,130 75,120 M100,135 Q108,130 105,120" class="tcf-line-gold" stroke-width="2" fill="none" />
      {/* 紫纱 */}
      <path d="M85,95 Q75,105 80,120" class="tcf-line-accent" stroke-width="2" fill="none" opacity="0.5" />
      {/* 四角生物（简化符号） */}
      {/* 左上：鹰（翅膀） */}
      <path d="M30,40 Q20,35 25,50 Q35,45 40,50" class="tcf-line-gold" stroke-width="1.5" fill="none" />
      <text x="30" y="60" text-anchor="middle" class="tcf-f-muted" font-size="8">鹰</text>
      {/* 右上：狮 */}
      <path d="M150,40 Q160,35 155,50 Q145,45 140,50" class="tcf-line-gold" stroke-width="1.5" fill="none" />
      <text x="150" y="60" text-anchor="middle" class="tcf-f-muted" font-size="8">狮</text>
      {/* 左下：牛 */}
      <ellipse cx="30" cy="155" rx="8" ry="5" class="tcf-line-gold" stroke-width="1.5" fill="none" />
      <text x="30" y="172" text-anchor="middle" class="tcf-f-muted" font-size="8">牛</text>
      {/* 右下：天使 */}
      <circle cx="150" cy="153" r="5" class="tcf-line-gold" stroke-width="1.5" fill="none" />
      <text x="150" y="172" text-anchor="middle" class="tcf-f-muted" font-size="8">使</text>
    </g>
  )
}

/* ============================================================
 * 主组件
 * ============================================================ */
export const TarotCardFace = defineComponent({
  name: 'TarotCardFace',
  props: {
    /** 引擎返回的卡牌对象 */
    card: { type: Object, required: true },
    /** 是否正位 */
    upright: { type: Boolean, default: true },
    /** 是否关键牌 */
    isKeyCard: { type: Boolean, default: false }
  },
  setup(props) {
    const uid = ++_tarotUidSeq
    const gradId = `tarot-grad-${uid}`

    const isMajor = computed(() => props.card?.arcana !== 'minor')
    const roman = computed(() => toRoman(props.card?.num ?? 0))
    const displayName = computed(() => displayCardName(props.card || {}))

    const illustration = computed(() => {
      const card = props.card
      if (!card) return null
      if (isMajor.value) {
        const art = MAJOR_ART[card.num]
        return art ? art() : MAJOR_ART[0]()
      }
      return renderMinorArcana(detectSuit(card), card.num)
    })

    return () => {
      const card = props.card
      if (!card) return null

      const classes = [
        'tarot-card-face',
        props.upright ? '' : 'tarot-card-face--reversed',
        props.isKeyCard ? 'tarot-card-face--key' : ''
      ].filter(Boolean).join(' ')

      return (
        <div class={classes}>
          <svg viewBox="0 0 180 300" class="tarot-card-face__svg" role="img" aria-label={`${displayName.value}${props.upright ? '正位' : '逆位'}`}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0.3" y2="1">
                <stop offset="0%" class="tcf-stop-bg3" />
                <stop offset="55%" class="tcf-stop-ink2" />
                <stop offset="100%" class="tcf-stop-ink" />
              </linearGradient>
            </defs>

            {/* 牌面背景（深色渐变） */}
            <rect x="0" y="0" width="180" height="300" rx="12" fill={`url(#${gradId})`} />

            {/* 外边框（金色） */}
            <rect x="2" y="2" width="176" height="296" rx="10" fill="none" class="tcf-s-gold" stroke-width="1.5" />

            {/* 内框（紫色细线） */}
            <rect x="7" y="7" width="166" height="286" rx="6" fill="none" class="tcf-s-accent" stroke-width="0.6" opacity="0.4" />

            {/* 插画区背景装饰 */}
            <rect x="14" y="14" width="152" height="185" rx="4" fill="none" class="tcf-s-gold" stroke-width="0.4" opacity="0.25" />

            {/* SVG 插画 */}
            <g class="tarot-card-face__art">
              {illustration.value}
            </g>

            {/* 分隔线 */}
            <line x1="25" y1="206" x2="155" y2="206" class="tcf-s-gold" stroke-width="0.6" opacity="0.4" />
            <circle cx="90" cy="206" r="2" class="tcf-f-gold" opacity="0.6" />

            {/* 罗马数字编号 */}
            <text x="90" y="232" text-anchor="middle" class="tcf-f-gold" font-size="16" font-weight="700" letter-spacing="2">
              {roman.value}
            </text>

            {/* 小分隔 */}
            <line x1="65" y1="245" x2="115" y2="245" class="tcf-s-accent" stroke-width="0.5" opacity="0.4" />

            {/* 牌名 */}
            <text x="90" y="265" text-anchor="middle" class="tcf-f-ink" font-size="13" font-weight="700">
              {displayName.value}
            </text>

            {/* 正逆位标记 */}
            <text x="90" y="285" text-anchor="middle" class="tcf-f-muted" font-size="9" letter-spacing="1">
              {props.upright ? '· 正位 ·' : '· 逆位 ·'}
            </text>
          </svg>
        </div>
      )
    }
  }
})

export default TarotCardFace
