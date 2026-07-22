# 更新日志

所有重要变更记录于此文件。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [0.3.0] - 2026-07-22

### 新增
- 新手引导组件（Onboarding）：3 步引导弹窗，首次访问自动展示
- 首页每日洞察模块：每日一句话钩子，基于日期轮换
- 墨砚系设计系统：暖黑画布 + 古铜金 + 暖白墨迹
- 18 个自定义 SVG 工具图标 + 9 个 UI 图标
- 品牌 LOGO 生成（回响纹样 + 山影）
- GitHub Actions CI/CD（最小化，全绿）
- SEO 增强：sitemap.xml、robots.txt、JSON-LD 结构化数据

### 变更
- 依赖全量升级：Vite 8.1、Pinia 4.0、Vue Router 5.2
- Node.js 最低版本要求提升至 22
- 首页改为左对齐编辑式排版
- 所有文字字符图标替换为 SVG 图标
- 配色从紫色系改为古铜金系
- 进度环、统计数字、侧边栏视觉优化

### 移除
- Dependabot 自动依赖更新（改为手动更新）
- 紫色渐变、emoji 图标、居中模板等 AI 设计味

## [0.2.0] - 2026-07-21

### 新增
- 摇卦功能（ShakeDiviner + CoinToss）
- 风水罗盘（Compass）：实时方位 + 24 山
- 粒子星空背景（ParticleBackground）
- 命运图谱（Graph）：五行关系网络
- 合婚匹配（Compatibility）：六维分析
- 命理学堂（Learn）：课程 + 测验
- 命格面板（Dashboard）：五行雷达 + 建议
- 分享卡片（ShareButton）：Canvas 海报生成
- 连签系统：连续签到 + 里程碑
- AI 对话系统：多会话 + 流式输出

### 变更
- TabBar 底部导航（移动端）/ 侧边栏（桌面端）
- 18 种命理工具引擎
- PWA 支持（manifest + service worker）

## [0.1.0] - 2026-07-20

### 新增
- 项目初始化
- Vue 3 + Vite + Pinia + Vue Router 脚手架
- 基础页面：首页、工具、印证中心、我的
- 命格等级系统 + localStorage 持久化
