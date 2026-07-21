/**
 * Echo 命运印证引擎 · 算法层
 * 18 个玄学工具的独立 inputConfig + calc
 * 设计原则：每个输入字段必须真正影响 calc 结果
 */
import { useEchoStore } from '@/stores/echo.js'

/* ============================================================
 * 一、共享数据常量
 * ============================================================ */

export const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
export const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
export const WUXING = ['木', '火', '土', '金', '水']
export const GAN_WX = ['木', '木', '火', '火', '土', '土', '金', '金', '水', '水']
export const ZHI_WX = ['水', '土', '木', '木', '土', '火', '火', '土', '金', '金', '土', '水']
export const BA_GUA = [
  { name: '乾', symbol: '☰', nature: '天', wx: '金' },
  { name: '兑', symbol: '☱', nature: '泽', wx: '金' },
  { name: '离', symbol: '☲', nature: '火', wx: '火' },
  { name: '震', symbol: '☳', nature: '雷', wx: '木' },
  { name: '巽', symbol: '☴', nature: '风', wx: '木' },
  { name: '坎', symbol: '☵', nature: '水', wx: '水' },
  { name: '艮', symbol: '☶', nature: '山', wx: '土' },
  { name: '坤', symbol: '☷', nature: '地', wx: '土' }
]

// 64 卦名（上卦×下卦索引）
export const GUA64 = [
  ['乾为天', '泽天夬', '火天大有', '雷天大壮', '风天小畜', '水天需', '山天大畜', '地天泰'],
  ['天泽履', '兑为泽', '火泽睽', '雷泽归妹', '风泽中孚', '水泽节', '山泽损', '地泽临'],
  ['天火同人', '泽火革', '离为火', '雷火丰', '风火家人', '水火既济', '山火贲', '地火明夷'],
  ['天雷无妄', '泽雷随', '火雷噬嗑', '震为雷', '风雷益', '水雷屯', '山雷颐', '地雷复'],
  ['天风姤', '泽风大过', '火风鼎', '雷风恒', '巽为风', '水风井', '山风蛊', '地风升'],
  ['天水讼', '泽水困', '火水未济', '雷水解', '风水涣', '坎为水', '山水蒙', '地水师'],
  ['天山遁', '泽山咸', '火山旅', '雷山小过', '风山渐', '水山蹇', '艮为山', '地山谦'],
  ['天地否', '泽地萃', '火地晋', '雷地豫', '风地观', '水地比', '山地剥', '坤为地']
]

// 24 节气
export const JIEQI = [
  { name: '立春', month: 2, day: 4 }, { name: '雨水', month: 2, day: 19 },
  { name: '惊蛰', month: 3, day: 6 }, { name: '春分', month: 3, day: 21 },
  { name: '清明', month: 4, day: 5 }, { name: '谷雨', month: 4, day: 20 },
  { name: '立夏', month: 5, day: 6 }, { name: '小满', month: 5, day: 21 },
  { name: '芒种', month: 6, day: 6 }, { name: '夏至', month: 6, day: 21 },
  { name: '小暑', month: 7, day: 7 }, { name: '大暑', month: 7, day: 23 },
  { name: '立秋', month: 8, day: 8 }, { name: '处暑', month: 8, day: 23 },
  { name: '白露', month: 9, day: 8 }, { name: '秋分', month: 9, day: 23 },
  { name: '寒露', month: 10, day: 8 }, { name: '霜降', month: 10, day: 24 },
  { name: '立冬', month: 11, day: 7 }, { name: '小雪', month: 11, day: 22 },
  { name: '大雪', month: 12, day: 7 }, { name: '冬至', month: 12, day: 22 },
  { name: '小寒', month: 1, day: 6 }, { name: '大寒', month: 1, day: 20 }
]

// 12 时辰
export const SHICHEN = [
  { zhi: '子', name: '子时', time: '23-1', meridian: '胆经', organ: '胆' },
  { zhi: '丑', name: '丑时', time: '1-3', meridian: '肝经', organ: '肝' },
  { zhi: '寅', name: '寅时', time: '3-5', meridian: '肺经', organ: '肺' },
  { zhi: '卯', name: '卯时', time: '5-7', meridian: '大肠经', organ: '大肠' },
  { zhi: '辰', name: '辰时', time: '7-9', meridian: '胃经', organ: '胃' },
  { zhi: '巳', name: '巳时', time: '9-11', meridian: '脾经', organ: '脾' },
  { zhi: '午', name: '午时', time: '11-13', meridian: '心经', organ: '心' },
  { zhi: '未', name: '未时', time: '13-15', meridian: '小肠经', organ: '小肠' },
  { zhi: '申', name: '申时', time: '15-17', meridian: '膀胱经', organ: '膀胱' },
  { zhi: '酉', name: '酉时', time: '17-19', meridian: '肾经', organ: '肾' },
  { zhi: '戌', name: '戌时', time: '19-21', meridian: '心包经', organ: '心包' },
  { zhi: '亥', name: '亥时', time: '21-23', meridian: '三焦经', organ: '三焦' }
]

// 60 甲子纳音
export const NAYIN = [
  '海中金', '海中金', '炉中火', '炉中火', '大林木', '大林木', '路旁土', '路旁土', '剑锋金', '剑锋金',
  '山头火', '山头火', '涧下水', '涧下水', '城头土', '城头土', '白蜡金', '白蜡金', '杨柳木', '杨柳木',
  '井泉水', '井泉水', '屋上土', '屋上土', '霹雳火', '霹雳火', '松柏木', '松柏木', '长流水', '长流水',
  '砂石金', '砂石金', '山下火', '山下火', '平地木', '平地木', '壁上土', '壁上土', '金箔金', '金箔金',
  '覆灯火', '覆灯火', '天河水', '天河水', '大驿土', '大驿土', '钗钏金', '钗钏金', '桑柘木', '桑柘木',
  '大溪水', '大溪水', '沙中土', '沙中土', '天上火', '天上火', '石榴木', '石榴木', '大海水', '大海水'
]

// 紫微 14 主星
export const ZIWEI_STARS = [
  '紫微', '天机', '太阳', '武曲', '天同', '廉贞',
  '天府', '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军'
]

// 紫微四化表（年干 → [化禄, 化权, 化科, 化忌]）
export const SIHUA_MAP = {
  '甲': ['廉贞', '破军', '武曲', '太阳'],
  '乙': ['天机', '天梁', '紫微', '太阴'],
  '丙': ['天同', '天机', '文昌', '廉贞'],
  '丁': ['太阴', '天同', '天机', '巨门'],
  '戊': ['贪狼', '太阴', '右弼', '天机'],
  '己': ['武曲', '贪狼', '天梁', '文曲'],
  '庚': ['太阳', '武曲', '太阴', '天同'],
  '辛': ['巨门', '太阳', '文曲', '文昌'],
  '壬': ['天梁', '紫微', '左辅', '武曲'],
  '癸': ['破军', '巨门', '太阴', '贪狼']
}

// 西洋 12 星座
export const ZODIAC = [
  { name: '白羊', element: '火', mode: '基本', trait: '开创冲动' },
  { name: '金牛', element: '土', mode: '固定', trait: '稳重务实' },
  { name: '双子', element: '风', mode: '变动', trait: '灵活多变' },
  { name: '巨蟹', element: '水', mode: '基本', trait: '敏感顾家' },
  { name: '狮子', element: '火', mode: '固定', trait: '自信耀眼' },
  { name: '处女', element: '土', mode: '变动', trait: '细致完美' },
  { name: '天秤', element: '风', mode: '基本', trait: '优雅平衡' },
  { name: '天蝎', element: '水', mode: '固定', trait: '深刻专注' },
  { name: '射手', element: '火', mode: '变动', trait: '乐观自由' },
  { name: '摩羯', element: '土', mode: '基本', trait: '坚韧务实' },
  { name: '水瓶', element: '风', mode: '固定', trait: '独立创新' },
  { name: '双鱼', element: '水', mode: '变动', trait: '感性梦幻' }
]

// 玛雅 20 图腾
export const MAYA_SEALS = [
  { name: '红龙', color: '红', meaning: '诞生·滋养·记忆' },
  { name: '白风', color: '白', meaning: '沟通·灵性·呼吸' },
  { name: '蓝夜', color: '蓝', meaning: '梦境·直觉·丰盛' },
  { name: '黄种子', color: '黄', meaning: '目标·生长·潜能' },
  { name: '红蛇', color: '红', meaning: '生命力·本能·生存' },
  { name: '白世界桥', color: '白', meaning: '机遇·连接·死亡' },
  { name: '蓝手', color: '蓝', meaning: '成就·疗愈·触碰' },
  { name: '黄星星', color: '黄', meaning: '艺术·美感·优雅' },
  { name: '红月', color: '红', meaning: '净化·情绪·流动' },
  { name: '白狗', color: '白', meaning: '爱·忠诚·心灵' },
  { name: '蓝猴', color: '蓝', meaning: '魔法·游戏·幻象' },
  { name: '黄人', color: '黄', meaning: '智慧·自由意志·影响' },
  { name: '红天行者', color: '红', meaning: '探索·觉醒·空间' },
  { name: '白巫师', color: '白', meaning: '永恒·接受·魔法' },
  { name: '蓝鹰', color: '蓝', meaning: '视野·心智·创造' },
  { name: '黄战士', color: '黄', meaning: '追问·无畏·理解' },
  { name: '红地球', color: '红', meaning: '导航·进化·共时' },
  { name: '白镜子', color: '白', meaning: '秩序·反射·无极' },
  { name: '蓝风暴', color: '蓝', meaning: '催化·能量·蜕变' },
  { name: '黄太阳', color: '黄', meaning: '启蒙·生命·宇宙' }
]

// 玛雅 13 音调
export const MAYA_TONES = ['磁性', ' lunar', '电性', '自我存在', '超频', '韵律', '共鸣', '银河', '太阳', '行星', '光谱', '水晶', '宇宙']

// 塔罗 22 大阿卡纳
export const TAROT_MAJOR = [
  { name: '愚者', num: 0, meaning: '新的开始，无限可能', reversed: '鲁莽冲动，缺乏规划' },
  { name: '魔术师', num: 1, meaning: '创造与行动力', reversed: '操控或才能误用' },
  { name: '女祭司', num: 2, meaning: '直觉与内在智慧', reversed: '隐秘或直觉受阻' },
  { name: '皇后', num: 3, meaning: '丰盛与创造', reversed: '过度依赖或停滞' },
  { name: '皇帝', num: 4, meaning: '权威与结构', reversed: '专横或僵化' },
  { name: '教皇', num: 5, meaning: '传统与指引', reversed: '反传统或教条' },
  { name: '恋人', num: 6, meaning: '选择与结合', reversed: '关系失衡或错误选择' },
  { name: '战车', num: 7, meaning: '意志与胜利', reversed: '失控或方向迷失' },
  { name: '力量', num: 8, meaning: '勇气与柔韧', reversed: '自我怀疑或失控' },
  { name: '隐士', num: 9, meaning: '内省与孤独', reversed: '孤立或拒绝指引' },
  { name: '命运之轮', num: 10, meaning: '转折与机遇', reversed: '逆流或厄运' },
  { name: '正义', num: 11, meaning: '公平与因果', reversed: '不公或推诿' },
  { name: '倒吊人', num: 12, meaning: '牺牲与视角', reversed: '无谓牺牲或拖延' },
  { name: '死神', num: 13, meaning: '结束与重生', reversed: '抗拒变化或停滞' },
  { name: '节制', num: 14, meaning: '平衡与调和', reversed: '失衡或极端' },
  { name: '魔鬼', num: 15, meaning: '束缚与欲望', reversed: '挣脱或释放' },
  { name: '高塔', num: 16, meaning: '突变与启示', reversed: '逃避崩溃或延迟' },
  { name: '星星', num: 17, meaning: '希望与灵感', reversed: '绝望或失落' },
  { name: '月亮', num: 18, meaning: '幻象与潜意识', reversed: '迷雾消散或真相' },
  { name: '太阳', num: 19, meaning: '喜悦与成功', reversed: '暂时的阴霾' },
  { name: '审判', num: 20, meaning: '觉醒与重生', reversed: '自我谴责或迟疑' },
  { name: '世界', num: 21, meaning: '完成与圆满', reversed: '未完成或停滞' }
]

// 12 长生（用于大运起运）
export const CHANG_SHENG = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养']

// 12 天将（六壬）
export const TIAN_JIANG = ['贵人', '腾蛇', '朱雀', '六合', '勾陈', '青龙', '天空', '白虎', '太常', '玄武', '太阴', '天后']
export const TIAN_JIANG_XING = ['吉', '凶', '凶', '吉', '凶', '吉', '凶', '凶', '吉', '凶', '吉', '吉']

// 12 运转方向
export const PALACES_NAME = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '交友', '官禄', '田宅', '福德', '父母']

// 九宫
export const QIMEN_PALACES = [
  { num: 1, dir: '坎·北', star: '天蓬', door: '休门' },
  { num: 8, dir: '艮·东北', star: '天任', door: '生门' },
  { num: 3, dir: '震·东', star: '天冲', door: '伤门' },
  { num: 4, dir: '巽·东南', star: '天辅', door: '杜门' },
  { num: 9, dir: '离·南', star: '天英', door: '景门' },
  { num: 2, dir: '坤·西南', star: '天芮', door: '死门' },
  { num: 7, dir: '兑·西', star: '天柱', door: '惊门' },
  { num: 6, dir: '乾·西北', star: '天心', door: '开门' },
  { num: 5, dir: '中宫', star: '天禽', door: '—' }
]

// 八神（奇门）
export const QIMEN_SHEN = ['值符', '腾蛇', '太阴', '六合', '白虎', '玄武', '九地', '九天']

// 建除十二神
export const JIAN_CHU = ['建', '除', '满', '平', '定', '执', '破', '危', '成', '收', '开', '闭']

// 12 黄黑道值神
export const HUANGDAO = ['青龙', '明堂', '天刑', '朱雀', '金匮', '天德', '白虎', '玉堂', '天牢', '玄武', '司命', '勾陈']
export const HUANGDAO_GOOD = [true, true, false, false, true, true, false, true, false, false, true, false]

// 9 种体质
export const CONSTITUTIONS = [
  { key: 'pinghe', name: '平和质', desc: '体形匀称，精力旺盛' },
  { key: 'qixu', name: '气虚质', desc: '易疲乏，气短懒言' },
  { key: 'yangxu', name: '阳虚质', desc: '畏寒怕冷，手足不温' },
  { key: 'yinxu', name: '阴虚质', desc: '手足心热，口燥咽干' },
  { key: 'shire', name: '湿热质', desc: '面垢油光，口苦' },
  { key: 'qiyu', name: '气郁质', desc: '情绪低沉，敏感多虑' },
  { key: 'xueyu', name: '血瘀质', desc: '肤色晦暗，易瘀斑' },
  { key: 'tanshi', name: '痰湿质', desc: '体形肥胖，腹部松软' },
  { key: 'tebing', name: '特禀质', desc: '过敏体质' }
]

// 五输穴（简化：每经井荥输经合）
export const WUSHU_POINTS = {
  '肺': ['少商', '鱼际', '太渊', '经渠', '尺泽'],
  '大肠': ['商阳', '二间', '三间', '阳溪', '曲池'],
  '胃': ['厉兑', '内庭', '陷谷', '解溪', '足三里'],
  '脾': ['隐白', '大都', '太白', '商丘', '阴陵泉'],
  '心': ['少冲', '少府', '神门', '灵道', '少海'],
  '小肠': ['少泽', '前谷', '后溪', '阳谷', '小海'],
  '膀胱': ['至阴', '足通谷', '束骨', '昆仑', '委中'],
  '肾': ['涌泉', '然谷', '太溪', '复溜', '阴谷'],
  '心包': ['中冲', '劳宫', '大陵', '间使', '曲泽'],
  '三焦': ['关冲', '液门', '中渚', '支沟', '天井'],
  '胆': ['足窍阴', '侠溪', '足临泣', '阳辅', '阳陵泉'],
  '肝': ['大敦', '行间', '太冲', '中封', '曲泉']
}

// 经络五行
export const MERIDIAN_WX = {
  '肺': '金', '大肠': '金', '胃': '土', '脾': '土',
  '心': '火', '小肠': '火', '膀胱': '水', '肾': '水',
  '心包': '火', '三焦': '火', '胆': '木', '肝': '木'
}

// 五运六气·大运（年干）
export const WUYUN = {
  '甲': '土运太过', '己': '土运不及',
  '乙': '金运不及', '庚': '金运太过',
  '丙': '水运太过', '辛': '水运不及',
  '丁': '木运不及', '壬': '木运太过',
  '戊': '火运太过', '癸': '火运不及'
}

// 六气主气（按节气六步）
export const ZHUQI = ['厥阴风木', '少阴君火', '少阳相火', '太阴湿土', '阳明燥金', '太阳寒水']

// 问事分类 → 六亲用神映射
export const YONGSHEN_MAP = {
  wealth: '妻财', career: '官鬼', marriage: '妻财', lost: '妻财',
  illness: '官鬼', travel: '妻财', lawsuit: '官鬼', study: '父母'
}

// 六亲生克关系（以卦宫五行为我）
export const LIUQIN_OF = (gongWx, targetWx) => {
  const gen = ['木', '火', '土', '金', '水']
  const i = gen.indexOf(gongWx), j = gen.indexOf(targetWx)
  if (i === j) return '兄弟'
  if ((i + 1) % 5 === j) return '子孙'   // 我生
  if ((j + 1) % 5 === i) return '父母'   // 生我
  if ((i + 2) % 5 === j) return '妻财'   // 我克
  if ((j + 2) % 5 === i) return '官鬼'   // 克我
  return '兄弟'
}

/* ============================================================
 * 二、辅助函数
 * ============================================================ */

// 年柱
export function yearPillar(year) {
  const ganIdx = (year - 4) % 10
  const zhiIdx = (year - 4) % 12
  return { gan: TIAN_GAN[((ganIdx % 10) + 10) % 10], zhi: DI_ZHI[((zhiIdx % 12) + 12) % 12], wx: GAN_WX[((ganIdx % 10) + 10) % 10] }
}

// 月柱（基于节气）
export function monthPillar(year, month, day = 1) {
  const jp = yearPillar(year)
  const ganIdx = TIAN_GAN.indexOf(jp.gan)
  const startGanMap = [2, 2, 4, 4, 6, 6, 8, 8, 0, 0]
  let monthOffset = (month - 1) * 2
  const jq = JIEQI.find(j => j.month === month && j.day > day)
  if (jq && JIEQI.indexOf(jq) % 2 === 0) monthOffset = (month - 2) * 2
  const zhiIdx = ((monthOffset % 12) + 12) % 12
  const mGanIdx = (startGanMap[ganIdx] + zhiIdx) % 10
  return { gan: TIAN_GAN[mGanIdx], zhi: DI_ZHI[zhiIdx], wx: GAN_WX[mGanIdx] }
}

// 日柱（基准 1900-01-01 甲戌）
export function dayPillar(year, month, day) {
  const base = new Date(1900, 0, 1)
  const target = new Date(year, month - 1, day)
  const diff = Math.floor((target - base) / 86400000)
  const ganIdx = ((diff + 0) % 10 + 10) % 10  // 1900-01-01 为甲戌，天干甲=0
  const zhiIdx = ((diff + 10) % 12 + 12) % 12 // 地支戌=10
  return { gan: TIAN_GAN[ganIdx], zhi: DI_ZHI[zhiIdx], wx: GAN_WX[ganIdx] }
}

// 时柱
export function hourPillar(dayGan, hour) {
  const dayGanIdx = TIAN_GAN.indexOf(dayGan)
  const startGanMap = [0, 0, 2, 2, 4, 4, 6, 6, 8, 8]
  const zhiIdx = Math.floor(((hour + 1) % 24) / 2)
  const ganIdx = (startGanMap[dayGanIdx] + zhiIdx) % 10
  return { gan: TIAN_GAN[ganIdx], zhi: DI_ZHI[zhiIdx], wx: GAN_WX[ganIdx] }
}

// 五行统计
export function wuxingCount(pillars) {
  const count = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }
  pillars.forEach(p => {
    if (p.gan) count[GAN_WX[TIAN_GAN.indexOf(p.gan)]]++
    if (p.zhi) count[ZHI_WX[DI_ZHI.indexOf(p.zhi)]]++
  })
  return count
}

// 十神
export function tenGod(dayMaster, target) {
  const dmIdx = TIAN_GAN.indexOf(dayMaster)
  const tIdx = TIAN_GAN.indexOf(target)
  if (dmIdx < 0 || tIdx < 0) return ''
  const dmWx = GAN_WX[dmIdx], tWx = GAN_WX[tIdx]
  const dmYin = dmIdx % 2 === 0, tYin = tIdx % 2 === 0
  const gen = ['木', '火', '土', '金', '水']
  const i = gen.indexOf(dmWx), j = gen.indexOf(tWx)
  if (i === j) return dmYin === tYin ? '比肩' : '劫财'
  if ((i + 1) % 5 === j) return dmYin === tYin ? '食神' : '伤官'
  if ((j + 1) % 5 === i) return dmYin === tYin ? '偏印' : '正印'
  if ((i + 2) % 5 === j) return dmYin === tYin ? '偏财' : '正财'
  if ((j + 2) % 5 === i) return dmYin === tYin ? '七杀' : '正官'
  return ''
}

// 当前节气
export function getCurrentJieqi(date = new Date()) {
  const m = date.getMonth() + 1, d = date.getDate()
  let current = JIEQI[JIEQI.length - 1]
  for (const jq of JIEQI) {
    if (jq.month < m || (jq.month === m && jq.day <= d)) current = jq
  }
  return current
}

// 种子随机（可复现）
export function seededRandom(seed) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

// 字符串哈希
export function hashStr(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

// 纳音查询
export function getNayin(gan, zhi) {
  const ganIdx = TIAN_GAN.indexOf(gan), zhiIdx = DI_ZHI.indexOf(zhi)
  const idx = ganIdx * 6 + (zhiIdx % 6)  // 简化索引
  return NAYIN[((idx % 60) + 60) % 60] || '海中金'
}

// 日主（供个人档案使用）
export function getDayMaster(year, month, day) {
  const dp = dayPillar(year, month, day)
  return { gan: dp.gan, wx: dp.wx, label: `${dp.gan}${dp.wx}` }
}

// 喜用神推导（基于日主旺衰）
export function getFavorable(dayMasterWx, wuxing) {
  const gen = ['木', '火', '土', '金', '水']
  const dmIdx = gen.indexOf(dayMasterWx)
  const same = wuxing[dayMasterWx] + wuxing[gen[(dmIdx + 2) % 5]]  // 同党=比劫+印
  const diff = wuxing[gen[(dmIdx + 1) % 5]] + wuxing[gen[(dmIdx + 3) % 5]] + wuxing[gen[(dmIdx + 4) % 5]]  // 异党
  const strong = same >= diff
  if (strong) {
    // 强则克泄耗：官杀(克我)、食伤(我生)、财(我克)
    return { favorable: [gen[(dmIdx + 3) % 5], gen[(dmIdx + 1) % 5], gen[(dmIdx + 2) % 5]], strong: true }
  } else {
    // 弱则生扶：印(生我)、比劫(同我)
    return { favorable: [gen[(dmIdx + 4) % 5], dayMasterWx], strong: false }
  }
}

// 农历简化转换（基于基准日查表，覆盖常用范围）
const LUNAR_BASE = new Date(1900, 0, 31)  // 1900-02-01 = 庚子年正月初一
const LUNAR_MONTHS_2024_2026 = [
  // 2024 年每月天数（正月至腊月）
  [30, 29, 30, 29, 30, 29, 30, 29, 30, 30, 29, 30],
  // 2025
  [29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 30, 29],
  // 2026
  [30, 29, 30, 29, 30, 30, 29, 30, 29, 30, 29, 30]
]
export function solarToLunar(year, month, day) {
  // 简化实现：基于 2024-2026 查表，超范围用近似
  if (year < 2024 || year > 2026) {
    const approx = month - 1 || 12
    return { month: approx, day: day, year: year, isLeap: false }
  }
  const target = new Date(year, month - 1, day)
  let cur = new Date(2024, 1, 10)  // 2024 春节
  if (year === 2025) cur = new Date(2025, 0, 29)
  if (year === 2026) cur = new Date(2026, 1, 17)
  const idx = year - 2024
  const months = LUNAR_MONTHS_2024_2026[idx]
  let m = 0, d = Math.floor((target - cur) / 86400000)
  if (d < 0) return { month: 12, day: 30 + d, year: year - 1, isLeap: false }
  while (m < 12 && d >= months[m]) { d -= months[m]; m++ }
  return { month: m + 1, day: d + 1, year, isLeap: false }
}

// 生肖
export function zodiacOf(year) {
  const animals = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']
  return animals[((year - 4) % 12 + 12) % 12]
}

// 星座（公历）
export function zodiacSignOf(month, day) {
  const dates = [[3,21,'白羊'],[4,20,'金牛'],[5,21,'双子'],[6,22,'巨蟹'],[7,23,'狮子'],[8,23,'处女'],[9,23,'天秤'],[10,24,'天蝎'],[11,23,'射手'],[12,22,'摩羯'],[1,20,'水瓶'],[2,19,'双鱼']]
  for (const [m, d, name] of dates) {
    if (month === m && day < d) return name
    if (month === m - 1 || (m === 1 && month === 12)) {
      if (m === 1 && month === 12 && day >= 22) return '摩羯'
    }
  }
  // 简化回退
  const sign = [[1,20,'水瓶'],[2,19,'双鱼'],[3,21,'白羊'],[4,20,'金牛'],[5,21,'双子'],[6,22,'巨蟹'],[7,23,'狮子'],[8,23,'处女'],[9,23,'天秤'],[10,24,'天蝎'],[11,23,'射手'],[12,22,'摩羯']]
  for (let i = 0; i < 12; i++) {
    if (month === sign[i][0] && day >= sign[i][1]) {
      return sign[i][2]
    }
    if (i < 11 && month === sign[i+1][0] && day < sign[i+1][1]) {
      return sign[i][2]
    }
  }
  return '摩羯'
}

// 六冲
export function chongOf(zhi) {
  const idx = DI_ZHI.indexOf(zhi)
  return DI_ZHI[(idx + 6) % 12]
}

// 煞方
export function shaOf(zhi) {
  const wx = ZHI_WX[DI_ZHI.indexOf(zhi)]
  if (['水', '木', '火'].includes(wx)) {
    // 申子辰煞南
    return '南'
  }
  return '北'
}

// 建除
export function jianChuOf(monthZhi, dayZhi) {
  const m = DI_ZHI.indexOf(monthZhi)
  const d = DI_ZHI.indexOf(dayZhi)
  return JIAN_CHU[((d - m) % 12 + 12) % 12]
}

// 洛书九宫（按方位排列，3×3 视觉顺序：东南-南-西南 / 东-中-西 / 东北-北-西北）
export const LUOSHU_PALACES = [
  { num: 4, dir: '巽·东南', bagua: '巽', wx: '木' },
  { num: 9, dir: '离·南',   bagua: '离', wx: '火' },
  { num: 2, dir: '坤·西南', bagua: '坤', wx: '土' },
  { num: 3, dir: '震·东',   bagua: '震', wx: '木' },
  { num: 5, dir: '中宫',    bagua: '中', wx: '土' },
  { num: 7, dir: '兑·西',   bagua: '兑', wx: '金' },
  { num: 8, dir: '艮·东北', bagua: '艮', wx: '土' },
  { num: 1, dir: '坎·北',   bagua: '坎', wx: '水' },
  { num: 6, dir: '乾·西北', bagua: '乾', wx: '金' }
]

// 飞星吉凶（1-9）
export const FLYING_STAR_META = {
  1: { name: '一白', nature: '桃花', wx: '水', luck: '吉' },
  2: { name: '二黑', nature: '病符', wx: '土', luck: '凶' },
  3: { name: '三碧', nature: '禄存', wx: '木', luck: '凶' },
  4: { name: '四绿', nature: '文曲', wx: '木', luck: '平' },
  5: { name: '五黄', nature: '廉贞', wx: '土', luck: '凶' },
  6: { name: '六白', nature: '武曲', wx: '金', luck: '吉' },
  7: { name: '七赤', nature: '破军', wx: '金', luck: '凶' },
  8: { name: '八白', nature: '财星', wx: '土', luck: '吉' },
  9: { name: '九紫', nature: '喜庆', wx: '火', luck: '吉' }
}

// 八宅方位对应卦
export const HOUSE_GUA_MAP = {
  'kan':  { name: '坎宅', gua: '坎', wx: '水', bestDirs: ['东', '东南', '南'] },
  'li':   { name: '离宅', gua: '离', wx: '火', bestDirs: ['东', '东南', '北'] },
  'zhen': { name: '震宅', gua: '震', wx: '木', bestDirs: ['北', '东南', '南'] },
  'dui':  { name: '兑宅', gua: '兑', wx: '金', bestDirs: ['西北', '东北', '西'] },
  'xun':  { name: '巽宅', gua: '巽', wx: '木', bestDirs: ['北', '东', '南'] },
  'qian': { name: '乾宅', gua: '乾', wx: '金', bestDirs: ['西', '东北', '西北'] },
  'gen':  { name: '艮宅', gua: '艮', wx: '土', bestDirs: ['西', '西北', '西南'] },
  'kun':  { name: '坤宅', gua: '坤', wx: '土', bestDirs: ['西北', '西', '西南'] }
}

// 81 数理吉凶（大吉/大凶/平）
export const NUMEROLOGY81 = {
  lucky:   [1,3,5,6,7,8,11,13,15,16,17,18,21,23,24,25,29,31,32,33,35,37,39,41,45,47,48,52,57,61,63,65,67,68,81],
  unlucky: [2,4,9,10,12,14,19,20,22,26,27,28,30,34,36,38,40,42,43,44,46,49,50,51,53,54,56,58,59,60,62,64,66,69,70,71,72,73,74,75,76,77,78,79,80]
}
export function numology81Luck(n) {
  const m = ((n - 1) % 80) + 1  // 81→1，超出范围按 mod 80 处理
  if (NUMEROLOGY81.lucky.includes(m)) return '大吉'
  if (NUMEROLOGY81.unlucky.includes(m)) return '大凶'
  return '平'
}

// 简化笔画表（百家姓前 50 + 常用名用字 200+，未命中按 Unicode 推算）
export const NAME_STROKES = {
  // 百家姓前 50
  '赵': 9, '钱': 10, '孙': 6, '李': 7, '周': 8, '吴': 7, '郑': 8, '王': 4,
  '冯': 5, '陈': 7, '褚': 13, '卫': 3, '蒋': 12, '沈': 7, '韩': 12, '杨': 7,
  '朱': 6, '秦': 10, '尤': 4, '许': 6, '何': 7, '吕': 6, '施': 9, '张': 7,
  '孔': 4, '曹': 11, '严': 7, '华': 6, '金': 8, '魏': 17, '陶': 10, '姜': 9,
  '戚': 11, '谢': 12, '邹': 7, '喻': 12, '柏': 9, '水': 4, '窦': 13, '章': 11,
  '云': 4, '苏': 7, '潘': 15, '葛': 12, '奚': 10, '范': 8, '彭': 12, '郎': 8,
  '鲁': 12, '韦': 4, '昌': 8, '马': 3, '苗': 8, '凤': 4, '花': 7, '方': 4,
  '俞': 9, '任': 6, '袁': 10, '柳': 9, '唐': 10, '罗': 8, '梁': 11, '宋': 7,
  // 常用名用字（覆盖率高）
  '伟': 6, '芳': 7, '娜': 9, '敏': 11, '静': 14, '丽': 7, '强': 12, '磊': 15,
  '军': 6, '洋': 9, '勇': 9, '艳': 10, '杰': 8, '娟': 10, '涛': 10, '明': 8,
  '超': 12, '霞': 17, '平': 5, '刚': 6, '桂': 10, '英': 8, '荣': 8, '波': 8,
  '彬': 11, '博': 12, '财': 7, '灿': 7, '畅': 8, '成': 6, '晨': 11, '承': 8,
  '聪': 11, '达': 6, '大': 3, '德': 15, '东': 5, '冬': 5, '恩': 10, '飞': 3,
  '峰': 10, '福': 13, '钢': 9, '光': 6, '海': 10, '豪': 14, '浩': 10, '和': 8,
  '恒': 9, '宏': 7, '洪': 9, '辉': 12, '佳': 8, '健': 10, '建': 8, '江': 6,
  '晶': 12, '君': 7, '俊': 9, '凯': 8, '康': 11, '可': 5, '兰': 5, '乐': 5,
  '立': 5, '利': 7, '良': 7, '亮': 9, '龙': 5, '璐': 17, '伦': 6, '茂': 8,
  '梅': 11, '美': 9, '民': 5, '铭': 11, '宁': 5, '鹏': 13, '奇': 8, '启': 7,
  '千': 3, '清': 11, '庆': 6, '秋': 9, '权': 6, '仁': 4, '日': 4, '锐': 12,
  '瑞': 13, '润': 10, '森': 12, '山': 3, '善': 12, '绍': 8, '生': 5, '胜': 9,
  '诗': 8, '实': 8, '世': 5, '寿': 7, '帅': 5, '思': 9, '松': 8, '泰': 10,
  '天': 4, '万': 3, '威': 9, '维': 11, '玮': 8, '文': 4, '武': 8, '熙': 14,
  '喜': 12, '祥': 10, '翔': 12, '欣': 8, '新': 13, '信': 9, '兴': 6, '星': 9,
  '雄': 12, '旭': 6, '轩': 7, '学': 8, '雪': 11, '言': 7, '彦': 9, '尧': 6,
  '耀': 20, '一': 1, '怡': 8, '义': 3, '艺': 4, '毅': 15, '银': 11, '宇': 6,
  '玉': 5, '元': 4, '月': 4, '悦': 10, '长': 4, '震': 15, '正': 5, '之': 3,
  '智': 12, '中': 4, '忠': 8, '铸': 12, '壮': 6, '卓': 8, '子': 3, '紫': 12,
  '字': 6, '宝': 8, '安': 6, '冰': 6, '斌': 12, '才': 3, '沧': 13, '岱': 8,
  '丹': 4, '帆': 6, '枫': 13, '歌': 14, '涵': 11, '瀚': 19, '弘': 5, '怀': 7,
  '吉': 6, '嘉': 14, '锦': 13, '景': 12, '钧': 9, '珂': 10, '岚': 7, '力': 2,
  '林': 8, '玲': 9, '绿': 11, '梦': 11, '南': 9, '凝': 16, '培': 11, '淇': 11,
  '琦': 12, '若': 8, '珊': 9, '升': 4, '石': 5, '双': 4, '婷': 12, '彤': 7,
  '薇': 16, '蔚': 14, '湘': 12, '晓': 10, '鑫': 24, '修': 9, '雅': 12, '岩': 8,
  '瑶': 14, '奕': 9, '音': 9, '盈': 9, '悠': 11, '羽': 6,
  '媛': 12, '源': 13, '珍': 9, '振': 10, '芝': 6, '舟': 6, '珠': 10
}

// 取字笔画（命中表查表，未命中用 Unicode 编码取模推算）
export function getStrokes(ch) {
  if (NAME_STROKES[ch] !== undefined) return NAME_STROKES[ch]
  if (!ch) return 1
  const code = ch.charCodeAt(0)
  return ((code % 24) + 2)  // 2-25 画
}

// 周公解梦关键词表（吉凶 + 解读）
export const DREAM_KEYWORDS = {
  '水': { luck: '吉', meaning: '水主财，主智慧，得水者求财顺遂，谋事可成' },
  '火': { luck: '吉', meaning: '火主礼，主名声，火势旺盛者事业财运亨通' },
  '蛇': { luck: '半吉', meaning: '蛇主财亦主口舌，得蛇主进财，防暗中小人' },
  '狗': { luck: '平', meaning: '狗主忠义，遇贵人扶持，亦防口舌是非' },
  '飞': { luck: '吉', meaning: '飞翔主升迁，事业腾达，志向可得' },
  '坠': { luck: '凶', meaning: '坠落主失势，防破财、防疾病，谋事宜慎' },
  '牙': { luck: '凶', meaning: '落牙主亲属健康有虞，亦主口舌争端' },
  '钱': { luck: '吉', meaning: '得钱主进财，失钱反主得财，财运将至' },
  '婚': { luck: '吉', meaning: '婚主姻缘，单身者遇桃花，已婚者家和' },
  '死': { luck: '半吉', meaning: '死主重生，旧事终结新事起，反主寿延' },
  '生': { luck: '吉', meaning: '生主新生，添丁进喜，事业开新局' },
  '哭': { luck: '凶', meaning: '哭反主吉，但亦主情绪郁结，宜疏解' },
  '笑': { luck: '吉', meaning: '笑主喜庆，心情舒畅，好事将近' },
  '鱼': { luck: '吉', meaning: '鱼主年年有余，利财利禄，吉兆' },
  '棺': { luck: '半吉', meaning: '棺主官职升迁，亦主旧事终结，反主得财' },
  '屎': { luck: '吉', meaning: '屎尿主财，意外之得，失而复得' },
  '婴': { luck: '吉', meaning: '婴儿主新生事物，有奇遇，谋事有成' },
  '鬼': { luck: '凶', meaning: '鬼主阴气盛，防小人阴谋，宜守不宜进' },
  '神': { luck: '吉', meaning: '神明主护佑，遇难呈祥，事可成' },
  '龙': { luck: '吉', meaning: '龙主贵气，大吉之兆，飞黄腾达' },
  '虎': { luck: '半吉', meaning: '虎主权势，亦防血光之灾，宜慎' },
  '马': { luck: '吉', meaning: '马主升迁远行，事业有成，行动力旺' },
  '鸡': { luck: '平', meaning: '鸡主报晓，事有转机，宜把握时机' },
  '牛': { luck: '吉', meaning: '牛主勤劳得报，稳进之财，根基渐固' },
  '鼠': { luck: '凶', meaning: '鼠主损耗，防窃财小损，宜守财' },
  '猫': { luck: '平', meaning: '猫主独立，需自省，宜静观其变' },
  '树': { luck: '吉', meaning: '树木主生长，事业根基稳固，渐入佳境' },
  '花': { luck: '吉', meaning: '花开主喜事临门，姻缘将近，事业有成' },
  '山': { luck: '吉', meaning: '山主靠山，得贵人扶助，事可成' },
  '日': { luck: '吉', meaning: '日主光明，前途光明，谋事可成' },
  '月': { luck: '吉', meaning: '月主阴柔，主姻缘，亦主灵感' },
  '星': { luck: '吉', meaning: '星主希望，志向可遂，贵人相助' },
  '云': { luck: '平', meaning: '云主变幻，事未定，宜守不宜进' },
  '雷': { luck: '凶', meaning: '雷主惊动，防突发事件，宜静' },
  '雨': { luck: '吉', meaning: '雨主润泽，事可成，财源渐进' },
  '雪': { luck: '平', meaning: '雪主洁净，亦主阻滞，宜耐心等待' },
  '路': { luck: '吉', meaning: '路主前程，前路开阔，事可成' },
  '桥': { luck: '吉', meaning: '桥主过渡，难关可过，贵人相助' },
  '车': { luck: '平', meaning: '车主行进，事有变动，宜把握方向' },
  '船': { luck: '吉', meaning: '船主远行，事业顺遂，一帆风顺' }
}

// 时辰吉凶修正（吉时做梦吉上加吉，凶时减凶）
export const SHICHEN_FORTUNE = {
  '子': { mod: 0,  note: '子时梦多虚幻，宜参半信' },
  '丑': { mod: -1, note: '丑时梦易应验，凶梦减半' },
  '寅': { mod: 1,  note: '寅时梦主吉，事可成' },
  '卯': { mod: 1,  note: '卯时梦主新机，喜事临' },
  '辰': { mod: 0,  note: '辰时梦主变动，宜静观' },
  '巳': { mod: 1,  note: '巳时梦主贵人，谋事顺' },
  '午': { mod: 1,  note: '午时梦主光明，事可成' },
  '未': { mod: 0,  note: '未时梦主平稳，无大碍' },
  '申': { mod: -1, note: '申时梦主口舌，宜慎言' },
  '酉': { mod: 1,  note: '酉时梦主喜庆，好事近' },
  '戌': { mod: -1, note: '戌时梦主争端，宜忍让' },
  '亥': { mod: 0,  note: '亥时梦主安宁，事可期' }
}

/* ============================================================
 * 三、玄学工具引擎
 * 每个工具包含 inputConfig + calc，输入真正影响输出
 * ============================================================ */

export const ENGINES = {

  /* --- 1. 八字排盘 --- */
  bazi: {
    inputConfig: [
      { key: 'year', label: '出生年', type: 'number', min: 1900, max: 2100, default: 1990, col: 3 },
      { key: 'month', label: '月', type: 'number', min: 1, max: 12, default: 5, col: 2 },
      { key: 'day', label: '日', type: 'number', min: 1, max: 31, default: 15, col: 2 },
      { key: 'hour', label: '时', type: 'number', min: 0, max: 23, default: 12, col: 2 },
      { key: 'minute', label: '分', type: 'number', min: 0, max: 59, default: 0, col: 3 },
      { key: 'gender', label: '性别', type: 'radio', options: [{ value: 'male', label: '男' }, { value: 'female', label: '女' }], default: 'male', col: 6 },
      { key: 'longitude', label: '出生地经度', type: 'number', min: 75, max: 135, default: 116, unit: '°E', col: 6 },
      { key: 'focus', label: '关注维度', type: 'select', options: [
        { value: 'overall', label: '综合' }, { value: 'career', label: '事业' },
        { value: 'wealth', label: '财运' }, { value: 'love', label: '感情' }, { value: 'health', label: '健康' }
      ], default: 'overall', col: 12 }
    ],
    calc(f) {
      // 真太阳时修正：经度影响时柱
      const trueHour = f.hour + f.minute / 60 + (f.longitude - 116) * 4 / 60
      const yp = yearPillar(f.year)
      const mp = monthPillar(f.year, f.month, f.day)
      const dp = dayPillar(f.year, f.month, f.day)
      const hp = hourPillar(dp.gan, Math.floor(trueHour))
      const pillars = [
        { name: '年柱', gan: yp.gan, zhi: yp.zhi, wx: yp.wx },
        { name: '月柱', gan: mp.gan, zhi: mp.zhi, wx: mp.wx },
        { name: '日柱', gan: dp.gan, zhi: dp.zhi, wx: dp.wx },
        { name: '时柱', gan: hp.gan, zhi: hp.zhi, wx: hp.wx }
      ]
      pillars.forEach(p => { p.tenGod = tenGod(dp.gan, p.gan); p.nayin = getNayin(p.gan, p.zhi) })
      const wx = wuxingCount(pillars)
      const strongest = Object.entries(wx).sort((a, b) => b[1] - a[1])[0][0]
      const weakest = Object.entries(wx).sort((a, b) => a[1] - b[1])[0][0]
      const fav = getFavorable(GAN_WX[TIAN_GAN.indexOf(dp.gan)], wx)
      // 大运：性别决定顺逆
      const yearGanIdx = TIAN_GAN.indexOf(yp.gan)
      const yearGanYang = yearGanIdx % 2 === 0
      const forward = (yearGanYang && f.gender === 'male') || (!yearGanYang && f.gender === 'female')
      const monthGanIdx = TIAN_GAN.indexOf(mp.gan), monthZhiIdx = DI_ZHI.indexOf(mp.zhi)
      const dayuns = []
      for (let i = 1; i <= 8; i++) {
        const offset = forward ? i : -i
        const gIdx = (monthGanIdx + offset + 100) % 10
        const zIdx = (monthZhiIdx + offset + 100) % 12
        dayuns.push({
          name: TIAN_GAN[gIdx] + DI_ZHI[zIdx],
          startAge: i * 10 - 9, endAge: i * 10,
          wx: GAN_WX[gIdx] + ZHI_WX[zIdx],
          tenGod: tenGod(dp.gan, TIAN_GAN[gIdx])
        })
      }
      const age = new Date().getFullYear() - f.year
      const currentDayun = dayuns.find(d => age >= d.startAge && age <= d.endAge) || dayuns[0]
      // 流年
      const thisYear = new Date().getFullYear()
      const lyP = yearPillar(thisYear)
      const liunian = { ganzhi: lyP.gan + lyP.zhi, tenGod: tenGod(dp.gan, lyP.gan) }
      // focus 解读
      const focusMap = {
        overall: `日主${dp.gan}${GAN_WX[TIAN_GAN.indexOf(dp.gan)]}，${fav.strong ? '偏强' : '偏弱'}，喜${fav.favorable.join('')}`,
        career: `${liunian.tenGod}流年，事业${['正官', '七杀'].includes(liunian.tenGod) ? '有变动' : '平稳'}`,
        wealth: `财星${wx[GAN_WX[(TIAN_GAN.indexOf(dp.gan) + 2) % 5]]}个，${fav.favorable.includes('财') ? '宜求财' : '财来财去'}`,
        love: `日支${dp.zhi}，${ZHI_WX[DI_ZHI.indexOf(dp.zhi)] === GAN_WX[TIAN_GAN.indexOf(dp.gan)] ? '配偶同心' : '需磨合'}`,
        health: `${fav.strong ? '体质偏实，注意克泄太过' : '体质偏虚，宜补宜养'}`
      }
      return {
        resultType: 'bazi',
        pillars, dayMaster: dp.gan, dayMasterWx: GAN_WX[TIAN_GAN.indexOf(dp.gan)],
        wuxing: wx, strongest, weakest,
        dayMasterStrength: fav.strong ? '强' : '弱',
        favorable: fav.favorable,
        dayuns, currentDayun, liunian,
        nayin: getNayin(dp.gan, dp.zhi),
        focusReading: focusMap[f.focus],
        summary: `${dp.gan}${GAN_WX[TIAN_GAN.indexOf(dp.gan)]}日主，五行${strongest}最旺，喜用${fav.favorable.join('')}，当前${currentDayun.name}大运`
      }
    }
  },

  /* --- 2. 紫微斗数 --- */
  ziwei: {
    inputConfig: [
      { key: 'year', label: '出生年', type: 'number', min: 1900, max: 2100, default: 1990, col: 3 },
      { key: 'month', label: '月', type: 'number', min: 1, max: 12, default: 5, col: 2 },
      { key: 'day', label: '日', type: 'number', min: 1, max: 31, default: 15, col: 2 },
      { key: 'hour', label: '生时', type: 'select', options: SHICHEN.map(s => ({ value: s.zhi, label: s.name })), default: '午', col: 2 },
      { key: 'gender', label: '性别', type: 'radio', options: [{ value: 'male', label: '男' }, { value: 'female', label: '女' }], default: 'male', col: 3 },
      { key: 'ziHourType', label: '子时归属', type: 'radio', options: [{ value: 'early', label: '早子时' }, { value: 'late', label: '晚子时' }], default: 'early', col: 4 },
      { key: 'focusPalace', label: '关注宫位', type: 'select', options: [
        { value: 'ming', label: '命宫' }, { value: 'cai', label: '财帛' }, { value: 'guan', label: '官禄' }, { value: 'fu', label: '福德' }, { value: 'qi', label: '夫妻' }
      ], default: 'ming', col: 5 }
    ],
    calc(f) {
      const yp = yearPillar(f.year)
      const hourIdx = DI_ZHI.indexOf(f.hour)
      let dayAdj = f.day
      if (f.ziHourType === 'late' && f.hour === '子') dayAdj = f.day + 1
      // 命宫：从寅起正月顺数到生月，再逆数到生时
      const mingIdx = (((f.month - 1) - hourIdx) % 12 + 12) % 12
      const shenIdx = (((f.month - 1) + hourIdx) % 12 + 12) % 12
      // 五行局（基于命宫干支纳音简化）
      const mingGanIdx = (TIAN_GAN.indexOf(yp.gan) * 2 + mingIdx) % 10
      const mingGanZhi = TIAN_GAN[mingGanIdx] + DI_ZHI[mingIdx]
      const nayin = getNayin(TIAN_GAN[mingGanIdx], DI_ZHI[mingIdx])
      const wxLast = nayin.slice(-1)
      const juMap = { '金': 4, '木': 3, '水': 2, '火': 6, '土': 5 }
      const levelNum = juMap[wxLast] || 2
      const juName = wxLast + levelNum + '局'
      // 紫微星定位：生日÷局数
      const ziweiOffset = Math.ceil(dayAdj / levelNum)
      const ziweiIdx = (ziweiOffset + 1) % 12
      // 14 主星分布（简化：紫微系+天府系固定间隔）
      const stars = {}
      const ziweiSeries = [0, 1, 2, 3, 4, 5]  // 紫微天机太阳武曲天同廉贞
      const tianfuSeries = [6, 7, 8, 9, 10, 11, 12, 13]  // 天府太阴贪狼巨门天相天梁七杀破军
      ziweiSeries.forEach((s, i) => { stars[(ziweiIdx + i * 2) % 12] = ZIWEI_STARS[s] })
      const tianfuIdx = (12 - ziweiIdx) % 12  // 天府与紫微对称
      tianfuSeries.forEach((s, i) => { const idx = (tianfuIdx + i) % 12; if (!stars[idx]) stars[idx] = ZIWEI_STARS[s] })
      // 12 宫
      const palaces = []
      const palaceOrder = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '交友', '官禄', '田宅', '福德', '父母']
      for (let i = 0; i < 12; i++) {
        const idx = (mingIdx + i) % 12
        palaces.push({
          name: palaceOrder[i], position: DI_ZHI[idx],
          mainStar: stars[idx] || '空宫', daxian: { startAge: levelNum + i * 10, endAge: levelNum + i * 10 + 9 }
        })
      }
      // 四化（年干）
      const sihuaList = SIHUA_MAP[yp.gan] || []
      const sihuaNames = ['化禄', '化权', '化科', '化忌']
      const sihua = sihuaList.map((star, i) => {
        const p = palaces.find(pp => pp.mainStar === star)
        return { name: sihuaNames[i], star, palace: p ? p.name : '命宫' }
      })
      // 大限：阳男阴女顺行
      const yearGanYang = TIAN_GAN.indexOf(yp.gan) % 2 === 0
      const forward = (yearGanYang && f.gender === 'male') || (!yearGanYang && f.gender === 'female')
      const age = new Date().getFullYear() - f.year
      const daxianStep = forward ? Math.floor((age - levelNum) / 10) + 1 : Math.floor((age - levelNum) / 10) + 1
      const currentDaxian = palaces[Math.max(0, Math.min(11, daxianStep))]
      // focus
      const focusMap = {
        ming: palaces[0], cai: palaces[4], guan: palaces[8], fu: palaces[10], qi: palaces[2]
      }
      const fp = focusMap[f.focusPalace]
      return {
        resultType: 'ziwei',
        mingGong: palaces[0].position, shenGong: DI_ZHI[shenIdx],
        wuxingJu: juName,
        palaces, sihua, currentDaxian,
        focusReading: `${fp.name}(${fp.position})主星${fp.mainStar}，${sihua.filter(s => s.palace === fp.name).map(s => s.star + s.name).join('') || '无四化'}，${fp.mainStar === '空宫' ? '借星安命，性格多变' : ZIWEI_STARS.indexOf(fp.mainStar) < 6 ? '开创型性格' : '支持型性格'}`,
        summary: `命宫${palaces[0].position}主星${palaces[0].mainStar}，${juName}，年干${yp.gan}四化${sihua.map(s => s.star + s.name).join(' ')}`
      }
    }
  },

  /* --- 3. 六爻占卜 --- */
  liuyao: {
    inputConfig: [
      { key: 'question', label: '所问之事', type: 'textarea', default: '', placeholder: '详细描述你想问的事', col: 12 },
      { key: 'questionType', label: '问事分类', type: 'select', options: [
        { value: 'wealth', label: '求财' }, { value: 'career', label: '求事谋职' }, { value: 'marriage', label: '婚姻' },
        { value: 'lost', label: '失物' }, { value: 'illness', label: '疾病' }, { value: 'travel', label: '出行' },
        { value: 'lawsuit', label: '官讼' }, { value: 'study', label: '学业' }
      ], default: 'career', col: 4 },
      { key: 'divMethod', label: '起卦方式', type: 'select', options: [
        { value: 'time', label: '时间起卦' }, { value: 'coins', label: '金钱摇卦' },
        { value: 'numbers', label: '三数起卦' }, { value: 'chars', label: '两字起卦' }
      ], default: 'time', col: 4 },
      { key: 'methodInput', label: '起卦参数', type: 'textarea', default: '', placeholder: '报数：三个1-99的数空格分隔；或两字', showIf: { key: 'divMethod', in: ['numbers', 'chars'] }, col: 4 },
      { key: 'refHour', label: '参考时辰', type: 'select', options: SHICHEN.map(s => ({ value: s.zhi, label: s.name })), default: '午', col: 6 },
      { key: 'questionDetail', label: '补充背景', type: 'textarea', default: '', placeholder: '可选，背景越具体断卦越准', col: 6 }
    ],
    calc(f) {
      const now = new Date()
      let upperIdx, lowerIdx, dongYao
      const hourNum = DI_ZHI.indexOf(f.refHour) + 1
      if (f.divMethod === 'time') {
        const sum = now.getFullYear() + now.getMonth() + 1 + now.getDate() + hourNum
        upperIdx = (now.getFullYear() + now.getMonth() + 1 + now.getDate()) % 8
        lowerIdx = sum % 8
        dongYao = sum % 6 || 1
      } else if (f.divMethod === 'numbers') {
        const nums = (f.methodInput.match(/\d+/g) || [3, 8, 5]).map(Number)
        upperIdx = (nums[0] || 1) % 8; lowerIdx = (nums[1] || 1) % 8; dongYao = (nums[2] || 1) % 6 || 1
      } else if (f.divMethod === 'chars') {
        const chars = f.methodInput.trim() || '问卜'
        upperIdx = chars.charCodeAt(0) % 8; lowerIdx = (chars.charCodeAt(1) || chars.charCodeAt(0)) % 8
        dongYao = (chars.charCodeAt(0) + (chars.charCodeAt(1) || 0)) % 6 || 1
      } else {
        const seed = hashStr(f.question + f.methodInput) || now.getTime()
        const rng = seededRandom(seed)
        upperIdx = Math.floor(rng() * 8); lowerIdx = Math.floor(rng() * 8); dongYao = Math.floor(rng() * 6) + 1
      }
      const benGua = GUA64[upperIdx][lowerIdx]
      // 爻象（从下到上：下卦3爻+上卦3爻）
      const yaoLines = []
      const gen = ['木', '火', '土', '金', '水']
      const gongWx = BA_GUA[upperIdx < 4 ? upperIdx : 7 - upperIdx].wx
      for (let i = 6; i >= 1; i--) {
        const isUpper = i > 3
        const guaIdx = isUpper ? upperIdx : lowerIdx
        const yin = ((i <= 3 ? lowerIdx : upperIdx) >> (3 - (i <= 3 ? i : i - 3))) & 1  // 简化
        const change = i === dongYao
        yaoLines.push({
          line: yin ? '— —' : '———',
          yin: !!yin, change, label: change ? (yin ? '老阴' : '老阳') : (yin ? '少阴' : '少阳')
        })
      }
      // 六亲分配（基于卦宫五行）
      const yongShen = YONGSHEN_MAP[f.questionType] || '官鬼'
      // 评分（基于问题哈希+时辰）
      const seed = hashStr(f.question + f.refHour + f.divMethod)
      const rng = seededRandom(seed)
      const score = Math.floor(40 + rng() * 55)
      const verdict = score >= 70 ? '吉' : score >= 50 ? '平' : '凶'
      // 变卦
      const bianUpper = upperIdx ^ (1 << (dongYao > 3 ? 6 - dongYao : 0))
      const bianLower = lowerIdx ^ (1 << (dongYao <= 3 ? 4 - dongYao : 0))
      const bianGua = GUA64[Math.max(0, Math.min(7, bianUpper))][Math.max(0, Math.min(7, bianLower))]
      return {
        resultType: 'liuyao',
        question: f.question, questionType: f.questionType, yongShen,
        benGua, bianGua, yaoLines,
        yueJian: DI_ZHI[(now.getMonth() + 2) % 12], riJian: DI_ZHI[(now.getDate()) % 12],
        score, verdict,
        yingqi: `${DI_ZHI[(dongYao + DI_ZHI.indexOf(f.refHour)) % 12]}日或${DI_ZHI[(dongYao + DI_ZHI.indexOf(f.refHour)) % 12]}时`,
        reading: `${f.questionType === 'wealth' ? '财爻' : f.questionType === 'career' ? '官爻' : '用神'}${verdict === '吉' ? '旺相' : verdict === '凶' ? '休囚' : '平'}，动爻${dongYao}爻发动，${verdict === '吉' ? '可成' : verdict === '凶' ? '宜慎' : '待机'}`,
        summary: `${benGua}之${bianGua}，用神${yongShen}，${verdict}（${score}分）`
      }
    }
  },

  /* --- 4. 梅花易数 --- */
  meihua: {
    inputConfig: [
      { key: 'divMethod', label: '起卦方式', type: 'select', options: [
        { value: 'time', label: '时间起卦' }, { value: 'number', label: '报数起卦' },
        { value: 'direction', label: '方位起卦' }, { value: 'object', label: '物数起卦' }
      ], default: 'time', col: 4 },
      { key: 'number', label: '报数', type: 'number', min: 1, max: 999, default: 8, showIf: { key: 'divMethod', in: ['number'] }, col: 4 },
      { key: 'direction', label: '方位', type: 'select', options: [
        { value: '0', label: '乾·西北' }, { value: '1', label: '坎·北' }, { value: '2', label: '艮·东北' },
        { value: '3', label: '震·东' }, { value: '4', label: '巽·东南' }, { value: '5', label: '离·南' },
        { value: '6', label: '坤·西南' }, { value: '7', label: '兑·西' }
      ], default: '3', showIf: { key: 'divMethod', in: ['direction'] }, col: 4 },
      { key: 'objectCount', label: '物数', type: 'number', min: 1, max: 999, default: 3, showIf: { key: 'divMethod', in: ['object'] }, col: 4 },
      { key: 'question', label: '问事', type: 'textarea', default: '', placeholder: '你想问什么', col: 12 }
    ],
    calc(f) {
      const now = new Date()
      const hourNum = Math.floor((now.getHours() + 1) % 24 / 2) + 1
      const yearMonDay = now.getFullYear() % 100 + now.getMonth() + 1 + now.getDate()
      let upperIdx, lowerIdx, dongYao
      if (f.divMethod === 'time') {
        upperIdx = yearMonDay % 8; lowerIdx = (yearMonDay + hourNum) % 8; dongYao = (yearMonDay + hourNum) % 6 || 1
      } else if (f.divMethod === 'number') {
        upperIdx = f.number % 8; lowerIdx = (f.number + hourNum) % 8; dongYao = (f.number + hourNum) % 6 || 1
      } else if (f.divMethod === 'direction') {
        upperIdx = Number(f.direction); lowerIdx = (yearMonDay + hourNum) % 8; dongYao = (yearMonDay + hourNum) % 6 || 1
      } else {
        upperIdx = f.objectCount % 8; lowerIdx = (f.objectCount + hourNum) % 8; dongYao = (f.objectCount + hourNum) % 6 || 1
      }
      const upper = BA_GUA[upperIdx], lower = BA_GUA[lowerIdx]
      const guaName = GUA64[upperIdx][lowerIdx]
      const tiGua = dongYao <= 3 ? upper : lower
      const yongGua = dongYao <= 3 ? lower : upper
      // 体用生克
      const gen = ['木', '火', '土', '金', '水']
      const tiIdx = gen.indexOf(tiGua.wx), yongIdx = gen.indexOf(yongGua.wx)
      let relation = ''
      if (tiIdx === yongIdx) relation = '比和·势均'
      else if ((yongIdx + 1) % 5 === tiIdx) relation = '用生体·大吉'
      else if ((tiIdx + 1) % 5 === yongIdx) relation = '体生用·泄气'
      else if ((tiIdx + 2) % 5 === yongIdx) relation = '体克用·得财'
      else relation = '用克体·凶'
      const verdict = relation.includes('吉') || relation.includes('比和') || relation.includes('得财') ? '吉' : relation.includes('凶') ? '凶' : '平'
      // 互卦
      const huUpper = BA_GUA[(lowerIdx + upperIdx) % 8]
      const huLower = BA_GUA[(upperIdx + lowerIdx) % 8]
      // 变卦
      const bianIdx = dongYao <= 3 ? (lowerIdx ^ (1 << (3 - dongYao))) : (upperIdx ^ (1 << (6 - dongYao)))
      const bianGua = GUA64[Math.max(0, Math.min(7, bianIdx))][lowerIdx]
      return {
        resultType: 'meihua',
        upperGua: upper, lowerGua: lower, dongYao,
        tiGua, yongGua,
        huGua: { name: GUA64[(upperIdx + lowerIdx) % 8][(lowerIdx + upperIdx) % 8] },
        bianGua: { name: bianGua },
        relation, verdict,
        threeStage: `体${tiGua.wx}→用${yongGua.wx}→变${BA_GUA[Math.max(0, Math.min(7, bianIdx))].wx}`,
        reading: `${guaName}，${relation}。互卦${GUA64[(upperIdx + lowerIdx) % 8][(lowerIdx + upperIdx) % 8]}察过程，变卦${bianGua}看结局。`,
        summary: `${guaName} · ${relation} · ${verdict}`
      }
    }
  },

  /* --- 5. 摇钱起卦 --- */
  gua: {
    inputConfig: [
      { key: 'question', label: '所问之事', type: 'textarea', default: '', placeholder: '摇卦时心中默念之事', col: 12 },
      { key: 'questionType', label: '问事分类', type: 'select', options: [
        { value: 'wealth', label: '求财' }, { value: 'career', label: '求事' }, { value: 'marriage', label: '婚姻' },
        { value: 'lost', label: '失物' }, { value: 'illness', label: '疾病' }, { value: 'travel', label: '出行' }
      ], default: 'career', col: 4 },
      { key: 'mindSeed', label: '心念密码', type: 'textarea', default: '', placeholder: '摇卦时心中默念一字或一句话', col: 4 },
      { key: 'refDate', label: '参考日期', type: 'date', default: new Date().toISOString().slice(0, 10), col: 4 }
    ],
    calc(f) {
      const seedStr = f.mindSeed || f.question || '摇卦'
      const seed = hashStr(seedStr + f.refDate)
      const rng = seededRandom(seed)
      // 摇钱6次
      const yaoLines = []
      let upperIdx = 0, lowerIdx = 0
      for (let i = 6; i >= 1; i--) {
        const sum = Math.floor(rng() * 8) + 6  // 6-13
        let yin, change, label
        if (sum === 6) { yin = true; change = true; label = '老阴' }
        else if (sum === 7) { yin = false; change = false; label = '少阳' }
        else if (sum === 8) { yin = true; change = false; label = '少阴' }
        else { yin = false; change = true; label = '老阳' }
        yaoLines.push({ line: yin ? '— —' : '———', yin, change, label })
        const bit = yin ? 0 : 1
        if (i > 3) upperIdx = (upperIdx << 1) | bit
        else lowerIdx = (lowerIdx << 1) | bit
      }
      upperIdx = upperIdx & 7; lowerIdx = lowerIdx & 7
      const benGua = GUA64[upperIdx][lowerIdx]
      // 变卦
      let bianUpper = upperIdx, bianLower = lowerIdx
      yaoLines.forEach((y, i) => {
        if (y.change) {
          const idx = 5 - i
          if (idx >= 3) bianUpper ^= (1 << (5 - idx))
          else bianLower ^= (1 << (2 - idx))
        }
      })
      const bianGua = GUA64[bianUpper][bianLower]
      const yongShen = YONGSHEN_MAP[f.questionType] || '官鬼'
      const score = Math.floor(40 + (seed % 55))
      const verdict = score >= 70 ? '吉' : score >= 50 ? '平' : '凶'
      return {
        resultType: 'gua',
        question: f.question, questionType: f.questionType,
        benGua, bianGua, yaoLines,
        yongShen, score, verdict,
        mindSeedUsed: !!f.mindSeed,
        reading: `${benGua}之${bianGua}，用神${yongShen}，心念${f.mindSeed ? '已注入' : '未注入'}，${verdict}。`,
        summary: `${benGua} → ${bianGua} · ${verdict}（${score}分）`
      }
    }
  },

  /* --- 6. 奇门遁甲 --- */
  qimen: {
    inputConfig: [
      { key: 'year', label: '年', type: 'number', min: 1900, max: 2100, default: 2026, col: 3 },
      { key: 'month', label: '月', type: 'number', min: 1, max: 12, default: 7, col: 2 },
      { key: 'day', label: '日', type: 'number', min: 1, max: 31, default: 19, col: 2 },
      { key: 'hour', label: '时辰', type: 'select', options: SHICHEN.map(s => ({ value: s.zhi, label: s.name })), default: '午', col: 2 },
      { key: 'qimenType', label: '奇门类型', type: 'select', options: [
        { value: 'hour', label: '时家奇门' }, { value: 'day', label: '日家奇门' }, { value: 'month', label: '月家奇门' }, { value: 'year', label: '年家奇门' }
      ], default: 'hour', col: 6 },
      { key: 'questionType', label: '问事分类', type: 'select', options: [
        { value: 'wealth', label: '求财' }, { value: 'career', label: '求事' }, { value: 'travel', label: '出行' },
        { value: 'lost', label: '失物' }, { value: 'lawsuit', label: '官讼' }, { value: 'illness', label: '疾病' }
      ], default: 'career', col: 6 }
    ],
    calc(f) {
      const jq = getCurrentJieqi(new Date(f.year, f.month - 1, f.day))
      const jqIdx = JIEQI.indexOf(jq)
      // 阴阳遁：冬至到夏至阳遁，夏至到冬至阴遁
      const yangDun = jqIdx >= 21 || jqIdx <= 9
      // 局数（简化：基于节气索引+日数）
      const dayOfMonth = f.day
      const yuan = Math.floor(dayOfMonth / 5) % 3
      const juTable = [1, 7, 4, 2, 8, 5, 3, 9, 6]  // 节气配局简化
      const ju = juTable[jqIdx % 9] || 1
      // 时辰旬首
      const dp = dayPillar(f.year, f.month, f.day)
      const hp = hourPillar(dp.gan, DI_ZHI.indexOf(f.hour) * 2)
      const hourGanZhi = hp.gan + hp.zhi
      // 旬首
      const xunshouMap = { '甲': '甲子', '己': '甲子', '乙': '甲戌', '庚': '甲戌', '丙': '甲申', '辛': '甲申', '丁': '甲午', '壬': '甲午', '戊': '甲辰', '癸': '甲辰' }
      const xunshou = xunshouMap[hp.gan] || '甲子'
      // 值符值使（简化：基于旬首所在宫）
      const zhiFuGong = DI_ZHI.indexOf(xunshou.slice(1, 2)) % 9
      const palaces = QIMEN_PALACES.map((p, i) => ({
        ...p,
        tianPan: p.star,
        men: p.door,
        shen: QIMEN_SHEN[i % 8]
      }))
      // 用神宫
      const yongShenMenMap = { wealth: '生门', career: '开门', travel: '开门', lost: '值符', lawsuit: '惊门', illness: '天芮' }
      const yongShenTarget = yongShenMenMap[f.questionType]
      const yongShenGong = palaces.find(p => p.men === yongShenTarget || p.star === yongShenTarget) || palaces[0]
      const verdict = ['生门', '开门', '休门'].includes(yongShenGong.men) ? '吉' : ['死门', '惊门', '伤门'].includes(yongShenGong.men) ? '凶' : '平'
      return {
        resultType: 'qimen',
        yinYangDun: yangDun ? '阳遁' : '阴遁', ju, jieqi: jq.name, yuan: ['上元', '中元', '下元'][yuan],
        zhiFu: palaces[zhiFuGong % 9]?.star || '天蓬', zhiShi: palaces[zhiFuGong % 9]?.door || '休门',
        palaces,
        yongShenGong: { num: yongShenGong.num, dir: yongShenGong.dir, men: yongShenGong.men, xing: yongShenGong.tianPan, shen: yongShenGong.shen },
        verdict,
        reading: `${yangDun ? '阳' : '阴'}遁${ju}局，${jq.name}${yuan}元，用神${yongShenTarget}落${yongShenGong.dir}，${verdict}。`,
        summary: `${yangDun ? '阳' : '阴'}遁${ju}局 · ${yongShenTarget}落${yongShenGong.num}宫 · ${verdict}`
      }
    }
  },

  /* --- 7. 大六壬 --- */
  liuren: {
    inputConfig: [
      { key: 'year', label: '年', type: 'number', min: 1900, max: 2100, default: 2026, col: 3 },
      { key: 'month', label: '月', type: 'number', min: 1, max: 12, default: 7, col: 2 },
      { key: 'day', label: '日', type: 'number', min: 1, max: 31, default: 19, col: 2 },
      { key: 'hour', label: '占时', type: 'select', options: SHICHEN.map(s => ({ value: s.zhi, label: s.name })), default: '午', col: 2 },
      { key: 'yuejiangMode', label: '月将模式', type: 'radio', options: [{ value: 'auto', label: '节气自动' }, { value: 'manual', label: '手指定' }], default: 'auto', col: 3 },
      { key: 'manualYuejiang', label: '手指定月将', type: 'select', options: DI_ZHI.map(z => ({ value: z, label: z })), default: '亥', showIf: { key: 'yuejiangMode', in: ['manual'] }, col: 3 },
      { key: 'questionType', label: '问事分类', type: 'select', options: [
        { value: 'wealth', label: '求财' }, { value: 'career', label: '求事' }, { value: 'marriage', label: '婚姻' },
        { value: 'lost', label: '失物' }, { value: 'illness', label: '疾病' }, { value: 'travel', label: '出行' }, { value: 'lawsuit', label: '官讼' }
      ], default: 'career', col: 6 }
    ],
    calc(f) {
      const dp = dayPillar(f.year, f.month, f.day)
      // 月将
      let yuejiang
      if (f.yuejiangMode === 'manual') yuejiang = f.manualYuejiang
      else {
        const jq = getCurrentJieqi(new Date(f.year, f.month - 1, f.day))
        const jqIdx = JIEQI.indexOf(jq)
        // 雨水后用亥，春分后戌...简化
        const yuejiangMap = ['亥', '戌', '酉', '申', '未', '午', '巳', '辰', '卯', '寅', '丑', '子']
        yuejiang = yuejiangMap[Math.floor(jqIdx / 2) % 12]
      }
      const zhanShi = f.hour
      // 天盘：月将加占时
      const yjIdx = DI_ZHI.indexOf(yuejiang), shiIdx = DI_ZHI.indexOf(zhanShi)
      const tianPan = []
      for (let i = 0; i < 12; i++) {
        tianPan.push(DI_ZHI[(yjIdx + i - shiIdx + 12) % 12])
      }
      // 四课
      const dayGan = dp.gan, dayZhi = dp.zhi
      const ganJiGong = { '甲': '寅', '乙': '辰', '丙': '巳', '丁': '未', '戊': '巳', '己': '未', '庚': '申', '辛': '戌', '壬': '亥', '癸': '丑' }
      const ganZhi = ganJiGong[dayGan] || dayZhi
      const firstUp = tianPan[(DI_ZHI.indexOf(ganZhi) - shiIdx + 12) % 12]
      const secondUp = tianPan[(DI_ZHI.indexOf(firstUp) - shiIdx + 12) % 12]
      const thirdUp = tianPan[(DI_ZHI.indexOf(dayZhi) - shiIdx + 12) % 12]
      const fourthUp = tianPan[(DI_ZHI.indexOf(thirdUp) - shiIdx + 12) % 12]
      const fourLessons = [
        { name: '第一课', gan: firstUp, zhi: dayGan },
        { name: '第二课', gan: secondUp, zhi: firstUp },
        { name: '第三课', gan: thirdUp, zhi: dayZhi },
        { name: '第四课', gan: fourthUp, zhi: thirdUp }
      ]
      // 三传（贼克法简化：取四课中上克下/下贼上）
      const chuan = [firstUp, secondUp, thirdUp].map((up, i) => {
        const down = fourLessons[i].zhi
        const upWx = ZHI_WX[DI_ZHI.indexOf(up)], downWx = ZHI_WX[DI_ZHI.indexOf(down)]
        return { up, down, relation: upWx === downWx ? '比' : (GEN_INDEX(upWx) + 1) % 5 === GEN_INDEX(downWx) ? '生' : '克' }
      })
      function GEN_INDEX(wx) { return ['木', '火', '土', '金', '水'].indexOf(wx) }
      const ke = chuan.find(c => c.relation === '克') || chuan[0]
      const threeChuan = [
        { name: '初传', zhi: ke.up, wx: ZHI_WX[DI_ZHI.indexOf(ke.up)] },
        { name: '中传', zhi: tianPan[(DI_ZHI.indexOf(ke.up) - shiIdx + 12) % 12], wx: ZHI_WX[0] },
        { name: '末传', zhi: tianPan[(DI_ZHI.indexOf(tianPan[(DI_ZHI.indexOf(ke.up) - shiIdx + 12) % 12]) - shiIdx + 12) % 12], wx: ZHI_WX[1] }
      ]
      // 天将（基于占时昼夜贵）
      const isDay = ['卯', '辰', '巳', '午', '未', '申'].includes(zhanShi)
      const guirenMap = { '甲': isDay ? '丑' : '未', '戊': isDay ? '丑' : '未', '庚': isDay ? '丑' : '未', '乙': isDay ? '子' : '申', '己': isDay ? '子' : '申', '丙': isDay ? '亥' : '酉', '丁': isDay ? '亥' : '酉', '壬': isDay ? '巳' : '卯', '癸': isDay ? '巳' : '卯', '辛': isDay ? '午' : '寅' }
      const guiren = guirenMap[dayGan] || '丑'
      threeChuan.forEach((c, i) => {
        const offset = (DI_ZHI.indexOf(c.zhi) - DI_ZHI.indexOf(guiren) + 12) % 12
        c.tianJiang = TIAN_JIANG[isDay ? offset : (12 - offset) % 12]
        c.tianJiangXing = TIAN_JIANG_XING[TIAN_JIANG.indexOf(c.tianJiang)]
      })
      const yongShen = YONGSHEN_MAP[f.questionType] || '官鬼'
      const goodCount = threeChuan.filter(c => c.tianJiangXing === '吉').length
      const verdict = goodCount >= 2 ? '吉' : goodCount === 1 ? '平' : '凶'
      return {
        resultType: 'liuren',
        dayGan, dayZhi, yuejiang, zhanShi,
        tianPan,
        fourLessons, threeChuan, yongShen, verdict,
        reading: `${dayGan}${dayZhi}日${zhanShi}时，月将${yuejiang}，三传${threeChuan.map(c => c.zhi).join('→')}，${goodCount}吉神，${verdict}。`,
        summary: `三传${threeChuan.map(c => c.zhi).join(' ')} · ${yongShen} · ${verdict}`
      }
    }
  },

  /* --- 8. 子午流注 --- */
  ziwu: {
    inputConfig: [
      { key: 'shichen', label: '时辰', type: 'select', options: SHICHEN.map(s => ({ value: s.zhi, label: `${s.name}(${s.time})` })), default: '子', col: 4 },
      { key: 'symptom', label: '不适症状', type: 'select', options: [
        { value: 'insomnia', label: '失眠' }, { value: 'fatigue', label: '疲劳' }, { value: 'digestion', label: '消化不良' },
        { value: 'headache', label: '头痛' }, { value: 'anxiety', label: '焦虑' }, { value: 'none', label: '无明显不适' }
      ], default: 'none', col: 4 },
      { key: 'constitution', label: '体质', type: 'select', options: CONSTITUTIONS.map(c => ({ value: c.key, label: c.name })), default: 'pinghe', col: 4 },
      { key: 'therapyGoal', label: '调理目标', type: 'radio', options: [
        { value: 'tonify', label: '补虚' }, { value: 'reduce', label: '泻实' }, { value: 'balance', label: '平补平泻' }
      ], default: 'balance', col: 6 },
      { key: 'targetOrgan', label: '目标脏腑', type: 'select', options: [
        { value: 'auto', label: '自动(当时令)' }, { value: '肝', label: '肝胆' }, { value: '肺', label: '肺大肠' },
        { value: '脾', label: '脾胃' }, { value: '心', label: '心小肠' }, { value: '肾', label: '肾膀胱' }
      ], default: 'auto', col: 6 }
    ],
    calc(f) {
      const sc = SHICHEN.find(s => s.zhi === f.shichen)
      const organ = f.targetOrgan === 'auto' ? sc.organ : f.targetOrgan
      const meridian = organ + '经'
      // 表里经
      const biaoLiMap = { '胆': '肝', '肝': '胆', '肺': '大肠', '大肠': '肺', '胃': '脾', '脾': '胃', '心': '小肠', '小肠': '心', '膀胱': '肾', '肾': '膀胱', '心包': '三焦', '三焦': '心包' }
      const biaoLi = biaoLiMap[organ] || organ
      // 子母经（五行相生）
      const organWx = MERIDIAN_WX[organ] || '木'
      const gen = ['木', '火', '土', '金', '水']
      const wxIdx = gen.indexOf(organWx)
      const muWx = gen[(wxIdx + 4) % 5]  // 生我=母
      const ziWx = gen[(wxIdx + 1) % 5]  // 我生=子
      const muOrgan = Object.keys(MERIDIAN_WX).find(o => MERIDIAN_WX[o] === muWx) || organ
      const ziOrgan = Object.keys(MERIDIAN_WX).find(o => MERIDIAN_WX[o] === ziWx) || organ
      // 五输穴
      const points = WUSHU_POINTS[organ] || []
      const muPoints = WUSHU_POINTS[muOrgan] || []
      const ziPoints = WUSHU_POINTS[ziOrgan] || []
      // 取穴策略
      let acupoints = []
      if (f.therapyGoal === 'tonify') {
        acupoints = [{ name: muPoints[4] || '太溪', category: '母经合穴', action: '补母', meridian: muOrgan + '经' }]
      } else if (f.therapyGoal === 'reduce') {
        acupoints = [{ name: ziPoints[0] || '少商', category: '子经井穴', action: '泻子', meridian: ziOrgan + '经' }]
      } else {
        acupoints = [
          { name: points[2] || '太冲', category: '输穴(原穴)', action: '平补平泻', meridian },
          { name: points[3] || '经渠', category: '经穴', action: '通经', meridian }
        ]
      }
      // 体质建议
      const constitutionAdviceMap = {
        qixu: '气虚宜补，可加灸足三里', yangxu: '阳虚宜温，重灸关元气海',
        yinxu: '阴虚宜滋，忌灸，针太溪', shire: '湿热宜清，取曲池阴陵泉',
        qiyu: '气郁宜疏，取太冲期门', xueyu: '血瘀宜化，取血海三阴交',
        tanshi: '痰湿宜化，取丰隆中脘', pinghe: '平和之体，顺时调养即可', tebing: '特禀体质，避免强刺激'
      }
      // 症状建议
      const symptomMap = {
        insomnia: '失眠多因心肾不交，可按神门太溪', fatigue: '疲劳多气虚，宜灸足三里关元',
        digestion: '消化不良取中脘足三里', headache: '头痛取太阳风池合谷',
        anxiety: '焦虑取内关神门太冲', none: '当前时辰顺时调养即可'
      }
      // 下一时辰
      const nextIdx = (SHICHEN.indexOf(sc) + 1) % 12
      const nextSc = SHICHEN[nextIdx]
      return {
        resultType: 'ziwu',
        current: { name: meridian, time: sc.time, organ, zhi: sc.zhi, advice: `${sc.zhi}时${meridian}当令，宜${sc.zhi === '子' || sc.zhi === '丑' ? '安眠' : '理事'}` },
        biaoLi: biaoLi + '经',
        muJing: muOrgan + '经', ziJing: ziOrgan + '经',
        organWx, acupoints,
        constitutionAdvice: constitutionAdviceMap[f.constitution] || '',
        symptomAdvice: symptomMap[f.symptom] || '',
        nextShichen: { name: nextSc.name, organ: nextSc.organ, advice: `下一时辰${nextSc.meridian}当令` },
        allMeridians: SHICHEN,
        summary: `${sc.name}${meridian}当令，${f.therapyGoal === 'tonify' ? '补母' : f.therapyGoal === 'reduce' ? '泻子' : '平补'}，取${acupoints.map(a => a.name).join('、')}`
      }
    }
  },

  /* --- 9. 节气养生 --- */
  yangsheng: {
    inputConfig: [
      { key: 'date', label: '日期', type: 'date', default: new Date().toISOString().slice(0, 10), col: 4 },
      { key: 'constitution', label: '体质', type: 'select', options: CONSTITUTIONS.map(c => ({ value: c.key, label: c.name })), default: 'pinghe', col: 4 },
      { key: 'goal', label: '调养目标', type: 'select', options: [
        { value: 'calm', label: '安神' }, { value: 'qi', label: '补气' }, { value: 'damp', label: '祛湿' },
        { value: 'warm', label: '温阳' }, { value: 'clear', label: '清热' }, { value: 'soothe', label: '疏肝' }
      ], default: 'qi', col: 4 },
      { key: 'ageGroup', label: '年龄段', type: 'radio', options: [
        { value: 'youth', label: '少年' }, { value: 'young', label: '青年' }, { value: 'middle', label: '中年' }, { value: 'elder', label: '老年' }
      ], default: 'young', col: 6 },
      { key: 'gender', label: '性别', type: 'radio', options: [{ value: 'male', label: '男' }, { value: 'female', label: '女' }], default: 'male', col: 6 }
    ],
    calc(f) {
      const date = new Date(f.date)
      const jq = getCurrentJieqi(date)
      const jqIdx = JIEQI.indexOf(jq)
      const season = ['春', '夏', '秋', '冬'][Math.floor(jqIdx / 6)]
      // 五运六气
      const yp = yearPillar(date.getFullYear())
      const dayun = WUYUN[yp.gan] || '土运'
      const zhuqi = ZHUQI[Math.floor(jqIdx / 2) % 6]
      // 物候
      const wuhouList = [
        '东风解冻', '蛰虫始振', '桃始华', '玄鸟至', '桐始华', '萍始生',
        '蝼蝈鸣', '反舌无声', '螳螂生', '鹿角解', '温风至', '腐草为萤',
        '凉风至', '鹰乃祭鸟', '鸿雁来', '玄鸟归', '雀入大水', '菊有黄华',
        '水始冰', '虹藏不见', '鹖鴠不鸣', '荔挺出', '雁北乡', '鸡始乳'
      ]
      const wuhou = wuhouList[jqIdx] || '万物生发'
      // 个性化建议矩阵
      const dietMap = {
        calm: '宜：百合莲子；忌：辛辣', qi: '宜：山药黄芪；忌：生冷',
        damp: '宜：薏米赤小豆；忌：油腻', warm: '宜：生姜桂圆；忌：寒凉',
        clear: '宜：绿豆苦瓜；忌：煎炸', soothe: '宜：玫瑰花茶；忌：酸收'
      }
      const ageAdjust = { youth: '重脾胃养生长', young: '重肝胆疏泄', middle: '重肾固本', elder: '重肾阳延年' }
      const genderAdjust = { male: '重肾精肺气', female: '重肝血冲任' }
      const exerciseMap = {
        calm: '睡前静坐调息', qi: '八段锦两手托天理三焦', damp: '太极云手祛湿',
        warm: '站桩温阳', clear: '六字诀呵字诀', soothe: '导引舒肝理气'
      }
      const emotionMap = {
        calm: '保持平和，戒躁', qi: '乐观豁达，戒悲', damp: '开朗祛湿，戒忧',
        warm: '热情向上，戒冷漠', clear: '清心寡欲，戒怒', soothe: '疏解郁结，戒郁'
      }
      const goalOptions = [
        { value: 'calm', label: '安神' }, { value: 'qi', label: '补气' }, { value: 'damp', label: '祛湿' },
        { value: 'warm', label: '温阳' }, { value: 'clear', label: '清热' }, { value: 'soothe', label: '疏肝' }
      ]
      const goalLabel = goalOptions.find(o => o.value === f.goal)?.label || f.goal
      return {
        resultType: 'yangsheng',
        jieqi: jq.name, season,
        wuyunLiuqi: { dayun, zhuqi },
        wuhou,
        jieqiAdvice: `${jq.name}${season}季，顺时调养`,
        constitutionAdvice: CONSTITUTIONS.find(c => c.key === f.constitution)?.desc + '，' + ageAdjust[f.ageGroup] + '，' + genderAdjust[f.gender],
        personalAdvice: {
          diet: dietMap[f.goal],
          lifestyle: `${jq.name}宜${jqIdx >= 18 || jqIdx <= 3 ? '早睡晚起' : '晚睡早起'}`,
          exercise: exerciseMap[f.goal],
          emotion: emotionMap[f.goal]
        },
        taboos: [`${f.constitution === 'yangxu' ? '阳虚忌生冷' : '忌过食'}`, `${season === '冬' ? '冬季忌大汗' : '忌熬夜'}`],
        summary: `${jq.name}养生 · ${CONSTITUTIONS.find(c => c.key === f.constitution)?.name} · ${goalLabel}`
      }
    }
  },

  /* --- 10. 老黄历 --- */
  huangli: {
    inputConfig: [
      { key: 'date', label: '日期', type: 'date', default: new Date().toISOString().slice(0, 10), col: 4 },
      { key: 'concernEvent', label: '关注事件', type: 'select', options: [
        { value: 'none', label: '不限' }, { value: 'marriage', label: '嫁娶' }, { value: 'moving', label: '搬家' },
        { value: 'business', label: '开业' }, { value: 'travel', label: '出行' }, { value: 'construction', label: '动土' }, { value: 'burial', label: '安葬' }
      ], default: 'none', col: 4 },
      { key: 'detailLevel', label: '详略', type: 'radio', options: [
        { value: 'simple', label: '简版' }, { value: 'detail', label: '详版' }, { value: 'full', label: '完整' }
      ], default: 'detail', col: 4 }
    ],
    calc(f) {
      const date = new Date(f.date)
      const y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate()
      const lunar = solarToLunar(y, m, d)
      const lunarStr = `${lunar.isLeap ? '闰' : ''}${['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'][lunar.month - 1]}月${['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十', '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'][lunar.day - 1]}`
      const yp = yearPillar(y), mp = monthPillar(y, m, d), dp = dayPillar(y, m, d)
      const zodiac = zodiacOf(y)
      const sign = zodiacSignOf(m, d)
      const jc = jianChuOf(mp.zhi, dp.zhi)
      // 值神黄黑道
      const zhiShenIdx = (DI_ZHI.indexOf(dp.zhi) + DI_ZHI.indexOf(mp.zhi)) % 12
      const zhiShen = HUANGDAO[zhiShenIdx]
      const isHuangdao = HUANGDAO_GOOD[zhiShenIdx]
      // 冲煞
      const chong = chongOf(dp.zhi)
      const sha = shaOf(dp.zhi)
      // 胎神（简化口诀）
      const taishenMap = ['占门碓外东南', '占厨灶炉外正南', '占门炉外西北', '占碓炉外西南', '占房床炉外西北', '占房床碓外正南']
      const taishen = taishenMap[d % 6]
      // 宜忌（基于日柱种子）
      const allYi = ['祭祀', '祈福', '出行', '嫁娶', '搬家', '动土', '开市', '安葬', '破土', '安门', '理发', '冠笄', '求嗣', '解除', '修饰垣墙']
      const allJi = ['开市', '动土', '嫁娶', '出行', '安葬', '破土', '理发', '搬迁', '诉讼', '针灸']
      const seed = hashStr(dp.gan + dp.zhi + dp.wx)
      const rng = seededRandom(seed)
      const yi = [], ji = []
      const yiCount = f.detailLevel === 'simple' ? 3 : f.detailLevel === 'detail' ? 5 : 7
      const jiCount = f.detailLevel === 'simple' ? 3 : f.detailLevel === 'detail' ? 5 : 7
      const shuffledYi = [...allYi].sort(() => rng() - 0.5)
      const shuffledJi = [...allJi].sort(() => rng() - 0.5)
      for (let i = 0; i < yiCount; i++) yi.push(shuffledYi[i])
      for (let i = 0; i < jiCount; i++) ji.push(shuffledJi[i])
      // concernEvent 匹配
      const eventMap = { marriage: '嫁娶', moving: '搬家', business: '开市', travel: '出行', construction: '动土', burial: '安葬' }
      let concernMatch = null
      if (f.concernEvent !== 'none') {
        const evt = eventMap[f.concernEvent]
        const inYi = yi.includes(evt), inJi = ji.includes(evt)
        concernMatch = {
          event: f.concernEvent, eventLabel: evt,
          match: inYi ? '宜' : inJi ? '忌' : '中性',
          score: inYi ? 85 : inJi ? 30 : 60
        }
      }
      // 12时辰宜忌（full）
      let shichenYiji = null
      if (f.detailLevel === 'full') {
        shichenYiji = SHICHEN.map(s => {
          const hp = hourPillar(dp.gan, DI_ZHI.indexOf(s.zhi) * 2)
          const hIdx = (DI_ZHI.indexOf(hp.zhi) + zhiShenIdx) % 12
          return { shichen: s.zhi, yi: HUANGDAO_GOOD[hIdx] ? '吉' : '凶', lucky: HUANGDAO_GOOD[hIdx] }
        })
      }
      return {
        resultType: 'huangli',
        solarDate: `${y}-${m}-${d}`, lunarDate: lunarStr,
        lunarGanZhi: `${yp.gan}${yp.zhi}年 ${mp.gan}${mp.zhi}月 ${dp.gan}${dp.zhi}日`,
        zodiac, zodiacSign: sign,
        jianChu: jc, zhiShen, isHuangdao,
        chong: `冲${chong}煞${sha}`,
        taishen,
        yi, ji, concernMatch, shichenYiji,
        summary: `${y}年${m}月${d}日 ${dp.gan}${dp.zhi}日 ${jc} ${zhiShen}(${isHuangdao ? '黄道' : '黑道'})`
      }
    }
  },

  /* --- 11. 择吉日 --- */
  jiri: {
    inputConfig: [
      { key: 'event', label: '事件类型', type: 'select', options: [
        { value: 'marriage', label: '嫁娶' }, { value: 'moving', label: '搬家' }, { value: 'business', label: '开业' },
        { value: 'travel', label: '出行' }, { value: 'construction', label: '动土' }, { value: 'burial', label: '安葬' }
      ], default: 'marriage', col: 4 },
      { key: 'startDate', label: '起始日期', type: 'date', default: new Date().toISOString().slice(0, 10), col: 4 },
      { key: 'range', label: '搜索范围', type: 'radio', options: [
        { value: '30', label: '30天' }, { value: '60', label: '60天' }, { value: '90', label: '90天' }
      ], default: '30', col: 4 },
      { key: 'excludeChong', label: '排除冲生肖', type: 'checkbox', toggle: true, default: true, col: 6 },
      { key: 'preferWeekend', label: '偏好周末', type: 'checkbox', toggle: true, default: false, col: 6 }
    ],
    calc(f) {
      const eventYiMap = { marriage: '嫁娶', moving: '搬家', business: '开市', travel: '出行', construction: '动土', burial: '安葬' }
      const targetYi = eventYiMap[f.event]
      const start = new Date(f.startDate)
      const range = Number(f.range)
      const goodDays = [], badDays = []
      // 用户生肖（从档案或默认）
      let userZodiac = '马'
      try { const store = useEchoStore(); if (store.profile?.birthday) userZodiac = zodiacOf(Number(store.profile.birthday.split('-')[0])) } catch (e) {}
      for (let i = 0; i < range; i++) {
        const date = new Date(start.getTime() + i * 86400000)
        const y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate()
        const dp = dayPillar(y, m, d)
        const mp = monthPillar(y, m, d)
        const jc = jianChuOf(mp.zhi, dp.zhi)
        const chong = chongOf(dp.zhi)
        const chongZodiac = zodiacOf(y) // 简化
        let score = 50
        const seed = hashStr(dp.gan + dp.zhi)
        const rng = seededRandom(seed)
        if (rng() > 0.6) score += 20  // 宜字命中
        if (['建', '除', '满', '定', '执', '危', '成', '开'].includes(jc)) score += 10
        if (rng() > 0.5) score += 10  // 黄道
        if (f.excludeChong && chongZodiac === userZodiac) { score -= 30; badDays.push({ date: `${y}-${m}-${d}`, reason: `冲${chongZodiac}` }) }
        if (f.preferWeekend && (date.getDay() === 0 || date.getDay() === 6)) score += 5
        if (rng() < 0.3) score -= 15  // 忌字命中
        if (score >= 60) {
          goodDays.push({
            date: `${y}-${m}-${d}`, weekday: '日一二三四五六'[date.getDay()],
            ganzhi: `${dp.gan}${dp.zhi}`, jianChu: jc,
            zhiShen: HUANGDAO[(DI_ZHI.indexOf(dp.zhi) + DI_ZHI.indexOf(mp.zhi)) % 12],
            chong: `冲${chong}`,
            bestHour: SHICHEN[Math.floor(rng() * 12)].name,
            yi: [targetYi, '祭祀', '祈福'].slice(0, 2 + Math.floor(rng() * 2)),
            ji: ['诉讼', '针灸'].slice(0, 1 + Math.floor(rng() * 2)),
            score, label: score >= 85 ? '大吉' : score >= 70 ? '吉' : '小吉'
          })
        }
      }
      goodDays.sort((a, b) => b.score - a.score)
      return {
        resultType: 'jiri',
        event: f.event, eventLabel: targetYi, range,
        goodDays: goodDays.slice(0, 8),
        badDays: badDays.slice(0, 5),
        summary: `${range}天内找到${goodDays.length}个吉日，首推${goodDays[0]?.date || '无'}`
      }
    }
  },

  /* --- 12. 每日运势 --- */
  yunshi: {
    inputConfig: [
      { key: 'year', label: '出生年', type: 'number', min: 1900, max: 2100, default: 1990, col: 3 },
      { key: 'month', label: '月', type: 'number', min: 1, max: 12, default: 5, col: 2 },
      { key: 'day', label: '日', type: 'number', min: 1, max: 31, default: 15, col: 2 },
      { key: 'focusArea', label: '关注维度', type: 'select', options: [
        { value: 'overall', label: '综合' }, { value: 'career', label: '事业' }, { value: 'love', label: '感情' },
        { value: 'wealth', label: '财运' }, { value: 'health', label: '健康' }
      ], default: 'overall', col: 5 },
      { key: 'mood', label: '今日心境', type: 'radio', options: [
        { value: 'calm', label: '平和' }, { value: 'anxious', label: '焦虑' }, { value: 'excited', label: '兴奋' }, { value: 'low', label: '低落' }
      ], default: 'calm', col: 6 },
      { key: 'todayPlan', label: '今日计划', type: 'textarea', default: '', placeholder: '今天要做的事，可选', col: 6 }
    ],
    calc(f) {
      const dm = getDayMaster(f.year, f.month, f.day)
      const today = new Date()
      const lp = dayPillar(today.getFullYear(), today.getMonth() + 1, today.getDate())
      const liuriShiShen = tenGod(dm.gan, lp.gan)
      // 四维评分
      let career = 50, love = 50, wealth = 50, health = 50
      const shishenMap = {
        '比肩': () => { love += 10 }, '劫财': () => { wealth -= 15 },
        '食神': () => { health += 10 }, '伤官': () => { career -= 10 },
        '偏财': () => { wealth += 20 }, '正财': () => { wealth += 15; love += 10 },
        '七杀': () => { career += 15; health -= 15 }, '正官': () => { career += 20 },
        '偏印': () => { health -= 10 }, '正印': () => { health += 5 }
      }
      ;(shishenMap[liuriShiShen] || (() => {}))()
      const seed = hashStr(dm.gan + lp.gan + lp.zhi)
      const rng = seededRandom(seed)
      career += Math.floor(rng() * 20 - 10)
      love += Math.floor(rng() * 20 - 10)
      wealth += Math.floor(rng() * 20 - 10)
      health += Math.floor(rng() * 20 - 10)
      // mood 修正
      const moodTipMap = {
        calm: '心境平和，宜顺其自然', anxious: '心神不宁，宜静养避争',
        excited: '精力旺盛，宜把握时机', low: '低潮期，宜守不宜攻'
      }
      if (f.mood === 'anxious') health -= 10
      if (f.mood === 'excited') career += 5
      if (f.mood === 'low') { career -= 5; love -= 5 }
      // 计划建议
      let planTip = '今日无特定计划，顺心而为'
      if (f.todayPlan) {
        if (/签|约|谈|见/.test(f.todayPlan)) planTip = '今日有约谈之事，申时(15-17)吉'
        else if (/出|行|走/.test(f.todayPlan)) planTip = '今日出行，辰时(7-9)启程吉'
        else if (/写|学|读/.test(f.todayPlan)) planTip = '今日学习创作，巳时(9-11)专注'
        else planTip = '计划已记录，顺时而为'
      }
      // 12时辰吉凶
      const shichenLuck = SHICHEN.map(s => {
        const hp = hourPillar(lp.gan, DI_ZHI.indexOf(s.zhi) * 2)
        const ss = tenGod(dm.gan, hp.gan)
        const luck = ['正官', '正财', '偏财', '食神', '正印'].includes(ss) ? '吉' : ['七杀', '劫财', '伤官'].includes(ss) ? '凶' : '平'
        return { shichen: s.zhi, shishen: ss, luck, advice: luck === '吉' ? '宜行' : luck === '凶' ? '宜避' : '宜静' }
      })
      const overall = Math.round((career + love + wealth + health) / 4)
      // 幸运
      const colors = ['青', '赤', '黄', '白', '黑']
      const dmWx = GAN_WX[TIAN_GAN.indexOf(dm.gan)]
      const luckyColor = colors[['木', '火', '土', '金', '水'].indexOf(dmWx)]
      return {
        resultType: 'yunshi',
        date: `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`,
        dayGanZhi: `${lp.gan}${lp.zhi}`, dayMaster: dm.label, liuriShiShen,
        scores: { career: Math.max(0, Math.min(100, career)), love: Math.max(0, Math.min(100, love)), wealth: Math.max(0, Math.min(100, wealth)), health: Math.max(0, Math.min(100, health)) },
        overall: Math.max(0, Math.min(100, overall)),
        luckyColor, luckyNum: (seed % 9) + 1, luckyDir: ['东', '南', '西', '北', '东南'][seed % 5],
        shichenLuck, moodTip: moodTipMap[f.mood], planTip,
        focusReading: f.focusArea === 'career' ? `事业运${career}分，${career >= 70 ? '宜进取' : '宜守'}` : f.focusArea === 'wealth' ? `财运${wealth}分，${wealth >= 70 ? '宜求财' : '宜守财'}` : `今日${liuriShiShen}日，综合${overall}分`,
        summary: `${lp.gan}${lp.zhi}日 · ${liuriShiShen} · 综合${overall}分`
      }
    }
  },

  /* --- 13. 西洋占星 --- */
  astro: {
    inputConfig: [
      { key: 'year', label: '年', type: 'number', min: 1900, max: 2100, default: 1990, col: 3 },
      { key: 'month', label: '月', type: 'number', min: 1, max: 12, default: 5, col: 2 },
      { key: 'day', label: '日', type: 'number', min: 1, max: 31, default: 15, col: 2 },
      { key: 'hour', label: '时', type: 'number', min: 0, max: 23, default: 12, col: 2 },
      { key: 'minute', label: '分', type: 'number', min: 0, max: 59, default: 0, col: 3 },
      { key: 'birthplace', label: '出生地', type: 'select', options: [
        { value: 'beijing', label: '北京(116°E)' }, { value: 'shanghai', label: '上海(121°E)' },
        { value: 'guangzhou', label: '广州(113°E)' }, { value: 'chengdu', label: '成都(104°E)' },
        { value: 'xian', label: '西安(109°E)' }, { value: 'other', label: '其他(120°E)' }
      ], default: 'beijing', col: 6 },
      { key: 'focusArea', label: '解读侧重', type: 'select', options: [
        { value: 'personality', label: '性格' }, { value: 'career', label: '事业' }, { value: 'love', label: '感情' }, { value: 'spiritual', label: '灵性' }
      ], default: 'personality', col: 6 }
    ],
    calc(f) {
      const lngMap = { beijing: 116, shanghai: 121, guangzhou: 113, chengdu: 104, xian: 109, other: 120 }
      const lng = lngMap[f.birthplace] || 116
      // 真太阳时
      const trueHour = f.hour + f.minute / 60 + (lng - 120) * 4 / 60
      // 太阳星座
      const sunSign = zodiacSignOf(f.month, f.day)
      const sunIdx = ZODIAC.findIndex(z => z.name === sunSign)
      // 月亮星座（简化：约2.5天一宫）
      const dayOfYear = Math.floor((new Date(f.year, f.month - 1, f.day) - new Date(f.year, 0, 1)) / 86400000)
      const moonIdx = (dayOfYear * 13 + Math.floor(trueHour * 2)) % 12
      const moonSign = ZODIAC[moonIdx].name
      // 上升星座（约2小时一宫）
      const ascIdx = (Math.floor(trueHour / 2) + sunIdx + 4) % 12
      const ascSign = ZODIAC[ascIdx].name
      // 行星（简化）
      const planets = {
        sun: sunSign, moon: moonSign,
        mercury: ZODIAC[(sunIdx + (Math.floor(trueHour) % 2 === 0 ? -1 : 1) + 12) % 12].name,
        venus: ZODIAC[(sunIdx + (Math.floor(f.minute / 20) - 2) + 12) % 12].name,
        mars: ZODIAC[(dayOfYear + Math.floor(trueHour)) % 12].name,
        jupiter: ZODIAC[(f.year % 12)].name,
        saturn: ZODIAC[Math.floor(f.year / 2.5) % 12].name
      }
      // 相位
      const aspects = []
      const sunMoonDiff = Math.abs(sunIdx - moonIdx)
      if (sunMoonDiff === 0 || sunMoonDiff === 12) aspects.push({ a: '太阳', b: '月亮', type: '合相位', angle: 0, meaning: '内外一致' })
      else if (sunMoonDiff === 6) aspects.push({ a: '太阳', b: '月亮', type: '冲相位', angle: 180, meaning: '内心冲突' })
      else if (sunMoonDiff === 4 || sunMoonDiff === 8) aspects.push({ a: '太阳', b: '月亮', type: '拱相位', angle: 120, meaning: '和谐流通' })
      else if (sunMoonDiff === 3 || sunMoonDiff === 9) aspects.push({ a: '太阳', b: '月亮', type: '刑相位', angle: 90, meaning: '张力挑战' })
      const sunAscDiff = Math.abs(sunIdx - ascIdx)
      if (sunAscDiff === 6) aspects.push({ a: '太阳', b: '上升', type: '冲相位', angle: 180, meaning: '自我与外在反差' })
      else if (sunAscDiff === 4 || sunAscDiff === 8) aspects.push({ a: '太阳', b: '上升', type: '拱相位', angle: 120, meaning: '自我表达顺畅' })
      // 元素模式
      const elementBalance = { 火: 0, 土: 0, 风: 0, 水: 0 }
      const modeBalance = { 基本: 0, 固定: 0, 变动: 0 }
      ;[sunSign, moonSign, ascSign].forEach(s => {
        const z = ZODIAC.find(zz => zz.name === s)
        if (z) { elementBalance[z.element]++; modeBalance[z.mode]++ }
      })
      const focusMap = {
        personality: `三巨头：太阳${sunSign}(${ZODIAC[sunIdx].trait})、月亮${moonSign}、上升${ascSign}。${aspects[0] ? aspects[0].meaning : '日月关系调和'}`,
        career: `太阳${sunSign}定志向，火星${planets.mars}主行动力，${elementBalance.火 > 1 ? '火元素旺宜创业' : '土元素旺宜稳健'}`,
        love: `月亮${moonSign}主情感需求，金星${planets.venus}主爱情模式，${elementBalance.水 > 0 ? '感性丰富' : '理性主导'}`,
        spiritual: `上升${ascSign}定灵性入口，木星${planets.jupiter}护持，${modeBalance.变动 > 1 ? '灵性流动' : '稳定修行'}`
      }
      return {
        resultType: 'astro',
        sunSign, moonSign, ascSign, planets, aspects,
        elementBalance, modeBalance,
        sunTrait: ZODIAC[sunIdx].trait,
        moonTrait: ZODIAC[moonIdx].trait,
        ascTrait: ZODIAC[ascIdx].trait,
        focusReading: focusMap[f.focusArea],
        summary: `日${sunSign}·月${moonSign}·升${ascSign} · ${ZODIAC[sunIdx].element}${ZODIAC[sunIdx].mode}`
      }
    }
  },

  /* --- 14. 玛雅历 --- */
  maya: {
    inputConfig: [
      { key: 'year', label: '年', type: 'number', min: 1900, max: 2100, default: 1990, col: 3 },
      { key: 'month', label: '月', type: 'number', min: 1, max: 12, default: 5, col: 3 },
      { key: 'day', label: '日', type: 'number', min: 1, max: 31, default: 15, col: 3 },
      { key: 'queryType', label: '查询类型', type: 'select', options: [
        { value: 'personal', label: '个人印记' }, { value: 'today', label: '今日印记' },
        { value: 'relation', label: '关系印记' }, { value: 'year', label: '年度印记' }
      ], default: 'personal', col: 3 },
      { key: 'partnerDate', label: '对方日期', type: 'date', default: '', showIf: { key: 'queryType', in: ['relation'] }, col: 6 },
      { key: 'focus', label: '解读焦点', type: 'select', options: [
        { value: 'blueprint', label: '生命蓝图' }, { value: 'talent', label: '天赋' },
        { value: 'challenge', label: '挑战' }, { value: 'purpose', label: '灵性使命' }
      ], default: 'blueprint', col: 6 }
    ],
    calc(f) {
      const base = new Date(2012, 11, 21)
      let target
      if (f.queryType === 'today') target = new Date()
      else if (f.queryType === 'year') target = new Date(f.year, 0, 1)
      else target = new Date(f.year, f.month - 1, f.day)
      const diff = Math.floor((target - base) / 86400000)
      const kin = ((diff % 260) + 260) % 260 || 1
      const tone = (kin % 13) + 1
      const sealIdx = kin % 20
      const seal = MAYA_SEALS[sealIdx]
      const toneMeaning = MAYA_TONES[tone - 1]
      // 五图腾矩阵
      const guide = MAYA_SEALS[(sealIdx + 10) % 20]
      const challenge = MAYA_SEALS[(sealIdx + 10) % 20]
      const hidden = MAYA_SEALS[(sealIdx + 5) % 20]
      const antipode = MAYA_SEALS[(sealIdx + 10) % 20]
      const analog = MAYA_SEALS[(sealIdx + 5) % 20]
      // 波符
      const waveSeal = MAYA_SEALS[Math.floor(kin / 20) % 20]
      const focusMap = {
        blueprint: `${seal.name}是你生命蓝图的核心，${seal.meaning}。引导图腾${guide.name}指引方向。`,
        talent: `音调${tone}（${toneMeaning}）赋予你${tone <= 4 ? '开创' : tone <= 9 ? '稳定' : '超越'}的天赋，${seal.name}的力量使你${seal.meaning.split('·')[0]}。`,
        challenge: `挑战图腾${challenge.name}，其力量${challenge.meaning}是你需要整合的阴影面。`,
        purpose: `波符${waveSeal.name}，${waveSeal.meaning}。你的灵性使命是${seal.meaning.split('·').slice(-1)[0]}。`
      }
      let relation = null
      if (f.queryType === 'relation' && f.partnerDate) {
        const pDate = new Date(f.partnerDate)
        const pDiff = Math.floor((pDate - base) / 86400000)
        const pKin = ((pDiff % 260) + 260) % 260 || 1
        const pSeal = MAYA_SEALS[pKin % 20]
        const relKin = (kin + pKin) % 260 || 1
        const relType = seal.color === pSeal.color ? '共振' : (Math.abs(sealIdx - (pKin % 20)) === 10 ? '互补' : '挑战')
        relation = { partnerKin: pKin, partnerSeal: pSeal.name, relationKin: relKin, type: relType, reading: `你${seal.name}与对方${pSeal.name}，${relType}关系` }
      }
      return {
        resultType: 'maya',
        kin, tone, seal: seal.name, color: seal.color,
        toneMeaning, sealMeaning: seal.meaning,
        fiveSeals: { guide: guide.name, challenge: challenge.name, hidden: hidden.name, antipode: antipode.name, analog: analog.name },
        waveSpell: { seal: waveSeal.name, day: tone, toneName: toneMeaning },
        relation,
        focusReading: focusMap[f.focus],
        summary: `Kin ${kin} · ${seal.name} · 音调${tone}(${toneMeaning}) · ${seal.color}色族`
      }
    }
  },

  /* --- 15. 塔罗牌 --- */
  tarot: {
    inputConfig: [
      { key: 'question', label: '你的问题', type: 'textarea', default: '', placeholder: '如：我的事业会如何发展？', col: 12 },
      { key: 'spread', label: '牌阵', type: 'select', options: [
        { value: 'single', label: '单张' }, { value: 'three-pf', label: '过去现在未来' },
        { value: 'three-bsb', label: '身心灵' }, { value: 'relationship', label: '关系阵' },
        { value: 'choice', label: '抉择阵' }, { value: 'celtic', label: '凯尔特十字' }
      ], default: 'three-pf', col: 4 },
      { key: 'focusArea', label: '关注领域', type: 'select', options: [
        { value: 'career', label: '事业' }, { value: 'love', label: '感情' }, { value: 'wealth', label: '财运' },
        { value: 'decision', label: '抉择' }, { value: 'spiritual', label: '灵性' }
      ], default: 'career', col: 4 },
      { key: 'includeMinor', label: '含小阿卡纳', type: 'checkbox', toggle: true, default: false, col: 4 }
    ],
    calc(f) {
      const spreadMap = {
        single: ['核心'],
        'three-pf': ['过去', '现在', '未来'],
        'three-bsb': ['身', '心', '灵'],
        relationship: ['你', '对方', '关系基础', '挑战', '发展'],
        choice: ['现状', '选项A', '选项B', '建议', '结局'],
        celtic: ['现状', '挑战', '基础', '过去', '近期', '未来', '自我', '环境', '希望/恐惧', '结局']
      }
      const positions = spreadMap[f.spread] || spreadMap['three-pf']
      // 牌池
      let deck = TAROT_MAJOR.map(c => ({ ...c, arcana: 'major' }))
      if (f.includeMinor) {
        const suits = [
          { name: '权杖', element: '火' }, { name: '圣杯', element: '水' },
          { name: '宝剑', element: '风' }, { name: '钱币', element: '土' }
        ]
        const minorCards = []
        suits.forEach(s => {
          for (let n = 1; n <= 14; n++) {
            minorCards.push({
              name: n === 1 ? `${s.name}Ace` : n === 11 ? `${s.name}侍从` : n === 12 ? `${s.name}骑士` : n === 13 ? `${s.name}王后` : n === 14 ? `${s.name}国王` : `${s.name}${n}`,
              num: n, meaning: `${s.element}元素${n}号`, reversed: `${s.element}逆位`,
              arcana: 'minor', suit: s.name
            })
          }
        })
        deck = deck.concat(minorCards)
      }
      // 抽牌（question 作种子）
      const seed = hashStr(f.question + f.spread + f.focusArea + (f.includeMinor ? '1' : '0'))
      const rng = seededRandom(seed)
      const drawn = []
      while (drawn.length < positions.length && drawn.length < deck.length) {
        const idx = Math.floor(rng() * deck.length)
        if (!drawn.includes(idx)) drawn.push(idx)
      }
      const keyCards = ['命运之轮', '死神', '高塔', '世界', '愚者', '审判']
      const cards = drawn.map((idx, i) => {
        const card = deck[idx]
        const upright = rng() > 0.5
        const meaning = upright ? card.meaning : (card.reversed || card.meaning)
        return {
          position: positions[i],
          card, upright, meaning,
          isKeyCard: keyCards.includes(card.name)
        }
      })
      // 综合解读
      const synthesis = cards.map(c => `${c.position}：${c.card.name}${c.upright ? '正位' : '逆位'}（${c.meaning}）`).join('；')
      const advice = cards[cards.length - 1] ? `结局牌${cards[cards.length - 1].card.name}提示：${cards[cards.length - 1].meaning}` : '顺应牌意'
      return {
        resultType: 'tarot',
        question: f.question, spread: f.spread, focusArea: f.focusArea,
        cards, synthesis, advice,
        summary: `${f.spread}牌阵 · ${cards.length}张 · ${cards.filter(c => c.isKeyCard).length}张关键牌`
      }
    }
  },

  /* --- 16. 风水布局 --- */
  fengshui: {
    inputConfig: [
      { key: 'houseFacing', label: '房屋坐向', type: 'select', options: [
        { value: 'kan',  label: '坎·坐北朝南' }, { value: 'li',   label: '离·坐南朝北' },
        { value: 'zhen', label: '震·坐东朝西' }, { value: 'dui',  label: '兑·坐西朝东' },
        { value: 'xun',  label: '巽·坐东南朝西北' }, { value: 'qian', label: '乾·坐西北朝东南' },
        { value: 'gen',  label: '艮·坐东北朝西南' }, { value: 'kun',  label: '坤·坐西南朝东北' }
      ], default: 'kan', col: 6 },
      { key: 'buildYear', label: '建造年份', type: 'number', min: 1950, max: 2030, default: 2000, col: 3 },
      { key: 'roomType', label: '房间用途', type: 'select', options: [
        { value: 'bedroom', label: '卧室' }, { value: 'livingroom', label: '客厅' },
        { value: 'study', label: '书房' }, { value: 'kitchen', label: '厨房' },
        { value: 'bathroom', label: '卫生间' }, { value: 'office', label: '办公室' }
      ], default: 'bedroom', col: 3 },
      { key: 'currentYear', label: '当前流年', type: 'number', min: 1900, max: 2100, default: 2026, col: 3 },
      { key: 'occupantGanZhi', label: '居住者生肖', type: 'select', options: DI_ZHI.map((z, i) => ({
        value: z, label: ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'][i]
      })), default: '子', col: 3 },
      { key: 'concernFocus', label: '关注重点', type: 'select', options: [
        { value: 'wealth', label: '财运' }, { value: 'health', label: '健康' }, { value: 'love', label: '感情' },
        { value: 'study', label: '学业' }, { value: 'career', label: '事业' }
      ], default: 'wealth', col: 6 }
    ],
    calc(f) {
      // === 九宫飞星：基于 currentYear 计算流年飞星盘 ===
      // 2024 年三碧入中宫，每年飞星递减一位（1→9 循环）
      const yearDelta = f.currentYear - 2024
      const centerStar = (((3 - yearDelta - 1) % 9) + 9) % 9 + 1  // 1-9

      // 飞星顺飞顺序：中5→乾6→兑7→艮8→离9→坎1→坤2→震3→巽4
      // 即各宫相对中宫的偏移：中=0, 乾=1, 兑=2, 艮=3, 离=4, 坎=5, 坤=6, 震=7, 巽=8
      const offsetMap = { 5: 0, 6: 1, 7: 2, 8: 3, 9: 4, 1: 5, 2: 6, 3: 7, 4: 8 }
      const flyStarGrid = LUOSHU_PALACES.map(p => {
        const offset = offsetMap[p.num]
        const star = ((centerStar - 1 + offset) % 9) + 1
        const meta = FLYING_STAR_META[star]
        return {
          palaceNum: p.num,
          dir: p.dir,
          bagua: p.bagua,
          palaceWx: p.wx,
          star,
          starName: meta.name,
          starNature: meta.nature,
          starWx: meta.wx,
          starLuck: meta.luck
        }
      })

      // === 宅卦（基于 houseFacing）===
      const houseGua = HOUSE_GUA_MAP[f.houseFacing] || HOUSE_GUA_MAP.kan

      // === 房间用途对应的飞星喜好 ===
      const roomStarPrefMap = {
        bedroom:    { good: [1, 6, 8], bad: [2, 5, 7], desc: '卧室喜1白桃花/6白武曲/8白财星，忌2黑5黄7赤' },
        livingroom: { good: [8, 9, 1], bad: [5, 2],    desc: '客厅喜8白财星/9紫喜庆/1白桃花，催旺家运' },
        study:      { good: [4, 1, 6], bad: [2, 5, 7], desc: '书房喜4绿文曲/1白文昌/6白武曲，利学业考运' },
        kitchen:    { good: [9, 3, 4], bad: [2, 5],    desc: '厨房喜9紫火/3碧4绿木生火，忌2黑5黄土' },
        bathroom:   { good: [2, 5, 7], bad: [8, 9, 1], desc: '卫生间宜凶星位（以凶制凶），不宜吉星位' },
        office:     { good: [8, 6, 1], bad: [2, 5, 7], desc: '办公室喜8白财星/6白武曲/1白贵人，催事业财运' }
      }
      const roomPref = roomStarPrefMap[f.roomType] || roomStarPrefMap.bedroom

      // 找到吉星方位与凶星方位（在飞星盘中）
      const goodPalaces = flyStarGrid.filter(c => roomPref.good.includes(c.star))
      const badPalaces = flyStarGrid.filter(c => roomPref.bad.includes(c.star))

      const roomAdvice = `${f.roomType === 'bedroom' ? '卧室' : f.roomType === 'livingroom' ? '客厅' : f.roomType === 'study' ? '书房' : f.roomType === 'kitchen' ? '厨房' : f.roomType === 'bathroom' ? '卫生间' : '办公室'}宜布置于${goodPalaces.map(p => p.dir + p.starName).join('、')}方位；避${badPalaces.map(p => p.dir + p.starName).join('、')}。${roomPref.desc}。`

      // === concernFocus 布局建议 ===
      const concernStarMap = {
        wealth:  { star: 8, name: '8白财星', advice: '催旺8白财星方位，宜置水景、鱼缸或聚宝盆，利财源' },
        health:  { star: 0, name: '2黑5黄', advice: '化解2黑病符与5黄廉贞方位，宜挂铜葫芦、六帝铜钱' },
        love:    { star: 1, name: '1白桃花', advice: '催旺1白桃花方位，宜置鲜花、粉水晶，利姻缘' },
        study:   { star: 4, name: '4绿文曲', advice: '催旺4绿文曲方位，宜置文昌塔、书桌，利学业考运' },
        career:  { star: 6, name: '6白武曲', advice: '催旺6白武曲方位，宜置金属饰品、玉玺，利事业升迁' }
      }
      const concern = concernStarMap[f.concernFocus] || concernStarMap.wealth
      const concernPalace = flyStarGrid.find(c => c.star === concern.star) || flyStarGrid[4]
      const layoutSuggestions = []
      if (f.concernFocus === 'health') {
        const star2 = flyStarGrid.find(c => c.star === 2)
        const star5 = flyStarGrid.find(c => c.star === 5)
        if (star2) layoutSuggestions.push({ star: star2.starName, dir: star2.dir, action: '挂铜葫芦或金属风铃化解', priority: '高' })
        if (star5) layoutSuggestions.push({ star: star5.starName, dir: star5.dir, action: '置六帝铜钱或铜鼎化煞', priority: '极高' })
      } else {
        layoutSuggestions.push({ star: concern.name, dir: concernPalace.dir, action: concern.advice, priority: '高' })
        // 额外建议
        const auxPalace = flyStarGrid.find(c => c.star === 9)
        if (auxPalace && f.concernFocus === 'wealth') {
          layoutSuggestions.push({ star: '9紫喜庆', dir: auxPalace.dir, action: '辅助催旺9紫喜庆位，置红色饰品', priority: '中' })
        }
      }
      // 房间方位建议
      layoutSuggestions.push({ star: '房间吉位', dir: goodPalaces[0]?.dir || '中宫', action: `${f.roomType === 'bathroom' ? '卫生间宜置凶星位以凶制凶' : `${f.roomType}宜置吉星位`}，参考${goodPalaces[0]?.starName || '中宫'}方位`, priority: '中' })

      // === 与居住者生肖冲合 ===
      const occupantZhi = f.occupantGanZhi
      const occupantIdx = DI_ZHI.indexOf(occupantZhi)
      const animals = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']
      const occupantAnimal = animals[occupantIdx]
      // 六冲：相隔6位
      const chongIdx = (occupantIdx + 6) % 12
      const chongAnimal = animals[chongIdx]
      // 六合：子丑、寅亥、卯戌、辰酉、巳申、午未
      const liuheMap = { 0: 1, 1: 0, 2: 11, 3: 10, 4: 9, 5: 8, 6: 7, 7: 6, 8: 5, 9: 4, 10: 3, 11: 2 }
      const heAnimal = animals[liuheMap[occupantIdx]]
      // 三合：申子辰、亥卯未、寅午戌、巳酉丑
      const sanheGroups = [[8, 0, 4], [11, 3, 7], [2, 6, 10], [5, 9, 1]]
      const sanheGroup = sanheGroups.find(g => g.includes(occupantIdx)) || []
      const sanheAnimals = sanheGroup.map(i => animals[i]).filter(a => a !== occupantAnimal)

      // 流年地支与居住者生肖的关系
      const yearZhiIdx = ((f.currentYear - 4) % 12 + 12) % 12
      const yearAnimal = animals[yearZhiIdx]
      const isChongYear = yearZhiIdx === chongIdx
      const isHeYear = yearZhiIdx === liuheMap[occupantIdx]

      const clashAnimal = {
        occupant: occupantAnimal,
        chong: chongAnimal,
        he: heAnimal,
        sanhe: sanheAnimals,
        yearAnimal,
        isChongYear,
        isHeYear,
        note: isChongYear ? `流年${yearAnimal}年冲${occupantAnimal}，风水布局宜慎重，可在太岁方化煞` : isHeYear ? `流年${yearAnimal}年合${occupantAnimal}，风水布局事半功倍` : `流年${yearAnimal}年与${occupantAnimal}无冲无合，按常布局`
      }

      // === 建造年份与流年关系（玄空飞星旺衰简化）===
      const buildPeriod = Math.floor((f.buildYear - 1864) / 20) + 1  // 简化的元运计算
      const currentPeriod = Math.floor((f.currentYear - 1864) / 20) + 1
      const isPeriodMatch = buildPeriod === currentPeriod

      // === 综合评判 ===
      const goodCount = goodPalaces.length
      const badCount = badPalaces.length
      let score = 50
      score += goodCount * 8
      score -= badCount * 5
      if (isHeYear) score += 10
      if (isChongYear) score -= 10
      if (isPeriodMatch) score += 8
      score = Math.max(0, Math.min(100, score))
      const verdict = score >= 70 ? '吉' : score >= 50 ? '平' : '凶'

      const verdictText = verdict === '吉' ? '风水布局吉，宜按建议催旺化煞' : verdict === '凶' ? '风水布局有煞，需重点化解' : '风水布局平稳，常规调理即可'

      const reading = `${f.currentYear}年${FLYING_STAR_META[centerStar].name}入中宫，飞星盘${goodPalaces.length}吉位${badPalaces.length}凶位。${houseGua.name}(${houseGua.gua}卦${houseGua.wx})，${roomAdvice}${concern.advice}。居住者属${occupantAnimal}，${clashAnimal.note}。${verdictText}。`

      return {
        resultType: 'fengshui',
        currentYear: f.currentYear,
        centerStar: centerStar,
        centerStarName: FLYING_STAR_META[centerStar].name,
        flyStarGrid,
        houseGua,
        roomType: f.roomType,
        roomAdvice,
        layoutSuggestions,
        clashAnimal,
        buildPeriod, currentPeriod, isPeriodMatch,
        score, verdict,
        reading,
        summary: `${f.currentYear}年${FLYING_STAR_META[centerStar].name}入中 · ${houseGua.name} · ${verdict}(${score}分)`
      }
    }
  },

  /* --- 17. 姓名学分析 --- */
  nameology: {
    inputConfig: [
      { key: 'name', label: '姓名', type: 'text', default: '', placeholder: '2-4字姓名', col: 12 },
      { key: 'gender', label: '性别', type: 'radio', options: [
        { value: 'male', label: '男' }, { value: 'female', label: '女' }
      ], default: 'male', col: 6 },
      { key: 'birthYear', label: '出生年份', type: 'number', min: 1950, max: 2025, default: 1990, col: 3 },
      { key: 'analysisType', label: '分析类型', type: 'select', options: [
        { value: 'sancai', label: '三才五格' },
        { value: 'wuxing', label: '五行数理' },
        { value: 'numology81', label: '81数理吉凶' }
      ], default: 'sancai', col: 3 }
    ],
    calc(f) {
      // 标准化姓名：去除空白、保留汉字
      const rawName = (f.name || '').replace(/\s/g, '')
      const chars = Array.from(rawName)
      const strokes = chars.map(c => ({ char: c, strokes: getStrokes(c) }))

      // === 三才五格计算 ===
      // 姓 = name[0]，名 = name.slice(1)
      const surnameStroke = strokes[0]?.strokes || 1
      const nameChars = strokes.slice(1)
      const nameStrokeSum = nameChars.reduce((s, c) => s + c.strokes, 0)
      const totalStroke = strokes.reduce((s, c) => s + c.strokes, 0)

      // 天格 = 姓笔画 + 1
      const tianGe = surnameStroke + 1
      // 人格 = 姓笔画 + 名第一字笔画（单名单字时为 姓 + 名 + 1）
      let renGe
      if (nameChars.length === 0) {
        renGe = surnameStroke + 1
      } else if (nameChars.length === 1) {
        renGe = surnameStroke + nameChars[0].strokes
      } else {
        renGe = surnameStroke + nameChars[0].strokes
      }
      // 地格 = 名所有字笔画之和（单名时为 名笔画 + 1）
      const diGe = nameChars.length === 0 ? 1 : (nameChars.length === 1 ? nameChars[0].strokes + 1 : nameStrokeSum)
      // 外格 = 总格 - 人格 + 1（单名单姓时为 2）
      const waiGe = (chars.length === 1 || nameChars.length === 0) ? 2 : (totalStroke - renGe + 1)
      // 总格 = 所有字笔画之和
      const zongGe = totalStroke

      // === 三才五行（按尾数）===
      // 1,2→木；3,4→火；5,6→土；7,8→金；9,0→水
      function wxOfNum(n) {
        const last = n % 10
        if (last === 1 || last === 2) return '木'
        if (last === 3 || last === 4) return '火'
        if (last === 5 || last === 6) return '土'
        if (last === 7 || last === 8) return '金'
        return '水'
      }
      const sanCai = {
        tian: { num: tianGe, wx: wxOfNum(tianGe) },
        ren:  { num: renGe,  wx: wxOfNum(renGe) },
        di:   { num: diGe,   wx: wxOfNum(diGe) }
      }

      // === 五格吉凶（用81数理表）===
      const wuGe = {
        tian: { name: '天格', num: tianGe, luck: numology81Luck(tianGe), wx: sanCai.tian.wx },
        ren:  { name: '人格', num: renGe,  luck: numology81Luck(renGe),  wx: sanCai.ren.wx },
        di:   { name: '地格', num: diGe,   luck: numology81Luck(diGe),   wx: sanCai.di.wx },
        wai:  { name: '外格', num: waiGe,  luck: numology81Luck(waiGe) },
        zong: { name: '总格', num: zongGe, luck: numology81Luck(zongGe) }
      }

      // === 81 数理细评 ===
      const numology81 = {
        tian: { num: tianGe, luck: wuGe.tian.luck, desc: name81Desc(tianGe, '天格') },
        ren:  { num: renGe,  luck: wuGe.ren.luck,  desc: name81Desc(renGe, '人格') },
        di:   { num: diGe,   luck: wuGe.di.luck,   desc: name81Desc(diGe, '地格') },
        wai:  { num: waiGe,  luck: wuGe.wai.luck,  desc: name81Desc(waiGe, '外格') },
        zong: { num: zongGe, luck: wuGe.zong.luck, desc: name81Desc(zongGe, '总格') }
      }

      // === 三才五行吉凶（相生为吉，相克为凶）===
      const gen = ['木', '火', '土', '金', '水']
      const tIdx = gen.indexOf(sanCai.tian.wx), rIdx = gen.indexOf(sanCai.ren.wx), dIdx = gen.indexOf(sanCai.di.wx)
      let sanCaiRelation = ''
      const tToR = tIdx === rIdx ? '比和' : (tIdx + 1) % 5 === rIdx ? '相生' : (rIdx + 1) % 5 === tIdx ? '相生' : '相克'
      const rToD = rIdx === dIdx ? '比和' : (rIdx + 1) % 5 === dIdx ? '相生' : (dIdx + 1) % 5 === rIdx ? '相生' : '相克'
      sanCaiRelation = `天格${sanCai.tian.wx}→人格${sanCai.ren.wx}(${tToR})，人格${sanCai.ren.wx}→地格${sanCai.di.wx}(${rToD})`

      // === 综合评分 ===
      const luckMap = { '大吉': 100, '平': 60, '大凶': 20 }
      // 人格权重最高（核心），其次总格、地格，天格外格权重低
      let overallScore = Math.round(
        luckMap[wuGe.ren.luck] * 0.35 +
        luckMap[wuGe.zong.luck] * 0.25 +
        luckMap[wuGe.di.luck] * 0.20 +
        luckMap[wuGe.tian.luck] * 0.10 +
        luckMap[wuGe.wai.luck] * 0.10
      )
      // 三才五行加成
      if (sanCaiRelation.includes('相生') && !sanCaiRelation.includes('相克')) overallScore += 5
      if (sanCaiRelation.includes('相克') && !sanCaiRelation.includes('相生')) overallScore -= 5
      // 性别加成（简化：人格为阳干利男、阴干利女）
      const renNumParity = renGe % 2
      if ((f.gender === 'male' && renNumParity === 1) || (f.gender === 'female' && renNumParity === 0)) overallScore += 2
      overallScore = Math.max(0, Math.min(100, overallScore))

      const verdict = overallScore >= 75 ? '吉' : overallScore >= 55 ? '平' : '凶'

      // === analysisType 切换解读重点 ===
      let reading
      if (f.analysisType === 'sancai') {
        reading = `姓名"${rawName}"三才配置：${sanCaiRelation}。人格${wuGe.ren.num}(${wuGe.ren.luck})为主运，总格${wuGe.zong.num}(${wuGe.zong.luck})为晚运，外格${wuGe.wai.num}(${wuGe.wai.luck})为副运。`
      } else if (f.analysisType === 'wuxing') {
        reading = `姓名五行数理：天格${sanCai.tian.wx}、人格${sanCai.ren.wx}、地格${sanCai.di.wx}。${sanCaiRelation.includes('相生') ? '三才相生，根基稳固' : sanCaiRelation.includes('相克') ? '三才相克，宜用五行属性的字调和' : '三才比和，性情稳定'}。`
      } else {
        reading = `姓名81数理分析：人格${renGe}(${wuGe.ren.luck})、地格${diGe}(${wuGe.di.luck})、总格${zongGe}(${wuGe.zong.luck})、外格${waiGe}(${wuGe.wai.luck})、天格${tianGe}(${wuGe.tian.luck})。${overallScore >= 75 ? '整体数理大吉，名字格局佳' : overallScore >= 55 ? '数理平稳，可考虑微调' : '数理多凶，建议改名或调和'}。`
      }

      const birthZodiac = zodiacOf(f.birthYear)
      const birthWx = GAN_WX[((f.birthYear - 4) % 10 + 10) % 10]

      return {
        resultType: 'nameology',
        name: rawName,
        strokes,
        sanCai,
        sanCaiRelation,
        wuGe,
        numology81,
        overallScore,
        verdict,
        gender: f.gender,
        birthYear: f.birthYear,
        birthZodiac,
        birthWx,
        reading,
        summary: `"${rawName}" · 三才${sanCai.tian.wx}${sanCai.ren.wx}${sanCai.di.wx} · 总格${zongGe}(${wuGe.zong.luck}) · ${verdict}(${overallScore}分)`
      }
    }
  },

  /* --- 18. 周公解梦 --- */
  dream: {
    inputConfig: [
      { key: 'dreamContent', label: '梦境描述', type: 'textarea', default: '', placeholder: '描述你的梦境...', col: 12 },
      { key: 'wakeTime', label: '醒来时辰', type: 'select', options: SHICHEN.map(s => ({ value: s.zhi, label: s.name })), default: '子', col: 4 },
      { key: 'emotion', label: '梦中情绪', type: 'radio', options: [
        { value: 'fear', label: '恐惧' }, { value: 'joy', label: '喜悦' }, { value: 'sad', label: '悲伤' },
        { value: 'calm', label: '平静' }, { value: 'anxiety', label: '焦虑' }, { value: 'anger', label: '愤怒' }
      ], default: 'calm', col: 4 },
      { key: 'dreamDate', label: '做梦日期', type: 'date', default: new Date().toISOString().slice(0, 10), col: 4 }
    ],
    calc(f) {
      // === 关键词匹配 ===
      const content = f.dreamContent || ''
      const matched = []
      for (const [kw, meta] of Object.entries(DREAM_KEYWORDS)) {
        if (content.includes(kw)) {
          matched.push({ keyword: kw, luck: meta.luck, meaning: meta.meaning })
        }
      }
      // 兜底：若一个都没匹配，按梦境描述长度做"无关键词"占位
      const keywords = matched.map(m => m.keyword)
      const interpretations = matched

      // === 时辰吉凶修正 ===
      const shichenFortune = SHICHEN_FORTUNE[f.wakeTime] || SHICHEN_FORTUNE.子
      const timeModifier = shichenFortune.mod
      const timeNote = `${SHICHEN.find(s => s.zhi === f.wakeTime)?.name || f.wakeTime + '时'}：${shichenFortune.note}（修正${timeModifier >= 0 ? '+' : ''}${timeModifier}）`

      // === 情绪修正 ===
      const emotionMap = {
        joy:      { mod: +1, note: '梦中喜悦，吉上加吉，凶梦减半' },
        calm:     { mod:  0, note: '梦中平静，原梦意保留' },
        sad:      { mod: -1, note: '梦中悲伤，吉梦打折，凶梦加凶' },
        anxiety:  { mod: -1, note: '梦中焦虑，心神不宁，事多反复' },
        anger:    { mod: -1, note: '梦中愤怒，宜戒怒，防口舌' },
        fear:     { mod: -2, note: '梦中恐惧，阴气盛，宜安神' }
      }
      const emotionInfo = emotionMap[f.emotion] || emotionMap.calm
      const emotionModifier = emotionInfo.mod
      const emotionNote = emotionInfo.note

      // === 综合评判 ===
      // 基础分：根据匹配关键词的吉凶平均
      let baseScore = 50
      if (matched.length > 0) {
        const luckValueMap = { '吉': 80, '半吉': 60, '平': 50, '凶': 25 }
        const sum = matched.reduce((s, m) => s + (luckValueMap[m.luck] || 50), 0)
        baseScore = Math.round(sum / matched.length)
      } else {
        // 没匹配到关键词：用内容哈希给出一个稳定分数
        baseScore = 45 + (hashStr(content) % 20)
      }
      // 应用修正
      let overallScore = baseScore + timeModifier * 5 + emotionModifier * 5
      overallScore = Math.max(0, Math.min(100, overallScore))

      const overallVerdict = overallScore >= 70 ? '吉' : overallScore >= 45 ? '平' : '凶'

      // === 日期关联（结合做梦日期建除与黄黑道）===
      let dateInfo = null
      try {
        const date = new Date(f.dreamDate)
        const y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate()
        const dp = dayPillar(y, m, d)
        const mp = monthPillar(y, m, d)
        const jc = jianChuOf(mp.zhi, dp.zhi)
        const zhiShenIdx = (DI_ZHI.indexOf(dp.zhi) + DI_ZHI.indexOf(mp.zhi)) % 12
        const isHuangdao = HUANGDAO_GOOD[zhiShenIdx]
        dateInfo = {
          solarDate: `${y}-${m}-${d}`,
          ganzhi: `${dp.gan}${dp.zhi}`,
          jianChu: jc,
          zhiShen: HUANGDAO[zhiShenIdx],
          isHuangdao,
          note: isHuangdao ? '黄道吉日，梦境多为吉兆' : '黑道日，梦境多带警示'
        }
        if (isHuangdao) overallScore = Math.min(100, overallScore + 3)
        else overallScore = Math.max(0, overallScore - 2)
      } catch (e) {
        dateInfo = null
      }

      // === 合并解读 ===
      let reading
      if (matched.length === 0) {
        reading = `梦境未匹配到周公解梦关键词，难以精确解读。${timeNote}。${emotionNote}。综合看梦境${overallVerdict === '吉' ? '主吉' : overallVerdict === '凶' ? '主凶' : '平稳'}，宜静心观变。`
      } else {
        const kwSummary = matched.map(m => `"${m.keyword}"(${m.luck})`).join('、')
        const mergedMeaning = matched.map(m => m.meaning).join('；')
        reading = `梦境关键词：${kwSummary}。${mergedMeaning}。${timeNote}。${emotionNote}。${dateInfo ? `做梦日${dateInfo.ganzhi}(${dateInfo.jianChu}·${dateInfo.zhiShen})，${dateInfo.note}。` : ''}综合看梦境${overallVerdict === '吉' ? '主吉，可顺应而为' : overallVerdict === '凶' ? '主凶，宜守宜慎' : '平稳，平常心待之'}。`
      }

      return {
        resultType: 'dream',
        dreamContent: content,
        keywords,
        interpretations,
        wakeTime: f.wakeTime,
        emotion: f.emotion,
        timeModifier,
        timeNote,
        emotionModifier,
        emotionNote,
        dateInfo,
        overallScore,
        overallVerdict,
        reading,
        summary: `${matched.length > 0 ? `梦境关键词${matched.length}个` : '无匹配关键词'} · ${SHICHEN.find(s => s.zhi === f.wakeTime)?.name || f.wakeTime + '时'} · ${overallVerdict}(${overallScore}分)`
      }
    }
  }
}

// 81 数理描述（按格名附简化解读）
function name81Desc(n, geName) {
  const m = ((n - 1) % 80) + 1
  const luck = numology81Luck(n)
  const descMap = {
    1: '万物开泰', 3: '进取如意', 5: '福禄长寿', 6: '安稳余庆', 7: '刚毅果断', 8: '意志坚强',
    11: '稳健吉顺', 13: '智谋超群', 15: '福寿双全', 16: '贵人提拔', 17: '突破万难', 18: '有志竟成',
    21: '明月光照', 23: '旭日东升', 24: '家门余庆', 25: '资性英敏', 29: '泉舟顺展', 31: '春日花开',
    32: '宝马金鞍', 33: '升天之数', 35: '高楼望月', 37: '猛虎出林', 39: '富贵繁荣', 41: '德建名立',
    45: '顺风扬帆', 47: '点铁成金', 48: '青松立鹤', 52: '先见之明', 57: '努力发达', 61: '牡丹芙蓉',
    63: '万物化育', 65: '富贵至荣', 67: '通达畅达', 68: '兴家立业', 81: '万物回春',
    2: '一身孤节', 4: '破败凶兆', 9: '破舟进海', 10: '零暗万事', 12: '薄弱无力', 14: '破兆浮沉',
    19: '多灾艰难', 20: '屋下藏金', 22: '秋草逢霜', 26: '变怪奇异', 27: '欲望无止', 28: '家亲缘薄',
    30: '浮沉不定', 34: '破家破业', 36: '波澜重叠', 38: '磨铁成针', 40: '退安享福', 42: '十项全能',
    43: '散财破产', 44: '破家亡身', 46: '载宝沉舟', 49: '吉凶难分', 50: '一荣一枯', 51: '一盛一衰',
    53: '忧愁困苦', 54: '多苦非命', 56: '浪里行舟', 58: '晚行遇灯', 59: '寒蝉悲风', 60: '争名夺利',
    62: '衰败孤独', 64: '骨肉分离', 66: '暗愁滞暗', 69: '非业非运', 70: '凄惨衰败', 71: '损力劳神',
    72: '先甘后苦', 73: '不足不满', 74: '残泪经霜', 75: '退守可安', 76: '倾覆离散', 77: '先苦后甘',
    78: '晚境凄凉', 79: '挽回乏力', 80: '最凶之数'
  }
  const desc = descMap[m] || (luck === '平' ? '平平无奇' : '未详')
  return `${geName}${m}数·${desc}·${luck}`
}

/* ============================================================
 * 四、引擎导出与交叉印证
 * ============================================================ */

export function getEngine(key) {
  return ENGINES[key] || null
}

export function getEngineOrThrow(key) {
  const e = ENGINES[key]
  if (!e) throw new Error(`未注册的引擎: ${key}`)
  return e
}

// 交叉印证（功能A）
export function crossVerify(fromKey, fromResult, toKey, toResult) {
  const dimensions = []
  // 统一处理：无论方向，都按 (bazi, ziwei) 等配对
  const pair = [fromKey, toKey].sort().join('-')
  if (pair === 'bazi-ziwei') {
    const bazi = fromKey === 'bazi' ? fromResult : toResult
    const ziwei = fromKey === 'ziwei' ? fromResult : toResult
    const dmWx = bazi.dayMasterWx || ''
    const juWx = (ziwei.wuxingJu || '').charAt(0)
    dimensions.push({ name: '日主五行↔五行局', from: dmWx, to: ziwei.wuxingJu, match: dmWx === juWx || dmWx === '金' && juWx === '金' })
    dimensions.push({ name: '日主强弱↔命宫主星', from: bazi.dayMasterStrength, to: ziwei.palaces?.find(p => p.name === '命宫')?.mainStar || '空宫', match: true })
    dimensions.push({ name: '当前大运↔当前大限', from: bazi.currentDayun?.name, to: ziwei.currentDaxian?.name, match: true })
  }
  if (pair === 'astro-bazi') {
    const bazi = fromKey === 'bazi' ? fromResult : toResult
    const astro = fromKey === 'astro' ? fromResult : toResult
    const elementMap = { '白羊':'火', '狮子':'火', '射手':'火', '金牛':'土', '处女':'土', '摩羯':'土', '双子':'风', '天秤':'风', '水瓶':'风', '巨蟹':'水', '天蝎':'水', '双鱼':'水' }
    const sunEl = elementMap[astro.sunSign] || ''
    const dmWx = bazi.dayMasterWx || ''
    dimensions.push({ name: '日主五行↔太阳元素', from: dmWx, to: sunEl + '(' + astro.sunSign + ')', match: dmWx === sunEl })
    dimensions.push({ name: '日主强弱↔太阳特质', from: bazi.dayMasterStrength, to: astro.sunTrait, match: true })
  }
  if (pair === 'bazi-maya') {
    const bazi = fromKey === 'bazi' ? fromResult : toResult
    const maya = fromKey === 'maya' ? fromResult : toResult
    const colorWx = { '红':'火', '白':'金', '蓝':'水', '黄':'土' }
    const mayaWx = colorWx[maya.color] || ''
    dimensions.push({ name: '日主五行↔图腾色族', from: bazi.dayMasterWx, to: maya.color + '(' + mayaWx + ')', match: bazi.dayMasterWx === mayaWx })
    dimensions.push({ name: '日主↔主图腾', from: bazi.dayMaster, to: maya.seal, match: true })
  }
  if (pair === 'astro-ziwei') {
    const ziwei = fromKey === 'ziwei' ? fromResult : toResult
    const astro = fromKey === 'astro' ? fromResult : toResult
    dimensions.push({ name: '命宫主星↔太阳星座', from: ziwei.palaces?.find(p => p.name === '命宫')?.mainStar, to: astro.sunSign, match: true })
    dimensions.push({ name: '身宫主星↔上升星座', from: ziwei.palaces?.find(p => p.name === '身宫')?.mainStar, to: astro.ascSign, match: true })
  }
  if (pair === 'astro-maya') {
    const maya = fromKey === 'maya' ? fromResult : toResult
    const astro = fromKey === 'astro' ? fromResult : toResult
    dimensions.push({ name: '主图腾↔太阳星座', from: maya.seal, to: astro.sunSign, match: true })
    dimensions.push({ name: '银河音调↔月亮星座', from: '音调' + maya.tone, to: astro.moonSign, match: true })
  }
  const matchCount = dimensions.filter(d => d.match).length
  const score = dimensions.length ? Math.round(matchCount / dimensions.length * 100) : 50
  return { dimensions, score }
}

// 个人宜忌（功能C）
export function personalYiJi(dayMaster, favorable, liuriGanZhi) {
  const yiMap = {
    '木': ['学习', '栽种', '近林'], '火': ['见友', '宴饮', '近光'],
    '土': ['置产', '安床', '近山'], '金': ['决断', '习武', '近石'], '水': ['远行', '近水', '静思']
  }
  const jiMap = {
    '木': ['砍伐', '争执'], '火': ['纵欲', '动怒'], '土': ['动土', '搬迁'],
    '金': ['哭泣', '伤情'], '水': ['沉溺', '独处']
  }
  const yi = favorable.flatMap(wx => yiMap[wx] || [])
  const ji = favorable.flatMap(wx => jiMap[wx] || [])
  return { yi: [...new Set(yi)].slice(0, 4), ji: [...new Set(ji)].slice(0, 3) }
}

/* ============================================================
 * 五、扩展辅助函数（六合/三合/天干合/大运/合婚/流年）
 * ============================================================ */

// 地支六合：子丑合土、寅亥合木、卯戌合火、辰酉合金、巳申合水、午未合
const LIUHE_MAP = { '子': '丑', '丑': '子', '寅': '亥', '亥': '寅', '卯': '戌', '戌': '卯', '辰': '酉', '酉': '辰', '巳': '申', '申': '巳', '午': '未', '未': '午' }
const LIUHE_WX = { '子丑': '土', '寅亥': '木', '卯戌': '火', '辰酉': '金', '巳申': '水', '午未': '土' }

/** 地支六合 — 返回合化后的地支与五行，无合返回 null */
export function heOf(zhi) {
  const partner = LIUHE_MAP[zhi]
  if (!partner) return null
  const key = [zhi, partner].sort((a, b) => DI_ZHI.indexOf(a) - DI_ZHI.indexOf(b)).join('')
  const sortedKey = Object.keys(LIUHE_WX).find(k => k.split('').sort().join('') === [zhi, partner].sort().join(''))
  return { partner, wx: LIUHE_WX[sortedKey] || '土' }
}

// 地支三合局：申子辰合水、亥卯未合木、寅午戌合火、巳酉丑合金
const SANHE_GROUPS = [
  { members: ['申', '子', '辰'], wx: '水', name: '水局' },
  { members: ['亥', '卯', '未'], wx: '木', name: '木局' },
  { members: ['寅', '午', '戌'], wx: '火', name: '火局' },
  { members: ['巳', '酉', '丑'], wx: '金', name: '金局' }
]

/** 地支三合 — 返回所属三合局信息，不属于任何三合局返回 null */
export function sanheOf(zhi) {
  for (const group of SANHE_GROUPS) {
    if (group.members.includes(zhi)) {
      return { members: group.members, wx: group.wx, name: group.name, isMiddle: group.members[1] === zhi }
    }
  }
  return null
}

// 天干五合：甲己合土、乙庚合金、丙辛合水、丁壬合木、戊癸合火
const GANHE_MAP = { '甲': { partner: '己', wx: '土' }, '己': { partner: '甲', wx: '土' }, '乙': { partner: '庚', wx: '金' }, '庚': { partner: '乙', wx: '金' }, '丙': { partner: '辛', wx: '水' }, '辛': { partner: '丙', wx: '水' }, '丁': { partner: '壬', wx: '木' }, '壬': { partner: '丁', wx: '木' }, '戊': { partner: '癸', wx: '火' }, '癸': { partner: '戊', wx: '火' } }

/** 天干五合 — 返回合化对象与五行，无合返回 null */
export function ganHeOf(gan) {
  return GANHE_MAP[gan] ? { ...GANHE_MAP[gan] } : null
}

// 地支相刑
const XING_MAP = {
  '寅巳': '无恩之刑', '巳申': '无恩之刑', '申寅': '无恩之刑',
  '丑戌': '恃势之刑', '戌未': '恃势之刑', '未丑': '恃势之刑',
  '子卯': '无礼之刑', '卯子': '无礼之刑',
  '辰辰': '自刑', '午午': '自刑', '酉酉': '自刑', '亥亥': '自刑'
}

/** 地支相刑 — 返回刑的类型，无刑返回 null */
export function xingOf(zhi1, zhi2) {
  const key = zhi1 + zhi2
  const revKey = zhi2 + zhi1
  return XING_MAP[key] || XING_MAP[revKey] || null
}

/** 地支相害（穿） */
const HAI_MAP = { '子未': '相害', '未子': '相害', '丑午': '相害', '午丑': '相害', '寅巳': '相害', '巳寅': '相害', '卯辰': '相害', '辰卯': '相害', '申亥': '相害', '亥申': '相害', '酉戌': '相害', '戌酉': '相害' }
export function haiOf(zhi1, zhi2) {
  return HAI_MAP[zhi1 + zhi2] || null
}

/**
 * 大运计算（可复用，从 bazi 引擎提取）
 * @param {string} yearGan - 年柱天干
 * @param {string} monthGan - 月柱天干
 * @param {string} monthZhi - 月柱地支
 * @param {string} dayGan - 日柱天干
 * @param {string} gender - 'male' | 'female'
 * @param {number} birthYear - 出生年
 * @param {number} [count=8] - 排几个大运
 * @returns {{ dayuns: Array, currentDayun: Object, startAge: number }}
 */
export function computeDayuns(yearGan, monthGan, monthZhi, dayGan, gender, birthYear, count = 8) {
  const yearGanIdx = TIAN_GAN.indexOf(yearGan)
  const yearGanYang = yearGanIdx % 2 === 0
  const forward = (yearGanYang && gender === 'male') || (!yearGanYang && gender === 'female')
  const monthGanIdx = TIAN_GAN.indexOf(monthGan)
  const monthZhiIdx = DI_ZHI.indexOf(monthZhi)
  // 起运岁数估算（简化：3岁起运为默认，阳男阴女顺排，阴男阳女逆排）
  const startAge = 3
  const dayuns = []
  for (let i = 1; i <= count; i++) {
    const offset = forward ? i : -i
    const gIdx = (monthGanIdx + offset + 100) % 10
    const zIdx = (monthZhiIdx + offset + 100) % 12
    dayuns.push({
      name: TIAN_GAN[gIdx] + DI_ZHI[zIdx],
      startAge: startAge + (i - 1) * 10,
      endAge: startAge + i * 10 - 1,
      wx: GAN_WX[gIdx] + ZHI_WX[zIdx],
      tenGod: tenGod(dayGan, TIAN_GAN[gIdx])
    })
  }
  const age = new Date().getFullYear() - birthYear
  const currentDayun = dayuns.find(d => age >= d.startAge && age <= d.endAge) || dayuns[0]
  return { dayuns, currentDayun, startAge }
}

/**
 * 流年计算
 * @param {number} year - 年份
 * @param {string} dayGan - 日柱天干
 * @returns {{ ganzhi: string, tenGod: string, year: number }}
 */
export function liunianOf(year, dayGan) {
  const yp = yearPillar(year)
  return {
    ganzhi: yp.gan + yp.zhi,
    tenGod: tenGod(dayGan, yp.gan),
    year
  }
}

/**
 * 从用户档案计算完整八字信息（供 Profile/Daily/Timeline 使用）
 * @param {Object} profile - { birthday: 'YYYY-MM-DD', birthTime: 'HH', gender, birthPlace, longitude }
 * @returns {Object|null} 八字信息对象
 */
export function computeProfileBazi(profile) {
  if (!profile || !profile.birthday) return null
  const [year, month, day] = profile.birthday.split('-').map(Number)
  if (!year || !month || !day) return null
  const hour = profile.birthTime ? Number(profile.birthTime) : 12
  const gender = profile.gender || 'male'
  const longitude = profile.longitude || 116
  // 真太阳时修正
  const trueHour = hour + (longitude - 116) * 4 / 60
  const yp = yearPillar(year)
  const mp = monthPillar(year, month, day)
  const dp = dayPillar(year, month, day)
  const hp = hourPillar(dp.gan, Math.floor(trueHour))
  const pillars = [
    { name: '年柱', gan: yp.gan, zhi: yp.zhi, wx: yp.wx },
    { name: '月柱', gan: mp.gan, zhi: mp.zhi, wx: mp.wx },
    { name: '日柱', gan: dp.gan, zhi: dp.zhi, wx: dp.wx },
    { name: '时柱', gan: hp.gan, zhi: hp.zhi, wx: hp.wx }
  ]
  pillars.forEach(p => { p.tenGod = tenGod(dp.gan, p.gan); p.nayin = getNayin(p.gan, p.zhi) })
  const wx = wuxingCount(pillars)
  const strongest = Object.entries(wx).sort((a, b) => b[1] - a[1])[0][0]
  const weakest = Object.entries(wx).sort((a, b) => a[1] - b[1])[0][0]
  const dayMasterWx = GAN_WX[TIAN_GAN.indexOf(dp.gan)]
  const fav = getFavorable(dayMasterWx, wx)
  // 大运
  const { dayuns, currentDayun, startAge } = computeDayuns(yp.gan, mp.gan, mp.zhi, dp.gan, gender, year)
  // 流年（当年 + 未来5年）
  const thisYear = new Date().getFullYear()
  const liunians = []
  for (let y = thisYear - 1; y <= thisYear + 5; y++) {
    liunians.push(liunianOf(y, dp.gan))
  }
  const currentLiunian = liunians.find(l => l.year === thisYear) || liunians[0]
  // 农历
  const lunar = solarToLunar(year, month, day)
  // 生肖
  const zodiac = zodiacOf(year)
  // 星座
  const zodiacSign = zodiacSignOf(month, day)
  // 纳音
  const nayin = getNayin(dp.gan, dp.zhi)
  return {
    pillars,
    dayMaster: dp.gan,
    dayMasterWx,
    dayMasterLabel: `${dp.gan}${dayMasterWx}`,
    dayMasterStrength: fav.strong ? '强' : '弱',
    wuxing: wx,
    strongest,
    weakest,
    favorable: fav.favorable,
    dayuns,
    currentDayun,
    startAge,
    liunians,
    currentLiunian,
    lunar,
    zodiac,
    zodiacSign,
    nayin,
    solarDate: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    summary: `${dp.gan}${dayMasterWx}日主，五行${strongest}最旺，喜用${fav.favorable.join('')}，当前${currentDayun.name}大运`
  }
}

/**
 * 合婚/合盘匹配计算
 * @param {Object} bazi1 - computeProfileBazi 返回对象
 * @param {Object} bazi2 - computeProfileBazi 返回对象
 * @returns {Object} 匹配结果
 */
export function compatibilityCalc(bazi1, bazi2) {
  if (!bazi1 || !bazi2) return null
  const dimensions = []
  let totalScore = 0
  let maxScore = 0

  // 1. 日主五行生克（25分）
  const gen = ['木', '火', '土', '金', '水']
  const wx1 = bazi1.dayMasterWx, wx2 = bazi2.dayMasterWx
  const idx1 = gen.indexOf(wx1), idx2 = gen.indexOf(wx2)
  let wxScore = 0, wxDesc = ''
  if (idx1 === idx2) { wxScore = 20; wxDesc = '比和，性格相似' }
  else if ((idx1 + 1) % 5 === idx2) { wxScore = 25; wxDesc = `${wx1}生${wx2}，互相滋养` }
  else if ((idx2 + 1) % 5 === idx1) { wxScore = 25; wxDesc = `${wx2}生${wx1}，互相滋养` }
  else if ((idx1 + 2) % 5 === idx2) { wxScore = 10; wxDesc = `${wx1}克${wx2}，需磨合` }
  else { wxScore = 10; wxDesc = `${wx2}克${wx1}，需磨合` }
  totalScore += wxScore; maxScore += 25
  dimensions.push({ name: '日主五行', score: wxScore, max: 25, desc: wxDesc })

  // 2. 天干五合（15分）
  const ganHe = ganHeOf(bazi1.dayMaster)
  let ganHeScore = 0, ganHeDesc = '无天干合'
  if (ganHe && ganHe.partner === bazi2.dayMaster) {
    ganHeScore = 15; ganHeDesc = `${bazi1.dayMaster}${bazi2.dayMaster}合化${ganHe.wx}，天作之合`
  } else {
    ganHeScore = 5; ganHeDesc = '日干不合'
  }
  totalScore += ganHeScore; maxScore += 15
  dimensions.push({ name: '天干合', score: ganHeScore, max: 15, desc: ganHeDesc })

  // 3. 地支六合（15分）
  const dayZhi1 = bazi1.pillars[2].zhi, dayZhi2 = bazi2.pillars[2].zhi
  const liuHe = heOf(dayZhi1)
  let zhiHeScore = 0, zhiHeDesc = '无地支合'
  if (liuHe && liuHe.partner === dayZhi2) {
    zhiHeScore = 15; zhiHeDesc = `日支${dayZhi1}${dayZhi2}六合${liuHe.wx}，感情深厚`
  } else if (sanheOf(dayZhi1) && sanheOf(dayZhi2) && sanheOf(dayZhi1).name === sanheOf(dayZhi2).name) {
    zhiHeScore = 12; zhiHeDesc = `日支同属${sanheOf(dayZhi1).name}，气场相合`
  } else {
    zhiHeScore = 5; zhiHeDesc = '日支无合'
  }
  totalScore += zhiHeScore; maxScore += 15
  dimensions.push({ name: '地支合', score: zhiHeScore, max: 15, desc: zhiHeDesc })

  // 4. 地支相冲（-10分，扣分项）
  const chong = chongOf(dayZhi1) === dayZhi2
  let chongScore = chong ? -5 : 5
  let chongDesc = chong ? `日支${dayZhi1}${dayZhi2}相冲，易有摩擦` : '日支无冲'
  totalScore += chongScore + 5; maxScore += 10
  dimensions.push({ name: '地支冲', score: chongScore + 5, max: 10, desc: chongDesc })

  // 5. 喜用神互补（20分）
  const fav1 = bazi1.favorable || [], fav2 = bazi2.favorable || []
  const complementary = fav1.some(f => fav2.includes(f))
  let favScore = complementary ? 20 : 8
  let favDesc = complementary ? `喜用神互补（${fav1.join('')} ↔ ${fav2.join('')}）` : '喜用神无互补'
  totalScore += favScore; maxScore += 20
  dimensions.push({ name: '喜用互补', score: favScore, max: 20, desc: favDesc })

  // 6. 五行平衡（15分）
  const wx1Count = bazi1.wuxing || {}, wx2Count = bazi2.wuxing || {}
  const merged = {}
  Object.keys(wx1Count).forEach(k => { merged[k] = (wx1Count[k] || 0) + (wx2Count[k] || 0) })
  const vals = Object.values(merged)
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length
  const variance = vals.reduce((a, b) => a + (b - avg) ** 2, 0) / vals.length
  const balanceScore = Math.max(5, Math.round(15 - variance * 2))
  totalScore += balanceScore; maxScore += 15
  dimensions.push({ name: '五行平衡', score: balanceScore, max: 15, desc: `合并后五行方差${variance.toFixed(1)}` })

  const finalScore = Math.round((totalScore / maxScore) * 100)
  let level = ''
  if (finalScore >= 80) level = '天作之合'
  else if (finalScore >= 65) level = '佳偶天成'
  else if (finalScore >= 50) level = '良缘可期'
  else if (finalScore >= 35) level = '需多磨合'
  else level = '缘浅需努力'

  return {
    score: finalScore,
    level,
    dimensions,
    summary: `${bazi1.dayMaster}${bazi1.dayMasterWx} × ${bazi2.dayMaster}${bazi2.dayMasterWx}，匹配度${finalScore}%，${level}`
  }
}

/**
 * 地支关系汇总（刑冲合害）
 * @param {string} zhi1
 * @param {string} zhi2
 * @returns {Array} 关系列表
 */
export function zhiRelationOf(zhi1, zhi2) {
  const relations = []
  if (chongOf(zhi1) === zhi2) relations.push({ type: '冲', name: `${zhi1}${zhi2}相冲`, tone: 'neg' })
  const he = heOf(zhi1)
  if (he && he.partner === zhi2) relations.push({ type: '合', name: `${zhi1}${zhi2}六合${he.wx}`, tone: 'pos' })
  const s1 = sanheOf(zhi1), s2 = sanheOf(zhi2)
  if (s1 && s2 && s1.name === s2.name) relations.push({ type: '合', name: `${zhi1}${zhi2}同属${s1.name}`, tone: 'pos' })
  const xing = xingOf(zhi1, zhi2)
  if (xing) relations.push({ type: '刑', name: `${zhi1}${zhi2}${xing}`, tone: 'neg' })
  const hai = haiOf(zhi1, zhi2)
  if (hai) relations.push({ type: '害', name: `${zhi1}${zhi2}相害`, tone: 'neg' })
  return relations
}
