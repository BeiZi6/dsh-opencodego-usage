// dsh-opencodego-usage v0.1 — 作者：Xu Yuanshan · 2026-08-14
// Host 半端：注册同源 HTTP 路由 /opencodego-usage，查询 OpenCodeGo 官方配额 API
// （https://opencode.ai/zen/go/v1/usage），Key 自动读取 DSH 凭据（仅当提供商为 opencode-go）。
import { execFile } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

export const name = 'opencodego-usage'

// 状态文件默认落在 DSH_HOME（默认 ~/.dsh），可用 OCG_STATE_PATH 覆盖。
const STATE_PATH = process.env.OCG_STATE_PATH
  || join(process.env.DSH_HOME || join(homedir(), '.dsh'), '.ocg-state.json')
const URLS = [
  'https://opencode.ai/zen/go/v1/usage',
  'https://opencode.ai/api/v1/usage',
  'https://api.opencode.ai/v1/usage',
]
const SEP = '@@OCG_STATUS@@'

function curl(url, apiKey) {
  return new Promise((resolve) => {
    execFile(
      'curl.exe',
      ['-sS', '-m', '20', '-H', 'Authorization: Bearer ' + apiKey, '-w', '\n' + SEP + '%{http_code}', url],
      { timeout: 25000, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 },
      (error, stdout, stderr) => resolve({ error, stdout, stderr }),
    )
  })
}

// Key 解析：显式传入 > 凭据自动读取（提供商 opencode-go）> 进程环境变量 > 状态文件
async function resolveKey(ctx, explicit) {
  if (explicit) return explicit
  try {
    const adm = ctx.get('agentDefaultModel')
    let provider = null
    try {
      const sel = adm && typeof adm.currentSelection === 'function' ? adm.currentSelection() : null
      provider = sel && typeof sel.provider === 'string' ? sel.provider : null
    } catch (e) { provider = null }
    if (provider === null || provider === 'opencode-go') {
      let ref = 'OPENCODE_GO_API_KEY'
      try {
        const settings = ctx.get('settings')
        const cfg = settings && typeof settings.get === 'function' ? settings.get('llm-pi-ai') : null
        const p = cfg && cfg.providers ? cfg.providers['opencode-go'] : null
        if (p && typeof p.apiKeyEnv === 'string' && p.apiKeyEnv.trim()) ref = p.apiKeyEnv.trim()
      } catch (e) { /* ignore */ }
      const creds = ctx.get('credentials')
      if (creds && typeof creds.resolve === 'function') {
        try {
          const hit = await creds.resolve(ref)
          const value = hit && typeof hit.value === 'string' ? hit.value.trim() : ''
          if (value) return value
        } catch (e) { /* ignore */ }
      }
      try {
        const value = process.env[ref]
        if (value && value.trim()) return value.trim()
      } catch (e) { /* ignore */ }
    }
  } catch (e) { /* ignore */ }
  try {
    const text = readFileSync(STATE_PATH, 'utf8')
    const state = JSON.parse(text)
    if (state && typeof state.apiKey === 'string' && state.apiKey.trim()) return state.apiKey.trim()
  } catch (e) { /* ignore */ }
  return null
}

function send(res, status, payload) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  res.end(JSON.stringify(payload))
}

// 真实 opencodego 结构：usage.{rolling,weekly,monthly}.{status,percent,resetsAt}
// percent = 已用百分比（支持数字字符串）；resetsAt = 重置时间。兼容 used/limit 数值对结构。
function extractWindows(json) {
  const LABEL_MAP = { rolling: '近5小时', weekly: '近7天', monthly: '近30天' }
  const ORDERED = ['近5小时', '近7天', '近30天']
  const windows = []
  const walk = (node, path, depth) => {
    if (node === null || typeof node !== 'object' || depth > 7) return
    const entries = Array.isArray(node)
      ? node.map((v, i) => [String(i), v])
      : Object.keys(node).map((k) => [k, node[k]])
    const scalar = {}
    const sub = []
    for (const pair of entries) {
      const k = String(pair[0]).toLowerCase()
      const v = pair[1]
      if (v !== null && typeof v === 'object') {
        sub.push([k, v])
      } else if (typeof v === 'number' || typeof v === 'string') {
        if (typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v.trim())) scalar[k] = Number(v.trim())
        else scalar[k] = v
      }
    }
    const seg = String(path).split('.').pop() || ''
    let percent = null
    let resetAt = null
    let status = null
    for (const k of Object.keys(scalar)) {
      const v = scalar[k]
      if (percent === null && typeof v === 'number' && /percent|pct/i.test(k)) percent = v
      if (resetAt === null && typeof v === 'string' && /reset|expire|end|until|date|time|timestamp/i.test(k) && !Number.isNaN(Date.parse(v))) resetAt = new Date(v)
      if (status === null && typeof v === 'string' && /^status$/i.test(k)) status = v
    }
    if (percent !== null) {
      windows.push({ seg, percent: Math.max(0, Math.min(100, percent)), resetAt: resetAt ? resetAt.toISOString() : null, status })
    } else {
      // 兼容结构：used/limit 或 remaining/limit 或 input+output/limit
      let used = null
      let limit = null
      let remaining = null
      let input = null
      let output = null
      for (const k of Object.keys(scalar)) {
        if (typeof scalar[k] !== 'number') continue
        if (/used|usage/.test(k) && used === null) used = scalar[k]
        if (/remaining|remain|left/.test(k) && remaining === null) remaining = scalar[k]
        if (/limit|quota|total|cap|max/.test(k) && limit === null) limit = scalar[k]
        if (/input|prompt/.test(k) && input === null) input = scalar[k]
        if (/output|completion/.test(k) && output === null) output = scalar[k]
      }
      if (used === null && remaining !== null && limit !== null) used = limit - remaining
      if (used === null && input !== null && output !== null) used = input + output
      else if (used === null && input !== null) used = input
      if (used !== null && limit !== null && limit > 0 && used >= 0) {
        windows.push({ seg, used, limit, resetAt: resetAt ? resetAt.toISOString() : null })
      }
    }
    for (const pair of sub) {
      walk(pair[1], path ? path + '.' + pair[0] : String(pair[0]), depth + 1)
    }
  }
  walk(json, '', 0)
  const out = []
  const usedLabels = new Set()
  windows.forEach((w, i) => {
    let label = w.seg && LABEL_MAP[w.seg] ? LABEL_MAP[w.seg] : null
    if (!label && w.seg && /h$|d$|day|hour|week|month|min|小时|天|周|月/i.test(w.seg)) label = w.seg
    if (!label && w.percent !== undefined) label = ORDERED[i] || ('窗口 ' + (i + 1))
    if (!label) label = '窗口 ' + (i + 1)
    if (usedLabels.has(label)) {
      let n = 2
      while (usedLabels.has(label + ' #' + n)) n += 1
      label = label + ' #' + n
    }
    usedLabels.add(label)
    const item = { label }
    if (w.percent !== undefined) item.percent = w.percent
    if (w.used !== undefined) item.used = w.used
    if (w.limit !== undefined) item.limit = w.limit
    if (w.resetAt !== null) item.resetAt = w.resetAt
    if (w.status !== null && w.status !== undefined) item.status = w.status
    out.push(item)
  })
  return out
}

export function apply(ctx) {
  ctx.inject(['webServer'], (httpCtx) => {
    httpCtx.effect(() => httpCtx.webServer.register({
      kind: 'exact',
      path: '/opencodego-usage',
      handler: async (req, res) => {
        try {
          const query = new URLSearchParams((req.url || '').split('?')[1] || '')
          const explicit = (query.get('key') || '').trim()
          const apiKey = await resolveKey(ctx, explicit)
          if (!apiKey) {
            send(res, 200, { ok: false, error: '未提供 API Key', needKey: true })
            return
          }
          if (explicit) {
            try { writeFileSync(STATE_PATH, JSON.stringify({ apiKey: explicit }), 'utf8') } catch (e) { /* ignore */ }
          }
          let lastErr = ''
          for (const url of URLS) {
            const r = await curl(url, apiKey)
            if (r.error) {
              lastErr = String((r.error && r.error.message) || r.error).slice(0, 200)
              continue
            }
            const idx = r.stdout.lastIndexOf('\n' + SEP)
            let status = ''
            let body = r.stdout
            if (idx >= 0) {
              status = r.stdout.slice(idx + 1 + SEP.length).trim()
              body = r.stdout.slice(0, idx)
            }
            if (status === '401' || status === '403') {
              send(res, 200, { ok: false, error: 'HTTP ' + status + '：API Key 无效或无权限', source: url, httpStatus: status, raw: body.trim().slice(0, 2000) })
              return
            }
            if (status === '404' || status === '405' || status === '500' || status === '502' || status === '503') {
              lastErr = 'HTTP ' + status
              continue
            }
            if (!body.trim()) {
              send(res, 200, { ok: false, error: '空响应 (HTTP ' + (status || '?') + ')', source: url, httpStatus: status })
              return
            }
            let json = null
            try { json = JSON.parse(body.trim()) } catch (e) { json = null }
            if (json === null) {
              send(res, 200, { ok: false, error: '响应不是 JSON', source: url, httpStatus: status, raw: (body.trim() + ' ' + r.stderr.trim()).slice(0, 300) })
              return
            }
            send(res, 200, {
              ok: true,
              source: url,
              httpStatus: status,
              windows: extractWindows(json),
              raw: JSON.stringify(json, null, 2).slice(0, 6000),
            })
            return
          }
          send(res, 200, { ok: false, error: '所有端点请求失败' + (lastErr ? '：' + lastErr : '') })
        } catch (e) {
          send(res, 500, { ok: false, error: String((e && e.message) || e) })
        }
      },
    }))
  })
}
