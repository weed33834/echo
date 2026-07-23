# 更新日志

所有重要变更记录于此文件。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [0.3.1] - 2026-07-23

### 新增
- 动画系统全面增强：grandEntrance / glowEntrance / goldPulse / goldShimmer / float 关键帧
- 18 种命理工具结果交错入场动画（八字四柱 / 紫微 12 宫 / 六爻爻线 / 塔罗牌翻转 / 六壬三传四课 / 奇门九宫 / 风水飞星盘等）
- 吉凶判语徽章印章 + 光晕双重入场效果
- 关键分数数字弹跳入场动画
- 当前大运 / 宫位 / 用神持续呼吸光效
- 首页 Hero / 工具卡片 / 快捷入口交错渐入
- Me 页统计数字 / 菜单项 / 签到里程碑光晕 + 交错入场
- Dashboard / 兼容性 / 学习页交错入场动画
- 路由转场增强：blur + scale 电影感过渡
- `.anim-grand` / `.anim-glow` / `.anim-float` / `.anim-gold-shimmer` 工具类

### 变更
- 金色按钮渐变差异化：linear-gradient + shadow
- `--ease-out` 缓动函数过冲修正（1.1 → 1.0）
- 卡片 hover 背景 / 边框修复

### 修复
- 36 处 `transition: all` → 具体属性
- 6 处 font-size 低于 13px 最小值 → `var(--fs-xs)`
- 五行颜色硬编码 hex → CSS tokens
- toast 重复动画移除
- SPEC.md 技术栈版本更新（Pinia ≥4.0 / Vue Router ≥5.2 / Vite ≥8.1）
- SPEC.md 设计令牌更新（紫色 → 墨砚金）、等级系统（8 级 → 11 级）、XP 公式修正
- SPEC.md 补充 Compass.jsx 页面
- README.md / README.en.md / README.ja.md 设计令牌部分全部同步更新
- CONTRIBUTING.md 间距描述修正（8pt 节奏 → 4pt 基准）

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
