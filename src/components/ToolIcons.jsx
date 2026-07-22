/**
 * Echo Tool Icons — 定制 SVG 图标系统
 * 替代旧版文字字符图标（八/紫/爻/梅），消除AI味
 * 风格：1.5px 描线，24x24 视口，参考 Lucide/Phosphor 但自定义路径
 */
import { defineComponent } from 'vue'

const PATHS = {
  bazi: [
    'M12 3v18M12 3a9 9 0 0 0 0 18M12 3a9 9 0 0 1 0 18M12 7v4M12 13v4M8 9l4 2M16 9l-4 2M8 15l4-2M16 15l-4-2'
  ],
  ziwei: [
    'M12 2l2.4 7.4H22l-6.2 4.5L18.2 22 12 17.5 5.8 22l2.4-8.1L2 9.4h7.6z'
  ],
  liuyao: [
    'M6 4h12M6 8h12M6 12h12M9 16h6M10 20h4M6 4v4M18 4v4M6 12v4M18 12v4M10 16v4M14 16v4'
  ],
  meihua: [
    'M12 3l4 4-4 4-4-4 4-4zM12 13l4 4-4 4-4-4 4-4zM3 12l4-4 4 4-4 4-4-4zM13 12l4-4 4 4-4 4-4-4z'
  ],
  yaoqian: [
    'M8 4v16M16 4v16M8 8a4 3 0 0 0 8 0M8 14a4 3 0 0 0 8 0M8 20a4 3 0 0 0 8 0'
  ],
  qimen: [
    'M3 3h18v18H3zM3 9h6V3M9 9h6V3M15 3v6h6M15 9h6v6M15 15h6v6M9 15v6h6M3 15h6v6M3 9v6'
  ],
  liuren: [
    'M12 2v6M12 16v6M2 12h6M16 12h6M5 5l4 4M15 15l4 4M19 5l-4 4M9 15l-4 4'
  ],
  liuzhu: [
    'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2'
  ],
  jieqi: [
    'M12 2v6M12 16v6M8 4l4 4 4-4M8 20l4-4 4 4M2 12h6M16 12h6M4 8l4 4-4 4M20 8l-4 4 4 4'
  ],
  laohuangli: [
    'M4 5h16v15H4zM4 9h16M8 3v4M16 3v4M8 13h2M14 13h2M8 17h2M14 17h2'
  ],
  zeji: [
    'M5 3v18l7-4 7 4V3zM12 7v6M9 10h6'
  ],
  yunshi: [
    'M12 3a6 6 0 0 0-6 6c0 3 2 4 2 6h8c0-2 2-3 2-6a6 6 0 0 0-6-6zM10 17h4M11 20h2'
  ],
  fengshui: [
    'M3 12l4-4 4 4 4-4 4 4 2-2M3 12v8h18v-8M7 12v8M11 12v8M15 12v8M19 12v8'
  ],
  xingming: [
    'M4 6h6v12H4zM14 6h6v12h-6zM10 12h4'
  ],
  xiyang: [
    'M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 5l-2 2M5 19l2-2M17 19l-2-2M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z'
  ],
  maya: [
    'M3 6h18v12H3zM3 6l9 7 9-7M3 18l9-7 9 7M12 2v4M12 18v4'
  ],
  tarot: [
    'M6 3h12v18H6zM6 3l6 8 6-8M9 7h6M8 14h8M8 17h8'
  ],
  meng: [
    'M12 3a9 9 0 1 0 9 9 4 4 0 0 1-4-4 4 4 0 0 1-4-4 4 4 0 0 1-1-1z'
  ],
}

export const ToolIcon = defineComponent({
  name: 'ToolIcon',
  props: {
    name: { type: String, required: true },
    size: { type: Number, default: 24 }
  },
  setup(props) {
    return () => (
      <svg
        width={props.size}
        height={props.size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        {(PATHS[props.name] || PATHS.bazi).map((d, i) => (
          <path key={i} d={d} />
        ))}
      </svg>
    )
  }
})

/**
 * 通用功能图标（首页快捷入口等）
 */
const UI_PATHS = {
  dashboard: 'M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z',
  daily: 'M12 3v2M12 19v2M3 12h2M19 12h2M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM8 12a4 4 0 0 1 8 0M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
  checkin: 'M5 12l5 5L20 7M5 12a7 7 0 1 1 14 0M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6',
  graph: 'M5 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM5 4v6l5 3M10 13l5-5M15 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM19 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM19 16v-4l-4-4',
  compatibility: 'M12 21a9 9 0 0 0 9-9 9 9 0 0 0-9-9 9 9 0 0 0-9 9 9 9 0 0 0 9 9zM12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM8 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM16 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  compass: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6l3 6-3 6-3-6 3-6zM12 2v3M12 19v3M2 12h3M19 12h3',
  learn: 'M3 5l9-2 9 2v14l-9 2-9-2zM12 3v18M3 5l9 2 9-2',
  profile: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20a8 8 0 0 1 16 0',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19',
}

export const UIIcon = defineComponent({
  name: 'UIIcon',
  props: {
    name: { type: String, required: true },
    size: { type: Number, default: 24 }
  },
  setup(props) {
    return () => (
      <svg
        width={props.size}
        height={props.size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d={UI_PATHS[props.name] || UI_PATHS.profile} />
      </svg>
    )
  }
})
