/**
 * Echo Store - Pinia
 * 印证引擎核心数据：假设/印证/命格/用户档案
 * 数据持久化到 localStorage，模拟后端
 */
import { defineStore } from 'pinia'
import { computeProfileBazi } from '@/utils/engines.js'

const LS_KEY = 'echo_store_v2'

// 命格等级阈值（经验值）
const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500]

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}
function saveState(state) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state))
  } catch {}
}

export const useEchoStore = defineStore('echo', {
  state: () => {
    const saved = loadState()
    return {
      // 用户档案
      profile: saved?.profile || null, // { name, birthday, gender, dayMaster }
      // 假设列表（预测）
      assumptions: saved?.assumptions || [],
      // 印证记录
      reviews: saved?.reviews || [],
      // 命格
      minge: saved?.minge || { level: 1, exp: 0, totalReviews: 0, accurateCount: 0 },
      // 签到
      checkin: saved?.checkin || { streak: 0, lastDate: null, dates: [] },
      // 设置
      settings: saved?.settings || { theme: 'light', fontScale: 'md' },
      // 推演档案（功能B：个人档案与轨迹）
      history: saved?.history || [],
      // 每日运势缓存 { date: 'YYYY-MM-DD', data: {...} }
      fortuneCache: saved?.fortuneCache || null,
      // 学习进度 { completedLessons: [], quizScores: {} }
      learnProgress: saved?.learnProgress || { completedLessons: [], quizScores: {} },
      ...({ __saved: saved ? true : false })
    }
  },
  getters: {
    pendingAssumptions: (state) => {
      const now = Date.now()
      return state.assumptions
        .filter(a => !a.reviewed)
        .map(a => ({ ...a, dueIn: a.dueAt - now, overdue: a.dueAt < now }))
        .sort((a, b) => a.dueAt - b.dueAt)
    },
    reviewedAssumptions: (state) => state.assumptions.filter(a => a.reviewed),
    accuracyRate: (state) => {
      const reviewed = state.assumptions.filter(a => a.reviewed)
      if (!reviewed.length) return 0
      const accurate = reviewed.filter(a => a.matchScore >= 0.7)
      return Math.round((accurate.length / reviewed.length) * 100)
    },
    mingeLevelTitle: (state) => {
      const titles = ['初悟', '渐悟', '开悟', '通玄', '明机', '知命', '洞微', '见性', '达理', '圆融', '天启']
      return titles[Math.min(state.minge.level - 1, titles.length - 1)] || '初悟'
    },
    nextLevelExp: (state) => {
      const next = LEVEL_THRESHOLDS[state.minge.level]
      return next ? next - state.minge.exp : 0
    },
    levelProgress: (state) => {
      const cur = LEVEL_THRESHOLDS[state.minge.level - 1] || 0
      const next = LEVEL_THRESHOLDS[state.minge.level] || cur + 1000
      return Math.min(100, Math.round(((state.minge.exp - cur) / (next - cur)) * 100))
    },
    // 推演档案统计（功能B）
    historyStats: (state) => {
      const stats = {}
      state.history.forEach(h => {
        stats[h.toolKey] = (stats[h.toolKey] || 0) + 1
      })
      return stats
    },
    recentHistory: (state) => state.history.slice(0, 20),
    // 档案八字信息（自动计算）
    profileBazi: (state) => {
      if (!state.profile || !state.profile.birthday) return null
      return computeProfileBazi(state.profile)
    },
    // 档案是否完整（含出生时辰）
    isProfileComplete: (state) => {
      return !!(state.profile && state.profile.name && state.profile.birthday && state.profile.birthTime)
    }
  },
  actions: {
    persist() {
      const { __saved, ...rest } = this.$state
      saveState(rest)
    },
    setProfile(profile) {
      this.profile = profile
      this.persist()
    },
    updateSettings(partial) {
      this.settings = { ...this.settings, ...partial }
      this.persist()
    },
    createAssumption(payload) {
      const assumption = {
        id: 'a_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        title: payload.title,
        desc: payload.desc || '',
        tool: payload.tool || 'custom',
        createdAt: Date.now(),
        dueAt: Date.now() + (payload.days || 30) * 86400000,
        reviewed: false,
        matchScore: 0,
        dimensions: null
      }
      this.assumptions.unshift(assumption)
      this.persist()
      return assumption
    },
    reviewAssumption(id, { actualEvent, matchScore, dimensions }) {
      const a = this.assumptions.find(x => x.id === id)
      if (!a) return
      a.reviewed = true
      a.actualEvent = actualEvent
      a.matchScore = matchScore
      a.dimensions = dimensions
      a.reviewedAt = Date.now()
      // 累加命格经验（复盘本身即成长，准与不准都获得）
      const expGain = Math.round(matchScore * 30) + 10
      this.minge.exp += expGain
      this.minge.totalReviews += 1
      if (matchScore >= 0.7) this.minge.accurateCount += 1
      // 升级判定
      while (this.minge.level < LEVEL_THRESHOLDS.length && this.minge.exp >= LEVEL_THRESHOLDS[this.minge.level]) {
        this.minge.level += 1
      }
      this.persist()
      return { expGain, leveledUp: this.minge.level }
    },
    doCheckin() {
      const today = new Date().toISOString().slice(0, 10)
      if (this.checkin.lastDate === today) {
        return { ok: false, message: '今日已签到' }
      }
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
      const newStreak = this.checkin.lastDate === yesterday ? this.checkin.streak + 1 : 1
      const points = 10 + Math.min(newStreak, 30)
      this.checkin.streak = newStreak
      this.checkin.lastDate = today
      if (!this.checkin.dates.includes(today)) this.checkin.dates.push(today)
      // 签到也给少量命格经验
      this.minge.exp += 5
      while (this.minge.level < LEVEL_THRESHOLDS.length && this.minge.exp >= LEVEL_THRESHOLDS[this.minge.level]) {
        this.minge.level += 1
      }
      this.persist()
      return { ok: true, streak: newStreak, points, message: `连续签到 ${newStreak} 天` }
    },
    resetAll() {
      this.assumptions = []
      this.reviews = []
      this.minge = { level: 1, exp: 0, totalReviews: 0, accurateCount: 0 }
      this.checkin = { streak: 0, lastDate: null, dates: [] }
      this.fortuneCache = null
      this.learnProgress = { completedLessons: [], quizScores: {} }
      this.persist()
    },
    // 推演档案：记录每次推演结果（功能B）
    pushHistory(entry) {
      const record = {
        id: 'h_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        toolKey: entry.toolKey,
        toolName: entry.toolName,
        toolCat: entry.toolCat,
        form: entry.form,
        result: entry.result,
        summary: entry.summary,
        createdAt: Date.now()
      }
      this.history.unshift(record)
      // 限制最多 200 条
      if (this.history.length > 200) this.history = this.history.slice(0, 200)
      this.persist()
      return record
    },
    clearHistory() {
      this.history = []
      this.persist()
    },
    removeHistory(id) {
      this.history = this.history.filter(h => h.id !== id)
      this.persist()
    },
    // 每日运势缓存
    setFortuneCache(data) {
      this.fortuneCache = { date: new Date().toISOString().slice(0, 10), data }
      this.persist()
    },
    getFortuneCache() {
      const today = new Date().toISOString().slice(0, 10)
      if (this.fortuneCache && this.fortuneCache.date === today) {
        return this.fortuneCache.data
      }
      return null
    },
    // 学习进度
    markLessonComplete(lessonId) {
      if (!this.learnProgress.completedLessons.includes(lessonId)) {
        this.learnProgress.completedLessons.push(lessonId)
        this.persist()
      }
    },
    setQuizScore(lessonId, score) {
      this.learnProgress.quizScores[lessonId] = score
      this.persist()
    },
    isLessonCompleted(lessonId) {
      return this.learnProgress.completedLessons.includes(lessonId)
    }
  }
})

// === 工具注册表（从原项目 tools.ts 精简） ===
export const TOOLS = [
  { key: 'bazi', name: '八字排盘', desc: '四柱干支推演', cat: 'mingli', glyph: '八', ready: true },
  { key: 'ziwei', name: '紫微斗数', desc: '星盘四化推演', cat: 'mingli', glyph: '紫', ready: true },
  { key: 'liuyao', name: '六爻占卜', desc: '金钱课起卦', cat: 'zhanbu', glyph: '爻', ready: true },
  { key: 'meihua', name: '梅花易数', desc: '时间起卦', cat: 'zhanbu', glyph: '梅', ready: true },
  { key: 'gua', name: '摇钱起卦', desc: '六十四卦', cat: 'zhanbu', glyph: '卦', ready: true },
  { key: 'qimen', name: '奇门遁甲', desc: '九宫时盘', cat: 'mingli', glyph: '奇', ready: true },
  { key: 'liuren', name: '大六壬', desc: '四课三传', cat: 'mingli', glyph: '壬', ready: true },
  { key: 'ziwu', name: '子午流注', desc: '时辰经络', cat: 'jiankang', glyph: '子', ready: true },
  { key: 'yangsheng', name: '节气养生', desc: '顺时调养', cat: 'jiankang', glyph: '节', ready: true },
  { key: 'huangli', name: '老黄历', desc: '宜忌建除', cat: 'shenghuo', glyph: '历', ready: true },
  { key: 'jiri', name: '择吉日', desc: '事件择日', cat: 'shenghuo', glyph: '吉', ready: true },
  { key: 'yunshi', name: '每日运势', desc: '个性化日运', cat: 'shenghuo', glyph: '运', ready: true },
  { key: 'astro', name: '西洋占星', desc: '星盘三巨头', cat: 'yiyu', glyph: '星', ready: true },
  { key: 'maya', name: '玛雅历', desc: '260 kin', cat: 'yiyu', glyph: '玛', ready: true },
  { key: 'tarot', name: '塔罗牌', desc: '三牌阵', cat: 'yiyu', glyph: '塔', ready: true },
  { key: 'fengshui', name: '风水布局', desc: '九宫飞星', cat: 'fengshui', glyph: '风', ready: true },
  { key: 'nameology', name: '姓名学', desc: '三才五格', cat: 'fengshui', glyph: '名', ready: true },
  { key: 'dream', name: '周公解梦', desc: '梦境解析', cat: 'yiyu', glyph: '梦', ready: true }
]

export const CATEGORIES = [
  { key: 'mingli', name: '命理', desc: '推演先天命局' },
  { key: 'zhanbu', name: '占卜', desc: '问事断吉凶' },
  { key: 'jiankang', name: '健康', desc: '顺时调摄' },
  { key: 'shenghuo', name: '生活', desc: '日常宜忌' },
  { key: 'fengshui', name: '风水', desc: '环境与姓名' },
  { key: 'yiyu', name: '异域', desc: '跨文化印证' }
]
