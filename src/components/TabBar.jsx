/**
 * TabBar 底部导航 - 解决原项目 59 页面无导航的硬伤
 * 4 个 tab：首页(印证中枢) / 印证(印证中心) / 工具(分类网格) / 我的(档案+设置)
 */
import { defineComponent } from 'vue'
import { RouterLink } from 'vue-router'

const TabIcon = ({ name }) => {
  const icons = {
    home: 'M3 12L12 4l9 8M5 10v10h5v-6h4v6h5V10',
    echo: 'M12 4v16M4 12h16M7 7l10 10M17 7L7 17',
    tools: 'M4 6h16M4 12h16M4 18h16',
    me: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 20a8 8 0 0116 0'
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d={icons[name] || icons.home} />
    </svg>
  )
}

export const TabBar = defineComponent({
  name: 'TabBar',
  setup() {
    const tabs = [
      { to: '/', label: '首页', icon: 'home' },
      { to: '/echo', label: '印证', icon: 'echo' },
      { to: '/tools', label: '工具', icon: 'tools' },
      { to: '/me', label: '我的', icon: 'me' }
    ]
    return () => (
      <nav class="tabbar" role="navigation" aria-label="主导航">
        <div class="tabbar__brand">
          <span class="tabbar__brand-name">Echo</span>
          <span class="tabbar__brand-sub">命运印证引擎</span>
        </div>
        {tabs.map(tab => (
          <RouterLink to={tab.to} class="tabbar__item" active-class="tabbar__item--active" exact-active-class="tabbar__item--active">
            <span class="tabbar__icon"><TabIcon name={tab.icon} /></span>
            <span class="tabbar__label">{tab.label}</span>
          </RouterLink>
        ))}
        <div class="tabbar__footer">v0.2.0 · Echo Engine</div>
      </nav>
    )
  }
})

/* === TopBar 顶部栏 === */
export const TopBar = defineComponent({
  name: 'TopBar',
  props: {
    title: String,
    subtitle: String,
    back: Boolean
  },
  setup(props, { slots }) {
    return () => (
      <header class="topbar">
        <div class="topbar__left">
          {props.back && (
            <button class="topbar__back" onClick={() => history.back()} aria-label="返回">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
          )}
          {slots.left?.()}
        </div>
        <div class="topbar__center">
          {props.title && <div class="topbar__title">{props.title}</div>}
          {props.subtitle && <div class="topbar__subtitle">{props.subtitle}</div>}
        </div>
        <div class="topbar__right">{slots.right?.()}</div>
      </header>
    )
  }
})
