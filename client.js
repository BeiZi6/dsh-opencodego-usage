// dsh-opencodego-usage v0.1 — 作者：Xu Yuanshan · 2026-08-14
// Client 半端：Web shell module-loader 形态（参照 dsh-theme-plugin）。
// 呼吸灯（输入框右下角）+ 液态玻璃面板（三窗口进度条 + 重置时间），
// 数据通过同源 fetch('/opencodego-usage') 从 Host 路由获取。
window.__ModuleLoader__.load({
  id: 'dsh-opencodego-usage',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    const React = require('react')

    const CSS = `
      @keyframes ocgr-breathe {
        0%, 100% { opacity: .28; transform: scale(.7); }
        50% { opacity: 1; transform: scale(1); }
      }
      @keyframes ocgr-grow {
        0%   { max-width: 0; max-height: 0; opacity: 0; }
        70%  { max-width: 300px; max-height: 420px; opacity: 1; }
        100% { max-width: 300px; max-height: 420px; opacity: 1; }
      }
      @keyframes ocgr-shrink {
        from { max-width: 300px; max-height: 420px; opacity: 1; }
        to   { max-width: 0; max-height: 0; opacity: 0; }
      }
      .ocgr-root { display:inline-flex; position:relative; }
      .ocgr-trigger { width:28px; height:28px; cursor:pointer; background:none; border:none; border-radius:999px; flex:none; place-items:center; display:grid; }
      .ocgr-trigger:hover { background:var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,.15)); }
      .ocgr-dot { width:9px; height:9px; border-radius:50%; animation:ocgr-breathe 3.6s ease-in-out infinite; box-shadow:0 0 6px currentColor; }
      .ocgr-idle { background:var(--dsw-alias-label-tertiary, #777); color:var(--dsw-alias-label-tertiary, #777); animation:none; opacity:.45; }
      .ocgr-ok { background:var(--dsw-alias-state-success-primary, #3fb950); color:var(--dsw-alias-state-success-primary, #3fb950); }
      .ocgr-warn { background:var(--dsw-alias-state-warn-primary, #d29922); color:var(--dsw-alias-state-warn-primary, #d29922); }
      .ocgr-low { background:var(--dsw-alias-state-error-primary, #f66); color:var(--dsw-alias-state-error-primary, #f66); }
      .ocgr-err { background:var(--dsw-alias-state-error-primary, #f66); color:var(--dsw-alias-state-error-primary, #f66); animation:none; }
      .ocgr-panel {
        z-index:100; box-sizing:border-box; width:300px; max-width:300px; max-height:420px;
        border-radius:18px; padding:14px; overflow:hidden;
        font-size:12px; line-height:20px; position:absolute; bottom:calc(100% + 10px); right:0;
        display:flex; flex-direction:column; gap:8px;
        color:var(--dsw-alias-label-secondary, #bbb);
        --gx:20%; --gy:0%;
        animation:ocgr-grow .24s cubic-bezier(.2,.8,.25,1);
        background:
          radial-gradient(560px circle at var(--gx) var(--gy), rgba(255,255,255,.16), transparent 45%),
          radial-gradient(120% 90% at 18% 0%, rgba(255,255,255,.10), transparent 50%),
          linear-gradient(145deg, rgba(255,255,255,.08), rgba(255,255,255,.02)),
          rgba(20,22,30,.16);
        border:1px solid rgba(255,255,255,.16);
        backdrop-filter: blur(26px) saturate(170%) brightness(1.08);
        -webkit-backdrop-filter: blur(26px) saturate(170%) brightness(1.08);
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.18),
          inset 0 -1px 0 rgba(255,255,255,.05),
          0 10px 36px rgba(0,0,0,.45);
      }
      .ocgr-panel-closing { animation:ocgr-shrink .18s ease-in forwards; }
      @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
        .ocgr-panel { background:rgba(28,30,40,.78); }
      }
      .ocgr-header { display:flex; align-items:center; gap:6px; }
      .ocgr-headline { color:var(--dsw-alias-label-tertiary, #999); }
      .ocgr-percent { color:var(--dsw-alias-label-primary, #eee); font-weight:500; }
      .ocgr-win { display:flex; flex-direction:column; gap:3px; }
      .ocgr-winTop { display:flex; align-items:baseline; gap:8px; }
      .ocgr-winLabel { color:var(--dsw-alias-label-primary, #eee); font-weight:500; min-width:64px; }
      .ocgr-winMeta { font-variant-numeric:tabular-nums; color:var(--dsw-alias-label-secondary, #bbb); }
      .ocgr-winReset { color:var(--dsw-alias-label-tertiary, #999); font-size:11px; margin-left:auto; }
      .ocgr-bar { background:rgba(255,255,255,.12); border-radius:999px; height:5px; overflow:hidden; }
      .ocgr-segment { border-radius:1px; height:100%; }
      .ocgr-ctrl { display:flex; gap:6px; flex-wrap:wrap; align-items:center; }
      .ocgr-input { background:rgba(255,255,255,.10); border:1px solid rgba(255,255,255,.18); color:var(--dsw-alias-label-primary, #eee); border-radius:8px; padding:2px 8px; font-size:12px; width:150px; }
      .ocgr-input:focus { outline:none; border-color:rgba(255,255,255,.40); }
      .ocgr-btn { cursor:pointer; background:rgba(255,255,255,.10); border:1px solid rgba(255,255,255,.18); color:var(--dsw-alias-label-primary, #eee); border-radius:8px; padding:1px 8px; font-size:12px; }
      .ocgr-btn:hover { border-color:var(--dsw-alias-brand-primary, #5b9dff); background:rgba(255,255,255,.14); }
      .ocgr-btn:disabled { opacity:.5; cursor:default; }
      .ocgr-err { color:var(--dsw-alias-state-error-primary, #f66); }
      .ocgr-meta { opacity:.75; }
      .ocgr-raw { max-height:180px; overflow:auto; font-size:11px; background:rgba(0,0,0,.30); border:1px solid rgba(255,255,255,.12); border-radius:8px; padding:6px; white-space:pre-wrap; word-break:break-all; margin:0; }
    `

    const keyRef = { current: '' }
    const checkRef = { current: null }

    function formatNum(n) {
      if (n === null || n === undefined || Number.isNaN(Number(n))) return '—'
      const v = Number(n)
      if (Math.abs(v) >= 1000000) return (v / 1000000).toFixed(2) + 'M'
      if (Math.abs(v) >= 1000) return (v / 1000).toFixed(1) + 'k'
      return String(Math.round(v * 100) / 100)
    }

    function formatReset(iso) {
      if (!iso) return null
      const d = new Date(iso)
      if (Number.isNaN(d.getTime())) return null
      const p = (x) => String(x).padStart(2, '0')
      return p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes())
    }

    function stateOf(remPct) {
      if (remPct === null) return 'idle'
      if (remPct > 50) return 'ok'
      if (remPct > 20) return 'warn'
      return 'low'
    }

    function trackMouse(e) {
      const el = e.currentTarget
      const rect = el.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      el.style.setProperty('--gx', x + '%')
      el.style.setProperty('--gy', y + '%')
    }

    function UsageDot() {
      const [apiKey, setApiKey] = React.useState('')
      const [open, setOpen] = React.useState(false)
      const [closing, setClosing] = React.useState(false)
      const [busy, setBusy] = React.useState(false)
      const [configured, setConfigured] = React.useState(false)
      const [windows, setWindows] = React.useState([])
      const [raw, setRaw] = React.useState('')
      const [error, setError] = React.useState('')
      const [updatedAt, setUpdatedAt] = React.useState(0)
      const [rawOpen, setRawOpen] = React.useState(false)

      function applyResult(res) {
        if (res && res.ok) {
          setWindows(Array.isArray(res.windows) ? res.windows : [])
          setRaw(typeof res.raw === 'string' ? res.raw : '')
          setError('')
          setConfigured(true)
        } else {
          setError((res && typeof res.error === 'string') ? res.error : '未知错误')
          setRaw((res && typeof res.raw === 'string') ? res.raw : '')
          if (!res || !res.needKey) setConfigured(false)
        }
        setUpdatedAt(Date.now())
        setBusy(false)
      }

      function doCheck(explicitKey, silent) {
        if (explicitKey) keyRef.current = explicitKey.trim()
        if (!explicitKey && !keyRef.current && !configured) return
        if (!silent) setBusy(true)
        const url = keyRef.current
          ? '/opencodego-usage?key=' + encodeURIComponent(keyRef.current)
          : '/opencodego-usage'
        fetch(url, { cache: 'no-store' })
          .then((r) => r.json())
          .then(applyResult)
          .catch((e) => {
            setError(String((e && e.message) || e))
            setBusy(false)
            setUpdatedAt(Date.now())
          })
      }
      checkRef.current = doCheck

      React.useEffect(() => {
        fetch('/opencodego-usage', { cache: 'no-store' })
          .then((r) => r.json())
          .then(applyResult)
          .catch(() => {})
      }, [])

      React.useEffect(() => {
        const id = window.setInterval(() => {
          if (checkRef.current) checkRef.current(null, true)
        }, 120000)
        return () => window.clearInterval(id)
      }, [])

      function submit() {
        doCheck(apiKey, false)
      }

      function toggle() {
        if (open) {
          setClosing(true)
        } else if (closing) {
          setClosing(false)
          setOpen(true)
        } else {
          setOpen(true)
        }
      }

      function finishClose(e) {
        if (closing && e && e.animationName === 'ocgr-shrink') {
          setOpen(false)
          setClosing(false)
        }
      }

      const remPcts = windows
        .map((w) => {
          if (w && typeof w.percent === 'number') {
            const rem = w.status && w.status !== 'ok' ? 0 : 100 - w.percent
            return { w, pct: Math.max(0, Math.min(100, rem)) }
          }
          if (w && typeof w.limit === 'number' && w.limit > 0 && typeof w.used === 'number') {
            return { w, pct: Math.max(0, Math.min(100, ((w.limit - Math.max(0, w.used)) / w.limit) * 100)) }
          }
          return null
        })
        .filter((x) => x !== null)
      const worst = remPcts.length ? remPcts.reduce((a, b) => (b.pct < a.pct ? b : a)) : null
      const remPct = worst ? Math.round(worst.pct) : null
      const state = error && !configured ? 'err' : stateOf(remPct)
      const dotClass = 'ocgr-dot ocgr-' + state
      const time = updatedAt ? new Date(updatedAt).toLocaleTimeString() : ''
      const color = state === 'ok' ? 'var(--dsw-alias-state-success-primary, #3fb950)'
        : state === 'warn' ? 'var(--dsw-alias-state-warn-primary, #d29922)'
        : state === 'low' || state === 'err' ? 'var(--dsw-alias-state-error-primary, #f66)'
        : 'var(--dsw-alias-label-tertiary, #777)'
      const label = error ? 'OpenCodeGo 查询失败'
        : remPct === null ? 'OpenCodeGo 剩余额度'
        : 'OpenCodeGo 剩余额度 ' + remPct + '%'
      const panelVisible = open || closing

      return React.createElement('span', { className: 'ocgr-root' },
        React.createElement('button', {
          type: 'button',
          className: 'ocgr-trigger',
          'aria-label': label,
          'aria-haspopup': 'dialog',
          'aria-expanded': open,
          title: label,
          onClick: toggle,
        },
          React.createElement('span', { className: dotClass, 'aria-hidden': true }),
        ),
        panelVisible && React.createElement('div', {
          className: 'ocgr-panel' + (closing ? ' ocgr-panel-closing' : ''),
          role: 'dialog',
          'aria-label': 'OpenCodeGo 用量',
          onMouseMove: trackMouse,
          onAnimationEnd: finishClose,
        },
          React.createElement('div', { className: 'ocgr-header' },
            React.createElement('span', { className: 'ocgr-headline' }, 'OpenCodeGo 剩余额度'),
            remPct !== null
              ? React.createElement('span', { className: 'ocgr-percent' }, '最低剩余 ' + remPct + '%')
              : React.createElement('span', { className: 'ocgr-headline' }, error ? '查询失败' : '未配置'),
          ),
          windows.length > 0 && React.createElement('div', { className: 'ocgr-rows' },
            windows.map((w) => {
              const usedPct = typeof w.percent === 'number'
                ? Math.min(100, Math.max(0, w.percent))
                : w.limit > 0 ? Math.min(100, Math.max(0, (w.used / w.limit) * 100)) : 0
              const remP = typeof w.percent === 'number'
                ? (w.status && w.status !== 'ok' ? 0 : 100 - w.percent)
                : w.limit > 0 ? Math.max(0, Math.min(100, ((w.limit - w.used) / w.limit) * 100)) : 0
              const wColor = stateOf(remP) === 'ok' ? 'var(--dsw-alias-state-success-primary, #3fb950)'
                : stateOf(remP) === 'warn' ? 'var(--dsw-alias-state-warn-primary, #d29922)'
                : 'var(--dsw-alias-state-error-primary, #f66)'
              const reset = formatReset(w.resetAt)
              const meta = typeof w.percent === 'number'
                ? '已用 ' + Math.round(usedPct) + '% · 剩余 ' + Math.round(remP) + '%'
                : '已用 ' + formatNum(w.used) + ' / ' + formatNum(w.limit) + ' · 剩余 ' + formatNum(Math.max(0, w.limit - w.used))
              return React.createElement('div', { className: 'ocgr-win', key: w.label + (w.resetAt || '') + (w.percent !== undefined ? w.percent : '') },
                React.createElement('div', { className: 'ocgr-winTop' },
                  React.createElement('span', { className: 'ocgr-winLabel' }, w.label),
                  React.createElement('span', { className: 'ocgr-winMeta' }, meta),
                  React.createElement('span', { className: 'ocgr-winReset' }, reset ? '重置 ' + reset : '滚动窗口'),
                ),
                React.createElement('div', { className: 'ocgr-bar' },
                  React.createElement('div', { className: 'ocgr-segment', style: { width: usedPct + '%', background: wColor } })),
              )
            }),
          ),
          React.createElement('div', { className: 'ocgr-ctrl' },
            React.createElement('input', {
              className: 'ocgr-input',
              type: 'password',
              placeholder: configured ? 'Key 已自动读取（可覆盖）' : 'OpenCodeGo API Key',
              value: apiKey,
              onChange: (e) => setApiKey(e.target.value),
              onKeyDown: (e) => { if (e.key === 'Enter') submit() },
            }),
            React.createElement('button', { className: 'ocgr-btn', onClick: submit, disabled: busy }, '查询'),
            React.createElement('button', { className: 'ocgr-btn', onClick: () => setRawOpen(!rawOpen) }, rawOpen ? '收起' : '原始'),
            React.createElement('button', { className: 'ocgr-btn', onClick: toggle }, '关闭'),
          ),
          ...(busy ? [React.createElement('div', { className: 'ocgr-meta', key: 'busy' }, '查询中…')] : []),
          ...(error ? [React.createElement('div', { className: 'ocgr-err', key: 'err' }, error)] : []),
          ...(time ? [React.createElement('div', { className: 'ocgr-meta', key: 'time' }, '更新于 ' + time)] : []),
          React.createElement('div', { className: 'ocgr-meta' }, 'Key 自动读取 DSH 凭据（opencode-go 提供商）· 每 2 分钟自动刷新'),
          ...(rawOpen && raw ? [React.createElement('pre', { className: 'ocgr-raw', key: 'raw' }, raw)] : []),
        ),
      )
    }

    module.exports = {
      inject: ['slots'],
      apply(ctx) {
        const tag = document.createElement('style')
        tag.textContent = CSS
        document.head.append(tag)
        ctx.effect(() => () => tag.remove())

        ctx.slots.inject('conversation.input.right', () => ctx.slots.register(
          { name: 'conversation.input.right', id: 'opencodego-usage', order: 10, label: 'OpenCodeGo 用量' },
          () => React.createElement(UsageDot, null),
        ))
      },
    }

    return module.exports
  },
})
