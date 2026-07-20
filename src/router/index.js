import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'home', component: () => import('@/pages/Home.jsx') },
  { path: '/echo', name: 'echo', component: () => import('@/pages/EchoCenter.jsx') },
  { path: '/tools', name: 'tools', component: () => import('@/pages/Tools.jsx') },
  { path: '/tools/:key', name: 'tool', component: () => import('@/pages/ToolDetail.jsx') },
  { path: '/dashboard', name: 'dashboard', component: () => import('@/pages/Dashboard.jsx') },
  { path: '/graph', name: 'graph', component: () => import('@/pages/Graph.jsx') },
  { path: '/me', name: 'me', component: () => import('@/pages/Me.jsx') },
  { path: '/checkin', name: 'checkin', component: () => import('@/pages/Checkin.jsx') },
  { path: '/daily', name: 'daily', component: () => import('@/pages/Daily.jsx') },
  { path: '/chat', name: 'chat', component: () => import('@/pages/Chat.jsx') },
  { path: '/settings', name: 'settings', component: () => import('@/pages/Settings.jsx') },
  { path: '/admin', name: 'admin', component: () => import('@/pages/Admin.jsx') }
]

export default createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() { return { top: 0 } }
})
