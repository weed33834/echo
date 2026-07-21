# 贡献指南

感谢你对 Echo 项目的关注！欢迎以任何方式参与贡献。

## 行为准则

请保持友善、尊重的交流态度。命理文化涉及不同观点，请包容多样性。详见 [CODE_OF_CONDUCT.md](./.github/CODE_OF_CONDUCT.md)。

## 如何贡献

### 报告问题

- 在 Issues 中搜索是否已有相同问题
- 新建 Issue 时请包含：复现步骤、预期行为、实际行为、环境信息（浏览器/系统）

### 提交代码

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -m 'feat: 添加某某功能'`
4. 推送分支：`git push origin feature/your-feature`
5. 提交 Pull Request

### 提交规范

采用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

| 前缀 | 用途 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `style` | 代码格式（不影响功能） |
| `refactor` | 重构（既不是新功能也不是修 Bug） |
| `perf` | 性能优化 |
| `chore` | 构建/工具变更 |

示例：`feat: 新增紫微斗数排盘引擎`

## 开发环境

```bash
# 克隆仓库
git clone https://github.com/weed33834/echo.git
cd echo

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

**技术栈**：Vue 3 (JSX) + Pinia + Vue Router + Vite

## 代码风格

- 使用 2 空格缩进
- 组件使用 `defineComponent` + `setup()` 模式
- CSS 遵循 BEM 命名，使用设计令牌（`var(--token)`）
- 不使用 TypeScript（保持纯 JavaScript + JSX）

## 新增命理引擎

如需添加新的命理工具引擎：

1. 在 `src/utils/engines.js` 中实现引擎，导出 `{ calc, meta }` 结构
2. 在 `src/stores/echo.js` 的 `TOOLS` 数组中注册工具元信息
3. 在 `src/services/tools.js` 的 `ENGINES` 映射中关联引擎
4. 测试推演流程：工具页 → 推演 → 印证 → 命格面板

## 免责声明

本项目所有推演结果均为文化算法的可视化呈现，不构成任何决策依据。贡献者在实现引擎时应保持文化尊重，避免绝对化断言。
