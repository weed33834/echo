/**
 * Learn 命理学堂
 * 知识卡片列表 + 课程详情（正文 / 课后测验）
 * 学习进度持久化于 echo store
 */
import { defineComponent, ref, computed } from 'vue'
import { useEchoStore } from '@/stores/echo.js'
import { TopBar } from '@/components/TabBar.jsx'
import { EchoCard, EchoButton, EchoBadge, EchoTag, EchoProgress, showToast } from '@/components/EchoUI.jsx'
import { LESSONS, LESSON_CATS } from '@/data/lessons.js'

export default defineComponent({
  name: 'Learn',
  setup() {
    const store = useEchoStore()

    // 列表态：分类筛选
    const activeCat = ref('all')
    // 详情态：当前选中的课程
    const selectedLesson = ref(null)
    // 测验作答：{ [questionIndex]: selectedOptionIndex }
    const quizAnswers = ref({})

    // 已完成课程集合（响应式）
    const completedSet = computed(() => new Set(store.learnProgress.completedLessons))

    const filteredLessons = computed(() =>
      activeCat.value === 'all'
        ? LESSONS
        : LESSONS.filter(l => l.cat === activeCat.value)
    )

    const completedCount = computed(() => completedSet.value.size)
    const progressPct = computed(() =>
      LESSONS.length ? Math.round((completedCount.value / LESSONS.length) * 100) : 0
    )

    const catName = (key) => {
      const c = LESSON_CATS.find(c => c.key === key)
      return c ? c.name : key
    }

    const selectLesson = (lesson) => {
      selectedLesson.value = lesson
      quizAnswers.value = {}
    }
    const backToList = () => {
      selectedLesson.value = null
    }

    // 锁定首答：作答后不可改，并展示正误与解析
    const onAnswer = (qIdx, optIdx) => {
      if (quizAnswers.value[qIdx] !== undefined) return
      quizAnswers.value = { ...quizAnswers.value, [qIdx]: optIdx }
    }

    const quizScore = computed(() => {
      const lesson = selectedLesson.value
      if (!lesson || !lesson.quiz.length) return 0
      let correct = 0
      lesson.quiz.forEach((q, i) => {
        if (quizAnswers.value[i] === q.answer) correct++
      })
      return Math.round((correct / lesson.quiz.length) * 100)
    })

    const allAnswered = computed(() => {
      const lesson = selectedLesson.value
      if (!lesson || !lesson.quiz.length) return false
      return lesson.quiz.every((_, i) => quizAnswers.value[i] !== undefined)
    })

    const markComplete = () => {
      const lesson = selectedLesson.value
      if (!lesson) return
      store.markLessonComplete(lesson.id)
      store.setQuizScore(lesson.id, quizScore.value)
      showToast(`已完成「${lesson.title}」，测验 ${quizScore.value} 分`, 'success')
    }

    // 选项按钮样式：未答 / 正确（绿）/ 错选（红）/ 其余
    const optClass = (qIdx, optIdx) => {
      const lesson = selectedLesson.value
      const selected = quizAnswers.value[qIdx]
      if (selected === undefined) return 'learn-page__quiz-opt'
      const q = lesson.quiz[qIdx]
      if (optIdx === q.answer) return 'learn-page__quiz-opt learn-page__quiz-opt--correct'
      if (optIdx === selected) return 'learn-page__quiz-opt learn-page__quiz-opt--wrong'
      return 'learn-page__quiz-opt'
    }

    // 正文渲染：\n\n 分段，**text** 转 <strong>
    const renderContent = (content) => {
      return content.split('\n\n').map((para, i) => {
        const parts = para.split(/\*\*(.+?)\*\*/g)
        const vnodes = []
        parts.forEach((part, j) => {
          if (j % 2 === 1) {
            vnodes.push(<strong>{part}</strong>)
          } else if (part) {
            vnodes.push(part)
          }
        })
        return <p key={i}>{vnodes}</p>
      })
    }

    return () => {
      // ===== 详情视图 =====
      if (selectedLesson.value) {
        const lesson = selectedLesson.value
        const isDone = completedSet.value.has(lesson.id)
        return (
          <div class="learn-page">
            <TopBar title="命理学堂" />
            <div class="container">
              <EchoButton variant="ghost" size="sm" onClick={backToList}>← 返回课程列表</EchoButton>

              <div class="learn-page__detail">
                {/* 标题区 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div class="learn-page__lesson-glyph">{lesson.glyph}</div>
                  <div>
                    <div class="learn-page__detail-title">{lesson.title}</div>
                    <div style={{ marginTop: '4px', display: 'flex', gap: '6px' }}>
                      <EchoTag variant="accent">{catName(lesson.cat)}</EchoTag>
                      {isDone && <EchoBadge variant="ok">已完成</EchoBadge>}
                    </div>
                  </div>
                </div>

                {/* 正文 */}
                <div class="learn-page__detail-content">{renderContent(lesson.content)}</div>

                {/* 课后测验 */}
                {lesson.quiz && lesson.quiz.length > 0 && (
                  <EchoCard level="secondary" title="课后测验">
                    <div class="learn-page__quiz">
                      {lesson.quiz.map((q, qi) => (
                        <div key={qi}>
                          <div class="learn-page__quiz-q">{qi + 1}. {q.q}</div>
                          <div class="learn-page__quiz-options">
                            {q.options.map((opt, oi) => (
                              <button
                                key={oi}
                                class={optClass(qi, oi)}
                                onClick={() => onAnswer(qi, oi)}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                          {quizAnswers.value[qi] !== undefined && q.explanation && (
                            <div style={{
                              marginTop: '8px',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              background: 'var(--bg-3)',
                              fontSize: 'var(--fs-xs)',
                              color: 'var(--muted)',
                              lineHeight: 1.6
                            }}>
                              <span style={{ color: 'var(--accent)', fontWeight: 'var(--fw-medium)' }}>解析：</span>
                              {q.explanation}
                            </div>
                          )}
                        </div>
                      ))}
                      {allAnswered.value && (
                        <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink)', fontWeight: 'var(--fw-medium)' }}>
                          本次得分：{quizScore.value} 分
                        </div>
                      )}
                    </div>
                  </EchoCard>
                )}

                {/* 标记完成 */}
                <EchoButton
                  variant={isDone ? 'secondary' : 'gold'}
                  block
                  onClick={markComplete}
                >
                  {isDone ? '已标记完成 · 再次确认' : '标记完成'}
                </EchoButton>
              </div>
            </div>
          </div>
        )
      }

      // ===== 列表视图 =====
      return (
        <div class="learn-page">
          <TopBar title="命理学堂" back />
          <div class="container">
            {/* 进度 */}
            <EchoCard level="tertiary">
              <div class="learn-page__progress">
                <span>已学 {completedCount.value} / {LESSONS.length} 课</span>
                <EchoProgress value={progressPct.value} variant="gold" />
              </div>
            </EchoCard>

            {/* 分类筛选 */}
            <div class="learn-page__cats">
              {LESSON_CATS.map(cat => (
                <button
                  key={cat.key}
                  class={`learn-page__cat ${activeCat.value === cat.key ? 'learn-page__cat--active' : ''}`}
                  onClick={() => { activeCat.value = cat.key }}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* 课程列表 */}
            <div class="learn-page__lessons">
              {filteredLessons.value.map(lesson => {
                const done = completedSet.value.has(lesson.id)
                return (
                  <div
                    key={lesson.id}
                    class="learn-page__lesson"
                    onClick={() => selectLesson(lesson)}
                  >
                    <div class="learn-page__lesson-glyph">{lesson.glyph}</div>
                    <div class="learn-page__lesson-info">
                      <div class="learn-page__lesson-title">{lesson.title}</div>
                      <div class="learn-page__lesson-desc">{lesson.desc}</div>
                      <div class="learn-page__lesson-meta">
                        <EchoTag variant="muted">{catName(lesson.cat)}</EchoTag>
                        {done && <EchoBadge variant="ok">已完成</EchoBadge>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )
    }
  }
})
