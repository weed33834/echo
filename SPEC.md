# Echo 技术规范

> 本文档描述 Echo 项目的架构设计、代码规范和技术约束。

## 一、项目定位

Echo 是一个**命运印证引擎**——不是算命软件，而是假设验证工具。

核心循环：**设节点 → 等回响 → 复盘**

用户用命理工具排盘得到预测结果 → 设定印证时间节点 → 到期后回来复盘应验情况 → 命格可信度随时间积累。

## 二、技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue 3 | ≥3.5 | 框架（JSX + Composition API） |
| Pinia | ≥4.0 | 状态管理 |
| Vue Router | ≥5.2 | 路由（Hash 模式） |
| Vite | ≥8.1 | 构建工具 |

**零运行时依赖**：除上述三个核心库外，所有功能自实现（Markdown 渲染、SVG 图表、UI 组件等）。

## 三、架构概览

```
src/
├── main.js                    # 应用入口
├── router/index.js            # 16 条路由（Hash 模式）
├── stores/                    # Pinia 状态管理
│   ├── echo.js                # 命格/历史/档案/工具注册
│   └── chat.js                # AI 对话/模型配置
├── services/                  # 业务服务层
│   ├── ai.js                  # 多模型 AI 对话（SSE 流式）
│   ├── tools.js               # 工具调度与执行
│   ├── sandbox.js             # 安全沙箱（校验/超时/注入检测）
│   └── webSearch.js           # Tavily 联网搜索
├── prompts/
│   └── system.js              # 系统提示词/Few-shot/知识库
├── utils/
│   └── engines.js             # 18 个命理引擎（纯函数）
├── components/                # 基础组件库
│   ├── EchoUI.jsx             # Card/Button/Badge/Modal/Toast/Progress/Gauge
│   ├── TabBar.jsx             # 导航栏（响应式底部/侧边）
│   ├── ChatFab.jsx            # 悬浮 AI 入口
│   ├── BaziChart.jsx          # 八字排盘可视化
│   └── Timeline.jsx           # 大运流年时间线
├── pages/                     # 16 个页面
│   ├── Home.jsx               # 首页（命格概览 + 快捷入口）
│   ├── Tools.jsx              # 工具列表（4 类 18 种）
│   ├── ToolDetail.jsx         # 工具推演（表单 + 结果渲染）
│   ├── Profile.jsx            # 个人档案
│   ├── Daily.jsx              # 今日运势
│   ├── Dashboard.jsx          # 命格面板（五行雷达 + 建议）
│   ├── Compatibility.jsx      # 合婚匹配
│   ├── Learn.jsx              # 学习中心
│   ├── EchoCenter.jsx         # 印证中心
│   ├── Graph.jsx              # 命运图谱（SVG 关系网络）
│   ├── Chat.jsx               # AI 对话
│   ├── Me.jsx                 # 个人中心
│   ├── Settings.jsx           # 设置（主题/字号/AI 配置）
│   ├── Admin.jsx              # 管理后台
│   ├── Checkin.jsx            # 每日签到
│   └── Compass.jsx            # 风水罗盘（实时方位）
├── designs/                   # 设计系统
│   ├── tokens.css             # 设计令牌（颜色/间距/字号/圆角/阴影）
│   ├── base.css               # 全局重置
│   ├── animations.css         # 动画关键帧
│   └── *.css                  # 各页面样式
└── data/
    └── lessons.js             # 学习中心课程数据
```

## 四、数据流

```
用户输入 → Profile.jsx → echoStore.setProfile()
                                ↓
                    computeProfileBazi() → profileBazi (getter)
                                ↓
                    Daily/Dashboard/Me 等页面读取
```

```
工具推演 → ToolDetail.jsx → toolsService.execute()
                                ↓
                    engines[key].calc(args) → result
                                ↓
                    echoStore.pushHistory() → 持久化到 localStorage
```

```
AI 对话 → Chat.jsx → chatStore.send()
                         ↓
              aiService.chatCompletion() → SSE 流式
                         ↓
              onToken → 更新消息 → 渲染
              onToolCall → toolsService.execute() → 工具结果注入
```

## 五、命理引擎规范

每个引擎导出 `{ inputConfig, calc }` 结构：

```javascript
export const myEngine = {
  meta: {
    name: '工具名',
    description: '工具描述',
    inputConfig: [
      { key: 'param1', label: '参数1', type: 'text', required: true },
      { key: 'param2', label: '参数2', type: 'select', options: [...] }
    ]
  },
  calc(args) {
    // 纯函数，无副作用
    // 返回结构化结果对象
    return { summary: '...', /* ... */ }
  }
}
```

注册流程：
1. 在 `engines.js` 实现引擎
2. 在 `echo.js` 的 `TOOLS` 数组注册元信息
3. 在 `tools.js` 的 `ENGINES` 映射关联引擎

## 六、设计系统

### 设计令牌

所有视觉属性通过 CSS 自定义属性定义在 `tokens.css` 的 `:root`：

```css
:root {
  /* 主题色 — 墨砚系（暖黑画布 + 古铜金） */
  --accent: #a68b5b;        /* 古铜金 */
  --accent-2: #c4a263;      /* 亮金 */
  --ink: #e8e0d4;           /* 暖白墨迹 */
  --bg: #0a0908;            /* 暖黑画布 */

  /* 五行色 */
  --wuxing-metal: #c9b06b;
  --wuxing-wood: #6b9b6b;
  --wuxing-water: #6b8eb5;
  --wuxing-fire: #c96b5a;
  --wuxing-earth: #a8825a;

  /* 间距（4pt 基准） */
  --sp-1: 4px; --sp-2: 8px; --sp-3: 12px; --sp-4: 16px;
  --sp-5: 24px; --sp-6: 32px; --sp-7: 48px; --sp-8: 64px;

  /* 字号 */
  --fs-xs: 13px; --fs-sm: 14px; --fs-base: 15px; --fs-lg: 19px;
  --fs-xl: 26px; --fs-2xl: 34px; --fs-3xl: 44px;
}
```

暗色为默认主题。浅色模式通过 `[data-theme="light"]` 覆盖令牌值。字号缩放通过 `[data-font-scale]` 控制。

### 响应式断点

| 断点 | 场景 | 策略 |
|------|------|------|
| ≤340px | 超窄屏 | 压缩间距、网格降列 |
| 341-767px | 标准手机 | 底部 TabBar、单列 |
| 768-1023px | 平板 | 双列网格 |
| 1024-1439px | 桌面 | 侧边导航、双列面板 |
| ≥1440px | 宽屏 | 五列工具网格 |

### 代码规范

- 2 空格缩进
- 组件使用 `defineComponent` + `setup()` 模式
- CSS 遵循 BEM 命名，使用设计令牌
- 列表渲染必须设置 `key` prop
- 不使用 TypeScript（纯 JavaScript + JSX）

## 七、安全机制

### 沙箱

```
用户输入 → sanitizeInput → detectInjection → AI
                                    ↓
工具调用 → validateArgs → executeWithTimeout → sanitizeToolResult → AI
                                    ↓
AI 输出 → validateOutput → 追加安全提示
```

### 安全护栏

| 类型 | 触发条件 | 处理方式 |
|------|----------|----------|
| 医疗 | 涉及疾病、用药 | 仅五行养生角度，建议就医 |
| 法律 | 涉及纠纷、官司 | 不预测输赢，建议咨询律师 |
| 财务 | 涉及投资、理财 | 不做收益保证，强调风险 |
| 危机 | 检测到自残倾向 | 优先安全，提供援助热线 |
| 绝对化 | 要求确定预测 | 软性表述，说明局限 |

详见 [SECURITY.md](./SECURITY.md)。

## 八、命格等级系统

| 等级 | 称号 | 经验阈值 |
|------|------|----------|
| 1 | 初悟 | 0 |
| 2 | 渐悟 | 50 |
| 3 | 开悟 | 200 |
| 4 | 通玄 | 500 |
| 5 | 明机 | 1000 |
| 6 | 知命 | 2000 |
| 7 | 洞微 | 3500 |
| 8 | 见性 | 5000 |
| 9 | 达理 | 6500 |
| 10 | 圆融 | 8000 |
| 11 | 天启 | 10000 |

经验值 = `Math.round(匹配度 × 30) + 10`（每次复盘印证）。签到 +5，引导完成 +20。

## 九、交付标准

1. `npm install && npm run dev` 可正常启动
2. `npm run build` 构建无错误
3. 所有页面可访问，所有按钮有响应
4. 响应式布局在 320px-4K 范围内无溢出
5. 设计令牌指标达标（无硬编码色值/字号）
6. 安全沙箱和护栏正常工作
