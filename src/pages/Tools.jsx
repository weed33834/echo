import { defineComponent } from 'vue'
import { useRouter } from 'vue-router'
import { useEchoStore, TOOLS, CATEGORIES } from '@/stores/echo.js'
import { TopBar } from '@/components/TabBar.jsx'
import { EchoCard, EchoBadge } from '@/components/EchoUI.jsx'

export default defineComponent({
  name: 'Tools',
  setup() {
    const router = useRouter()
    const store = useEchoStore()

    return () => (
      <div class="tools-page">
        <TopBar title="工具" subtitle="命运假设的输入端" />
        <div class="container">
          {CATEGORIES.map(cat => {
            const tools = TOOLS.filter(t => t.cat === cat.key)
            return (
              <section class="tools-page__cat">
                <div class="tools-page__cat-head">
                  <h2 class="tools-page__cat-name">{cat.name}</h2>
                  <span class="tools-page__cat-desc">{cat.desc}</span>
                </div>
                <div class="tools-page__grid">
                  {tools.map(t => (
                    <button class="tool-card" onClick={() => router.push(`/tools/${t.key}`)}>
                      <div class="tool-card__glyph">{t.glyph}</div>
                      <div class="tool-card__info">
                        <div class="tool-card__name">{t.name}</div>
                        <div class="tool-card__desc">{t.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    )
  }
})
