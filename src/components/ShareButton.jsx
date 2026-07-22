import { ref } from 'vue'
import { generatePoster, generateShareText, shareResult, downloadPoster } from '@/utils/shareUtils'

/**
 * ShareButton — 分享按钮组件
 * 支持生成海报、原生分享、剪贴板复制
 *
 * @props {string} toolName - 工具名称
 * @props {object} result - 推演结果
 * @props {string} theme - 主题 dark/light
 */
export const ShareButton = {
  props: {
    toolName: { type: String, default: '命理推演' },
    result: { type: Object, default: () => ({}) },
    posterTitle: { type: String, default: '' },
    posterItems: { type: Array, default: () => [] },
    score: { type: Number, default: null },
  },
  setup(props) {
    const showMenu = ref(false)
    const generating = ref(false)
    const toast = ref('')

    const showToast = (msg) => {
      toast.value = msg
      setTimeout(() => { toast.value = '' }, 2500)
    }

    const handleShare = async () => {
      showMenu.value = !showMenu.value
    }

    const handleNativeShare = async () => {
      showMenu.value = false
      const text = generateShareText(props.toolName, props.result)
      const res = await shareResult({ title: `Echo · ${props.toolName}`, text })
      if (res === 'copied') {
        showToast('结果已复制到剪贴板')
      } else if (res === true) {
        showToast('分享成功')
      } else {
        showToast('分享已取消')
      }
    }

    const handleGeneratePoster = async () => {
      showMenu.value = false
      generating.value = true
      try {
        const docTheme = document.documentElement.dataset.theme
        const isDark = docTheme === 'dark' || (!docTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
        const dataURL = await generatePoster({
          title: props.posterTitle || `Echo · ${props.toolName}`,
          subtitle: props.result?.summary || '',
          score: props.score,
          items: props.posterItems,
          theme: isDark ? 'dark' : 'light',
        })
        downloadPoster(dataURL, `echo-${props.toolName}-${Date.now()}.png`)
        showToast('海报已保存到相册')
      } catch (e) {
        showToast('海报生成失败')
      } finally {
        generating.value = false
      }
    }

    const handleCopy = async () => {
      showMenu.value = false
      const text = generateShareText(props.toolName, props.result)
      try {
        await navigator.clipboard.writeText(`${props.toolName}\n\n${text}`)
        showToast('已复制到剪贴板')
      } catch (e) {
        showToast('复制失败')
      }
    }

    return () => (
      <div class="share-btn-wrap">
        <button
          class="share-btn"
          onClick={handleShare}
          disabled={generating.value}
          aria-label="分享结果"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          <span>{generating.value ? '生成中...' : '分享'}</span>
        </button>

        {showMenu.value && (
          <>
            <div class="share-btn-overlay" onClick={() => { showMenu.value = false }} />
            <div class="share-btn-menu">
              <button class="share-btn-item" onClick={handleGeneratePoster}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <span>生成运势海报</span>
              </button>
              <button class="share-btn-item" onClick={handleNativeShare}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                  <polyline points="16 6 12 2 8 6"/>
                  <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
                <span>分享到...</span>
              </button>
              <button class="share-btn-item" onClick={handleCopy}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                <span>复制文字</span>
              </button>
            </div>
          </>
        )}

        {toast.value && (
          <div class="share-btn-toast">{toast.value}</div>
        )}
      </div>
    )
  }
}
