# 贡献指南

感谢你对 Echo 项目的关注！欢迎以任何方式参与贡献。

## 行为准则

请保持友善、尊重的交流态度。命理文化涉及不同观点，请包容多样性。详见 [CODE_OF_CONDUCT.md](./.github/CODE_OF_CONDUCT.md)。

## 如何贡献

### 报告问题

- 在 [Issues](https://github.com/weed33834/echo/issues) 中搜索是否已有相同问题
- 新建 Issue 时请选择对应模板（Bug 报告 / 功能建议）
- 请包含：复现步骤、预期行为、实际行为、环境信息（浏览器/系统/屏幕尺寸）

### 提交代码

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -m 'feat: 添加某某功能'`
4. 推送分支：`git push origin feature/your-feature`
5. 提交 Pull Request（会自动使用 PR 模板）

### 提交规范

采用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

| 前缀 | 用途 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat: 新增紫微斗数排盘引擎` |
| `fix` | Bug 修复 | `fix: 修复签到页面 UTC 日期问题` |
| `docs` | 文档更新 | `docs: 更新 README 英文版` |
| `style` | 代码格式 | `style: 统一缩进为 2 空格` |
| `refactor` | 重构 | `refactor: 提取公共日期工具函数` |
| `perf` | 性能优化 | `perf: 懒加载 ToolDetail 结果渲染器` |
| `chore` | 构建/工具 | `chore: 升级 Vite 到 5.4.20` |

## 开发环境

### 前置要求

- Node.js ≥ 18（推荐 20.x，参见 `.nvmrc`）
- npm ≥ 9

### 快速启动

```bash
# 克隆仓库
git clone https://github.com/weed33834/echo.git
cd echo

# 安装依赖
npm install

# 启动开发服务器（默认 5173 端口）
npm run dev

# 构建生产版本
npm run build

# 预览构建结果（4173 端口）
npm run preview
```

### 环境变量

复制 `.env.example` 为 `.env`，填入你的 API Key：

```bash
cp .env.example .env
```

也可在应用内「设置」页面直接配置 AI 模型，无需 `.env` 文件。

## 项目结构

详细结构见 [SPEC.md](./SPEC.md)，核心目录：

```
src/
├── stores/          # Pinia 状态管理（echo.js / chat.js）
├── services/        # 业务服务（AI 对话 / 工具调度 / 安全沙箱）
├── utils/engines.js # 18 个命理引擎（纯函数）
├── components/      # 基础组件库（EchoUI / TabBar / BaziChart 等）
├── pages/           # 15 个页面
├── designs/         # 设计系统（tokens.css 设计令牌 + 页面样式）
└── data/lessons.js  # 学习中心课程数据
```

## 代码风格

- **缩进**：2 空格（已配置 `.editorconfig` 和 `.prettierrc`）
- **组件模式**：`defineComponent` + `setup()` + JSX
- **CSS 命名**：BEM 风格（`block__element--modifier`）
- **颜色/字号**：必须使用设计令牌（`var(--token)`），禁止硬编码
- **间距**：8pt 节奏（4/8/12/16/24/32/48/64）
- **列表渲染**：必须设置 `key` prop
- **不使用 TypeScript**：保持纯 JavaScript + JSX

## 新增命理引擎

1. 在 `src/utils/engines.js` 中实现引擎，导出 `{ calc, meta }` 结构
2. 在 `src/stores/echo.js` 的 `TOOLS` 数组中注册工具元信息
3. 在 `src/services/tools.js` 的 `ENGINES` 映射中关联引擎
4. 测试推演流程：工具页 → 推演 → 印证 → 命格面板

引擎规范详见 [SPEC.md §五](./SPEC.md#五命理引擎规范)。

## 安全规范

- 所有 AI 工具调用必须经过沙箱校验（`src/services/sandbox.js`）
- 用户输入必须经过注入检测
- 涉及医疗/法律/财务/危机话题时必须触发安全护栏
- 详见 [SECURITY.md](./SECURITY.md)

## 免责声明

本项目所有推演结果均为文化算法的可视化呈现，不构成任何决策依据。贡献者在实现引擎时应保持文化尊重，避免绝对化断言。
