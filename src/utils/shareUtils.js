/**
 * ShareUtils — 社交分享工具
 * 支持：原生分享、海报生成、剪贴板复制
 */

/**
 * 生成运势海报为 Canvas 并返回 DataURL
 * @param {Object} opts - { title, subtitle, score, items: [{label, value, color}], footer }
 * @returns {Promise<string>} PNG dataURL
 */
export function generatePoster(opts) {
  const { title = 'Echo · 命运印证', subtitle = '', score = null, items = [], footer = 'Echo 回响 — 命运印证引擎', theme = 'dark' } = opts

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const W = 1080, H = 1920
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')

    // 背景：深色宇宙渐变
    const isDark = theme === 'dark'
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H)
    if (isDark) {
      bgGrad.addColorStop(0, '#0d0a1a')
      bgGrad.addColorStop(0.5, '#16112a')
      bgGrad.addColorStop(1, '#0d0a1a')
    } else {
      bgGrad.addColorStop(0, '#f7f5f0')
      bgGrad.addColorStop(0.5, '#ffffff')
      bgGrad.addColorStop(1, '#efeafb')
    }
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, W, H)

    // 星空点缀
    if (isDark) {
      for (let i = 0; i < 80; i++) {
        const x = Math.random() * W
        const y = Math.random() * H
        const r = Math.random() * 2 + 0.5
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.4 + 0.1})`
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // 装饰圆环
    const cx = W / 2
    const ringY = 350
    ctx.strokeStyle = isDark ? 'rgba(201,168,76,0.25)' : 'rgba(184,137,58,0.2)'
    ctx.lineWidth = 1
    for (let r = 80; r <= 200; r += 40) {
      ctx.beginPath()
      ctx.arc(cx, ringY, r, 0, Math.PI * 2)
      ctx.stroke()
    }

    // 中心装饰
    ctx.strokeStyle = isDark ? 'rgba(122,95,240,0.3)' : 'rgba(91,63,214,0.2)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(cx - 220, ringY)
    ctx.lineTo(cx + 220, ringY)
    ctx.stroke()

    // 标题
    ctx.fillStyle = isDark ? '#c9a84c' : '#b8893a'
    ctx.font = 'bold 52px "PingFang SC", "Noto Sans SC", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(title, cx, 150)

    // 副标题
    if (subtitle) {
      ctx.fillStyle = isDark ? '#9b8fb5' : '#6b6779'
      ctx.font = '32px "PingFang SC", "Noto Sans SC", sans-serif'
      ctx.fillText(subtitle, cx, 210)
    }

    // 评分（如果有）
    let yOffset = 500
    if (score !== null) {
      ctx.fillStyle = isDark ? '#e8e4f0' : '#15131f'
      ctx.font = 'bold 120px "PingFang SC", sans-serif'
      ctx.fillText(String(score), cx, yOffset)
      ctx.fillStyle = isDark ? '#9b8fb5' : '#6b6779'
      ctx.font = '28px "PingFang SC", sans-serif'
      ctx.fillText('综合评分', cx, yOffset + 50)
      yOffset += 120
    }

    // 条目列表
    ctx.textAlign = 'left'
    items.forEach((item, i) => {
      const y = yOffset + i * 90
      // 标签
      ctx.fillStyle = isDark ? '#c4bdd6' : '#2a2540'
      ctx.font = '34px "PingFang SC", sans-serif'
      ctx.fillText(item.label, 120, y)

      // 进度条背景
      const barX = 520
      const barW = 440
      const barH = 12
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
      ctx.beginPath()
      ctx.roundRect(barX, y - 12, barW, barH, 6)
      ctx.fill()

      // 进度条填充
      const fillW = Math.max(0, Math.min(1, item.value / 100)) * barW
      const grad = ctx.createLinearGradient(barX, 0, barX + fillW, 0)
      const color = item.color || (isDark ? '#7a5ff0' : '#5b3fd6')
      grad.addColorStop(0, color)
      grad.addColorStop(1, color + 'cc')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.roundRect(barX, y - 12, fillW, barH, 6)
      ctx.fill()

      // 数值
      ctx.fillStyle = isDark ? '#e8e4f0' : '#15131f'
      ctx.font = 'bold 32px "PingFang SC", sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(String(item.value), W - 120, y)
      ctx.textAlign = 'left'
    })

    // 底部品牌
    const footerY = H - 120
    ctx.strokeStyle = isDark ? 'rgba(201,168,76,0.2)' : 'rgba(184,137,58,0.15)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(200, footerY - 30)
    ctx.lineTo(W - 200, footerY - 30)
    ctx.stroke()

    ctx.fillStyle = isDark ? '#c9a84c' : '#b8893a'
    ctx.font = 'bold 36px "PingFang SC", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(footer, cx, footerY)

    ctx.fillStyle = isDark ? '#6b5f80' : '#9b97a9'
    ctx.font = '24px "PingFang SC", sans-serif'
    ctx.fillText('weed33834.github.io/echo', cx, footerY + 40)

    resolve(canvas.toDataURL('image/png'))
  })
}

/**
 * 生成简单文本分享内容
 */
export function generateShareText(toolName, result) {
  const lines = []
  lines.push(`【Echo · ${toolName}】`)
  if (result?.summary) {
    lines.push(result.summary)
  }
  if (result?.pillars) {
    result.pillars.forEach(p => {
      lines.push(`${p.label}：${p.value}`)
    })
  }
  if (result?.cards) {
    result.cards.forEach(c => {
      lines.push(`${c.position || ''}：${c.card} ${c.upright ? '正位' : '逆位'}`)
    })
  }
  lines.push('')
  lines.push('— Echo 回响 · 命运印证引擎')
  return lines.join('\n')
}

/**
 * 分享到各平台
 */
export async function shareResult(data) {
  const { title, text, image } = data

  // 优先使用原生分享 API
  if (navigator.share) {
    try {
      const shareData = { title, text }
      if (image) {
        const blob = await (await fetch(image)).blob()
        const file = new File([blob], 'echo-result.png', { type: 'image/png' })
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          shareData.files = [file]
        }
      }
      await navigator.share(shareData)
      return true
    } catch (e) {
      if (e.name === 'AbortError') return false
    }
  }

  // 降级：复制到剪贴板
  try {
    await navigator.clipboard.writeText(`${title}\n\n${text}`)
    return 'copied'
  } catch (e) {
    return false
  }
}

/**
 * 下载海报图片
 */
export function downloadPoster(dataURL, filename = 'echo-poster.png') {
  const a = document.createElement('a')
  a.href = dataURL
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
