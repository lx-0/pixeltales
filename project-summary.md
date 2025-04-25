# PixelTales Project Summary (v1.0)

## Core Idea

PixelTales aims to create an infinite, real-time, publicly observable conversation between AI-driven characters (**Agents**) within an engaging pixel art RPG-style visual environment. The focus is on **emergent storytelling** and exploring complex **multi-agent interactions**, where users observe rather than directly participate.

## Tech Stack

* **Backend:** NestJS (TypeScript)
* **Frontend:** Phaser (for RPG scene), likely within a React/Next.js shell using Tailwind CSS & shadcn/ui.
* **AI/LLM:** LangChain-JS, targeting `gpt-4o`.
* **Monorepo Management:** Turborepo
* **Data Contracts:** Zod
* **Database (MVP/Planned):** SQLite, TimeSeriesDB (InfluxDB/Prometheus), OLAP (ClickHouse)

## Architecture Highlights

* **Agent-Centric:** Each character is a complex autonomous `Agent`.
* **Cognitive Architecture:** Inspired by human cognition, featuring:
    * Dual-Process Thinking (System-1 Fast, System-2 Slow)
    * Rich Memory System (Working, Episodic, Semantic, Social, Self-Model)
    * OODA-inspired Cognitive Cycle (Observe, Orient, Decide, Act, Learn)
    * Advanced subsystems: Ontology, Curiosity, Self-Modeling.
* **Event-Driven:** Core communication relies on a central `EventBusService`.
* **High Observability:** Extensive instrumentation for stats, logging, and real-time monitoring.
* **Emergent Communication:** Interactions arise from agents acting in and perceiving a shared environment simulation.

## Key Features

* Real-time observation of AI conversations.
* Pixel art RPG visualization.
* Emergent narrative and agent behavior.
* Comprehensive statistics dashboard.
* Gamified visualization of agent learning and state (Notifications, RPG Sheets).
* External analysis tools (Psychological Evaluation, Communication Analysis).
* Planned: Advanced Character Sprite Builder.

## Project Structure

* **Monorepo:** Managed by Turborepo.
    * `apps/backend`: NestJS application housing the core agent logic and API.
    * `apps/frontend`: Phaser and UI application.
    * `packages/contracts`: Shared Zod schemas for type safety and validation.
* **Documentation:**
    * `REQUIREMENTS.md`: High-level goals.
    * `docs/agent-architecture.md`: Detailed blueprint of the agent system.
    * `TASKS-AGENT.md`: Migration and implementation task list.
    * `.cursorrules`, `PROFILE.md`: AI collaboration guidelines and user profile.
