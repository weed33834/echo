import { createApp, defineComponent, h, watch } from 'vue'
import { createPinia } from 'pinia'
import { RouterView } from 'vue-router'
import router from './router'
import { TabBar } from '@/components/TabBar.jsx'
import { ChatFab } from '@/components/ChatFab.jsx'
import { ToastHost } from '@/components/EchoUI.jsx'
import { useEchoStore } from '@/stores/echo.js'

import './designs/tokens.css'
import './designs/base.css'
import './designs/animations.css'
import './components/echo-ui.css'
import './components/tabbar.css'
import './pages/pages.css'
import './designs/tool-results.css'
import './designs/dashboard.css'
import './designs/chat.css'
import './designs/admin.css'
import './designs/extended.css'

// 主题/字号应用器
function applySettings(settings) {
  const root = document.documentElement
  if (settings.theme === 'dark') {
    root.setAttribute('data-theme', 'dark')
    root.classList.remove('theme-auto')
  } else if (settings.theme === 'auto') {
    root.removeAttribute('data-theme')
    root.classList.add('theme-auto')
  } else {
    root.removeAttribute('data-theme')
    root.classList.remove('theme-auto')
  }
  root.setAttribute('data-font-scale', settings.fontScale || 'md')
}

const App = defineComponent({
  name: 'App',
  setup() {
    const store = useEchoStore()
    // 初始应用
    applySettings(store.settings)
    // 监听变化
    watch(() => store.settings, (s) => applySettings(s), { deep: true })
    return () => h('div', { class: 'app-root' }, [
      h('main', { class: 'app-main' }, [h(RouterView)]),
      h(TabBar),
      h(ChatFab),
      h(ToastHost)
    ])
  }
})

createApp(App).use(createPinia()).use(router).mount('#app')
