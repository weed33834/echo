/**
 * Notifications Service — 每日运势推送通知
 *
 * 基于 Web Notification API + setTimeout/setInterval 实现。
 * 说明：浏览器仅在前台或 Service Worker 激活时可调度通知；
 * 本实现使用 setTimeout/setInterval，应用保持打开时按计划推送，
 * 应用重新打开时会重新调度并补发当日未送达的运势提醒（仅一次/天）。
 *
 * 设置状态持久化到 localStorage（key: echo_notifications）。
 */

const LS_KEY = 'echo_notifications'
const DEFAULT_TIME = '08:00' // 默认每日推送时间
const ONE_DAY_MS = 24 * 60 * 60 * 1000

/** 通知正文（按需求固定文案） */
const FORTUNE_TITLE = 'Echo · 回响 — 今日运势'
const FORTUNE_BODY = '今日运势已更新，点击查看你的专属运程'

/* 模块内持有的定时器句柄，便于取消 */
let dailyTimeoutId = null
let dailyIntervalId = null

/* ============================================================
 * localStorage 读写
 * ============================================================ */

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveState(state) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state))
  } catch {
    /* 忽略隐私模式等写入失败 */
  }
}

function getState() {
  const s = loadState() || {}
  return {
    enabled: s.enabled === true,
    time: typeof s.time === 'string' && s.time ? s.time : DEFAULT_TIME,
    lastSent: typeof s.lastSent === 'string' ? s.lastSent : ''
  }
}

/* ============================================================
 * 能力与权限
 * ============================================================ */

/** 是否支持通知 API */
export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window
}

/** 当前权限状态：'granted' | 'denied' | 'default' | 'unsupported' */
export function getPermissionStatus() {
  if (!isNotificationSupported()) return 'unsupported'
  return Notification.permission // 'default' | 'granted' | 'denied'
}

/**
 * 请求通知权限
 * @returns {Promise<'granted'|'denied'|'default'|'unsupported'>}
 */
export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported'
  try {
    const result = await Notification.requestPermission()
    return result
  } catch {
    return 'default'
  }
}

/* ============================================================
 * 发送通知
 * ============================================================ */

/**
 * 发送一条通知
 * @param {string} title
 * @param {string} body
 * @param {object} [opts] - 额外选项（如 tag、icon）
 * @returns {Notification|null}
 */
export function sendNotification(title, body, opts = {}) {
  if (!isNotificationSupported()) return null
  if (Notification.permission !== 'granted') return null
  try {
    const notification = new Notification(title, {
      body,
      tag: opts.tag || 'echo-fortune',
      icon: opts.icon || undefined,
      badge: opts.badge || undefined,
      data: opts.data || {},
      ...opts
    })
    // 点击通知：聚焦窗口并跳转到每日运势页（hash 路由 #/daily）
    notification.onclick = () => {
      try {
        window.focus()
        if (location.hash !== '#/daily') {
          location.hash = '#/daily'
        }
      } catch {
        /* 忽略 */
      }
      try {
        notification.close()
      } catch {
        /* 忽略 */
      }
    }
    return notification
  } catch {
    return null
  }
}

/* ============================================================
 * 每日运势调度
 * ============================================================ */

/** 返回本地日期字符串 YYYY-MM-DD */
function todayStr(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 解析 'HH:MM' 为 [hours, minutes] */
function parseTime(time) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(time || DEFAULT_TIME))
  if (!match) return [8, 0]
  return [Math.min(23, parseInt(match[1], 10)), Math.min(59, parseInt(match[2], 10))]
}

/** 计算到下一次指定时间的毫秒数 */
function msUntilNext(time, now = new Date()) {
  const [h, m] = parseTime(time)
  const target = new Date(now)
  target.setHours(h, m, 0, 0)
  let diff = target.getTime() - now.getTime()
  if (diff <= 0) diff += ONE_DAY_MS // 已过今日目标时间，则定到明日
  return diff
}

/** 触发今日运势通知（含当日去重） */
function fireDailyFortune() {
  const state = getState()
  const today = todayStr()
  if (state.lastSent === today) return // 当天已发过，避免重复
  sendNotification(FORTUNE_TITLE, FORTUNE_BODY, { tag: 'echo-daily-fortune' })
  saveState({ ...state, lastSent: today })
}

/**
 * 安排每日运势通知
 * - 计算到下一次推送时间的延时，到点触发；
 * - 之后每 24 小时重复一次。
 * - 若应用启动时今日目标时间已过且当日尚未发送，立即补发一次。
 */
export function scheduleDailyFortune() {
  // 先清理已有调度
  clearTimers()

  if (!isNotificationSupported()) return
  if (Notification.permission !== 'granted') return

  const state = getState()
  const now = new Date()
  const [h, m] = parseTime(state.time)

  // 今日目标时间
  const todayTarget = new Date(now)
  todayTarget.setHours(h, m, 0, 0)

  // 若今日目标时间已过且当天未发送，立即补发
  if (now.getTime() > todayTarget.getTime() && state.lastSent !== todayStr(now)) {
    // 略微延迟以避免与页面初始化竞争
    setTimeout(fireDailyFortune, 1500)
  }

  const delay = msUntilNext(state.time, now)

  // 到下一次目标时间触发，并设置每 24h 重复
  dailyTimeoutId = setTimeout(() => {
    fireDailyFortune()
    dailyIntervalId = setInterval(fireDailyFortune, ONE_DAY_MS)
  }, delay)

  saveState({ ...state, enabled: true })
}

/** 清理所有定时器（不修改持久化状态） */
function clearTimers() {
  if (dailyTimeoutId) {
    clearTimeout(dailyTimeoutId)
    dailyTimeoutId = null
  }
  if (dailyIntervalId) {
    clearInterval(dailyIntervalId)
    dailyIntervalId = null
  }
}

/**
 * 取消每日通知
 * - 清理定时器
 * - 将 enabled 置为 false 并持久化
 */
export function cancelDailyNotification() {
  clearTimers()
  const state = getState()
  saveState({ ...state, enabled: false })
}

/* ============================================================
 * 设置读写辅助
 * ============================================================ */

/** 当日运势推送是否已开启 */
export function isDailyFortuneEnabled() {
  return getState().enabled
}

/** 获取每日推送时间（'HH:MM'） */
export function getDailyFortuneTime() {
  return getState().time
}

/** 设置每日推送时间（'HH:MM'），若已开启则重新调度 */
export function setDailyFortuneTime(time) {
  const state = getState()
  saveState({ ...state, time })
  if (state.enabled && getPermissionStatus() === 'granted') {
    scheduleDailyFortune()
  }
}

/**
 * 开启/关闭每日运势推送（供 Settings 开关调用）
 * @param {boolean} enabled
 * @returns {Promise<{ok:boolean, reason?:string, permission?:string}>}
 */
export async function setDailyFortuneEnabled(enabled) {
  if (!enabled) {
    cancelDailyNotification()
    return { ok: true }
  }
  // 开启前需请求权限
  const permission = await requestNotificationPermission()
  if (permission !== 'granted') {
    // 权限未授予，不开启
    saveState({ ...getState(), enabled: false })
    return { ok: false, reason: 'permission-denied', permission }
  }
  scheduleDailyFortune()
  return { ok: true, permission }
}

/**
 * 应用启动时恢复调度：若之前已开启且权限仍在，则重新安排。
 * 适合在 main.js / 页面挂载时调用。
 */
export function restoreDailyFortuneIfNeeded() {
  const state = getState()
  if (state.enabled && getPermissionStatus() === 'granted') {
    scheduleDailyFortune()
  }
}

export default {
  isNotificationSupported,
  getPermissionStatus,
  requestNotificationPermission,
  sendNotification,
  scheduleDailyFortune,
  cancelDailyNotification,
  isDailyFortuneEnabled,
  getDailyFortuneTime,
  setDailyFortuneTime,
  setDailyFortuneEnabled,
  restoreDailyFortuneIfNeeded
}
