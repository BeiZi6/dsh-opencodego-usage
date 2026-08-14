# dsh-opencodego-usage

**作者：Xu Yuanshan · 2026-08-14 · MIT**

DeepSeek Harness (DSH) Web GUI 插件：在输入框右下角显示 **OpenCodeGo 剩余额度呼吸灯**，点击展开**液态玻璃面板**——三窗口进度条（近5小时 / 近7天 / 近30天）与**重置时间**标注。

## 功能

- 🟢🟡🔴 **呼吸灯**：随剩余额度变色（>50% 绿 / 20–50% 黄 / <20% 红），3.6s 慢呼吸
- 📊 **三窗口进度条**：`rolling` / `weekly` / `monthly` → 近5小时 / 近7天 / 近30天，含「已用 · 剩余」与重置时间
- 🔑 **Key 自动读取**：仅当 DSH 提供商为 `opencode-go` 时，自动解析 `credentials` 中 `llm-pi-ai.providers.opencode-go.apiKeyEnv` 对应的凭据；面板内可手动覆盖
- 🪟 **液态玻璃面板**：鼠标跟随高光 + 极透磨砂 + 窗口式斜向开合动画
- ⏱ 每 2 分钟自动刷新

## 结构

| 文件 | 作用 |
| --- | --- |
| `index.js` | Host 半端：`webServer` 注册同源路由 `/opencodego-usage`，查询 OpenCodeGo 官方配额 API 并解析窗口数据 |
| `client.js` | Client 半端：Web shell module-loader 形态，`conversation.input.right` 插槽注册呼吸灯与面板 |
| `cordis.patch.yml` | 组合层 patch：`insert` 插件行 |

## 安装

```sh
dsh plugin --profile web add github:BeiZi6/dsh-opencodego-usage
```

重启 `dsh web` 生效。

## 端点

OpenCodeGo 官方配额 API：`GET https://opencode.ai/zen/go/v1/usage`（Bearer 认证），响应形如：

```json
{ "usage": { "rolling": { "status": "ok", "percent": 86, "resetsAt": "..." },
              "weekly":  { "status": "ok", "percent": 34, "resetsAt": "..." },
              "monthly": { "status": "ok", "percent": 17, "resetsAt": "..." } } }
```

## 已知限制

- Key 状态文件默认落在 `$DSH_HOME/.ocg-state.json`（可用环境变量 `OCG_STATE_PATH` 覆盖）；删除后仅影响手动覆盖的 Key，凭据自动读取不受影响。

## 卸载

```sh
dsh plugin --profile web remove dsh-opencodego-usage
```
