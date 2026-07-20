# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/lang/zh-CN/spec/v2.0.0.html).

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
