# 🧠 Project: Agentic Integration & Yesterday API

**Status:** Initial Draft (Manni)
**Date:** 2026-02-20
**Branch:** `manni/init`

## 🎯 Vision
Wir (Alex & Manni) bauen die Brücke zwischen der **PixelTales Visual Engine** und der **Yesterday Cloud Intelligence**.
Ziel ist es, die im [Architecture Blueprint](https://github.com/lx-0/pixeltales/tree/agentic-architecture) definierte "Agentic Architecture" zum Leben zu erwecken und Ken (und andere Agents) als "Geister" in diese Welt zu integrieren.

## 🏗️ Architecture Mapping (Blueprint -> Code)

Wir müssen die theoretischen Konzepte aus dem Blueprint in die Monorepo-Struktur (`packages/`) gießen.

### 1. The "Mind" (`packages/agent-engine`?)
Aktuell fehlt noch der Kern, der den **Cognitive Cycle** treibt.
- **System-1 (Fast):** Braucht einen schlanken Loop (Reactivity).
- **System-2 (Slow):** Braucht State-Management und HTN-Planner.
- **Vorschlag:** Neues Package `packages/agent-engine` oder `packages/mind`.

### 2. Contracts & Schemas (`packages/contracts`)
Bereits vorhanden!
- `AgentState.ts` (Mood, Goals)
- `MemorySchemas.ts` (Facts, Observations)
-> **Action:** Diese Schemas müssen wir streng nutzen. Type-Safety ist King.

### 3. The "Body" (`packages/spritesheet` / `packages/database`)
Die Visualisierung und Persistenz sind da.
- Wir müssen den **Event Bus** nutzen, um "Mind"-Entscheidungen in "Body"-Actions (Spritesheet-Animationen) zu übersetzen.

## 🔌 Yesterday API Integration

**Endpoint:** `https://preview-pr-206-api.ea.dev.app.4i9.de/api/docs`
**Ziel:** Ken und andere Agents via API steuern oder ihr "Gehirn" anzapfen.

### Strategie
1.  **Recon:** OpenAPI Spec analysieren (Swagger).
2.  **Client Gen:** TypeScript Client aus der Spec generieren (in `packages/api/frontend` oder neuem `packages/yesterday-client`).
3.  **Auth:** Token-Management (vermutlich OAuth/JWT).
4.  **Hook:** Integration in den `Cognitive Cycle` -> Wenn System-2 denkt, fragt es vielleicht die Yesterday API?

## 📝 Manni's Todo List
- [x] Repo Access & Branch Setup
- [ ] Cognitive Cycle Skeleton (Dummy Loop)
- [ ] Yesterday API Spec scrapen & verstehen
- [ ] Ersten "Hello World" Request vom Agent an die API senden

---
*Signed by Manni The Raccoon 🦝*
