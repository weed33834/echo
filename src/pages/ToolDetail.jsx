import { defineComponent, ref, computed, watch, Fragment } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEchoStore, TOOLS } from '@/stores/echo.js'
import { getEngine, crossVerify } from '@/utils/engines.js'
import { TopBar } from '@/components/TabBar.jsx'
import { EchoCard, EchoButton, EchoTag, EchoBadge, EchoModal, EchoProgress, showToast } from '@/components/EchoUI.jsx'

/* ============================================================
 * 结果渲染器：每种 resultType 对应独立的 JSX 渲染函数
 * 每个渲染器都深度匹配 engines.js 的 calc 返回结构
 * ============================================================ */
const QUESTION_TYPE_LABELS = {
  wealth: '求财', career: '求事', marriage: '婚姻',
  lost: '失物', illness: '疾病', travel: '出行',
  lawsuit: '官讼'
}
const qtLabel = (v) => QUESTION_TYPE_LABELS[v] || v

const ResultRenderers = {
  // 1. 八字排盘 —— 四柱 + 五行 + 大运时间轴 + 流年 + 关注解读
  bazi: (r) => (
    <EchoCard level="primary" title="四柱命盘">
      <div class="bazi-pillars">
        {r.pillars.map(p => (
          <div class="bazi-pillar" key={p.name}>
            <div class="bazi-pillar__label">{p.name}</div>
            <div class="bazi-pillar__gan">{p.gan}</div>
            <div class="bazi-pillar__zhi">{p.zhi}</div>
            <div class="bazi-pillar__wx">{p.wx}</div>
            <div class="bazi-pillar__god">{p.tenGod}</div>
            <div class="bazi-pillar__nayin">{p.nayin}</div>
          </div>
        ))}
      </div>
      <div class="bazi-daymaster">
        <span class="bazi-daymaster__label">日主</span>
        <span class="bazi-daymaster__val">{r.dayMaster}</span>
        <EchoTag variant="gold">{r.dayMasterWx}</EchoTag>
        <EchoTag variant={r.dayMasterStrength === '强' ? 'danger' : 'accent'}>{r.dayMasterStrength}</EchoTag>
        <span class="bazi-daymaster__fav">喜用：{r.favorable.join('')}</span>
      </div>
      <div class="bazi-wuxing">
        <div class="bazi-wuxing__title">五行分布 · 最旺{r.strongest} · 最弱{r.weakest}</div>
        <div class="bazi-wuxing__bars">
          {Object.entries(r.wuxing).map(([wx, count]) => (
            <div class="bazi-wuxing__bar" key={wx}>
              <span class="bazi-wuxing__wx">{wx}</span>
              <div class="bazi-wuxing__track">
                <div class={`bazi-wuxing__fill bazi-wuxing__fill--${wx}`} style={{ width: `${count / 8 * 100}%` }} />
              </div>
              <span class="bazi-wuxing__count">{count}</span>
            </div>
          ))}
        </div>
      </div>
      <div class="bazi-dayun">
        <div class="bazi-dayun__title">大运时间轴 · 纳音{r.nayin}</div>
        <div class="bazi-dayun__timeline">
          {r.dayuns.map((d, i) => (
            <div class={`bazi-dayun__item ${d.name === r.currentDayun.name ? 'bazi-dayun__item--current' : ''}`} key={d.name}>
              <div class="bazi-dayun__age">{d.startAge}-{d.endAge}</div>
              <div class="bazi-dayun__name">{d.name}</div>
              <div class="bazi-dayun__god">{d.tenGod}</div>
            </div>
          ))}
        </div>
      </div>
      <div class="bazi-liunian">
        <span class="bazi-liunian__label">流年</span>
        <EchoBadge variant="accent">{r.liunian.ganzhi}</EchoBadge>
        <EchoTag variant="gold">{r.liunian.tenGod}</EchoTag>
        <span class="bazi-liunian__current">当前大运：{r.currentDayun.name}（{r.currentDayun.startAge}-{r.currentDayun.endAge}岁）</span>
      </div>
      <div class="bazi-focus">
        <div class="bazi-focus__title">关注解读</div>
        <div class="bazi-focus__text">{r.focusReading}</div>
      </div>
      <div class="tool-detail__summary">{r.summary}</div>
    </EchoCard>
  ),

  // 2. 紫微斗数 —— 12宫矩阵 + 四化 + 五行局 + 大限 + 关注宫位
  ziwei: (r) => (
    <EchoCard level="primary" title="紫微命盘">
      <div class="ziwei-info">
        <div class="ziwei-info__item"><span class="ziwei-info__label">命宫</span><EchoBadge variant="accent">{r.mingGong}</EchoBadge></div>
        <div class="ziwei-info__item"><span class="ziwei-info__label">身宫</span><EchoBadge variant="gold">{r.shenGong}</EchoBadge></div>
        <div class="ziwei-info__item"><span class="ziwei-info__label">五行局</span><EchoBadge variant="gold">{r.wuxingJu}</EchoBadge></div>
      </div>
      <div class="ziwei-palaces">
        {r.palaces.map((p, i) => (
          <div class={`ziwei-palace ${p.name === r.currentDaxian.name ? 'ziwei-palace--current' : ''}`} key={p.name}>
            <div class="ziwei-palace__pos">{p.position}</div>
            <div class="ziwei-palace__name">{p.name}</div>
            <div class={`ziwei-palace__star ${p.mainStar === '空宫' ? 'ziwei-palace__star--empty' : ''}`}>{p.mainStar}</div>
            <div class="ziwei-palace__daxian">{p.daxian.startAge}-{p.daxian.endAge}</div>
          </div>
        ))}
      </div>
      <div class="ziwei-sihua">
        <div class="ziwei-sihua__title">四化（年干）</div>
        <div class="ziwei-sihua__list">
          {r.sihua.map(s => (
            <EchoTag key={s.name} variant={s.name === '化忌' ? 'danger' : s.name === '化禄' ? 'gold' : s.name === '化权' ? 'accent' : 'ok'}>
              {s.star}{s.name}@{s.palace}
            </EchoTag>
          ))}
        </div>
      </div>
      <div class="ziwei-daxian">
        <span class="ziwei-daxian__label">当前大限</span>
        <EchoBadge variant="gold">{r.currentDaxian.name}({r.currentDaxian.position})</EchoBadge>
        <span class="ziwei-daxian__star">主星{r.currentDaxian.mainStar}</span>
      </div>
      <div class="ziwei-focus">
        <div class="ziwei-focus__title">关注宫位解读</div>
        <div class="ziwei-focus__text">{r.focusReading}</div>
      </div>
      <div class="tool-detail__summary">{r.summary}</div>
    </EchoCard>
  ),

  // 3. 六爻占卜 —— 本卦变卦 + 六爻 + 用神 + 评分 + 应期
  liuyao: (r) => (
    <EchoCard level="primary" title="六爻卦象">
      <div class="liuyao-question">所问：{r.question || '（未填写）'} · 分类：{qtLabel(r.questionType)}</div>
      <div class="liuyao-gua">
        <div class="liuyao-gua__name">{r.benGua}</div>
        {r.benGua !== r.bianGua && (
          <div class="liuyao-gua__change">
            <span class="liuyao-gua__arrow">→</span>
            <span class="liuyao-gua__bian">{r.bianGua}</span>
          </div>
        )}
        <div class="liuyao-gua__lines">
          {r.yaoLines.map((y, i) => (
            <div class={`liuyao-yao ${y.change ? 'liuyao-yao--change' : ''}`} key={i}>
              <span class="liuyao-yao__pos">第{i + 1}爻</span>
              <span class="liuyao-yao__line">{y.line}</span>
              <span class="liuyao-yao__label">{y.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div class="liuyao-meta">
        <div class="liuyao-meta__item"><span class="liuyao-meta__label">用神</span><EchoBadge variant="accent">{r.yongShen}</EchoBadge></div>
        <div class="liuyao-meta__item"><span class="liuyao-meta__label">月建</span><EchoBadge variant="gold">{r.yueJian}</EchoBadge></div>
        <div class="liuyao-meta__item"><span class="liuyao-meta__label">日建</span><EchoBadge variant="gold">{r.riJian}</EchoBadge></div>
      </div>
      <div class="liuyao-verdict">
        <div class={`liuyao-verdict__badge liuyao-verdict__badge--${r.verdict}`}>{r.verdict}</div>
        <div class="liuyao-verdict__score">{r.score}分</div>
        <div class="liuyao-verdict__text">{r.reading}</div>
      </div>
      <div class="liuyao-yingqi">
        <span class="liuyao-yingqi__label">应期</span>
        <span class="liuyao-yingqi__val">{r.yingqi}</span>
      </div>
      <div class="tool-detail__summary">{r.summary}</div>
    </EchoCard>
  ),

  // 4. 梅花易数 —— 体用 + 互卦 + 变卦 + 三阶段
  meihua: (r) => (
    <EchoCard level="primary" title="梅花易数">
      <div class="meihua-gua">
        <div class={`meihua-gua__upper ${r.upperGua === r.tiGua ? 'meihua-gua__upper--ti' : 'meihua-gua__upper--yong'}`}>
          <div class="meihua-gua__symbol">{r.upperGua.symbol}</div>
          <div class="meihua-gua__name">{r.upperGua.name}·{r.upperGua.nature}({r.upperGua.wx})</div>
          <EchoTag variant={r.upperGua === r.tiGua ? 'ok' : 'danger'}>{r.upperGua === r.tiGua ? '体' : '用'}</EchoTag>
        </div>
        <div class="meihua-gua__divider">— 第{r.dongYao}爻动 —</div>
        <div class={`meihua-gua__lower ${r.lowerGua === r.tiGua ? 'meihua-gua__lower--ti' : 'meihua-gua__lower--yong'}`}>
          <div class="meihua-gua__symbol">{r.lowerGua.symbol}</div>
          <div class="meihua-gua__name">{r.lowerGua.name}·{r.lowerGua.nature}({r.lowerGua.wx})</div>
          <EchoTag variant={r.lowerGua === r.tiGua ? 'ok' : 'danger'}>{r.lowerGua === r.tiGua ? '体' : '用'}</EchoTag>
        </div>
      </div>
      <div class="meihua-relation">
        <EchoBadge variant={r.relation.includes('吉') || r.relation.includes('比和') || r.relation.includes('得财') ? 'ok' : r.relation.includes('凶') ? 'danger' : 'accent'}>{r.relation}</EchoBadge>
        <EchoTag variant={r.verdict === '吉' ? 'ok' : r.verdict === '凶' ? 'danger' : 'accent'}>{r.verdict}</EchoTag>
      </div>
      <div class="meihua-three">
        <div class="meihua-three__title">体用生克三阶段</div>
        <div class="meihua-three__text">{r.threeStage}</div>
      </div>
      <div class="meihua-hubian">
        <div class="meihua-hubian__item"><span class="meihua-hubian__label">互卦</span><span class="meihua-hubian__val">{r.huGua.name}</span><span class="meihua-hubian__note">察过程</span></div>
        <div class="meihua-hubian__item"><span class="meihua-hubian__label">变卦</span><span class="meihua-hubian__val">{r.bianGua.name}</span><span class="meihua-hubian__note">看结局</span></div>
      </div>
      <div class="meihua-reading">{r.reading}</div>
      <div class="tool-detail__summary">{r.summary}</div>
    </EchoCard>
  ),

  // 5. 摇钱起卦 —— 本卦变卦 + 六爻 + 用神 + 心念 + 评分
  gua: (r) => (
    <EchoCard level="primary" title="摇钱卦">
      <div class="gua-question">所问：{r.question || '（未填写）'} · 分类：{qtLabel(r.questionType)}</div>
      <div class="gua-result">
        <div class="gua-result__name">{r.benGua}</div>
        <div class="gua-result__lines">
          {r.yaoLines.map((y, i) => (
            <div class={`gua-yao ${y.change ? 'gua-yao--change' : ''}`} key={i}>
              <span class="gua-yao__pos">第{i + 1}爻</span>
              <span class="gua-yao__line">{y.line}</span>
              <span class="gua-yao__label">{y.label}</span>
            </div>
          ))}
        </div>
      </div>
      {r.benGua !== r.bianGua && (
        <div class="gua-changed">
          <span class="gua-changed__arrow">→</span>
          <span class="gua-changed__name">{r.bianGua}</span>
        </div>
      )}
      <div class="gua-meta">
        <div class="gua-meta__item"><span class="gua-meta__label">用神</span><EchoBadge variant="accent">{r.yongShen}</EchoBadge></div>
        <div class="gua-meta__item"><span class="gua-meta__label">心念</span><EchoBadge variant={r.mindSeedUsed ? 'gold' : 'muted'}>{r.mindSeedUsed ? '已注入' : '未注入'}</EchoBadge></div>
      </div>
      <div class="gua-verdict">
        <div class={`gua-verdict__badge gua-verdict__badge--${r.verdict}`}>{r.verdict}</div>
        <div class="gua-verdict__score">{r.score}分</div>
        <div class="gua-verdict__text">{r.reading}</div>
      </div>
      <div class="tool-detail__summary">{r.summary}</div>
    </EchoCard>
  ),

  // 6. 奇门遁甲 —— 阴阳遁 + 九宫 + 值符值使 + 用神宫
  qimen: (r) => (
    <EchoCard level="primary" title="奇门九宫">
      <div class="qimen-header">
        <div class="qimen-header__item"><span class="qimen-header__label">阴阳遁</span><EchoBadge variant={r.yinYangDun === '阳遁' ? 'gold' : 'accent'}>{r.yinYangDun}</EchoBadge></div>
        <div class="qimen-header__item"><span class="qimen-header__label">局数</span><EchoBadge variant="accent">{r.ju}局</EchoBadge></div>
        <div class="qimen-header__item"><span class="qimen-header__label">节气</span><EchoBadge variant="gold">{r.jieqi}</EchoBadge></div>
        <div class="qimen-header__item"><span class="qimen-header__label">元</span><EchoBadge variant="accent">{r.yuan}</EchoBadge></div>
      </div>
      <div class="qimen-grid">
        {r.palaces.map(p => (
          <div class={`qimen-cell ${p.num === 5 ? 'qimen-cell--center' : ''} ${p.num === r.yongShenGong.num ? 'qimen-cell--yongshen' : ''}`} key={p.num}>
            <div class="qimen-cell__num">{p.num}宫·{p.dir}</div>
            <div class="qimen-cell__men">{p.men}</div>
            <div class="qimen-cell__xing">{p.tianPan}</div>
            <div class="qimen-cell__shen">{p.shen}</div>
          </div>
        ))}
      </div>
      <div class="qimen-zhifu">
        <span class="qimen-zhifu__label">值符</span><EchoBadge variant="gold">{r.zhiFu}</EchoBadge>
        <span class="qimen-zhifu__label">值使</span><EchoBadge variant="accent">{r.zhiShi}</EchoBadge>
      </div>
      <div class="qimen-yongshen">
        <div class="qimen-yongshen__title">用神落宫</div>
        <div class="qimen-yongshen__detail">
          {r.yongShenGong.num}宫({r.yongShenGong.dir}) · 门{r.yongShenGong.men} · 星{r.yongShenGong.xing} · 神{r.yongShenGong.shen}
        </div>
        <div class={`qimen-yongshen__verdict qimen-yongshen__verdict--${r.verdict}`}>{r.verdict}</div>
      </div>
      <div class="qimen-reading">{r.reading}</div>
      <div class="tool-detail__summary">{r.summary}</div>
    </EchoCard>
  ),

  // 7. 大六壬 —— 天盘地盘 + 四课 + 三传 + 天将
  liuren: (r) => (
    <EchoCard level="primary" title="六壬课式">
      <div class="liuren-day">
        <span>日干：<strong>{r.dayGan}</strong></span>
        <span>日支：<strong>{r.dayZhi}</strong></span>
        <span>月将：<strong>{r.yuejiang}</strong></span>
        <span>占时：<strong>{r.zhanShi}</strong></span>
      </div>
      <div class="liuren-tianpan">
        <div class="liuren-tianpan__title">天盘（月将加占时）</div>
        <div class="liuren-tianpan__grid">
          {r.tianPan.map((t, i) => (
            <div class="liuren-tp__cell" key={t}>
              <div class="liuren-tp__zhi">{t}</div>
              <div class="liuren-tp__pos">{DI_ZHI_LABEL[i]}</div>
            </div>
          ))}
        </div>
      </div>
      <div class="liuren-lessons">
        <div class="liuren-lessons__title">四课</div>
        <div class="liuren-lessons__grid">
          {r.fourLessons.map(l => (
            <div class="liuren-lesson" key={l.name}>
              <div class="liuren-lesson__name">{l.name}</div>
              <div class="liuren-lesson__gan">{l.gan}</div>
              <div class="liuren-lesson__zhi">{l.zhi}</div>
            </div>
          ))}
        </div>
      </div>
      <div class="liuren-chuan">
        <div class="liuren-chuan__title">三传</div>
        <div class="liuren-chuan__grid">
          {r.threeChuan.map(c => (
            <div class="liuren-chuan__item" key={c.name}>
              <div class="liuren-chuan__name">{c.name}</div>
              <div class="liuren-chuan__zhi">{c.zhi}</div>
              <EchoTag variant="muted">{c.wx}</EchoTag>
              <div class="liuren-chuan__jiang">{c.tianJiang}</div>
              <div class={`liuren-chuan__xing ${c.tianJiangXing === '吉' ? 'liuren-chuan__xing--ji' : 'liuren-chuan__xing--xiong'}`}>{c.tianJiangXing}</div>
            </div>
          ))}
        </div>
      </div>
      <div class="liuren-verdict">
        <span class="liuren-verdict__label">用神</span><EchoBadge variant="accent">{r.yongShen}</EchoBadge>
        <div class={`liuren-verdict__badge liuren-verdict__badge--${r.verdict}`}>{r.verdict}</div>
      </div>
      <div class="liuren-reading">{r.reading}</div>
      <div class="tool-detail__summary">{r.summary}</div>
    </EchoCard>
  ),

  // 8. 子午流注 —— 当令 + 表里 + 子母 + 五输穴 + 体质症状
  ziwu: (r) => (
    <EchoCard level="primary" title="子午流注">
      <div class="ziwu-current">
        <div class="ziwu-current__name">{r.current.name}</div>
        <div class="ziwu-current__time">{r.current.time}时 · 当令</div>
        <div class="ziwu-current__organ">对应脏腑：{r.current.organ}</div>
        <div class="ziwu-current__advice">{r.current.advice}</div>
      </div>
      <div class="ziwu-relations">
        <div class="ziwu-relations__item"><span class="ziwu-relations__label">表里经</span><EchoBadge variant="accent">{r.biaoLi}</EchoBadge></div>
        <div class="ziwu-relations__item"><span class="ziwu-relations__label">母经</span><EchoBadge variant="gold">{r.muJing}</EchoBadge></div>
        <div class="ziwu-relations__item"><span class="ziwu-relations__label">子经</span><EchoBadge variant="gold">{r.ziJing}</EchoBadge></div>
        <div class="ziwu-relations__item"><span class="ziwu-relations__label">脏腑五行</span><EchoBadge variant="accent">{r.organWx}</EchoBadge></div>
      </div>
      <div class="ziwu-acupoints">
        <div class="ziwu-acupoints__title">取穴方案</div>
        <div class="ziwu-acupoints__list">
          {r.acupoints.map(a => (
            <div class="ziwu-acupoint" key={a.name}>
              <div class="ziwu-acupoint__name">{a.name}</div>
              <div class="ziwu-acupoint__cat">{a.category}</div>
              <div class="ziwu-acupoint__action">{a.action}</div>
              <div class="ziwu-acupoint__meridian">{a.meridian}</div>
            </div>
          ))}
        </div>
      </div>
      <div class="ziwu-advice">
        <div class="ziwu-advice__title">体质建议</div>
        <div class="ziwu-advice__text">{r.constitutionAdvice}</div>
      </div>
      <div class="ziwu-advice">
        <div class="ziwu-advice__title">症状建议</div>
        <div class="ziwu-advice__text">{r.symptomAdvice}</div>
      </div>
      <div class="ziwu-next">
        <span class="ziwu-next__label">下一时辰</span>
        <EchoBadge variant="accent">{r.nextShichen.name}</EchoBadge>
        <span class="ziwu-next__advice">{r.nextShichen.advice}</span>
      </div>
      <div class="tool-detail__summary">{r.summary}</div>
    </EchoCard>
  ),

  // 9. 节气养生 —— 节气 + 五运六气 + 物候 + 四维建议 + 禁忌
  yangsheng: (r) => (
    <EchoCard level="primary" title="节气养生">
      <div class="yangsheng-jieqi">
        <div class="yangsheng-jieqi__name">{r.jieqi}</div>
        <div class="yangsheng-jieqi__season">{r.season}季</div>
      </div>
      <div class="yangsheng-wuyun">
        <div class="yangsheng-wuyun__title">五运六气</div>
        <div class="yangsheng-wuyun__detail">
          <span>大运：<strong>{r.wuyunLiuqi.dayun}</strong></span>
          <span>主气：<strong>{r.wuyunLiuqi.zhuqi}</strong></span>
        </div>
      </div>
      <div class="yangsheng-wuhou">
        <span class="yangsheng-wuhou__label">物候</span>
        <span class="yangsheng-wuhou__val">{r.wuhou}</span>
      </div>
      <div class="yangsheng-advice">
        <div class="yangsheng-advice__title">节气调养</div>
        <div class="yangsheng-advice__text">{r.jieqiAdvice}</div>
      </div>
      <div class="yangsheng-advice">
        <div class="yangsheng-advice__title">体质建议</div>
        <div class="yangsheng-advice__text">{r.constitutionAdvice}</div>
      </div>
      <div class="yangsheng-matrix">
        <div class="yangsheng-matrix__title">四维调养矩阵</div>
        <div class="yangsheng-matrix__grid">
          <div class="yangsheng-matrix__item yangsheng-matrix__item--diet"><div class="yangsheng-matrix__cat">饮食</div><div class="yangsheng-matrix__text">{r.personalAdvice.diet}</div></div>
          <div class="yangsheng-matrix__item yangsheng-matrix__item--life"><div class="yangsheng-matrix__cat">起居</div><div class="yangsheng-matrix__text">{r.personalAdvice.lifestyle}</div></div>
          <div class="yangsheng-matrix__item yangsheng-matrix__item--exer"><div class="yangsheng-matrix__cat">运动</div><div class="yangsheng-matrix__text">{r.personalAdvice.exercise}</div></div>
          <div class="yangsheng-matrix__item yangsheng-matrix__item--emo"><div class="yangsheng-matrix__cat">情志</div><div class="yangsheng-matrix__text">{r.personalAdvice.emotion}</div></div>
        </div>
      </div>
      <div class="yangsheng-taboos">
        <div class="yangsheng-taboos__title">禁忌</div>
        <div class="yangsheng-taboos__list">
          {r.taboos.map(t => <EchoTag key={t} variant="danger">{t}</EchoTag>)}
        </div>
      </div>
      <div class="tool-detail__summary">{r.summary}</div>
    </EchoCard>
  ),

  // 10. 老黄历 —— 农历 + 建除 + 黄黑道 + 冲煞 + 宜忌 + 关注事件 + 时辰宜忌
  huangli: (r) => (
    <EchoCard level="primary" title="今日黄历">
      <div class="huangli-date">{r.solarDate}（{r.lunarDate}）</div>
      <div class="huangli-ganzhi">{r.lunarGanZhi}</div>
      <div class="huangli-meta">
        <EchoTag variant="accent">建除：{r.jianChu}</EchoTag>
        <EchoTag variant={r.isHuangdao ? 'gold' : 'muted'}>{r.zhiShen}({r.isHuangdao ? '黄道' : '黑道'})</EchoTag>
        <EchoTag variant="muted">{r.zodiac}年</EchoTag>
        <EchoTag variant="muted">{r.zodiacSign}座</EchoTag>
        <EchoTag variant="danger">{r.chong}</EchoTag>
      </div>
      {r.concernMatch && (
        <div class={`huangli-concern huangli-concern--${r.concernMatch.match === '宜' ? 'good' : r.concernMatch.match === '忌' ? 'bad' : 'neutral'}`}>
          <span class="huangli-concern__label">关注事件：{r.concernMatch.eventLabel}</span>
          <EchoBadge variant={r.concernMatch.match === '宜' ? 'ok' : r.concernMatch.match === '忌' ? 'danger' : 'accent'}>{r.concernMatch.match}</EchoBadge>
          <span class="huangli-concern__score">{r.concernMatch.score}分</span>
        </div>
      )}
      <div class="huangli-yiji">
        <div class="huangli-yi">
          <div class="huangli-yi__label">宜</div>
          <div class="huangli-yi__list">
            {r.yi.map(y => <EchoTag key={y} variant="ok">{y}</EchoTag>)}
          </div>
        </div>
        <div class="huangli-ji">
          <div class="huangli-ji__label">忌</div>
          <div class="huangli-ji__list">
            {r.ji.map(j => <EchoTag key={j} variant="danger">{j}</EchoTag>)}
          </div>
        </div>
      </div>
      <div class="huangli-taishen">胎神{r.taishen}</div>
      {r.shichenYiji && (
        <div class="huangli-shichen">
          <div class="huangli-shichen__title">十二时辰宜忌</div>
          <div class="huangli-shichen__grid">
            {r.shichenYiji.map(s => (
              <div class={`huangli-shichen__cell ${s.lucky ? 'huangli-shichen__cell--ji' : 'huangli-shichen__cell--xiong'}`} key={s.shichen}>
                <span class="huangli-shichen__zhi">{s.shichen}</span>
                <span class="huangli-shichen__yi">{s.yi}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div class="tool-detail__summary">{r.summary}</div>
    </EchoCard>
  ),

  // 11. 择吉日 —— 吉日列表 + 评分 + 宜忌 + 凶日
  jiri: (r) => (
    <EchoCard level="primary" title={`择吉日 · ${r.eventLabel}`}>
      <div class="jiri-range">{r.range}天内筛选，找到{r.goodDays.length}个吉日</div>
      <div class="jiri-list">
        {r.goodDays.map((d, i) => (
          <div class={`jiri-day ${d.label === '大吉' ? 'jiri-day--best' : ''}`} key={d.date}>
            <div class="jiri-day__rank">第{i + 1}选</div>
            <div class="jiri-day__main">
              <div class="jiri-day__date">{d.date}（周{d.weekday}）</div>
              <div class="jiri-day__ganzhi">{d.ganzhi} · {d.jianChu} · {d.zhiShen}</div>
              <div class="jiri-day__chong">{d.chong}</div>
              <div class="jiri-day__yi">宜：{d.yi.join('、')}</div>
              <div class="jiri-day__ji">忌：{d.ji.join('、')}</div>
              <div class="jiri-day__hour">吉时：{d.bestHour}</div>
            </div>
            <div class="jiri-day__score">
              <EchoBadge variant={d.label === '大吉' ? 'gold' : 'accent'}>{d.label}</EchoBadge>
              <span class="jiri-day__num">{d.score}分</span>
            </div>
          </div>
        ))}
      </div>
      {r.badDays.length > 0 && (
        <div class="jiri-baddays">
          <div class="jiri-baddays__title">需避开</div>
          <div class="jiri-baddays__list">
            {r.badDays.map(d => (
              <div class="jiri-badday" key={d.date}>
                <span class="jiri-badday__date">{d.date}</span>
                <EchoTag variant="danger">{d.reason}</EchoTag>
              </div>
            ))}
          </div>
        </div>
      )}
      <div class="tool-detail__summary">{r.summary}</div>
    </EchoCard>
  ),

  // 12. 每日运势 —— 流日十神 + 四维评分 + 12时辰 + 心境 + 计划
  yunshi: (r) => (
    <EchoCard level="primary" title="每日运势">
      <div class="yunshi-date">{r.date} · {r.dayGanZhi}日 · 日主{r.dayMaster}</div>
      <div class="yunshi-shishen">
        <span class="yunshi-shishen__label">流日十神</span>
        <EchoBadge variant="gold">{r.liuriShiShen}</EchoBadge>
      </div>
      <div class="yunshi-overall">
        <div class="yunshi-overall__num">{r.overall}</div>
        <div class="yunshi-overall__label">综合运势</div>
      </div>
      <div class="yunshi-scores">
        {[
          { label: '事业', val: r.scores.career },
          { label: '感情', val: r.scores.love },
          { label: '财运', val: r.scores.wealth },
          { label: '健康', val: r.scores.health }
        ].map(s => (
          <div class="yunshi-score" key={s.label}>
            <div class="yunshi-score__head">
              <span class="yunshi-score__label">{s.label}</span>
              <span class="yunshi-score__val">{s.val}</span>
            </div>
            <EchoProgress value={s.val} variant={s.val >= 75 ? 'gold' : s.val >= 50 ? 'accent' : 'danger'} />
          </div>
        ))}
      </div>
      <div class="yunshi-lucky">
        <div class="yunshi-lucky__item">幸运色：<strong>{r.luckyColor}</strong></div>
        <div class="yunshi-lucky__item">幸运数：<strong>{r.luckyNum}</strong></div>
        <div class="yunshi-lucky__item">幸运方位：<strong>{r.luckyDir}</strong></div>
      </div>
      <div class="yunshi-shichen">
        <div class="yunshi-shichen__title">12时辰吉凶</div>
        <div class="yunshi-shichen__grid">
          {r.shichenLuck.map(s => (
            <div class={`yunshi-sc__cell yunshi-sc__cell--${s.luck === '吉' ? 'ji' : s.luck === '凶' ? 'xiong' : 'ping'}`} key={s.shichen}>
              <span class="yunshi-sc__zhi">{s.shichen}</span>
              <span class="yunshi-sc__ss">{s.shishen}</span>
              <span class="yunshi-sc__luck">{s.luck}</span>
            </div>
          ))}
        </div>
      </div>
      <div class="yunshi-tips">
        <div class="yunshi-tip"><span class="yunshi-tip__label">心境</span><span class="yunshi-tip__text">{r.moodTip}</span></div>
        <div class="yunshi-tip"><span class="yunshi-tip__label">计划</span><span class="yunshi-tip__text">{r.planTip}</span></div>
      </div>
      <div class="yunshi-focus">{r.focusReading}</div>
      <div class="tool-detail__summary">{r.summary}</div>
    </EchoCard>
  ),

  // 13. 西洋占星 —— 三巨头 + 7行星 + 相位 + 元素模式
  astro: (r) => (
    <EchoCard level="primary" title="星盘三巨头">
      <div class="astro-trinity">
        <div class="astro-trinity__item astro-trinity__item--sun">
          <div class="astro-trinity__icon">☉</div>
          <div class="astro-trinity__label">太阳</div>
          <div class="astro-trinity__sign">{r.sunSign}</div>
          <div class="astro-trinity__trait">{r.sunTrait}</div>
        </div>
        <div class="astro-trinity__item astro-trinity__item--moon">
          <div class="astro-trinity__icon">☽</div>
          <div class="astro-trinity__label">月亮</div>
          <div class="astro-trinity__sign">{r.moonSign}</div>
          <div class="astro-trinity__trait">{r.moonTrait}</div>
        </div>
        <div class="astro-trinity__item astro-trinity__item--asc">
          <div class="astro-trinity__icon">↑</div>
          <div class="astro-trinity__label">上升</div>
          <div class="astro-trinity__sign">{r.ascSign}</div>
          <div class="astro-trinity__trait">{r.ascTrait}</div>
        </div>
      </div>
      <div class="astro-planets">
        <div class="astro-planets__title">七行星分布</div>
        <div class="astro-planets__grid">
          {Object.entries(r.planets).map(([k, v]) => (
            <div class="astro-planet" key={k}><span class="astro-planet__name">{{sun:'☉太阳',moon:'☽月亮',mercury:'☿水星',venus:'♀金星',mars:'♂火星',jupiter:'♃木星',saturn:'♄土星'}[k]}</span><EchoBadge variant="accent">{v}</EchoBadge></div>
          ))}
        </div>
      </div>
      {r.aspects.length > 0 && (
        <div class="astro-aspects">
          <div class="astro-aspects__title">主要相位</div>
          <div class="astro-aspects__list">
            {r.aspects.map((a, i) => (
              <div class="astro-aspect" key={i}>
                <span class="astro-aspect__pair">{a.a}↔{a.b}</span>
                <EchoTag variant={a.type.includes('合') || a.type.includes('拱') ? 'ok' : a.type.includes('冲') || a.type.includes('刑') ? 'danger' : 'accent'}>{a.type}</EchoTag>
                <span class="astro-aspect__meaning">{a.meaning}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div class="astro-balance">
        <div class="astro-balance__group">
          <div class="astro-balance__title">元素</div>
          <div class="astro-balance__bars">
            {Object.entries(r.elementBalance).map(([k, v]) => (
              <div class="astro-balance__bar" key={k}><span class="astro-balance__label">{k}</span><span class="astro-balance__val">{v}</span></div>
            ))}
          </div>
        </div>
        <div class="astro-balance__group">
          <div class="astro-balance__title">模式</div>
          <div class="astro-balance__bars">
            {Object.entries(r.modeBalance).map(([k, v]) => (
              <div class="astro-balance__bar" key={k}><span class="astro-balance__label">{k}</span><span class="astro-balance__val">{v}</span></div>
            ))}
          </div>
        </div>
      </div>
      <div class="astro-focus">{r.focusReading}</div>
      <div class="tool-detail__summary">{r.summary}</div>
    </EchoCard>
  ),

  // 14. 玛雅历 —— Kin + 五图腾 + 波符 + 关系
  maya: (r) => (
    <EchoCard level="primary" title="玛雅印记">
      <div class="maya-kin">
        <div class="maya-kin__num">Kin {r.kin}</div>
        <div class="maya-kin__seal">{r.seal}</div>
        <div class="maya-kin__tone">银河音调 {r.tone} · {r.toneMeaning}</div>
        <div class="maya-kin__color">{r.color}色族</div>
      </div>
      <div class="maya-seal-meaning">
        <div class="maya-seal-meaning__label">图腾特质</div>
        <div class="maya-seal-meaning__val">{r.sealMeaning}</div>
      </div>
      <div class="maya-five">
        <div class="maya-five__title">五图腾矩阵</div>
        <div class="maya-five__grid">
          <div key="guide" class="maya-five__item maya-five__item--guide"><div class="maya-five__role">引导</div><div class="maya-five__seal">{r.fiveSeals.guide}</div></div>
          <div key="analog" class="maya-five__item maya-five__item--analog"><div class="maya-five__role">类比</div><div class="maya-five__seal">{r.fiveSeals.analog}</div></div>
          <div key="antipode" class="maya-five__item maya-five__item--antipode"><div class="maya-five__role">对偶</div><div class="maya-five__seal">{r.fiveSeals.antipode}</div></div>
          <div key="hidden" class="maya-five__item maya-five__item--hidden"><div class="maya-five__role">隐藏</div><div class="maya-five__seal">{r.fiveSeals.hidden}</div></div>
          <div key="challenge" class="maya-five__item maya-five__item--challenge"><div class="maya-five__role">挑战</div><div class="maya-five__seal">{r.fiveSeals.challenge}</div></div>
        </div>
      </div>
      <div class="maya-wave">
        <span class="maya-wave__label">波符</span>
        <EchoBadge variant="gold">{r.waveSpell.seal}</EchoBadge>
        <span class="maya-wave__day">第{r.waveSpell.day}天 · {r.waveSpell.toneName}</span>
      </div>
      {r.relation && (
        <div class="maya-relation">
          <div class="maya-relation__title">关系印记</div>
          <div class="maya-relation__detail">
            你{r.seal}(Kin{r.kin}) ↔ 对方{r.relation.partnerSeal}(Kin{r.relation.partnerKin})
          </div>
          <EchoBadge variant={r.relation.type === '共振' ? 'gold' : r.relation.type === '互补' ? 'accent' : 'danger'}>{r.relation.type}</EchoBadge>
          <div class="maya-relation__reading">{r.relation.reading}</div>
        </div>
      )}
      <div class="maya-focus">{r.focusReading}</div>
      <div class="tool-detail__summary">{r.summary}</div>
    </EchoCard>
  ),

  // 15. 塔罗牌 —— 多牌阵 + 正逆位 + 关键牌 + 综合解读
  tarot: (r) => (
    <EchoCard level="primary" title="塔罗牌阵">
      <div class="tarot-question">所问：{r.question || '（未填写）'} · {r.spread}牌阵 · 关注{r.focusArea}</div>
      <div class={`tarot-cards tarot-cards--${r.spread}`}>
        {r.cards.map((c, i) => (
          <div class={`tarot-card ${c.upright ? '' : 'tarot-card--reversed'} ${c.isKeyCard ? 'tarot-card--key' : ''}`} key={c.position}>
            <div class="tarot-card__position">{c.position}</div>
            <div class="tarot-card__num">{c.card.num || '★'}</div>
            <div class="tarot-card__name">{c.card.name}</div>
            <div class="tarot-card__orient">{c.upright ? '正位' : '逆位'}</div>
            <div class="tarot-card__meaning">{c.meaning}</div>
            {c.isKeyCard && <div class="tarot-card__key">关键牌</div>}
          </div>
        ))}
      </div>
      <div class="tarot-synthesis">
        <div class="tarot-synthesis__title">综合解读</div>
        <div class="tarot-synthesis__text">{r.synthesis}</div>
      </div>
      <div class="tarot-advice">
        <div class="tarot-advice__title">建议</div>
        <div class="tarot-advice__text">{r.advice}</div>
      </div>
      <div class="tool-detail__summary">{r.summary}</div>
    </EchoCard>
  ),

  // 16. 风水布局 —— 飞星九宫 + 宅卦 + 房间建议 + 布局建议 + 生肖冲合
  fengshui: (r) => (
    <EchoCard level="primary" title="风水布局">
      <div class="fengshui-header">
        <div class="fengshui-header__item"><span class="fengshui-header__label">流年</span><EchoBadge variant="gold">{r.currentYear}</EchoBadge></div>
        <div class="fengshui-header__item"><span class="fengshui-header__label">入中飞星</span><EchoBadge variant="accent">{r.centerStarName}</EchoBadge></div>
        <div class="fengshui-header__item"><span class="fengshui-header__label">宅卦</span><EchoBadge variant="gold">{r.houseGua.name}({r.houseGua.gua}卦{r.houseGua.wx})</EchoBadge></div>
        <div class="fengshui-header__item"><span class="fengshui-header__label">元运</span><EchoBadge variant="accent">建{r.buildPeriod}运/今{r.currentPeriod}运</EchoBadge></div>
      </div>
      <div class="fengshui-grid">
        {r.flyStarGrid.map(c => (
          <div class={`fengshui-cell ${c.palaceNum === 5 ? 'fengshui-cell--center' : ''} ${c.starLuck === '吉' ? 'fengshui-cell--ji' : c.starLuck === '凶' ? 'fengshui-cell--xiong' : ''}`} key={c.palaceNum}>
            <div class="fengshui-cell__dir">{c.dir}</div>
            <div class="fengshui-cell__star">{c.starName}</div>
            <div class="fengshui-cell__nature">{c.starNature}</div>
            <div class="fengshui-cell__luck">{c.starLuck}</div>
          </div>
        ))}
      </div>
      <div class="fengshui-room">
        <div class="fengshui-room__title">房间建议</div>
        <div class="fengshui-room__text">{r.roomAdvice}</div>
      </div>
      <div class="fengshui-suggestions">
        <div class="fengshui-suggestions__title">布局建议</div>
        <div class="fengshui-suggestions__list">
          {r.layoutSuggestions.map((s, i) => (
            <div class="fengshui-suggestion" key={i}>
              <EchoBadge variant={s.priority === '极高' ? 'danger' : s.priority === '高' ? 'gold' : 'accent'}>{s.priority}</EchoBadge>
              <span class="fengshui-suggestion__star">{s.star}</span>
              <span class="fengshui-suggestion__dir">@{s.dir}</span>
              <span class="fengshui-suggestion__action">{s.action}</span>
            </div>
          ))}
        </div>
      </div>
      <div class="fengshui-clash">
        <div class="fengshui-clash__title">居住者生肖冲合</div>
        <div class="fengshui-clash__row">
          <span class="fengshui-clash__label">生肖</span><EchoBadge variant="gold">{r.clashAnimal.occupant}</EchoBadge>
          <span class="fengshui-clash__label">六冲</span><EchoTag variant="danger">{r.clashAnimal.chong}</EchoTag>
          <span class="fengshui-clash__label">六合</span><EchoTag variant="ok">{r.clashAnimal.he}</EchoTag>
          <span class="fengshui-clash__label">三合</span><EchoTag variant="accent">{r.clashAnimal.sanhe.join('、')}</EchoTag>
        </div>
        <div class="fengshui-clash__note">{r.clashAnimal.note}</div>
      </div>
      <div class="fengshui-verdict">
        <div class={`fengshui-verdict__badge fengshui-verdict__badge--${r.verdict}`}>{r.verdict}</div>
        <div class="fengshui-verdict__score">{r.score}分</div>
        <div class="fengshui-verdict__text">{r.reading}</div>
      </div>
      <div class="tool-detail__summary">{r.summary}</div>
    </EchoCard>
  ),

  // 17. 姓名学 —— 笔画 + 三才五格 + 81数理 + 评分
  nameology: (r) => (
    <EchoCard level="primary" title="姓名学分析">
      <div class="nameology-name">
        <span class="nameology-name__label">姓名</span>
        <span class="nameology-name__val">{r.name}</span>
        <EchoTag variant="muted">{r.strokes.length}字</EchoTag>
        <EchoTag variant="accent">{r.gender === 'male' ? '男' : '女'}</EchoTag>
        <EchoTag variant="gold">属{r.birthZodiac}</EchoTag>
        <EchoTag variant="accent">{r.birthWx}命</EchoTag>
      </div>
      <div class="nameology-strokes">
        <div class="nameology-strokes__title">笔画分布</div>
        <div class="nameology-strokes__list">
          {r.strokes.map((s, i) => (
            <div class="nameology-stroke" key={i}>
              <div class="nameology-stroke__char">{s.char}</div>
              <div class="nameology-stroke__num">{s.strokes}画</div>
              <div class="nameology-stroke__pos">{i === 0 ? '姓' : `名${i}`}</div>
            </div>
          ))}
        </div>
      </div>
      <div class="nameology-sancai">
        <div class="nameology-sancai__title">三才五行</div>
        <div class="nameology-sancai__row">
          <div class="nameology-sancai__item"><div class="nameology-sancai__name">天格</div><div class="nameology-sancai__num">{r.sanCai.tian.num}</div><EchoBadge variant="gold">{r.sanCai.tian.wx}</EchoBadge></div>
          <div class="nameology-sancai__item"><div class="nameology-sancai__name">人格</div><div class="nameology-sancai__num">{r.sanCai.ren.num}</div><EchoBadge variant="accent">{r.sanCai.ren.wx}</EchoBadge></div>
          <div class="nameology-sancai__item"><div class="nameology-sancai__name">地格</div><div class="nameology-sancai__num">{r.sanCai.di.num}</div><EchoBadge variant="gold">{r.sanCai.di.wx}</EchoBadge></div>
        </div>
        <div class="nameology-sancai__relation">{r.sanCaiRelation}</div>
      </div>
      <div class="nameology-wuge">
        <div class="nameology-wuge__title">五格吉凶</div>
        <div class="nameology-wuge__grid">
          {Object.entries(r.wuGe).map(([k, g]) => (
            <div class={`nameology-wuge-item nameology-wuge-item--${g.luck === '大吉' ? 'ji' : g.luck === '大凶' ? 'xiong' : 'ping'}`} key={k}>
              <div class="nameology-wuge-item__name">{g.name}</div>
              <div class="nameology-wuge-item__num">{g.num}</div>
              <div class="nameology-wuge-item__luck">{g.luck}</div>
              {g.wx && <div class="nameology-wuge-item__wx">{g.wx}</div>}
            </div>
          ))}
        </div>
      </div>
      <div class="nameology-numology">
        <div class="nameology-numology__title">81数理解读</div>
        <div class="nameology-numology__list">
          {Object.entries(r.numology81).map(([k, n]) => (
            <div class="nameology-numology-item" key={k}>
              <EchoTag variant={n.luck === '大吉' ? 'ok' : n.luck === '大凶' ? 'danger' : 'muted'}>{n.luck}</EchoTag>
              <span class="nameology-numology-item__desc">{n.desc}</span>
            </div>
          ))}
        </div>
      </div>
      <div class="nameology-verdict">
        <div class={`nameology-verdict__badge nameology-verdict__badge--${r.verdict}`}>{r.verdict}</div>
        <div class="nameology-verdict__score">{r.overallScore}分</div>
        <div class="nameology-verdict__text">{r.reading}</div>
      </div>
      <div class="tool-detail__summary">{r.summary}</div>
    </EchoCard>
  ),

  // 18. 周公解梦 —— 关键词 + 解读 + 时辰修正 + 情绪修正 + 日期关联
  dream: (r) => (
    <EchoCard level="primary" title="周公解梦">
      <div class="dream-content">
        <div class="dream-content__title">梦境描述</div>
        <div class="dream-content__text">{r.dreamContent || '（未填写）'}</div>
      </div>
      {r.keywords.length > 0 ? (
        <div class="dream-keywords">
          <div class="dream-keywords__title">匹配关键词（{r.keywords.length}个）</div>
          <div class="dream-keywords__list">
            {r.keywords.map((k, i) => (
              <EchoTag key={k} variant={r.interpretations[i].luck === '吉' ? 'ok' : r.interpretations[i].luck === '凶' ? 'danger' : r.interpretations[i].luck === '半吉' ? 'gold' : 'muted'}>
                {k}（{r.interpretations[i].luck}）
              </EchoTag>
            ))}
          </div>
        </div>
      ) : (
        <div class="dream-keywords dream-keywords--empty">
          <div class="dream-keywords__title">未匹配到关键词</div>
          <div class="dream-keywords__note">梦境内容未命中周公解梦关键词表，仅按时辰情绪综合评判</div>
        </div>
      )}
      {r.interpretations.length > 0 && (
        <div class="dream-interprets">
          <div class="dream-interprets__title">逐条解读</div>
          <div class="dream-interprets__list">
            {r.interpretations.map((it, i) => (
              <div class="dream-interpret" key={it.keyword}>
                <EchoBadge variant={it.luck === '吉' ? 'ok' : it.luck === '凶' ? 'danger' : it.luck === '半吉' ? 'gold' : 'accent'}>{it.keyword}</EchoBadge>
                <span class="dream-interpret__meaning">{it.meaning}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div class="dream-modifiers">
        <div class="dream-modifier">
          <span class="dream-modifier__label">时辰修正</span>
          <EchoBadge variant={r.timeModifier >= 0 ? 'ok' : r.timeModifier < 0 ? 'danger' : 'muted'}>{r.timeModifier >= 0 ? '+' : ''}{r.timeModifier}</EchoBadge>
          <span class="dream-modifier__note">{r.timeNote}</span>
        </div>
        <div class="dream-modifier">
          <span class="dream-modifier__label">情绪修正</span>
          <EchoBadge variant={r.emotionModifier > 0 ? 'ok' : r.emotionModifier < 0 ? 'danger' : 'muted'}>{r.emotionModifier > 0 ? '+' : ''}{r.emotionModifier}</EchoBadge>
          <span class="dream-modifier__note">{r.emotionNote}</span>
        </div>
      </div>
      {r.dateInfo && (
        <div class="dream-date">
          <span class="dream-date__label">做梦日</span>
          <EchoBadge variant="accent">{r.dateInfo.ganzhi}</EchoBadge>
          <EchoTag variant="muted">{r.dateInfo.jianChu}</EchoTag>
          <EchoTag variant={r.dateInfo.isHuangdao ? 'gold' : 'muted'}>{r.dateInfo.zhiShen}({r.dateInfo.isHuangdao ? '黄道' : '黑道'})</EchoTag>
          <span class="dream-date__note">{r.dateInfo.note}</span>
        </div>
      )}
      <div class="dream-verdict">
        <div class={`dream-verdict__badge dream-verdict__badge--${r.overallVerdict}`}>{r.overallVerdict}</div>
        <div class="dream-verdict__score">{r.overallScore}分</div>
        <div class="dream-verdict__text">{r.reading}</div>
      </div>
      <div class="tool-detail__summary">{r.summary}</div>
    </EchoCard>
  )
}

// 六壬天盘地支位置标签
const DI_ZHI_LABEL = ['子位', '丑位', '寅位', '卯位', '辰位', '巳位', '午位', '未位', '申位', '酉位', '戌位', '亥位']

/* ============================================================
 * ToolDetail 主组件
 * ============================================================ */
export default defineComponent({
  name: 'ToolDetail',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const store = useEchoStore()

    const tool = computed(() => TOOLS.find(t => t.key === route.params.key) || TOOLS[0])
    const engine = computed(() => getEngine(tool.value.key))

    const form = ref({})
    const result = ref(null)
    const loading = ref(false)
    const assumeModal = ref(false)
    const assumeForm = ref({ title: '', days: 30, desc: '' })
    const crossVerifyModal = ref(false)
    const crossVerifyResult = ref(null)

    // 初始化/切换工具时重置表单
    function initForm() {
      const e = engine.value
      if (!e) return
      const newForm = {}
      e.inputConfig.forEach(f => {
        newForm[f.key] = f.default
      })
      form.value = newForm
      result.value = null
      crossVerifyResult.value = null
    }
    initForm()

    watch(() => route.params.key, () => {
      initForm()
    })

    const calcLabel = computed(() => {
      const labels = {
        bazi: '排盘', ziwei: '排盘', qimen: '排盘', liuren: '起课',
        liuyao: '起卦', meihua: '起卦', gua: '摇卦',
        ziwu: '推演', yangsheng: '推演', huangli: '查看', jiri: '择日',
        yunshi: '查看运势', astro: '查看星盘', maya: '查询', tarot: '抽牌',
        fengshui: '布局', nameology: '分析', dream: '解梦'
      }
      return labels[tool.value.key] || '推演'
    })

    // 判断字段是否应该显示（showIf 条件）
    function shouldShow(f) {
      if (!f.showIf) return true
      const condVal = form.value[f.showIf.key]
      return f.showIf.in.includes(condVal)
    }

    // 执行计算
    const calc = () => {
      const e = engine.value
      if (!e) return
      for (const f of e.inputConfig) {
        if (!shouldShow(f)) continue
        if (f.type === 'textarea' && f.key !== 'questionDetail' && f.key !== 'methodInput' && f.key !== 'todayPlan' && !form.value[f.key]?.trim()) {
          // question 类必填（但允许 questionDetail/methodInput/todayPlan 为空）
          if (f.key === 'question' || f.key === 'mindSeed') {
            showToast('请填写' + f.label, 'warn')
            return
          }
        }
      }
      loading.value = true
      setTimeout(() => {
        try {
          const res = e.calc(form.value)
          result.value = res
          // 记录推演档案（功能B）
          store.pushHistory({
            toolKey: tool.value.key,
            toolName: tool.value.name,
            toolCat: tool.value.cat,
            form: { ...form.value },
            result: res,
            summary: res.summary
          })
        } catch (err) {
          showToast('推演失败：' + err.message, 'danger')
        }
        loading.value = false
      }, 600)
    }

    // 设节点追踪
    const openAssume = () => {
      if (!result.value) return
      assumeForm.value = {
        title: result.value.summary || `${tool.value.name}推演结果`,
        days: 30,
        desc: `基于${tool.value.name}推演`
      }
      assumeModal.value = true
    }

    const submitAssume = () => {
      if (!assumeForm.value.title.trim()) {
        showToast('请填写预测内容', 'warn')
        return
      }
      store.createAssumption({
        title: assumeForm.value.title,
        desc: assumeForm.value.desc,
        tool: tool.value.name,
        days: assumeForm.value.days
      })
      showToast('预测已记录，等待回响', 'success', 2000)
      assumeModal.value = false
      setTimeout(() => router.push('/echo'), 800)
    }

    // 交叉印证（功能A）
    const openCrossVerify = () => {
      crossVerifyModal.value = true
      crossVerifyResult.value = null
    }

    const doCrossVerify = (toKey) => {
      if (!result.value) return
      // 从历史中找对应工具的结果
      const hist = store.history.find(h => h.toolKey === toKey)
      if (!hist) {
        showToast('请先使用' + TOOLS.find(t => t.key === toKey)?.name + '推演一次', 'warn')
        return
      }
      crossVerifyResult.value = crossVerify(tool.value.key, result.value, toKey, hist.result)
      crossVerifyResult.value.targetTool = TOOLS.find(t => t.key === toKey)?.name
    }

    // 可交叉印证的目标工具
    const crossVerifyTargets = computed(() => {
      const map = {
        bazi: [{ key: 'ziwei', name: '紫微斗数' }, { key: 'astro', name: '西洋占星' }, { key: 'maya', name: '玛雅历' }],
        ziwei: [{ key: 'bazi', name: '八字排盘' }, { key: 'astro', name: '西洋占星' }],
        astro: [{ key: 'bazi', name: '八字排盘' }, { key: 'ziwei', name: '紫微斗数' }],
        maya: [{ key: 'bazi', name: '八字排盘' }, { key: 'astro', name: '西洋占星' }]
      }
      return map[tool.value.key] || []
    })

    // 渲染输入字段（支持 radio/checkbox/showIf/unit）
    const renderField = (f) => {
      if (!shouldShow(f)) return null

      const colStyle = f.col ? { gridColumn: `span ${f.col}` } : {}

      if (f.type === 'number') {
        return (
          <div class="tool-detail__field" style={colStyle}>
            <label class="tool-detail__label">{f.label}{f.unit && <span class="tool-detail__unit">{f.unit}</span>}</label>
            <input
              class="tool-detail__input"
              type="number"
              value={form.value[f.key]}
              min={f.min}
              max={f.max}
              onInput={(e) => form.value[f.key] = parseInt(e.target.value) || 0}
            />
          </div>
        )
      }
      if (f.type === 'select') {
        return (
          <div class="tool-detail__field" style={colStyle}>
            <label class="tool-detail__label">{f.label}</label>
            <select
              class="tool-detail__input tool-detail__select"
              value={form.value[f.key]}
              onChange={(e) => form.value[f.key] = e.target.value}
            >
              {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        )
      }
      if (f.type === 'radio') {
        return (
          <div class="tool-detail__field" style={colStyle}>
            <label class="tool-detail__label">{f.label}</label>
            <div class="tool-detail__radio">
              {f.options.map(o => (
                <button
                  key={o.value}
                  type="button"
                  class={`tool-detail__radio-btn ${form.value[f.key] === o.value ? 'tool-detail__radio-btn--active' : ''}`}
                  onClick={() => form.value[f.key] = o.value}
                >{o.label}</button>
              ))}
            </div>
          </div>
        )
      }
      if (f.type === 'checkbox') {
        const checked = form.value[f.key]
        return (
          <div class="tool-detail__field" style={colStyle}>
            <label class="tool-detail__label">{f.label}</label>
            <button
              type="button"
              class={`tool-detail__toggle ${checked ? 'tool-detail__toggle--on' : ''}`}
              onClick={() => form.value[f.key] = !checked}
            >
              <span class="tool-detail__toggle-knob"></span>
              <span class="tool-detail__toggle-text">{checked ? '已开启' : '已关闭'}</span>
            </button>
          </div>
        )
      }
      if (f.type === 'textarea') {
        return (
          <div class="tool-detail__field tool-detail__field--full" style={colStyle}>
            <label class="tool-detail__label">{f.label}</label>
            <textarea
              class="tool-detail__textarea"
              value={form.value[f.key]}
              onInput={(e) => form.value[f.key] = e.target.value}
              placeholder={f.placeholder || ''}
              rows="2"
            />
          </div>
        )
      }
      if (f.type === 'text') {
        return (
          <div class="tool-detail__field" style={colStyle}>
            <label class="tool-detail__label">{f.label}</label>
            <input
              type="text"
              class="tool-detail__input"
              value={form.value[f.key]}
              onInput={(e) => form.value[f.key] = e.target.value}
              placeholder={f.placeholder || ''}
            />
          </div>
        )
      }
      if (f.type === 'date') {
        return (
          <div class="tool-detail__field" style={colStyle}>
            <label class="tool-detail__label">{f.label}</label>
            <input
              class="tool-detail__input"
              type="date"
              value={form.value[f.key]}
              onInput={(e) => form.value[f.key] = e.target.value}
            />
          </div>
        )
      }
      return null
    }

    return () => {
      const e = engine.value
      if (!e) {
        return (
          <div class="tool-detail">
            <TopBar title="未找到" back />
            <div class="container"><p>该工具尚未实现</p></div>
          </div>
        )
      }
      const Renderer = result.value ? ResultRenderers[result.value.resultType] : null
      return (
        <div class="tool-detail">
          <TopBar title={tool.value.name} subtitle={tool.value.desc} back />
          <div class="container">
            <EchoCard level="tertiary">
              <div class="tool-detail__intro">
                <div class="tool-detail__glyph">{tool.value.glyph}</div>
                <div>
                  <div class="tool-detail__name">{tool.value.name}</div>
                  <div class="tool-detail__desc">{tool.value.desc} · 作为 Echo 假设的输入端</div>
                </div>
              </div>
            </EchoCard>

            <EchoCard level="secondary" title="输入">
              <div class="tool-detail__form">
                {e.inputConfig.map(f => <Fragment key={f.key}>{renderField(f)}</Fragment>)}
              </div>
              <EchoButton variant="primary" block loading={loading.value} onClick={calc} class="tool-detail__calc-btn">
                {loading.value ? '推演中…' : calcLabel.value}
              </EchoButton>
            </EchoCard>

            {result.value && Renderer && (
              <div class="tool-detail__result">
                {Renderer(result.value)}

                {/* 交叉印证（功能A） */}
                {crossVerifyTargets.value.length > 0 && (
                  <EchoCard level="tertiary">
                    <div class="tool-detail__crossverify">
                      <div class="tool-detail__crossverify-title">交叉印证</div>
                      <p class="tool-detail__crossverify-text">
                        用其他工具的结果与本推演互相印证，看不同体系是否指向同一结论。
                      </p>
                      <div class="tool-detail__crossverify-btns">
                        {crossVerifyTargets.value.map(t => (
                          <EchoButton key={t.key} variant="ghost" size="sm" onClick={() => doCrossVerify(t.key)}>{t.name}印证</EchoButton>
                        ))}
                      </div>
                      {crossVerifyResult.value && (
                        <div class="crossverify-result">
                          <div class="crossverify-result__header">
                            <span>与{crossVerifyResult.value.targetTool}印证</span>
                            <EchoBadge variant={crossVerifyResult.value.score >= 70 ? 'gold' : crossVerifyResult.value.score >= 50 ? 'accent' : 'muted'}>
                              {crossVerifyResult.value.score}分吻合
                            </EchoBadge>
                          </div>
                          <div class="crossverify-result__dims">
                            {crossVerifyResult.value.dimensions.map(d => (
                              <div class={`crossverify-dim ${d.match ? 'crossverify-dim--match' : 'crossverify-dim--nomatch'}`} key={d.name}>
                                <span class="crossverify-dim__name">{d.name}</span>
                                <span class="crossverify-dim__from">{d.from}</span>
                                <span class="crossverify-dim__arrow">↔</span>
                                <span class="crossverify-dim__to">{d.to}</span>
                                <EchoTag variant={d.match ? 'ok' : 'muted'}>{d.match ? '吻合' : '差异'}</EchoTag>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </EchoCard>
                )}

                {/* AssumeDialog - 核心钩子 */}
                <EchoCard level="tertiary">
                  <div class="tool-detail__assume">
                    <div class="tool-detail__assume-title">这条预测准吗？</div>
                    <p class="tool-detail__assume-text">
                      设一个节点，{assumeForm.value.days} 天后回来看应验几分。每次复盘都让命格可信度积累。
                    </p>
                    <EchoButton variant="gold" size="sm" onClick={openAssume}>设节点追踪</EchoButton>
                  </div>
                </EchoCard>

                <EchoButton variant="ghost" block onClick={() => router.push('/echo')}>查看所有印证 →</EchoButton>
              </div>
            )}
          </div>

          {/* AssumeDialog 弹窗 */}
          <EchoModal
            modelValue={assumeModal.value}
            onUpdate:modelValue={(v) => assumeModal.value = v}
            title="设节点追踪"
            vSlots={{
              default: () => (
                <div class="assume-form">
                  <div class="assume-form__field">
                    <label class="assume-form__label">预测内容</label>
                    <textarea
                      class="assume-form__textarea"
                      value={assumeForm.value.title}
                      onInput={(e) => assumeForm.value.title = e.target.value}
                      rows="2"
                    />
                  </div>
                  <div class="assume-form__field">
                    <label class="assume-form__label">回看时间</label>
                    <div class="assume-form__days">
                      {[7, 30, 90, 180].map(d => (
                        <button
                          key={d}
                          class={`assume-form__day ${assumeForm.value.days === d ? 'assume-form__day--active' : ''}`}
                          onClick={() => assumeForm.value.days = d}
                        >{d} 天</button>
                      ))}
                    </div>
                  </div>
                </div>
              ),
              footer: () => [
                <EchoButton variant="ghost" onClick={() => assumeModal.value = false}>取消</EchoButton>,
                <EchoButton variant="primary" onClick={submitAssume}>发起预测</EchoButton>
              ]
            }}
          />
        </div>
      )
    }
  }
})
