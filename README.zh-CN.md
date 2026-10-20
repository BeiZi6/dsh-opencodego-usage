# dsh-opencodego-usage

**[简体中文](README.zh-CN.md) · [English](README.md)**

DeepSeek Harness (DSH) Web GUI 的 OpenCodeGo 额度监控插件:输入框右下角的呼吸灯一眼可见剩余额度,点击展开液态玻璃面板,展示各窗口进度条与重置时间。

## 特性

- 🟢🟡🔴 **呼吸灯** —— 按剩余额度变色(>50% 绿 / 20–50% 黄 / <20% 红),3.6 秒柔和呼吸动画
- 📊 **三窗口进度面板** —— `rolling`(约近 5 小时)、`weekly`(约近 7 天)、`monthly`(约近 30 天)进度条,含已用 · 剩余与每个窗口的重置时间
- 🔑 **零配置 Key 处理** —— 自动从 DSH 凭据读取 API Key(仅当提供商为 `opencode-go` 时);面板内可手动覆盖
- 🪟 **液态玻璃面板** —— 鼠标跟随高光、磨砂模糊与窗口式斜向开合动画
- ⏱ **自动刷新** —— 每 2 分钟拉取一次最新额度

## 安装

需要启用 web profile 的 DeepSeek Harness。

插件支持 `dsh-host-webserver` 0.1.x 以及从 `0.2.1-rc.2` 开始的 0.2.x 系列，
包括 DSH Desktop 2.0.18。启动时指示灯会等待输入框插槽服务就绪后再注册。

从官方 registry 安装:

```sh
dsh plugin --profile web add github:BeiZi6/dsh-opencodego-usage
```

重启 `dsh web` 后生效。

卸载:

```sh
dsh plugin --profile web remove dsh-opencodego-usage
```

## 使用

- 指示器位于对话输入框右下角,颜色反映三个窗口中最低的剩余份额:

  | 剩余份额 | 颜色 |
  |---|---|
  | > 50% | 🟢 绿 |
  | 20–50% | 🟡 黄 |
  | < 20% | 🔴 红 |

- 点击展开面板:
  - `rolling` —— 约近 5 小时内的已用额度
  - `weekly` —— 约近 7 天内的已用额度
  - `monthly` —— 约近 30 天内的已用额度
- 每个窗口显示已用百分比、剩余份额与确切重置时间。
- 可在面板内为当前会话手动覆盖 API Key;清除后回退到自动解析。
- 数据每 2 分钟自动刷新。

### API Key 解析

插件按以下顺序查找 Key:

1. 面板内手动覆盖(保存在 `$DSH_HOME` 下的一个小型状态文件中;可用 `OCG_STATE_PATH` 环境变量修改路径)
2. DSH 凭据 —— 仅当当前提供商为 `opencode-go` 时,解析 `llm-pi-ai.providers.opencode-go.apiKeyEnv` 引用的凭据
3. 进程环境变量
4. 状态文件

Key 只会通过 HTTPS 发送给 OpenCodeGo 官方额度接口。

## 工作原理

- **Host 半端**(`index.js`) —— 在 DSH Web 服务器上注册同源路由 `/opencodego-usage`。该路由查询 OpenCodeGo 官方额度 API(`GET https://opencode.ai/zen/go/v1/usage`,Bearer 认证)并解析窗口数据:

  ```json
  { "usage": { "rolling": { "status": "ok", "percent": 86, "resetsAt": "…" },
                "weekly":  { "status": "ok", "percent": 34, "resetsAt": "…" },
                "monthly": { "status": "ok", "percent": 17, "resetsAt": "…" } } }
  ```

  同时兼容旧版 `used` / `limit` 数值对结构。
- **Client 半端**(`client.js`) —— 以 web-shell 模块注册进 `conversation.input.right` 插槽;每 2 分钟轮询同源路由并渲染指示器与面板。

## 已知限制

- 状态文件只保存手动覆盖的 Key;删除它绝不影响基于凭据的解析。
- 额度数值与重置时间以 OpenCodeGo API 返回为准,不做本地估算。

## 兼容性

- DeepSeek Harness Web GUI(`dsh web`)
- Node.js >= 22.19
- Peer 依赖:`@deepseek-ai/cordis`(^4)、`@deepseek-ai/dsh-host-webserver`(^0.1.0-rc.6)

## 许可证

MIT © Xu Yuanshan

## 链接

- 仓库: <https://github.com/BeiZi6/dsh-opencodego-usage>
- Issues: <https://github.com/BeiZi6/dsh-opencodego-usage/issues>
