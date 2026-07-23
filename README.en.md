<div align="center">

# Echo

**Destiny Verification Engine**

*Initiate predictions, await the echo*

[简体中文](./README.md) | [English](./README.en.md) | [日本語](./README.ja.md)

**[Live Demo →](https://weed33834.github.io/echo/)**

![Vue](https://img.shields.io/badge/Vue-3.5-42b883?logo=vuedotjs&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.1-646cff?logo=vite&logoColor=white)
![Pinia](https://img.shields.io/badge/Pinia-4.0-ffd859?logo=pinia&logoColor=black)
![Vue Router](https://img.shields.io/badge/Vue_Router-5.2-42b883?logo=vuedotjs&logoColor=white)
![Node](https://img.shields.io/badge/Node-%E2%89%A522-339933?logo=nodedotjs&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)
![CI](https://img.shields.io/github/actions/workflow/status/weed33834/echo/ci.yml?branch=main&label=CI)
![Deploy](https://img.shields.io/github/actions/workflow/status/weed33834/echo/deploy.yml?branch=main&label=Deploy)
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
- Three-theme switching (XuanYe dark / Xuan paper light / auto by time of day)
- Font size scaling (compact / standard / relaxed)
- Fully responsive: 320px mobile → 4K display

## Tech Architecture

```
src/
├── main.js                    # App entry
├── router/index.js            # 16 routes
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
├── pages/                     # 16 pages
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
│   ├── Checkin.jsx            # Daily check-in
│   └── Compass.jsx            # Feng Shui Compass
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
| Pinia | 4.0 | State management |
| Vue Router | 5.2 | Routing |
| Vite | 8.1 | Build tool |

**Zero runtime dependencies** — besides Vue/Pinia/Router, everything is self-implemented:
- Markdown renderer (no marked/markdown-it)
- SVG radar / interaction / network graphs (no echarts/d3)
- Toast / Modal / Progress (no UI library)

## Quick Start

> Prerequisites: Node.js ≥ 22 (see `.nvmrc`), npm ≥ 9

```bash
# Clone repository
git clone https://github.com/weed33834/echo.git
cd echo

# Install dependencies
npm install

# (Optional) Configure environment variables
cp .env.example .env  # Fill in your API keys, or configure in-app Settings page

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
  /* Inkstone palette — Warm black canvas + Ancient copper gold */
  --accent: #a68b5b;     /* Ancient copper gold */
  --accent-2: #c4a263;   /* Bright gold */
  --ink: #e8e0d4;        /* Warm white ink */
  --bg: #0a0908;         /* Warm black canvas */

  --wuxing-metal: #c9b06b;
  --wuxing-wood: #6b9b6b;
  --wuxing-water: #6b8eb5;
  --wuxing-fire: #c96b5a;
  --wuxing-earth: #a8825a;
}
```

Dark theme is the default. Light mode via `[data-theme="light"]`. Font scaling via `[data-font-scale]`.

## Security Sandbox

```
User input → sanitizeInput → detectInjection → AI
                                    ↓
Tool call → validateArgs → executeWithTimeout → sanitizeToolResult → AI
                                    ↓
AI output → validateOutput → append safety notice
```

## Destiny Level System

| Level | Title | XP Threshold |
|-------|-------|--------------|
| 1 | Initiate | 0 |
| 2 | Gradual Awakening | 50 |
| 3 | Enlightenment | 200 |
| 4 | Profound | 500 |
| 5 | Clear Insight | 1,000 |
| 6 | Knowing Destiny | 2,000 |
| 7 | Deep Sight | 3,500 |
| 8 | True Nature | 5,000 |
| 9 | Reaching Truth | 6,500 |
| 10 | Harmony | 8,000 |
| 11 | Heavenly Revelation | 10,000 |

XP = match score × 30 + 10 (weighted by review match), check-in +5, guide completion +20

## Documentation

| Document | Description |
|----------|-------------|
| [SPEC.md](./SPEC.md) | Technical spec (architecture / engines / design system / security) |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Contributing guide (dev setup / code style / commit conventions) |
| [SECURITY.md](./SECURITY.md) | Security policy (vulnerability reporting / sandbox / guardrails) |
| [CHANGELOG.md](./CHANGELOG.md) | Changelog |
| [.env.example](./.env.example) | Environment variable template |

## Contributing

Issues and Pull Requests are welcome. Read [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

Adding a new divination engine takes 3 steps:
1. Implement `{ inputConfig, calc }` structure in `engines.js`
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
