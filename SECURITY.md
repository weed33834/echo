# 安全策略

## 报告漏洞

如果你发现安全漏洞，请**不要**在 GitHub Issue 中公开报告。

请发送邮件至项目维护者，或在 GitHub 上创建**私密** Security Advisory：

1. 前往 [Security Advisories](https://github.com/weed33834/echo/security/advisories/new)
2. 点击 "Report a vulnerability"
3. 填写漏洞描述、复现步骤和影响范围

我们会在 48 小时内回复。

## 支持的版本

| 版本 | 支持状态 |
|------|----------|
| 0.3.x | ✅ 当前版本 |
| < 0.3 | ❌ 不再支持 |

## 数据安全

Echo · 回响 是一个纯前端应用，所有数据存储在浏览器的 `localStorage` 中：

- 不收集任何个人信息
- 不上传数据到服务器
- 清除浏览器数据即清除所有记录
- AI 对话功能需要用户自行配置 API Key，密钥同样仅存储在本地
