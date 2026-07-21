# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/lang/zh-CN/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- 修复塔罗牌结果显示内部代码名（如 three-pf、career）而非中文标签
- 修复个人档案页生肖星座显示错误（传入字符串而非解析后的数字）
- 修复风水布局建议显示英文房间类型名（bedroom）而非中文（卧室）
- 修复 getCurrentJieqi 节气计算错误（7 月显示大寒而非小暑，因 1 月节气排序问题）
- 修复八字大运起运年龄不一致（bazi 引擎改用 computeDayuns 统一计算）
- 修复首页档案卡片显示异常
- 修复 showToast 的 danger 变体与 CSS 类名不匹配（toast--danger → toast--error）
- 修复 Dashboard 五行雷达图和今日建议因 dayMaster 路径错误而始终显示默认值
- 修复 EchoCenter 复盘提交时 result 为空导致崩溃
- 修复 Checkin 签到页面使用 UTC 日期导致跨午夜/时区签到异常
- 修复 Admin 模型编辑和知识库编辑弹窗的 footer 按钮被错误放入 body slot
- 修复 Me 页面日主显示依赖 store.profile.dayMaster（仅 Me 页面写入）的不一致问题
- 修复 MingeGauge 未对 value 做 0-100 边界检查
- 修复 EchoCard 的 onClick 不传递事件对象
- 修复 Me.jsx zodiacOf 对公元前年份返回 undefined
- 修复 Settings.jsx watch 清空 baseUrl 默认值
- 修复 Dashboard 工具使用统计中 compat 显示原始 key 而非中文名

### Changed
- MingeGauge 移除未使用的 level prop
- EchoCenter 复盘表单初始值改为 0.3（部分）以匹配 scoreLabels 选项
- Checkin nextMilestone 在所有里程碑达成后显示"所有里程碑已达成"而非回退到最后一项

### Removed
- 清理 Home.jsx 未使用的 onMounted、CATEGORIES、zodiacOfYear 死代码
- 清理 Dashboard.jsx 未使用的 ref、onMounted、getDayMaster、showToast、goToBazi
- 清理 Me.jsx 未使用的 computed、EchoProgress、getDayMaster 及 saveProfile 中的 dayMaster 冗余计算
- 清理 Chat.jsx 未使用的 useRouter、EmptyState
- 清理 ToolDetail.jsx 未使用的 reactive
- 清理 Tools.jsx 未使用的 useEchoStore
- 清理 Compatibility.jsx 未使用的 genderLabel
- 清理 Profile.jsx 未使用的 isProfileComplete、handleBack
- 清理 Admin.jsx 未使用的 onMounted、useRouter、useEchoStore、EchoTag

### Added
- 多语言 README 支持（中文默认 / English / 日本語）
- 开源仓库标准文件（ISSUE 模板、PR 模板、CODE_OF_CONDUCT、CI 工作流）
- 为全部组件和页面的列表渲染补充 key prop（ToolDetail 38 处、BaziChart 2 处、Timeline 2 处等）
- 添加 SECURITY.md 安全策略文档
- 添加 .env.example 环境变量模板
- 添加 .nvmrc Node 版本声明
- 添加 .prettierrc 代码格式化配置
- CI 工作流新增 Node 22.x 矩阵和构建产物上传

### Changed
- 升级 pinia 2.2→2.3.1、vue-router 4.4→4.6.4、vite 5.4.0→5.4.20
- SPEC.md 从内部 AI agent 规范重写为开源项目技术文档
- CONTRIBUTING.md 补充项目结构说明、环境变量配置、代码风格规范
- package.json 新增 lint 脚本

## [0.2.0] - 2026-07-20

### Added
- 命格面板：五行雷达图、五行生克关系图、今日建议矩阵、推演时间线、工具使用统计
- AI 对话：多模型切换、工具调用循环守卫、联网搜索（Tavily API）、Few-shot 示例注入
- 安全沙箱：参数校验、超时控制、Prompt Injection 检测、输出验证、工具结果净化
- 命运图谱：SVG 关系网络可视化（五行节点 + 工具节点 + 交互式调摄建议）
- 管理后台：模型管理（预设/自定义 CRUD）、提示词管理、用量统计、系统配置
- 每日签到：连续签到奖励、里程碑系统
- 今日运势：老黄历宜忌、时辰宜忌、每日渡言
- 响应式设计：超窄屏（≤340px）、横屏矮视口、超宽屏（≥1920px）适配
- 暗色模式、字号缩放、安全区适配

### Changed
- 设计令牌系统重构：统一颜色、间距、字号、圆角、阴影变量
- TabBar 响应式：移动端底部导航 → 桌面端侧边栏
- Modal 组件：移动端底部弹出 → 桌面端居中弹窗

### Fixed
- 修复 Chat 模型选择器 id/name 字段错配导致名称空白
- 修复 Admin 退出按钮因 TopBar slot 问题丢失
- 移除硬编码管理员默认密码
- 接入 Prompt Injection 检测（此前定义但未调用）
- 复用 sandbox.escapeHtml，消除重复代码
- 修复 CSS 重复导入（dashboard.css / admin.css）
- 修复 showToast 变体名不一致（warning/error → warn/danger）

## [0.1.0] - 2026-07-19

### Added
- 项目初始版本
- 18 个命理工具引擎（八字、紫微、六爻、梅花、摇钱、奇门、大六壬、子午流注、风水、老黄历等）
- 命运印证引擎：设节点 → 等回响 → 复盘
- 命格等级系统：经验值、等级、应验率
- Vue3 + Pinia + Vue Router SPA 架构
- 设计系统：宣纸/墨砚双主题
