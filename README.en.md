<div align="center">

# Echo

**Destiny Verification Engine**

*Initiate predictions, await the echo*

[简体中文](./README.md) | [English](./README.en.md) | [日本語](./README.ja.md)

![Vue](https://img.shields.io/badge/Vue-3.5-42b883?logo=vuedotjs&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.4-646cff?logo=vite&logoColor=white)
![Pinia](https://img.shields.io/badge/Pinia-2.2-ffd859?logo=pinia&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-blue)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)
![Stars](https://img.shields.io/github/stars/weed33834/echo?style=social)

</div>

---

## What is This

Echo is not fortune-telling software. It is a **hypothesis verification tool**.

The results you get from BaZi, ZiWei, or LiuYao divination are essentially **predictions**. What Echo does is simple: it helps you record these predictions, set verification timepoints, and return later to review whether they came true. Over time, your "destiny credibility" accumulates, and you can see which system works better for you.

Core loop: **Set node → Await echo → Review**

> All divination results are visual representations of cultural algorithms and do not constitute any decision-making basis.

## Feature Overview

### 18 Divination Tools

| Category | Tool | Description |
|----------|------|-------------|
| Destiny | BaZi (八字) | Four pillars, day master, ten gods, luck cycles |
| Destiny | ZiWei (紫微) | 12 palaces, star transformations |
| Destiny | QiMen (奇门) | Nine-palace time board, eight gates |
| Destiny | LiuRen (六壬) | Four lessons, three transmissions |
| Divination | LiuYao (六爻) | Coin toss hexagram, six relations |
| Divination | MeiHua (梅花) | Time-based hexagram, ti-yong analysis |
| Divination | YaoQian (摇钱) | 64 hexagrams coin method |
| Health | ZiWu (子午) | 12-hour meridian flow |
| Health | JieQi (节气) | Seasonal wellness, solar term guidance |
| Daily | HuangLi (黄历) | Daily auspicious/inauspicious, conflicts |
| Daily | JiRi (择吉日) | Event date selection |
| Daily | YunShi (运势) | Personalized daily fortune |
| Western | Astrology | Chart big three, planetary aspects |
| Western | Mayan Calendar | 260 kin, galactic tones |
| Western | Tarot | Major Arcana three-card spread |
| Western | Dream Interpretation | Dream keyword analysis |
| FengShui | FengShui Layout | Nine-palace flying stars |
| FengShui | Nameology | Three talents, five grids, 81 numbers |

### AI Chat

- Supports DeepSeek / OpenAI / Claude / Qwen / Ollama local models
- Tool calling: AI can invoke 18 divination tools
- Web search: Tavily API integration for real-time information
- Security sandbox: parameter validation, timeout control, injection detection
- Knowledge retrieval: fortune-telling knowledge base + solar term awareness + few-shot examples

### Destiny Dashboard

- Five elements radar chart: metal/wood/water/fire/earth distribution
- Five elements interaction graph: generation/destruction network
- Daily advice matrix: diet / lifestyle / exercise / emotion
- Divination timeline: history visualization
- Tool usage statistics
- Luck cycles: ten-year major luck and annual flow

### Destiny Graph

- SVG relationship network: center node + element nodes + tool nodes
- Interactive nodes: click elements for wellness advice
- Verification statistics and destiny level visualization

### Other Features

- Daily check-in + streak milestones
- Compatibility matching: dual BaZi comparison
- Learning center: fortune-telling introductory courses
- Dark mode (Xuan paper / Ink stone dual themes)
- Font size scaling (compact / standard / relaxed)
- Fully responsive: 320px mobile → 4K display

## Tech Architecture

```
src/
├── main.js                    # App entry
├── router/index.js            # 15 routes
├── stores/
│   ├── echo.js                # Destiny/history/profile/tools store
│   └── chat.js                # AI chat/model config store
├── services/
│   ├── ai.js                  # Multi-model AI service
│   ├── tools.js               # Tool scheduling and execution
│   ├── sandbox.js             # Security sandbox
│   └── webSearch.js           # Tavily web search
├── prompts/
│   └── system.js              # System prompts/Few-shot/knowledge base
├── utils/
│   └── engines.js             # 18 divination engines
├── components/
│   ├── EchoUI.jsx             # Base component library
│   ├── TabBar.jsx             # Navigation bar (responsive)
│   ├── ChatFab.jsx            # Floating AI entry
│   ├── BaziChart.jsx          # BaZi visualization
│   └── Timeline.jsx           # Timeline component
├── pages/                     # 15 pages
│   ├── Home.jsx               # Home
│   ├── Tools.jsx              # Tool list
│   ├── ToolDetail.jsx         # Tool divination
│   ├── Profile.jsx            # Profile
│   ├── Daily.jsx              # Daily fortune
│   ├── Dashboard.jsx          # Destiny dashboard
│   ├── Compatibility.jsx      # Compatibility matching
│   ├── Learn.jsx              # Learning center
│   ├── EchoCenter.jsx         # Verification center
│   ├── Graph.jsx              # Destiny graph
│   ├── Chat.jsx               # AI chat
│   ├── Me.jsx                 # Personal center
│   ├── Settings.jsx           # Settings
│   ├── Admin.jsx              # Admin panel
│   └── Checkin.jsx            # Daily check-in
└── designs/                   # Design system
    ├── tokens.css             # Design tokens
    ├── base.css               # Global reset
    ├── animations.css         # Animation keyframes
    └── ...                    # Page styles
```

### Tech Stack

| Tech | Version | Purpose |
|------|---------|---------|
| Vue 3 | 3.5 | Framework (JSX + Composition API) |
| Pinia | 2.2 | State management |
| Vue Router | 4.4 | Routing |
| Vite | 5.4 | Build tool |

**Zero runtime dependencies** — besides Vue/Pinia/Router, everything is self-implemented:
- Markdown renderer (no marked/markdown-it)
- SVG radar / interaction / network graphs (no echarts/d3)
- Toast / Modal / Progress (no UI library)

## Quick Start

```bash
# Clone repository
git clone https://github.com/weed33834/echo.git
cd echo

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview build
npm run preview
```

Open `http://localhost:5173` in your browser.

### Configure AI Chat

1. Go to the "Settings" page
2. Enter your API Key in the "AI Chat" section
3. Or enable "Use default model" for placeholder responses
4. Supported providers: DeepSeek / OpenAI / Claude / Qwen / Ollama

### Admin Panel

Access `#/admin` for the admin panel (set a password in system config on first use).

Features: model management (preset/custom CRUD), prompt management, usage statistics, system config.

## Responsive Design

| Breakpoint | Scenario | Strategy |
|------------|----------|----------|
| ≤340px | Ultra-narrow (iPhone SE 1) | Compress spacing, reduce grid columns |
| 341-767px | Standard mobile | Bottom TabBar, single column |
| 768-1023px | Tablet | Dual column grid, horizontal radar |
| 1024-1439px | Desktop | Side navigation, dual panel |
| ≥1440px | Wide screen | Five-column tool grid |
| ≥1920px | Ultra-wide | Max width 1280px |
| Landscape ≤500h | Mobile landscape | Compress vertical spacing |

## Design Tokens

The project uses CSS custom properties as design tokens:

```css
:root {
  --accent: #5b3fd6;     /* Primary: Purple */
  --gold: #b8893a;       /* Gold */
  --ink: #15131f;        /* Text */
  --bg: #f7f5f0;         /* Background */

  --wuxing-metal: #d4a843;
  --wuxing-wood: #5a9e5a;
  --wuxing-water: #5a8db5;
  --wuxing-fire: #d45a5a;
  --wuxing-earth: #a8825a;
}
```

Supports dark mode (`[data-theme="dark"]`) and font scaling (`[data-font-scale]`).

## Security Sandbox

```
User input → sanitizeInput → detectInjection → AI
                                    ↓
Tool call → validateArgs → executeWithTimeout → sanitizeToolResult → AI
                                    ↓
AI output → validateOutput → append safety notice
```

## Destiny Level System

| Level | Title | XP Required |
|-------|-------|-------------|
| 1 | Initiate | 0 |
| 2 | Awakening | 100 |
| 3 | Profound | 300 |
| 4 | Destiny-Knower | 600 |
| 5 | Insightful | 1000 |
| 6 | Deep Sight | 1500 |
| 7 | Clear Mind | 2200 |
| 8 | True Nature | 3000 |

XP = verification count × 10 + fulfilled count × 20

## Contributing

Issues and Pull Requests are welcome. Read [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

Adding a new divination engine takes 3 steps:
1. Implement `{ calc, meta }` structure in `engines.js`
2. Register tool metadata in `TOOLS` array in `echo.js`
3. Associate engine in `ENGINES` map in `tools.js`

## License

[MIT License](./LICENSE)

## Disclaimer

All divination results in this project are visual representations of cultural algorithms and do not constitute any decision-making basis. The value of fortune-telling culture lies in inspiring thought and self-awareness, not in predicting the future accurately. Echo's core is the verification process of "set node → await echo → review", not whether a single prediction is accurate.

For health, legal, financial, and other sensitive topics, please consult professionals.

---

<div align="center">

**If this project inspires you, a Star is appreciated**

</div>
