<div align="center">

# Echo · 回响

**命运印证引擎**

*发起预测，等待回响*

[简体中文](./README.md) | [English](./README.en.md) | [日本語](./README.ja.md)

**[在线体验 →](https://weed33834.github.io/echo/)**

![Vue](https://img.shields.io/badge/Vue-3.5-42b883?logo=vuedotjs&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.1-646cff?logo=vite&logoColor=white)
![Pinia](https://img.shields.io/badge/Pinia-4.0-ffd859?logo=pinia&logoColor=black)
![Vue Router](https://img.shields.io/badge/Vue_Router-5.2-42b883?logo=vuedotjs&logoColor=white)
![Node](https://img.shields.io/badge/Node-%E2%89%A522-339933?logo=nodedotjs&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)
![CI](https://img.shields.io/github/actions/workflow/status/weed33834/echo/ci.yml?branch=main&label=CI)
![Deploy](https://img.shields.io/github/actions/workflow/status/weed33834/echo/deploy.yml?branch=main&label=Deploy)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)
![Stars](https://img.shields.io/github/stars/weed33834/echo?style=social)

</div>

---

## 这是什么

Echo 不是算命软件。它是一个**假设验证工具**。

你用八字、紫微、六爻排出来的结果，本质上是一个**预测**。Echo 做的事情很简单：帮你记录这些预测，设定印证时间节点，到期后回来复盘——应验了还是没应验。随着时间推移，你的「命格可信度」会逐渐积累，你也能看清哪套体系对你更准。

核心循环：**设节点 → 等回响 → 复盘**

> 所有推演结果均为文化算法的可视化呈现，不构成任何决策依据。

## 功能总览

### 18 种命理工具

| 类别 | 工具 | 说明 |
|------|------|------|
| 命理 | 八字排盘 | 四柱干支、日主五行、十神、大运流年 |
| 命理 | 紫微斗数 | 十二宫位、主星四化 |
| 命理 | 奇门遁甲 | 九宫时盘、八门九星 |
| 命理 | 大六壬 | 四课三传、天将盘 |
| 占卜 | 六爻占卜 | 金钱课起卦、六亲装卦 |
| 占卜 | 梅花易数 | 时间起卦、体用生克 |
| 占卜 | 摇钱起卦 | 六十四卦铜钱法 |
| 健康 | 子午流注 | 十二时辰经络流注 |
| 健康 | 节气养生 | 顺时调养、节气宜忌 |
| 生活 | 老黄历 | 每日宜忌、冲煞、值神 |
| 生活 | 择吉日 | 事件择日、黄道吉日 |
| 生活 | 每日运势 | 个性化日运、四维运势 |
| 异域 | 西洋占星 | 星盘三巨头、七行星相位 |
| 异域 | 玛雅历 | 260 kin、银河音调 |
| 异域 | 塔罗牌 | 大阿卡那三牌阵 |
| 异域 | 周公解梦 | 梦境关键词解析 |
| 风水 | 风水布局 | 九宫飞星、元运盘 |
| 风水 | 姓名学 | 三才五格、81 数理 |

### AI 对话

- 支持 DeepSeek / OpenAI / Claude / 通义千问 / Ollama 本地模型
- 工具调用：AI 可调用 18 种命理工具进行推演
- 联网搜索：集成 Tavily API，AI 可搜索实时信息
- 安全沙箱：参数校验、超时控制、注入检测、输出验证
- 知识检索：命理知识库 + 节气感知 + Few-shot 示例

### 命格面板

- 五行雷达图：金木水火土分布可视化
- 五行生克图：相生相克关系网络
- 今日建议矩阵：饮食 / 起居 / 运动 / 情志
- 推演时间线：历史记录可视化
- 工具使用统计：使用频率排行
- 大运流年：十年大运与流年走势

### 命运图谱

- SVG 关系网络图：中心节点 + 五行节点 + 工具节点
- 交互式节点：点击五行查看调摄建议
- 印证统计与命格等级可视化

### 其他功能

- 每日签到 + 连续签到里程碑
- 合婚匹配：双方八字对照分析
- 学习中心：命理入门课程
- 暗色模式（宣纸 / 墨砚双主题）
- 字号缩放（紧凑 / 标准 / 宽松）
- 全响应式：320px 手机 → 4K 显示器

## 技术架构

```
src/
├── main.js                    # 应用入口
├── router/index.js            # 15 条路由
├── stores/
│   ├── echo.js                # 命格/历史/档案/工具注册 store
│   └── chat.js                # AI 对话/模型配置 store
├── services/
│   ├── ai.js                  # 多模型 AI 对话服务
│   ├── tools.js               # 工具调度与执行
│   ├── sandbox.js             # 安全沙箱（校验/超时/注入检测）
│   └── webSearch.js           # Tavily 联网搜索
├── prompts/
│   └── system.js              # 系统提示词/Few-shot/知识库/安全护栏
├── utils/
│   └── engines.js             # 18 个命理引擎
├── components/
│   ├── EchoUI.jsx             # 基础组件库（Card/Button/Badge/...）
│   ├── TabBar.jsx             # 导航栏（响应式底部/侧边）
│   ├── ChatFab.jsx            # 悬浮 AI 入口
│   ├── BaziChart.jsx          # 八字排盘可视化
│   └── Timeline.jsx           # 时间线组件
├── pages/                     # 15 个页面
│   ├── Home.jsx               # 首页
│   ├── Tools.jsx              # 工具列表
│   ├── ToolDetail.jsx         # 工具推演
│   ├── Profile.jsx            # 个人档案
│   ├── Daily.jsx              # 今日运势
│   ├── Dashboard.jsx          # 命格面板
│   ├── Compatibility.jsx      # 合婚匹配
│   ├── Learn.jsx              # 学习中心
│   ├── EchoCenter.jsx         # 印证中心
│   ├── Graph.jsx              # 命运图谱
│   ├── Chat.jsx               # AI 对话
│   ├── Me.jsx                 # 个人中心
│   ├── Settings.jsx           # 设置
│   ├── Admin.jsx              # 管理后台
│   └── Checkin.jsx            # 每日签到
└── designs/                   # 设计系统
    ├── tokens.css             # 设计令牌（颜色/间距/字号）
    ├── base.css               # 全局重置
    ├── animations.css         # 动画关键帧
    └── ...                    # 各页面样式
```

### 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue 3 | 3.5 | 框架（JSX + Composition API） |
| Pinia | 2.3 | 状态管理 |
| Vue Router | 4.6 | 路由 |
| Vite | 5.4 | 构建工具 |

**零运行时依赖**——除了 Vue/Pinia/Router 三个核心库，所有功能均自实现：
- Markdown 渲染器（无 marked/markdown-it）
- SVG 雷达图 / 生克图 / 关系图谱（无 echarts/d3）
- Toast / Modal / Progress（无 UI 库）

## 快速开始

> 前置要求：Node.js ≥ 18（推荐 20.x，参见 `.nvmrc`）、npm ≥ 9

```bash
# 克隆仓库
git clone https://github.com/weed33834/echo.git
cd echo

# 安装依赖
npm install

#（可选）配置环境变量
cp .env.example .env  # 填入你的 API Key，也可在应用内设置页面配置

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

浏览器打开 `http://localhost:5173` 即可使用。

### 配置 AI 对话

1. 进入「设置」页面
2. 在「AI 对话」区域输入你的 API Key
3. 或开启「使用默认模型」体验占位回复
4. 支持的模型提供商：DeepSeek / OpenAI / Claude / 通义千问 / Ollama

### 管理后台

访问 `#/admin` 进入管理后台（首次使用需在系统配置中设置密码）。

功能包括：模型管理（预设/自定义 CRUD）、提示词管理、用量统计、系统配置。

## 响应式设计

| 断点 | 场景 | 适配策略 |
|------|------|----------|
| ≤340px | 超窄屏（iPhone SE 1） | 压缩间距、网格降列、隐藏文字 |
| 341-767px | 标准手机 | 底部 TabBar、单列布局 |
| 768-1023px | 平板 | 双列网格、雷达图横向 |
| 1024-1439px | 桌面 | 侧边导航、双列面板 |
| ≥1440px | 宽屏 | 五列工具网格、更大间距 |
| ≥1920px | 超宽屏 | 限制最大宽度 1280px |
| 横屏 ≤500h | 手机横屏 | 压缩垂直间距、输入区优化 |

## 设计令牌

项目使用 CSS 自定义属性作为设计令牌的单源真相：

```css
:root {
  /* 主题色 */
  --accent: #5b3fd6;     /* 主色：紫 */
  --gold: #b8893a;       /* 金色 */
  --ink: #15131f;        /* 文字 */
  --bg: #f7f5f0;         /* 背景 */

  /* 五行色 */
  --wuxing-metal: #d4a843;
  --wuxing-wood: #5a9e5a;
  --wuxing-water: #5a8db5;
  --wuxing-fire: #d45a5a;
  --wuxing-earth: #a8825a;

  /* 间距 / 字号 / 圆角 / 阴影 */
  --sp-1: 4px;  --sp-4: 16px;  --sp-7: 28px;
  --fs-xs: 12px;  --fs-base: 15px;  --fs-2xl: 24px;
}
```

支持暗色模式（`[data-theme="dark"]`）和字号缩放（`[data-font-scale]`）。

## 项目结构亮点

### 安全沙箱

```
用户输入 → sanitizeInput → detectInjection → AI
                                    ↓
工具调用 → validateArgs → executeWithTimeout → sanitizeToolResult → AI
                                    ↓
AI 输出 → validateOutput → 追加安全提示
```

### 命格等级系统

| 等级 | 称号 | 所需经验 |
|------|------|----------|
| 1 | 初悟 | 0 |
| 2 | 渐明 | 100 |
| 3 | 通玄 | 300 |
| 4 | 识命 | 600 |
| 5 | 知机 | 1000 |
| 6 | 洞微 | 1500 |
| 7 | 明心 | 2200 |
| 8 | 见性 | 3000 |

经验值 = 印证次数 × 10 + 应验次数 × 20

## 项目文档

| 文档 | 说明 |
|------|------|
| [SPEC.md](./SPEC.md) | 技术规范（架构 / 引擎 / 设计系统 / 安全） |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | 贡献指南（开发环境 / 代码风格 / 提交规范） |
| [SECURITY.md](./SECURITY.md) | 安全策略（漏洞报告 / 沙箱机制 / 安全护栏） |
| [CHANGELOG.md](./CHANGELOG.md) | 更新日志 |
| [.env.example](./.env.example) | 环境变量模板 |

## 贡献

欢迎提交 Issue 和 Pull Request。请阅读 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解开发规范。

新增命理引擎只需 3 步：
1. 在 `engines.js` 实现 `{ calc, meta }` 结构
2. 在 `echo.js` 的 `TOOLS` 数组注册元信息
3. 在 `tools.js` 的 `ENGINES` 映射关联引擎

## 许可证

[MIT License](./LICENSE)

## 免责声明

本项目所有推演结果均为文化算法的可视化呈现，不构成任何决策依据。命理文化的价值在于启发思考与自我认知，而非预测未来的准确性。Echo 的核心在于「设节点 → 等回响 → 复盘」的验证过程，而非单次预测的准与不准。

涉及健康、法律、财务等敏感话题时，请咨询专业人士。

---

<div align="center">

**如果这个项目对你有启发，欢迎 Star 支持**

</div>
