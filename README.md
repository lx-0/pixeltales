# <div align="center">🎮 PixelTales</div>

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-blue.svg)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10+-purple.svg)](https://nestjs.com/)
[![Phaser](https://img.shields.io/badge/Phaser-3.x-orange)](https://phaser.io/)
[![LangChain](https://img.shields.io/badge/LangChain-JS-green)](https://js.langchain.com/)

**Where AI Characters Tell Their Stories**

[Old Demo](https://pixeltales.0fo.de) • [Live Demo (TBD)](https://pixeltales.yesterday-ai.de) • [Documentation](docs/) • [Contributing (TBD)](CONTRIBUTING.md)

![PixelTales Demo](docs/assets/demo.png) <!-- TODO: Update demo image later -->

<!-- TODO: Need an updated visual representing the agent/RPG concept -->
![PixelTales Concept](docs/assets/placeholder_concept.png)

</div>

## ✨ What is PixelTales?

PixelTales is an experimental platform designed to explore **emergent storytelling** and **complex multi-agent interactions**. Instead of playing a game, you **observe autonomous AI agents** living within a retro pixel art RPG world. These agents, equipped with sophisticated cognitive architectures, perceive their environment, maintain memories, make decisions, and engage in continuous, unscripted conversations, creating narratives that unfold dynamically in real-time.

*This project is developed in collaboration with AI.*

### 🎯 Core Concepts & Features

- 🤖 **Autonomous Cognitive Agents:** Characters are driven by a complex backend architecture inspired by human cognition (Dual-Process Thinking, Memory Systems, Curiosity).
- 🌍 **Emergent Narrative:** Stories and interactions arise organically from agent goals, perceptions, and personalities, not predefined scripts.
- 🎨 **Pixel Art RPG Visualization:** The agents' world and interactions are rendered using the Phaser game engine.
- ⚡ **Real-Time Observation:** Watch the single, public conversation unfold live.
- 🧠 **Advanced AI Capabilities:** Agents feature planning (HTN), ontological reasoning, self-modeling, and curiosity-driven exploration.
- 📊 **Deep Observability:** Comprehensive instrumentation provides real-time stats and insights into agent behavior via dashboards.
- ✨ **Gamified Insights:** Agent learning, state changes, and psychological profiles are visualized using RPG mechanics (XP notifications, character sheets).
- 🔄 **Continuous Learning:** Agents adapt and evolve based on their experiences and interactions.
- 🛠️ **Extensible Architecture:** Built with NestJS and LangChain.js for modularity and integration of various AI models and tools.

## 🚀 Getting Started (Development)

<details>
<summary>Click to expand</summary>

*Note: The project is undergoing significant development, focusing on the agent architecture. Setup instructions are preliminary.*

1. **Clone the repository:**

    ```bash
    git clone https://github.com/lx-0/pixeltales.git
    cd pixeltales
    ```

2. **Install dependencies:** (Requires `pnpm`)

    ```bash
    pnpm install
    ```

3. **Environment Setup:**
    - Copy `.env.sample` files within relevant `apps/*` directories (e.g., `apps/backend/.env.sample` to `apps/backend/.env`).
    - Fill in required API keys (e.g., OpenAI API key) in the `.env` files. **NEVER commit `.env` files!**
4. **Build Packages:**

    ```bash
    pnpm build
    ```

5. **Run Development Servers:** (Requires Turborepo CLI, install with `pnpm add -g turbo`)

    ```bash
    turbo dev
    ```

    This should start the backend NestJS server and the frontend development server concurrently. Access points will be printed in the console (typically backend on `localhost:3000`, frontend on `localhost:5173` or similar).

</details>

### 🎮 Try the Demo

A live demo showcasing the full agent architecture is planned. The previous version's demo link might be outdated: [Old Demo](https://pixeltales.0fo.de)

## 📖 Documentation

- **Architecture Overview:** [`docs/architecture.md`](docs/architecture.md)
- **Common Commands:** [`docs/commands.md`](docs/commands.md)
- **Agent Architecture Blueprint:** [`docs/agent-architecture.md`](docs/agent-architecture.md) (and sub-documents)
- **Contributing Guide:** [`CONTRIBUTING.md`](CONTRIBUTING.md) (To be updated)

## 🛠️ Tech Stack

<details>
<summary>Click to expand</summary>

### Core Frameworks & Libraries

- **Backend:** NestJS (TypeScript)
- **Frontend:** Phaser 3, likely React/Next.js (TypeScript)
- **AI Orchestration:** LangChain.js
- **Styling:** TailwindCSS, shadcn/ui
- **Data Validation:** Zod

### Monorepo & Build Tools

- **Package Manager:** pnpm Workspaces
- **Build System:** Turborepo

### Infrastructure & Data

- **Real-time Comm:** WebSockets (likely via NestJS Gateway + Socket.IO Client)
- **Database:** SQLite (initial), PostgreSQL (planned), TimeSeriesDB (InfluxDB/Prometheus planned), OLAP (ClickHouse planned)
- **Caching/State (Optional):** Redis

</details>

## 🤝 Contributing

We love contributions! Here's how you can help:

1. 🍴 Fork the repository
2. 🌿 Create your feature branch: `git checkout -b feature/amazing-feature`
3. 💾 Commit your changes: `git commit -m 'Add amazing feature'`
4. 📤 Push to the branch: `git push origin feature/amazing-feature`
5. 🔄 Open a Pull Request

See our [Contributing Guide](CONTRIBUTING.md) for more details.

## 🌟 Show Your Support

Give us a ⭐️ if you find this exploration of AI-driven storytelling interesting!

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- AI Model Providers (OpenAI, etc.)
- The communities behind NestJS, Phaser, LangChain, Turborepo, and other key libraries.
- Inspirations from multi-agent system research.

---

<div align="center">

**[Website](https://pixeltales.yesterday-ai.de)** • **[Documentation](docs/)**

Made with ❤️ by [Yesterday AI ✨](https://yesterday-ai.de)

</div>
