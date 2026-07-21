/**
 * Fortune Service — 每日运势生成
 *
 * generateDailyFortune(bazi, date)
 *  - bazi: computeProfileBazi 返回的对象（含 dayMaster / dayMasterWx / favorable /
 *    wuxing / strongest / weakest / dayMasterStrength 等），可为 null
 *  - date: Date 对象，默认 new Date()
 *  - 返回 fortune 对象；对同一人同一天确定性可复现（种子 = 日期 + 日主）
 *
 * 设计要点：
 *  1. 使用 seededRandom 保证同种子同结果（日期 + 日主哈希）
 *  2. 喜用神加成对应维度（木→事业 / 火→感情 / 土→健康 / 金→财运 / 水→事业）
 *  3. 宜忌基于 personalYiJi 个性化池 + 默认池，按日种子抽取，保证每日有变化
 *  4. 幸运色 / 方位优先取喜用神对应项
 *  5. 无 bazi 时生成通用运势（无喜用加成，纯种子驱动）
 */
import { seededRandom, personalYiJi, TIAN_GAN, GAN_WX } from '@/utils/engines.js'

/* ============================================================
 * 常量映射
 * ============================================================ */

// 五行 → 主维度映射（喜用神加成目标维度）
const WX_TO_DIM = {
  '木': 'career', // 木主生发 · 事业
  '火': 'love',   // 火主礼 · 感情
  '土': 'health', // 土主信 · 健康
  '金': 'wealth', // 金主义 · 财运
  '水': 'career'  // 水主智 · 事业(智略)
}

// 默认宜忌池（无 bazi 或喜用神为空时回退）
const DEFAULT_YI_POOL = ['决断', '签约', '会友', '静思', '出行', '学习', '祈福', '收束', '近林', '近水']
const DEFAULT_JI_POOL = ['动怒', '急躁', '远行', '熬夜', '争执', '破财', '冲动', '拖延', '纵欲', '搬迁']

// 五行对应幸运色
const COLOR_BY_WX = {
  '木': ['青', '翠绿', '松柏绿'],
  '火': ['赤', '朱红', '暖橙'],
  '土': ['黄', '驼色', '土褐'],
  '金': ['白', '银灰', '月白'],
  '水': ['玄', '靛蓝', '墨青']
}
const ALL_COLORS = Object.values(COLOR_BY_WX).flat()

// 五行对应方位（土居中，转为四隅）
const DIR_BY_WX = { '木': '东', '火': '南', '金': '西', '水': '北' }
const ALL_DIRS = ['东', '南', '西', '北', '东南', '西南', '东北', '西北']

// 十二时辰
const SHICHEN_NAMES = [
  '子时', '丑时', '寅时', '卯时', '辰时', '巳时',
  '午时', '未时', '申时', '酉时', '戌时', '亥时'
]

/* ============================================================
 * 辅助函数
 * ============================================================ */

// 综合分档一句话总结
function overallSummary(overall) {
  if (overall >= 85) return '今日天时地利人和，宜积极行事、顺势而为'
  if (overall >= 70) return '今日运势上扬，把握重点、可进可取'
  if (overall >= 60) return '今日运势平顺，稳扎稳打即可有成'
  if (overall >= 50) return '今日运势平稳，宜守不宜攻'
  if (overall >= 40) return '今日运势稍弱，宜低调行事、养精蓄锐'
  return '今日运势偏弱，宜静养蓄势、避免冒进'
}

/**
 * 从池中按种子抽取 n 个不重复项
 * @param {Function} rng - seededRandom 返回的随机函数
 * @param {string[]} pool - 候选池
 * @param {number} n - 抽取数量
 * @returns {string[]}
 */
function pickN(rng, pool, n) {
  const arr = [...pool]
  const out = []
  let guard = 0
  while (out.length < n && arr.length && guard++ < 1000) {
    const idx = Math.floor(rng() * arr.length)
    out.push(arr.splice(idx, 1)[0])
  }
  return out
}

/**
 * 由日主天干推导五行（兼容仅有 dayMaster 而无 dayMasterWx 的 bazi 对象）
 * @param {Object} bazi
 * @returns {string} 五行字符
 */
function deriveDayMasterWx(bazi) {
  if (!bazi || !bazi.dayMaster) return ''
  if (bazi.dayMasterWx) return bazi.dayMasterWx
  const idx = TIAN_GAN.indexOf(bazi.dayMaster)
  return idx >= 0 ? GAN_WX[idx] : ''
}

/* ============================================================
 * 核心：生成每日运势
 * ============================================================ */

/**
 * 生成每日运势
 * @param {Object|null} bazi - computeProfileBazi 返回的八字对象，可为 null
 * @param {Date} [date=new Date()]
 * @returns {Object} fortune 对象
 */
export function generateDailyFortune(bazi, date = new Date()) {
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()
  const ymd = y * 10000 + m * 100 + d

  // 种子：日期 + 日主（同一人同一天确定性可复现）
  const dmKey = (bazi && bazi.dayMaster) ? bazi.dayMaster : 'generic'
  let dmHash = 0
  for (let i = 0; i < dmKey.length; i++) {
    dmHash = ((dmHash << 5) - dmHash + dmKey.charCodeAt(i)) | 0
  }
  const seed = Math.abs(ymd * 7919 + dmHash) || 1
  const rng = seededRandom(seed)

  const hasBazi = !!(bazi && bazi.dayMaster)
  const favorable = (bazi && Array.isArray(bazi.favorable)) ? bazi.favorable : []
  const dmWx = deriveDayMasterWx(bazi)

  // --- 四维评分（基础 40-85，喜用神加成）---
  const base = {
    career: Math.round(40 + rng() * 45),
    love: Math.round(40 + rng() * 45),
    wealth: Math.round(40 + rng() * 45),
    health: Math.round(40 + rng() * 45)
  }
  // 喜用神加成：每个喜用五行为其主维度 +7~15 分（上限 98）
  favorable.forEach((wx) => {
    const dim = WX_TO_DIM[wx]
    if (dim) {
      base[dim] = Math.min(98, base[dim] + Math.round(7 + rng() * 8))
    }
  })
  const dimensions = {
    career: base.career,
    love: base.love,
    wealth: base.wealth,
    health: base.health
  }

  // 综合分：加权平均（事业 0.3 / 感情 0.2 / 财运 0.25 / 健康 0.25）
  const overall = Math.round(
    dimensions.career * 0.3 +
    dimensions.love * 0.2 +
    dimensions.wealth * 0.25 +
    dimensions.health * 0.25
  )

  // --- 宜忌（个性化池 + 默认池，按种子抽取，保证每日变化）---
  const personal = hasBazi && favorable.length
    ? personalYiJi(bazi.dayMaster, favorable, null)
    : { yi: [], ji: [] }
  const yiPool = Array.from(new Set([...personal.yi, ...DEFAULT_YI_POOL]))
  const jiPool = Array.from(new Set([...personal.ji, ...DEFAULT_JI_POOL]))
  const yi = pickN(rng, yiPool, 3)
  const ji = pickN(rng, jiPool, 2)

  // --- 幸运色（喜用神对应色优先）---
  let colorPool = favorable.length
    ? favorable.flatMap((wx) => COLOR_BY_WX[wx] || [])
    : []
  if (!colorPool.length) colorPool = ALL_COLORS
  const luckyColor = colorPool[Math.floor(rng() * colorPool.length)]

  // --- 幸运数字 1-9 ---
  const luckyNumber = 1 + Math.floor(rng() * 9)

  // --- 幸运方位（喜用神方位优先；土居中转为四隅）---
  let dirPool = favorable
    .map((wx) => DIR_BY_WX[wx])
    .filter(Boolean)
  if (favorable.includes('土')) {
    dirPool = Array.from(new Set([...dirPool, '东南', '西南', '东北', '西北']))
  }
  if (!dirPool.length) dirPool = ALL_DIRS
  const luckyDirection = dirPool[Math.floor(rng() * dirPool.length)]

  // --- 幸运时辰 ---
  const luckyTime = SHICHEN_NAMES[Math.floor(rng() * SHICHEN_NAMES.length)]

  // --- 一句话总结 ---
  const summary = overallSummary(overall)

  // --- 个性化解读（2-3 句，基于日主与五行）---
  let reading
  if (hasBazi) {
    const favTxt = favorable.length ? favorable.join('、') : '五行调和'
    const strong = bazi.strongest || ''
    const weak = bazi.weakest || ''
    const strongFlag = bazi.dayMasterStrength === '强'
    const favHasSelf = !!dmWx && favorable.includes(dmWx)
    const tone = overall >= 70
      ? '顺势而为、把握机遇'
      : overall >= 55
        ? '稳中求进、量力而行'
        : '静守蓄势、避免冒进'
    const qiPart = favHasSelf
      ? `今日喜用得令，${dmWx}气充盈、神清气爽`
      : `今日宜借${favTxt}之气补益${dmWx}日主之不足`
    reading =
      `日主${bazi.dayMaster}${dmWx}，命局${strongFlag ? '偏强' : '偏弱'}，` +
      `五行${strong}最旺、${weak}最弱，喜用${favTxt}。` +
      `${qiPart}，${tone}。` +
      `${luckyDirection}方与${luckyColor}色助你聚气，${luckyTime}前后灵感最盛。`
  } else {
    const tone = overall >= 70
      ? '宜积极进取、把握今日'
      : overall >= 55
        ? '宜稳中求进、不急不躁'
        : '宜静养身心、蓄势待发'
    reading =
      `今日五行流转${overall >= 60 ? '顺畅' : '稍滞'}，整体运势${overall >= 60 ? '尚可' : '平平'}。` +
      `${tone}。` +
      `建议借${luckyColor}色与${luckyDirection}方调节气场，${luckyTime}前后最为得力。`
  }

  return {
    // 是否个性化（有 bazi）— 用于缓存与 UI 分支
    personalized: hasBazi,
    date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    // 便于 AI 提示词构建
    dayMaster: hasBazi ? bazi.dayMaster : '',
    wuxing: dmWx,
    // 核心运势
    overall,
    dimensions,
    yi,
    ji,
    luckyColor,
    luckyNumber,
    luckyDirection,
    luckyTime,
    summary,
    reading
  }
}

export default generateDailyFortune
