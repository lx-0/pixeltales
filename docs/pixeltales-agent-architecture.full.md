# PixelTales Agent Architecture Blueprint (v1.0)

2025 by yesterday AI, <alex@yesterday-ai.de>

## 0. Document Index

- **1. Introduction & Foundation**
    - **1.1 Overall System Goal & Vision**
    - **1.2 Introduction: The Agent-Centric Vision**
    - **1.3 Agentic Subsystems Overview**

- **2. [Core Subsystems](docs/agent-architecture/02-core-subsystems.md)**
    - **2.1 The `Agent`: Core Autonomous Entity**
        - 2.1.1 Agent's Mind – A Unifying View
        - 2.1.2 Theoretical Foundation: Dual-Process Cognition
        - 2.1.3 Implementation in PixelTales
        - 2.1.4 The Planner/Executor: Bridging Thought and Action
        - 2.1.5 Subsystem Integration
        - 2.1.6 Reflection Mechanism
    - **2.2 Perception System: The Agent's Senses**
    - **2.3 Cognitive Cycle: The Agent's Thought Process**
        - 2.3.1 Enhanced Planning (HTN-based)
        - 2.3.2 Reflection – Borrowing from *Thinking, Fast & Slow*
        - 2.3.3 Orchestration of Asynchronous Subsystems
        - 2.3.4 Cognitive Context Composition
        - 2.3.5 Context Selection for LLM Interaction
    - **2.4 Internal State & Memory System**
        - 2.4.1 Internal State: Dynamic State
            - State Management: Moods and Motivations
        - 2.4.2 Memory System: Storing and Recalling Experiences
            - 2.4.2.1 Memory System Overview
            - 2.4.2.2 Working Memory
            - 2.4.2.3 Episodic Memory
            - 2.4.2.4 Semantic Memory
            - 2.4.2.5 Social Memory
            - 2.4.2.6 Self Model
            - 2.4.2.7 Memory Utilization in the Cognitive Cycle
            - 2.4.2.8 Learning Notifications
    - **2.5 Action System: Executing Decisions**
    - **2.6 Capability Extensions**
    - **2.7 Internal Interface Tools**
        - 2.7.1 Purpose and Design
        - 2.7.2 Core Internal Tools
        - 2.7.3 Implementation Approach
        - 2.7.4 Integration with Cognitive Cycle
        - 2.7.5 Integration Points
    - **2.8 Learning & Adaptation Foundation**
    - **2.9 Synthesizing & Driving Systems**
        - 2.9.1 Reflection System: Synthesizing Experience
        - 2.9.2 Curiosity & Discovery System
    - **2.10 Ontological Reasoning System**
    - **2.11 Self-Modeling System**
    - **2.12 Interaction Model: Environment Simulation & Emergent Communication**

- **3. [Instrumentation & Advanced Features](docs/agent-architecture/03-instrumentation-features.md)**
    - **3.1 Event Bus & Communication**
        - 3.1.1 Architecture & Design Principles
        - 3.1.2 Core Components
        - 3.1.3 Key Event Types
        - 3.1.4 Integration with Analytics
        - 3.1.5 Communication Patterns
    - **3.2 Statistics & Logging Concept**
        - 3.2.1 Key Metrics
        - 3.2.2 Instrumentation & Data Flow
            - 3.2.2.1 Real-Time Statistics Architecture
            - 3.2.2.2 Stats Type Definitions (TypeScript & Zod)
        - 3.2.3 Logging & Storage
        - 3.2.4 Dashboard & UX Mockup
        - 3.2.5 UX Considerations
    - **3.3 Psychological Evaluation System**
        - 3.3.1 Purpose and Goals
        - 3.3.2 Evaluation Framework
        - 3.3.3 Implementation Details
        - 3.3.4 Visualization Components
    - **3.4 Inter-Agent Communication Analysis**
    - **3.5 Agent State Visualization**
        - 3.5.1 Purpose and Goals
        - 3.5.2 State Broadcast System
        - 3.5.3 Visualization Interface
        - 3.5.4 Historical State Navigation
    - **3.6 Learning Notification System**
        - 3.6.1 Purpose and Goals
        - 3.6.2 Notification Types
        - 3.6.3 Implementation Details
        - 3.6.4 Notification Appearance
        - 3.6.5 Integration Points
    - **3.7 In-Game Agent Mind Visualization**

- **4. [Integration, Architecture & Performance](docs/agent-architecture/04-integration-architecture-performance.md)**
    - **4.1 Integration Layer**
        - 4.1.1 Key Responsibilities
        - 4.1.2 Architectural Patterns
            - 4.1.2.1 Facade Pattern
            - 4.1.2.2 Mediator Pattern
            - 4.1.2.3 Adapter Pattern
        - 4.1.3 Cross-Module State Management
        - 4.1.4 Module Lifecycle Management
        - 4.1.5 Error Handling & Resilience
        - 4.1.6 Observability Infrastructure
    - **4.2 Key Data Structures (`packages/contracts`)**
    - **4.3 Integration Diagram**
    - **4.4 File Structure**
    - **4.5 Performance Considerations: Subsystem Classification**
        - 4.5.1 Computational Classification of Subsystems
        - 4.5.2 Performance Bottleneck Analysis
        - 4.5.3 Optimization Strategies
        - 4.5.4 Monitoring & Adaptation
        - 4.5.5 Temporal Decoupling for Real-Time Responsiveness
            - 4.5.5.1 Temporal Decoupling Patterns
            - 4.5.5.2 Implementation Approaches
            - 4.5.5.3 Subsystem-Specific Approaches
            - 4.5.5.4 Non-Blocking Agent API Dåesign
            - 4.5.5.5 Consistency Management
    - **4.6 Legacy Application Integration**
        - 4.6.1 Adaptable Components
        - 4.6.2 Crucial Integration Interfaces

- **5. [Future Directions](docs/agent-architecture/05-future-directions.md)**
    - **5.1 Future Directions**

## 1. Introduction & Foundation

### 1.1 Overall System Goal & Vision

PixelTales aims to create an **infinite, real-time, and publicly observable conversation** between AI-driven characters, presented within an engaging **pixel art RPG-style visual environment**. This project stems from a fascination with **multi-agent systems** and the exploration of **AI's potential for dynamic storytelling and emergent behavior**.

**Core Objectives:**

1. **Simulate Believable Characters:** Develop autonomous agents (`Agent` entities) capable of perceiving their environment, maintaining complex internal states and memories, making decisions aligned with their defined personalities and roles, and interacting dynamically within a shared scene.
2. **Real-Time Interaction:** Ensure the conversation flows naturally and is observable by users in real-time, mimicking a continuous interaction between characters.
3. **Emergent Storytelling:** Foster situations where the narrative evolves organically from the agents' interactions, goals, and discoveries, rather than following a predefined script.
4. **Exploration & Innovation:** Serve as a platform for experimenting with advanced AI concepts like **intrinsic motivation (curiosity), self-modeling, hierarchical planning, and continuous learning**, reflecting a drive for discovery and pushing the boundaries of collaborative AI.
5. **Engaging User Experience:** Provide a visually appealing interface (pixel art RPG) and gamified elements (e.g., learning notifications, state visualization) that make the agents' cognitive processes transparent and engaging for observers.
6. **Observability & Analysis:** Implement comprehensive logging, statistics, and *external* analysis tools (like psychological profiling) to understand, evaluate, and refine agent behavior over time.

This architecture moves beyond simple request-response models towards a **holistic simulation of autonomous entities** operating within a shared digital world, driven by a passion for building innovative, emotionally resonant AI systems and exploring their societal implications.

### 1.2 Introduction: The Agent-Centric Vision

This document outlines the agent-centric architecture designed for PixelTales. Moving beyond a simple request-response model, this architecture treats each character as an autonomous `Agent` entity. The goal is to simulate more realistic and dynamic interactions where agents perceive their environment, maintain internal state and memory, make decisions based on their personality and context, and act upon the shared world. This approach aligns with modern multi-agent system research, emphasizing autonomy, perception, memory, and structured reasoning.

Central to this design is the principle of **strict typing and structured data flow**. All significant internal states, decisions, actions, and communication events are represented by well-defined Zod schemas located in `packages/contracts`, ensuring predictability, observability, and integration with UI features.

The architecture incorporates **comprehensive instrumentation, logging, and real-time analytics** throughout all components. Every significant event, state transition, decision point, and agent interaction is captured, timestamped, and channeled into both persistent storage and real-time monitoring systems. This observability layer enables:

1. **Real-time agent performance dashboards** for monitoring ongoing conversations and agent behavior
2. **Retrospective analysis** for debugging, tuning, and improving agent cognition
3. **A/B testing frameworks** for systematically evaluating alternative reasoning approaches
4. **Agent development metrics** for tracking learning and adaptation over time
5. **Gamified user interfaces** that expose relevant agent state changes to end users
6. **External evaluation frameworks** for analyzing agent behavior (e.g., psychological profiles, communication dynamics).

The collected metrics and events not only serve development and debugging purposes but also enable the gamified visualization of agent development, turning internal state changes into engaging user-facing experiences. **Crucially, advanced analytical evaluations (like psychological profiling) are performed *externally* based on these events and are not directly accessible or used by the agents themselves.**

### 1.3 Agentic Subsystems Overview

The agent architecture consists of several interconnected subsystems, each handling specific aspects of cognitive processing and interaction:

```diagram/text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                                AGENT ARCHITECTURE OVERVIEW                                   │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                                   AGENT'S INTERNAL ARCHITECTURE                         │ │
│  │                                                                                         │ │
│  │  ┌─────────────────────────┐   ┌─────────────────────────┐   ┌───────────────────────┐  │ │
│  │  │     Core Cognitive      │   │        Memory &         │   │     Agent Learning    │  │ │
│  │  │        Systems          │   │      Knowledge Systems  │   │     & Development     │  │ │
│  │  ├─────────────────────────┤   ├─────────────────────────┤   ├───────────────────────┤  │ │
│  │  │                         │   │                         │   │                       │  │ │
│  │  │ • Perception System     │   │ • Memory System         │   │ • Self-Modeling       │  │ │
│  │  │   (2.2)                 │   │   - Working Memory      │   │   System (2.11)       │  │ │
│  │  │ • Cognitive Cycle (2.3) │   │   - Episodic Memory     │   │                       │  │ │
│  │  │   ┌─────────────────┐   │   │   - Semantic Memory     │   │                       │  │ │
│  │  │   │  System-1       │   │   │   - Social Memory       │   │                       │  │ │
│  │  │   │  (Fast, 2.1.3)  │   │   │   (2.4)                 │   │                       │  │ │
│  │  │   └─────────────────┘   │   │ • Ontology System       │   │                       │  │ │
│  │  │   ┌─────────────────┐   │   │   - Concept Network     │   │                       │  │ │
│  │  │   │  System-2       │   │   │   - Relation Reasoning  │   │                       │  │ │
│  │  │   │  (Slow, 2.1.3)  │   │   │   (2.10)                │   │                       │  │ │
│  │  │   └─────────────────┘   │   │                         │   │                       │  │ │
│  │  │ • Planner/Executor      │   │                         │   │ • Learning System     │  │ │
│  │  │   (2.1.4)               │   │                         │   │   - Policy Updates    │  │ │
│  │  │ • Action System (2.5)   │   │                         │   │   - Meta-Learning     │  │ │
│  │  │ • Capability Extensions │   │                         │   │   - Adaptation        │  │ │
│  │  │   (2.6)                 │   │                         │   │   (2.8)               │  │ │
│  │  │ • Internal Tools (2.7)  │   │                         │   │                       │  │ │
│  │  │                         │   │                         │   │                       │  │ │
│  │  └───────────┬─────────────┘   └───────────┬─────────────┘   └───────────┬───────────┘  │ │
│  │              │                             │                             │              │ │
│  │              │      ┌───────────────────┐  │                             │              │ │
│  │              └──────┤ Curiosity System  ├──┴─────────────────────────────┘              │ │
│  │                     │     (2.9)         │                                               │ │
│  │                     └───────────────────┘                                               │ │
│  │                                                                                         │ │
│  └───────────────────────────────────┬─────────────────────────────────────────────────────┘ │
│                                      │                                                       │
│  ┌───────────────────────────────────┴─────────────────────────────────────────────────────┐ │
│  │                                                                                         │ │
│  │                                  INTEGRATION LAYER                                      │ │
│  │                                      (4.1)                                              │ │
│  │  • State Synchronization     • Cross-Module Communication     • Service Lifecycle       │ │
│  │  • Error Handling            • Observability Infrastructure   • Middleware Patterns     │ │
│  │                                                                                         │ │
│  └──────────────┬─────────────────────────────┬─────────────────────────────┬──────────────┘ │
│                 │                             │                             │                │
│                 ▼                             ▼                             ▼                │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                                    EVENT BUS                                            │ │
│  │                                     (3.1)                                               │ │
│  │ • Publish/Subscribe       • Event Broadcasting        • Message Routing                 │ │
│  │ • Protocol Management     • Event Filtering           • Hierarchical Namespaces         │ │
│  │                                                                                         │ │
│  └───────────────────────────────────────┬─────────────────────────────────────────────────┘ │
│                                          │                                                   │
│            ┌───────────────────────────┐ │ ┌───────────────────────────────────────────────┐ │
│            │                           │ │ │                                               │ │
│            ▼                           │ │ ▼                                               │ │
│  ┌─────────────────────────┐           │ │ ┌────────────────────────┐  ┌────────────────┐  │ │
│  │  Learning Notification  │           │ │ │  External Analysis     │  │   Statistics   │  │ │
│  │  System                 │           │ │ │  (Separate Systems)    │  │   & Monitoring │  │ │
│  │  (3.6)                  │           │ │ │  (3.3, 3.4)            │  │  (3.2)         │  │ │
│  │ • XP Generation         │           │ │ │ • Psychological Eval   │  │ • Metrics      │  │ │
│  │ • User Alerts           │◄──────────┘ └─┤ • Communication        │  │   Collection   │  │ │
│  │ • Gamification          │               │   Analysis             │  │ • Dashboard    │  │ │
│  │ • Progress Tracking     │               │ • Relationship Mapping │  │   Views        │  │ │
│  └─────────────────────────┘               └────────────────────────┘  │ • Time Series  │  │ │
│                                                                        │   DB           │  │ │
│                                                                        │ • Alert        │  │ │
│                                                                        │   Thresholds   │  │ │
│                                                                        └───────┬────────┘  │ │
│                                                                                │           │ │
│                                                                                │           │ │
│                                                                                └───────────┘ │
│                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
                        ┌─────────────────────────────────┐
                        │   Environment Simulation Layer   │
                        │          (2.12)                  │
                        │   (Mediates agent interactions)  │
                        └─────────────────────────────────┘
```

**Core Cognitive Systems**:
- **Perception System (2.2)**: Filters and processes incoming environmental events via perception extensions.
- **Cognitive Cycle (2.3)**: Implements the OODA-inspired reasoning loop with dual-process cognition:
    - **System-1 (Fast)**: Provides immediate, intuitive responses with minimal cognitive effort (2.1.3)
    - **System-2 (Slow)**: Handles complex, deliberative thinking requiring more resources (2.1.3)
- **Planner/Executor (2.1.4)**: Bridges thought and action through hierarchical task networks.
- **Action System (2.5)**: Formats decisions and dispatches them to capability extensions for execution.
- **Capability Extensions (2.6) & Internal Interface Tools (2.7)**: Provides specific means to act upon the environment or access internal functions.

**Memory & Knowledge Systems**:
- **Memory System (2.4)**: Manages episodic, semantic, working, and social memory
- **Ontology System (2.10)**: Organizes knowledge into structured hierarchical concepts

**Agent Learning & Development**:
- **Self-Modeling System (2.11)**: Maintains the agent's understanding of its own capabilities
- **Learning System (2.8)**: Refines planning and decision-making through experience

**Synthesizing & Driving Systems (2.9)**:
- Serves a dual role connecting both knowledge
acquisition and agent development
- Drives intrinsic motivation, exploration, and
hypothesis testing
- **Reflection System (2.9.1)**: Orchestrates synthesis of experience into cross-domain insights.
- **Curiosity System (2.9.2)**: Drives intrinsic motivation, exploration, and hypothesis testing.

**Integration Layer (4.1)**:
- Routes information between subsystems
- Manages state updates and synchronization
- Ensures consistency across agent cognitive processes

**Infrastructure & Instrumentation**:
- **Event Bus (3.1)**: Provides asynchronous message passing between systems
- **Learning Notification System (3.6)**: Generates gamified alerts for significant agent learning events
- **Statistics & Monitoring (3.2)**: Collects metrics and enables real-time observation
- **External Analysis Systems (Separate)**:
    - **Psychological Evaluation (3.3)**: *External* analysis of agent behavior using psychological frameworks.
    - **Communication Analysis (3.4)**: *External* analysis of inter-agent communication dynamics and relationships.

Each subsystem is developed as a cohesive module with well-defined interfaces, enabling independent testing and evolution while maintaining integration with the overall architecture. **External analysis systems consume data from the Event Bus/Statistics but do not feed information back into the agent's cognitive loop.**


# 2. Core Subsystems

## 2.1 The `Agent`: Core Autonomous Entity

Each character participating in a scene is represented by an instance of the `Agent` (likely implemented as a NestJS service instance or managed class). The `Agent` is the primary locus of state, perception, cognition, and action.

The following diagram illustrates the flow of information and decision-making within a single agent, drawing parallels to human cognitive processes:

```diagram/text
+------------------------------------------------------------------------------------------------------------------------------------------+
|                                         🧠 AGENT'S MIND (ENTIRE COGNITIVE ARCHITECTURE)                                                  |
+------------------------------------------------------------------------------------------------------------------------------------------+
|                                                                                                                                          |
|       Environmental Events (Perceived via Vision/Audio/Other Sensors)                                                                    │
|                          +---------------------------------------------------------------------------------------------------------------┼---+
|                          v                                                                                                               |   |    Agent Actions
| +--------------------------+         +-----------------------------+         +--------------------------+  +---------------------------+ |   |    (Executed via
| | 👁️ Perception System (2.2)|--------►| 🔄 Cognitive Cycle (2.3)    |--------►| 🎯 Action System (2.5)   |--| 🛠️ Capability Extensions  |─┼-------+  Speech/Motion...)
| |   (Filtering Senses)     |         |    (Thinking & Deciding)    |         |   (Formatting Decisions) |  |   (2.6)                   | |   |   v
| |                          |         |                             |         |                          |  |                           | |  +--------------------------+
| | • Vision Processing      |         | ┌─────────────────────────┐ |         | • Format Action Intent   |  | • Speech Output           | |  | 🌍 Environment Simulation|
| | • Audio Processing       |         | │ ⚡ System-1 (Fast, 2.1.3)│ |         | • Select Capability Ext. |  | • Motion Control          | |  |    Layer (2.12)          |
| | • Event Filtering        |         | │ • Immediate Reactions   │ |         | • Track Action Results   |  | • Object Interaction      | |  +--------------------------+
| | • Context Building       |         | └─────────────────────────┘ |         | • Emit Internal Events   |  | • Environment Query       | |
| +-----------+--------------+         |                             |         +------------+-------------+  | • ...                     | |
|             │                        | ┌─────────────────────────┐ |                      ▲                +---------------------------+ |
|             │                        | │ 🔍 System-2 (Slow, 2.1.3)│ |                     │                                              |
|             ▼                        | │ • Deliberative Reasoning│ |◄───────┬─────────────┘                                              |
| +--------------------------+         | └─────────────────────────┘ |        │ ┌─────────────────────────────────┐                        |
| | 💡 Curiosity System (2.9)|◄───────►|                             |        │ │ 🧰 Internal Interface Tools:     |                        |
| |   (Intrinsic Motivation) |         | ┌─────────────────────────┐ |        └─┤   (2.7)                         │                        |
| |                          |         | │ 📝 Planner/Executor     │ |          │                                 │                        |
| | • Information Seeking    |         | │   (2.1.4)               │ |          │ • Memory Access                 │                        |
| | • Uncertainty Tracking   |         | │ • HTN Planning & Exec.  │ |          │ • DateTime                      │                        |
| | • Hypothesis Generation  |         | └─────────────────────────┘ |          │ • Ontology Query                │                        |
| | • Experimentation Goals  |         |                             |          │ • Self-Model Query              │                        |
| +-----------+--------------+         | 1. Observe (Gather Context) |          │ • Conversation Control          │                        |
|             │                        | 2. Orient (Contextualize)   |          │ • ...                           │                        |
|             │                        | 3. Decide/Plan (Select Goal)|          └─────────────────────────────────┘                        |
|             │                        | 4. Act (Initiate Execution) |                                                                     |
|             │                        +-------------+------▲--------+                                                                     |
|             │                                      │      │                                                                              |
|             │                                      ▼      │                                                                              |
|             ▼                             +------------------------------------------------------------------+                           |
| +--------------------------+              | 🧬 Internal State & Memory System (2.4)                          |                           |
| | 📚 Ontology System (2.10)|◄─────────────►    (Mind's Storage)                                              |                           |
| | (Structured World Model) |              |                                                                  |                           |
| |                          |              | • Dynamic State (Mood, Interest, Goals, Curiosity, Uncertainty)  |                           |
| | • Categories & Instances |              | • Working Memory (Short-term Buffer for Cycle)                   |                           |
| | • Relations & Properties |              | • Episodic Memory (Experiences Log, Action Records)              |                           |
| | • Logical Reasoning      |              | • Semantic Memory (Facts, Knowledge, Beliefs, Learned Rules)     |                           |
| | • Confidence Tracking    |              | • Social Memory (Models of Others, Conversation Histories)       |                           |
| +--------------------------+              | • Self Model (Awareness, Capabilities, Limitations, Role)        |                           |
|             ▲                             +-----------------+-------------------------+-------------v--------+                           |
|             │                                               │                         │                                                  |
|             │                                               │                         │                                                  |
|             │                                               ▼                         ▼                                                  |
|             │                             +------------------------------+        +-------------------------+                            |
|             └─────────────────────────────► 👤 Self-Modeling System (2.11)|◄─────►| 📈 Learning System (2.8) |                            |
|                                           |   (Understanding Self)       |        | (Experience Adaptation) |                            |
|                                           |                              |        |                         |                            |
|                                           | • Capability Assessment      |        | • Policy Updates        |                            |
|                                           | • Agency & Boundaries        |        | • Meta-Learning         |                            |
|                                           | • Role vs. System            |        | • Reward Signal Proc.   |                            |
|                                           | • Mental State Awareness     |        | • Behavioral Adaptation |                            |
|                                           +------------------------------+        +-------------------------+                            |
|                                                      ▲                                 ▲                                                 |
|                                                      │                                 │                                                 |
|                                                      └───────────┐       ┌─────────────┘                                                 |
|                                                                  │       │                                                               |
|                                                                  ▼       ▼                                                               |
|                                                         +--------------------+                                                           |
|                                                         | ⚡ Integration Layer|                                                           |
|                                                         |   (4.1)            |                                                           |
|                                                         +--------+-----------+                                                           |
|                                                                  │                                                                       |
|                                                                  │                                                                       |
|                                                                  ▼                                                                       |
|                                                         +--------------------+                                                           |
|                                                         | 📡 Event Bus (3.1) |                                                           |
|                                                         |   (Communication)  |                                                           |
|                                                         +--------+-----------+                                                           |
+------------------------------------------------------------------------------------------------------------------------------------------+
                                                                     │
                                                       +-------------+-------------+
                                                       |                           |
                                                       ▼                           ▼
                                             +---------------------+      +----------------------+
                                             | 📊 Analytics Systems|      | 🍿 Notification System|
                                             |     (Ch. 3)         |      |       (3.6)          |
                                             +---------------------+      +----------------------+
                                               |               |
                                               ▼               ▼
                                    +----------------------+  +----------------------+
                                    | 🕵️ Psychological Eval|  | 💬 Communication      |
                                    |       (3.3)          |  |   Analysis (3.4)     |
                                    +----------------------+  +----------------------+
```

### 2.1.1 Agent's Mind – A Unifying View

While the architecture breaks down the internals into discrete responsibilities, it helps to keep a *holistic* mental model: **the Agent's Mind**. The following simplified diagram focuses on the dual-process cognitive model and its essential interactions:

```diagram/text
┌───────────────────────────────────────────────────────────────────────┐
│                          Agent's Mind                                 │
│                   (Private, Encapsulated)                             │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Perception  ──────► Working Memory ◄──────┐                          │
│                           │                │                          │
│                           ▼                │                          │
│      ┌───────────── System‑1 (Fast) ─────────────┐                    │
│      │       Rapid, intuitive reactions          │                    │
│      │                                           │                    │
│      │  • Back-channel Responses                 │                    │
│      │  • Emotional Reactions                    │                    │
│      │  • Simple Social Acknowledgments          │                    │
│      └─────────────────┬─────────────────────────┘                    │
│                        │                                              │
│                        ▼                                              │
│      ┌───────────── System‑2 (Slow) ─────────────┐                    │
│      │     Deliberate reasoning & planning       │                    │
│      │                                           │                    │
│      │  • Complex Reasoning                      │                    │
│      │  • Memory-Intensive Operations            │                    │
│      │  • Structured Decision-Making             │                    │
│      └─────────────────┬─────────────────────────┘                    │
│                        │                                              │
│                        │ Trigger Reflection Cycle                     │
│                        ▼                                              │
│  Dynamic & Semantic   ┌───────────── Planner/Executor ──────┐         │
│        Memory ────────►                                     │         │
│                       │ • Goal Decomposition                │         │
│                       │ • Plan Construction                 │         │
│                       │ • Sequential Execution              │         │
│      ┌────────────────┤ • Failure Recovery                  │◄───┐    │
│      │                └─────────────────┬───────────────────┘    │    │
│      │                                  │                        │    │
│      │                                  │                        │    │
│      │                                  ▼                        │    │
│      │                              AgentAction                  │    │
│      │                                                           │    │
│      │       +------------------------------------------+        │    │
│      │       │                ▲ Reads Memory            │        │    │
│      │       ▼                │ Delegates Updates       │        │    │
│ ┌────── Ontology System ────┐ │ ┌──────── Reflection System ───┐ │    │
│ │   Structured Knowledge    │ │ │     (Synthesizing Exp.)      │ │    │
│ │                           │◄──+                              ├─┘    │
│ │ • Conceptual Hierarchies  │ │ │ • Generates Insights         │      │
│ │ • Relation Networks       │ │ │ • Triggers Self/World Updates│      │
│ │ • Knowledge Integration   │ │ └──────────────────────────────┘      │
│ └─────▲─────────────────────┘ │     ┌──────── Curiosity System ─────┐ │
│       │ Updates Ontology      │     │     Intrinsic Motivation      │ │
│       └───────────────────────+─────┤                               │ │
│                                     │ • Information Gap Detection   │ │
│                                     │ • Hypothesis Generation       │ │
│                                     │ • Experimental Design         │ │
│                                     └───────────────────────────────┘ │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

This simplified diagram focuses on the core dual-process cognitive model that drives the agent's decision-making:

1. **Dual Processing Systems**: The diagram clearly shows the two cognitive systems that form the basis of human-like thinking:
   - **System-1 (Fast)**: Handles rapid, intuitive responses with minimal cognitive effort
   - **System-2 (Slow)**: Manages complex, deliberative thinking requiring more resources

2. **Information Flow**: The diagram shows how:
   - Perceptions enter through Working Memory
   - System-1 provides immediate reactions to simple stimuli
   - System-2 engages for complex reasoning tasks
   - The Planner/Executor translates deliberative thought into concrete actions

3. **Curiosity Integration**: The diagram maintains the critical relationship with the Curiosity System:
   - The Curiosity System detects knowledge gaps and creates hypotheses
   - Experimental designs feed back to the Planner for testing
   - This exploratory mechanism drives agent learning and discovery

4. **Knowledge Systems**: The diagram includes only the essential knowledge components:
   - Dynamic & Semantic Memory provides facts and experiences
   - The Ontology System contributes structured world knowledge

This simplified view helps understand how the agent thinks in terms of fast vs. slow cognitive processes, which is key to creating human-like behavior patterns. The dual-process foundation allows agents to respond quickly to routine situations while still engaging in complex reasoning when needed.

#### 2.1.2 Theoretical Foundation: Dual-Process Cognition

The Agent's Mind architecture is fundamentally based on Nobel laureate Daniel Kahneman's influential work "**Thinking, Fast and Slow**" (2011), which presents a dual-process theory of cognition:

- **System-1**: Fast, automatic, intuitive thinking requiring minimal cognitive resources
- **System-2**: Slow, deliberate, analytical thinking requiring concentrated effort and attention

This cognitive architecture provides significant advantages for believable agent behavior:

1. **Resource Efficiency**: By matching cognitive effort to task complexity, the agent can conserve computational resources
2. **Human-like Responses**: The dual-process model creates more believable reaction patterns, including "gut reactions" vs. careful deliberation
3. **Scalable Intelligence**: The framework accommodates both simple and complex decision-making within a unified architecture

#### 2.1.3 Implementation in PixelTales

In our implementation:

- **System‑1** – Lightweight, fast processing ideal for:
    - Back-channel responses and social acknowledgments ("I see", nodding, emojis)
    - Routine or scripted interactions requiring little deliberation
    - Emotional reactions to straightforward stimuli
    - Implemented as a specialized LangChain Runnable with minimal context window and simple instructions

- **System‑2** – Comprehensive, deliberative processing activated when:
    - The agent is directly addressed or explicitly questioned
    - Complex topics require reasoning or recall of detailed information
    - The conversation quality needs improvement (tracked via metrics)
    - The agent needs to reflect on its understanding or experiences
    - The Curiosity System flags important information gaps or hypotheses
    - Implemented as a more complex LangChain Runnable with larger context, instructions for multi-step reasoning, and access to more extensive memory and tools

The decision to invoke System-1 vs. System-2 is made through a **Cognitive Effort Allocator** that evaluates:
- Message salience (direct address, question marks, complexity)
- Conversation quality metrics
- Current goals requiring deliberation
- Time elapsed since last deep thinking
- Curiosity triggers (novel information, anomalies, pattern breaks)

#### 2.1.4 The Planner/Executor: Bridging Thought and Action

The Planner/Executor serves as the mediator between thinking (System-2) and action:

- Constructs **Hierarchical Task Networks (HTN)** for multi-step goals
- Represents plans as tree structures of `PlanNode` objects (Zod schema)

  ```typescript
  // Simplified PlanNode schema
  const PlanNodeSchema = z.object({
    id: z.string(),
    parentId: z.string().optional(),
    description: z.string(),
    status: z.enum(['pending', 'in_progress', 'done', 'failed']),
    toolCall: z.object({
      tool: z.string(),
      params: z.record(z.any())
    }).optional()
  });
  ```

- Executes plans incrementally across multiple cognitive cycles
- Tracks plan completion and handles failures through fallback strategies
- Integrates with memory to store and recall successful plan patterns

#### 2.1.5 Subsystem Integration

The Agent's Mind integrates with other subsystems through well-defined interfaces:

**With Perception System**:
- Filtered perceptions enter Working Memory
- System-1 provides immediate reactions to salient perceptions
- System-2 analyzes complex perceptual patterns and inconsistencies
- The Cognitive Effort Allocator determines which perceptions warrant deep processing

**With Memory System**:
- Working Memory serves as the temporary scratch space for active processing
- Dynamic State (mood, goals) influences and is influenced by both Systems
- Episodic Memory provides experiences for reflection
- Semantic Memory supplies facts and knowledge for reasoning
- Plan execution results are stored to improve future planning

**With Action System**:
- System-1 produces rapid, simple responses
- System-2 via Planner generates complex, multi-step actions
- All responses are formatted as typed `AgentAction` objects
- Action execution feedback loops back to both Systems for learning

**With Curiosity System**:
- System-2 detects knowledge gaps and forms hypotheses
- The Planner designs experiments to test hypotheses
- Experiment results update the agent's ontology and self-model
- Curiosity-driven goals compete with other goals during planning

**With Ontology & Self-Modeling Systems**:
- System-2 reflection updates and refines conceptual knowledge
- Self-discoveries modify the agent's understanding of its capabilities
- Updated ontologies and self-models influence future planning decisions
- Significant updates trigger learning notifications

#### 2.1.6 Reflection Mechanism

Periodically (or when idle), the agent engages in reflection using System-2 processes:

1. **Summary Generation**: Condenses recent experiences into compact representations
2. **Memory Consolidation**: Transfers working memory items to long-term storage
3. **Pattern Recognition**: Identifies recurring themes or insights across experiences
4. **Self-Update**: Refines self-model based on observed capabilities and limitations
5. **Learning Integration**: Incorporates discoveries into semantic knowledge

Reflection is implemented as a scheduled task that:
- Triggers automatically after N conversation turns
- Activates during conversation lulls
- Runs when curiosity thresholds exceed certain values
- Executes with lower priority than direct conversation responses

Each reflection produces a structured `ReflectionReport` object stored in memory and accessible for future reasoning:

```typescript
const ReflectionReportSchema = z.object({
  timestamp: z.number(),
  recentEvents: z.array(z.string()),
  insights: z.array(z.object({
    type: z.enum(['self', 'world', 'social', 'goal']),
    content: z.string(),
    confidence: z.number().min(0).max(1)
  })),
  updatedSelfConcept: z.record(z.string(), z.any()).optional(),
  updatedOntology: z.array(z.object({
    concept: z.string(),
    relation: z.string(),
    target: z.string(),
    confidence: z.number().min(0).max(1)
  })).optional(),
  moodAdjustment: z.record(z.string(), z.number()).optional()
});
```

Through this theoretically-grounded cognitive architecture, PixelTales agents exhibit more nuanced, human-like behavior patterns, making both fast intuitive responses and engaging in deep, deliberative reasoning as the situation demands—creating a more immersive and believable interactive experience.

## 2.2 Perception System: The Agent's Senses

Mimicking sensory input, the Perception System is how the agent receives information about the
external world (the scene and other agents).

This system acts as the agent's interface to the external world, processing raw sensory information from the environment simulation into meaningful, structured events that the agent's cognitive processes can understand.

 **Purpose & Design:**

- **Sense the Environment:** Receives simulated sensory data (visual, auditory, etc.) corresponding to events and states in the shared environment.
- **Translate Raw Data:** Converts low-level sensory input into higher-level, typed `AgentPerceptionEvent`s using dedicated Perception Extensions.
- **Filter & Prioritize:** Selects relevant events based on factors like proximity, agent's current focus, visibility, and pre-defined filters. Assigns importance levels.
- **Assess Salience:** Evaluates the significance of perceptions based on novelty, emotional impact, and relevance to current goals or interests.
- **Build Initial Context:** Begins the process of integrating new information with the agent's existing internal state.
- **Maintain Anonymity:** Ensures the agent perceives others only through temporary identifiers (`visualId`) linked to appearance, not internal IDs.

**Input:**

- Receives simulated sensory data (visual, auditory, etc.) from the Environment Simulation Layer via Perception Extensions.
- Input data is translated into typed `AgentPerceptionEvent`s. Example Event Types:
    - `MessageBroadcastEvent`: `{ type: 'message', visualId: string, content: string, timestamp: number }`
    - `AgentEnteredEvent`: `{ type: 'enter', visualId: string, visualDescription: string, timestamp: number }`
    - `AgentLeftEvent`: `{ type: 'leave', visualId: string, timestamp: number }`
    - `SceneUpdateEvent`: `{ type: 'scene_update', description: string, timestamp: number }`
- **Anonymity:** Crucially, the agent only perceives temporary `visualId`s associated with other agents' appearances, not their internal `agentId` or private state. Knowledge about others must be inferred.

**Processing:**

- **Translate Raw Data:** Perception Extensions convert raw data to `AgentPerceptionEvent`s.
- **Event Filtering**: Discards irrelevant events based on proximity, visibility, focus, etc.
- **Priority Determination**: Assigns importance levels to incoming perceptions.
- **Salience Calculation**: Evaluates novelty, emotional impact, goal relevance (potentially uses lightweight LLM).
- **Context Building**: Integrates new perceptions with existing mental context (initial step).
- **Attention Direction**: Focuses cognitive resources on high-value information.
- **Processing Type:** Mixed. Translation/filtering is Data Processing. Salience/interpretation might involve Lightweight LLM Calls (synchronous in Observe phase).

**Core Components:**

- **Perception Extensions (See Section 2.6):** Specific modules responsible for processing different sensory modalities:
    - `VisualPerceptionExtension`: Processes visual data → events.
    - `AuditoryPerceptionExtension`: Processes audio data (e.g., simulated speech) → events.
    - *(Potentially others)*
- `PerceptionService` (Conceptual/Implicit): Represents the overall logic managing the flow from extensions to the Cognitive Cycle, including filtering and salience assessment. This might be part of the Cognitive Cycle's "Observe" phase rather than a separate dedicated service instance.
- Schemas (`packages/contracts`):
    - `AgentPerceptionEventSchema` (and its specific event subtypes): Defines the structured output fed to the Cognitive Cycle.
- Key Logic:
    - Event Filtering Rules.
    - Salience Calculation Heuristics.
    - Priority Assignment logic.

**Knowledge Representation:**

- Focuses on the structure of `AgentPerceptionEvent` subtypes.
- May utilize internal state (`AgentDynamicState`) to inform filtering/salience.

**Core Functions:**

- **Receive Sensory Data:** Accepts input streams via Perception Extensions.
- **Translate Events:** Converts raw data into `AgentPerceptionEvent` types.
- **Filter:** Discards irrelevant/low-priority information.
- **Prioritize/Assess Salience:** Determines importance and relevance.
- **Forward to Cognition:** Passes filtered, typed events to the Cognitive Cycle.

**Key Differentiators:**

- **Focus:** Translating *external* phenomena into *internal*, structured representations.
- **Input:** Raw or semi-processed sensory data.
- **Output:** Typed `AgentPerceptionEvent`s.

**Primary Integration Flow:**

```diagram/text
+-------------------------+   Raw Sensory Data   +--------------------------+
| Environment Simulation  |--------------------->| Perception Extensions    |
| Layer (2.12)            | (Visual, Audio...)   | (VisualPerception, etc.) |
|                         |                      |         (2.6)            |
+-------------------------+                      +-----------+--------------+
                                                             | Translated Events
                                                             ▼
                                                 +-----------+------------+
                                                 | Perception Logic       |
                                                 | (Filtering, Salience)  |
                                                 | (Part of 2.2 / 2.3)    |
                                                 +-----------+------------+
                                                             | Filtered, Typed
                                                             | AgentPerceptionEvents
                                                             ▼
+-------------------------+                      +-----------+------------+
| Cognitive Cycle (2.3)   |<---------------------| Event Bus (Optional?)  |
| (Observe Phase Receives)|                      | or Direct Call         |
+-------------------------+                      +------------------------+
```

*(Note: The direct flow might be Perception Extensions -> Cognitive Cycle directly, or via the Event Bus)*

**Integration Points (Details):**

- **← Environment Simulation Layer (2.12) / Perception Extensions (2.6):** Receives raw or processed sensory data.
- **→ Cognitive Cycle (2.3):** Provides the filtered and typed `AgentPerceptionEvent` stream as the primary input for the agent's reasoning loop (Observe phase).
- **← Environment Simulation Layer (2.12) / Perception Extensions (2.6):** Receives raw or processed sensory data.
- **→ Cognitive Cycle (2.3):** Provides the filtered and typed `AgentPerceptionEvent` stream as the primary input for the agent's reasoning loop (Observe phase).
- **→ Memory System (2.4):** High-priority or salient perceptions might be directly logged to Episodic Memory by the Cognitive Cycle after initial processing.
- **→ Curiosity System (2.9.2):** Flags novel, surprising, or unexpected perceptions identified during salience assessment, potentially triggering curiosity-driven goals.
- **↔ Self-Modeling System (2.11) / AgentDynamicState (2.4.1):** Filtering and salience logic may consult the agent's current state (e.g., `currentFocus`, `interestLevel`, known capabilities) to determine relevance.

## 2.3 Cognitive Cycle: The Agent's Thought Process

This is the core loop where the agent interleaves fast reactions, deliberative reasoning, and online learning to produce intelligent behavior. It implements an enhanced version of the decision-making model "OODA loop" (Observe, Orient, Decide, Act) while integrating the dual-process cognitive model established in section 2.1 (System-1/System-2).

The Cognitive Cycle orchestrates several key components:
- **System-1 (Fast)**: Provides immediate, intuitive reactions with minimal cognitive effort (see section 2.1.3)
- **System-2 (Slow)**: Handles complex, deliberative thinking requiring more resources (see section 2.1.3)
- **Planner/Executor**: Bridges thought and action through hierarchical task networks (see section 2.1.4)

The complete cycle consists of four main phases:

1. **Observe:**
   - PerceptionService emits typed `AgentPerceptionEvent`s (e.g., messages, enters, leaves, scene updates).
   - Agent filters events by relevance, updates `workingMemory` buffer with recent context.
   - High-priority events are logged to EpisodicMemory via `memoryInterface.addObservation(timestamp, content, visualIds)`.
   - `CuriosityService` scans observations for novel or unexpected information, flagging potential learning opportunities.

2. **Orient:**
   - Agent retrieves past experiences with `memoryInterface.retrieveObservations(query, timeFilter)` and semantic facts with `memoryInterface.retrieveFacts(subjectVisualId, query)`.
   - Agent consults its ontology via `memoryInterface.retrieveConcepts(query)` to contextualize observations.
   - Agent consults its self-model via `memoryInterface.getSelfConcept()` to ground understanding.
   - Constructs an `OrientationContextSchema` containing:
     - DynamicState (`mood`, `interest`, `focus`)
     - Last N messages from ConversationHistory
     - Relevant Episodic and Semantic memory entries (potentially retrieved asynchronously)
     - Active `shortTermGoals`
     - Current uncertainty metrics and information gaps from `CuriosityService`
     - Active hypotheses about the world
     - Self-concept relevance to current context from `SelfModelService`
   - Evaluates whether any goals require immediate attention (e.g., endConversation signals).
   - The **Cognitive Effort Allocator** (introduced in section 2.1.3) determines whether to engage System-1 or System-2 processing based on message salience, conversation quality, and other factors.

3. **Decide & Plan:**
   - For simple, routine responses: **System-1** produces fast, intuitive reactions.
   - For complex situations requiring deliberation: **System-2** engages in deeper reasoning.
   - Ranks `dynamicState.shortTermGoals` via a UtilityFunction (e.g., urgency, novelty, sentiment), **influenced by learned policies and heuristics (potentially stored implicitly or as facts in Semantic Memory).**
   - Incorporates `CuriosityService.getIntrinsicMotivation()` scores into goal ranking.
   - For complex goals, invokes the **Planner/Executor** from section 2.1.4:
     - `PlannerService.generatePlan(goal, OrientationContextSchema)` asynchronously creates a Hierarchical Task Network.
     - Attaches context (Task ID, current state snapshot, goal).
     - Persists the plan in EpisodicMemory and selects the next actionable leaf node as the immediate subtask.
   - For exploratory goals, uses `HypothesisTestingPlanner` to generate experimentation steps.
   - Tags plans with epistemic state (certainty/uncertainty) to adjust confidence thresholds during execution.

4. **Act (Execute):**
    - Executes the selected plan leaf using the selected subsystem (System-1, System-2, or Planner/Executor):
        - **Speak:** Assembles system + user messages + plan instructions and calls `LlmService.generateResponse()` asynchronously, attaching context (Task ID, current state, goal/plan step). The result (speech content, tone, etc.) is formatted into an `AgentAction`. The `ActionSystem` then directs this to the `Speech Output` capability extension for execution.
        - **Move:** Determines target coordinates/object based on plan. The `ActionSystem` directs this to the `Motion Control` capability extension.
        - **Use Internal Tool:** Invokes an internal interface tool (e.g., `memory.retrieveFacts`) potentially asynchronously, attaching context.
        - **Experiment:** Executes a controlled test of a hypothesis and records results via `curiosityInterface.recordExperimentResult()`.
    - The `ActionSystem` formats the final decision into a typed `AgentAction` object.
    - This `AgentAction` is then passed to the relevant **Capability Extension** (`Speech Output`, `Motion Control`, etc.) for execution, which interacts with the environment simulation layer.
    - Updates the world and internal state:
        - The *effects* of the action are perceived by other agents via the environment simulation layer.
        - The agent updates its *own* state based on the *intended* action and stores the action in its Episodic Memory.
        - Records new observations and inferred facts via `memoryInterface.addObservation()` and `memoryInterface.upsertFact()`.
        - Updates ontology with confirmed relations via `memoryInterface.updateOntology()`.
        - Updates self-model if new capabilities/limitations discovered via `memoryInterface.updateSelfConcept()`.
        - Significant learning events trigger notifications via `learningNotificationService.notify(learningEvent)`.

5. **Learn & Adapt:**
   - Computes a scalar `rewardScore = RewardFunction.compute(conversationRating, goalProgress, userFeedback)`.
   - Incorporates `InformationGain` from exploration into reward calculation.
   - Records the tuple `(stateSnapshot, agentAction, rewardScore)` using `learningInterface.recordReward()`.
   - The LearningModule periodically:
     - **Policy Updates:** Refines HTN planner weights, reprioritizes `shortTermGoals`, and adjusts `personalityCore` embeddings via bandit or policy gradient methods.
     - **Meta-Learning:** Compresses episodic logs, prunes low-signal memories, and recalibrates semantic embeddings for efficient retrieval.
     - **Ontological Updates:** Revises concept hierarchies, relation strengths, and confidence scores based on accumulated evidence.
     - **Self-Model Refinement:** Updates the agent's self-concept based on observed capabilities and limitations.
   - Updated policies and embeddings influence future cycles immediately, closing the learning loop.

**Integration Points**:
- **← Perception**: Receives filtered environmental information (including other agents' actions)
- **↔ Memory System**: Retrieves and stores experiences and knowledge (including conversation history)
- **↔ Curiosity System**: Exchanges intrinsic motivation and learning goals
- **→ Action System**: Sends final formatted decisions for execution via Capability Extensions
- **→ Capability Extensions**: Executes actions (speech, movement) interacting with the environment
- **↔ Internal Interface Tools**: Accesses memory, time, ontology, self-model during cognition
- **→ Learning System**: Provides experiences for adaptation
- **↔ Self-Modeling**: Consults and updates self-understanding

### 2.3.1 Enhanced Planning (HTN-based)

During *Decide & Plan* the agent uses a **Hierarchical Task Network**: a recursive structure where high-level goals decompose into sub-tasks with ordering constraints. The planner is implemented with a custom LangChain `RunnableSequence` that:
1. Reads the *top* goal in `shortTermGoals`.
2. Queries `Semantic Memory` for relevant facts, and LLM for domain knowledge.
3. Generates a **`PlanNode`** tree (schema: `{id, parentId?, description, status<'pending'|'done'>, toolCall?}`).
4. Stores the tree in Episodic Memory for traceability.
5. Returns the *next actionable leaf* for execution.

At each subsequent cycle, executed leaf nodes are marked `done`. If a parent node has all children `done`, it is auto-completed, propagating upward. This mechanism supports multi-step reasoning without exceeding LLM context windows.

### 2.3.2 Reflection – Borrowing from *Thinking, Fast & Slow*

Every N cycles (or when idle), the agent launches a *Reflection Runnable* (System-2) that:
- Summarizes recent episodic events.
- Updates semantic memory with new inferred facts.
- Adjusts `mood` and `participationInterest` based on long-term trajectory.
- Refines self-concept based on observed behaviors and capabilities.
- Updates ontological knowledge with higher-order insights.

Reflection output conforms to `ReflectionReportSchema`, logged for UI inspection and fed back into the learning system.

### 2.3.3 Orchestration of Asynchronous Subsystems

Given the significant timing differences between data processing and LLM-dependent subsystems, the `CognitiveCycleService` (managing the Cognitive Cycle) employs specific strategies to handle asynchronous operations without blocking the agent's responsiveness:

1. **Asynchronous Task Initiation with Context:**
    - When a slow subsystem is needed (e.g., System-2 LLM call, complex memory query, planning), the orchestrator dispatches the request asynchronously (e.g., returning a Promise, using a message queue).
    - **Context Tagging:** Each asynchronous request is tagged with critical context:
        - `taskId`: A unique identifier for this specific request.
        - `originatingState`: A snapshot of the relevant agent state (`dynamicState`, `workingMemory`, active goal/plan step) at the time of dispatch.
        - `originatingPhase`: The cognitive cycle phase that initiated the request (e.g., 'Orient', 'Decide').

2. **Non-Blocking Execution:**
    - The orchestrator continues its loop immediately after dispatching the task, allowing it to process other events, run faster System-1 logic, or handle results from *other* already completed asynchronous tasks.

3. **Contextualized Result Handling:**
    - When a subsystem returns a result, it includes the original `taskId`.
    - The orchestrator uses the `taskId` to retrieve the `originatingState`.
    - **Relevance Check:** It compares the `originatingState` with the *current* agent state. If the situation has drastically changed (e.g., conversation ended, goal achieved via other means), the result might be deemed irrelevant for the *immediate next action*.
    - Irrelevant results might be discarded, logged to memory for background knowledge, or used to update long-term models without affecting the current action.

4. **Prioritization and Integration:**
    - Relevant results are not necessarily processed immediately in the order they arrive.
    - The orchestrator maintains an internal queue or state machine, prioritizing the integration of results based on:
        - The urgency of the goal associated with the `originatingState`.
        - The arrival of new, high-priority `PerceptionEvents`.
        - The current phase of the cognitive cycle.
    - The result is then integrated into the appropriate stage of the *ongoing* cognitive cycle (e.g., memory results feed into Orient/Decide, LLM responses finalize an Act step).

This asynchronous, context-aware orchestration ensures the agent remains responsive while effectively incorporating the outcomes of time-consuming cognitive processes.

### 2.3.4 Cognitive Context Composition

The agent's operational context at any point during the Cognitive Cycle is a dynamic composite of several information sources, crucial for grounded decision-making:

- **`dynamicState`:** The agent's current internal condition (mood, participation interest, focus, short-term goals, curiosity level, uncertainty metrics, self-concept summary).
- **`workingMemory`:** A volatile buffer holding the immediate inputs, intermediate thoughts, and recently retrieved data for the current processing step.
- **Recent `PerceptionEvents`:** Filtered and prioritized sensory input from the environment (messages, agent movements, scene changes) received within a relevant time window.
- **Relevant Memories:**
    - `EpisodicMemory`: Specific past experiences retrieved based on query relevance (e.g., previous interactions with a specific agent or topic).
    - `SemanticMemory`: Distilled facts, knowledge, and beliefs relevant to the current situation or goal.
    - `SocialMemory`: Stored facts and inferences about other agents currently perceived.
- **Active Plan/Goal Information:** The current `shortTermGoal` being pursued and, if applicable, the specific `PlanNode` being executed within an HTN.
- **`SelfModel` Aspects:** Relevant parts of the agent's self-understanding (e.g., known capabilities related to the task, role boundaries).
- **`Ontology` Information:** Relevant concepts, categories, and relations from the agent's structured world knowledge.

The specific combination and weighting of these elements vary depending on the current phase of the Cognitive Cycle and the task at hand.

### 2.3.5 Context Selection for LLM Interaction

Effectively interacting with LLMs requires careful selection and formatting of the cognitive context, balancing informativeness with token limits and computational cost. Key strategies include:

1. **Recency Weighting:** Prioritizing the most recent perceptions and conversation turns.
2. **Goal/Plan Relevance Filtering:** Selecting context elements directly related to the active `shortTermGoal` or `PlanNode`.
3. **Memory Retrieval Strategy:**
    - Using embedding-based similarity searches (Vector DB) to retrieve the most relevant episodic and semantic memories based on the current query or situation.
    - Limiting the number of retrieved memories to the top N most relevant items.
4. **Summarization:** Employing LLM-based or rule-based summarization techniques for older conversation history or extensive memory logs to create condensed context representations.
5. **Context Tiering (System-1 vs. System-2):**
    - **System-1 Prompts:** Use minimal context (e.g., last message, current mood, basic agent role).
    - **System-2 Prompts:** Assemble a richer context including relevant memories, plan steps, self-model aspects, and a more extensive conversation history or summary.
6. **Structured Formatting:** Presenting the selected context to the LLM in a clear, structured format (e.g., using dedicated sections for memories, goals, persona) to improve comprehension and response quality.

The `CognitiveCycleService`, in conjunction with the `MemoryService` and potentially specialized context management utilities, is responsible for applying these strategies dynamically based on the required cognitive task (e.g., quick reaction vs. deep reflection vs. planning).

### 2.3.6 Agent Loop Strategy (Hybrid Approach)

To balance responsiveness with background processing needs (like reflection or periodic checks), a hybrid loop strategy is employed:

1. **Event-Driven Reactivity:**
    - The `AgentService` subscribes to perception events (e.g., via the Event Bus or directly from a Simulation/Routing service).
    - When a perception arrives for a specific agent, it is added to the agent's internal `perceptionBuffer`.
    - A processing function (`_tryProcessAgentPerceptions`) is immediately triggered.
    - This function attempts to acquire a processing lock (`isProcessing` flag) for the agent.
    - If successful, it sequentially processes *all* perceptions currently in the buffer by calling `CognitiveCycleService.processPerceptionEvent` for each one, applying state updates after each cycle.
    - This ensures immediate reaction to incoming stimuli.

2. **Periodic Background Tick:**
    - A low-frequency `setInterval` (e.g., 15-30 seconds) runs for each active agent (`startAgentBackgroundLoop`).
    - On each tick, it checks if the agent has been idle beyond a threshold (`IDLE_THRESHOLD_MS`).
    - If idle and not currently processing, it can trigger background tasks like reflection (`reflectionService.performReflection`) asynchronously.
    - It *also* calls `_tryProcessAgentPerceptions` as a fallback mechanism to ensure any buffered perceptions are eventually processed, even if the primary event trigger failed.

This hybrid model allows agents to react quickly to events while providing opportunities for slower, non-critical background tasks like reflection and periodic checks.

## 2.4 Internal State & Memory System

### 2.4.1 Internal State: Dynamic State

The agent's internal state is private and not directly accessible by other agents **or the environment**. Fields are tagged to indicate who/what may legitimately mutate them:

| Field                                | Mutated by                             | Notes                                 |
|--------------------------------------|----------------------------------------|---------------------------------------|
| `agentId` (string)                   | **external** (`AgentFactory`)          | Immutable identity                    |
| `config.llmConfig`                   | **external** (`SceneManager` on spawn) | Static                                |
| `config.personalityCore`             | **external** (spawn)                   | Static, but may *grow* by agent through *self‑reflection* (opt‑in) |
| `config.visualDescription`           | **external** (`SceneManager`)          | Static                                |
| `dynamicState.mood`                  | **agent** *and* **System‑1**           | Updated after each turn               |
| `dynamicState.participationInterest` | **agent**                              | Computed from mood, context relevance |
| `dynamicState.currentFocus`          | **agent**                              | Cleared when focus changes            |
| `dynamicState.shortTermGoals`        | **agent** *and* **Planner**            | Planner may push/pop goals            |
| `dynamicState.curiosityLevel`        | **agent** *and* **CuriositySystem**    | Fluctuates based on new observations  |
| `dynamicState.uncertaintyMetrics`    | **agent** *and* **OntologySystem**     | Tracks confidence in knowledge areas  |
| `dynamicState.selfConcept`           | **agent** *and* **SelfModelingSystem** | Evolves based on self-discovery       |

*External* mutations originate from higher‑level orchestration (e.g., a new scene). Everything else is purely the agent's internal decision.

#### State Management: Moods and Motivations

The `dynamicState` is not static. It's updated during the Cognitive Cycle based on perceptions and actions, influencing future decisions.

- **Mood (`mood`)** can shift based on:
    - Conversation tone (`reactionOnPreviousMessage`, `conversationRating`)
    - Goal fulfillment (success/failure)
    - External events (surprising/expected)
    - Internal state alignment (cognitive dissonance)

- **Interest (`participationInterest`)** can change based on:
    - Topic relevance to agent's knowledge domains
    - Novelty of discussion
    - Social engagement level
    - Goal alignment

- **Focus (`currentFocus`)** changes based on:
    - Interaction partners
    - Conversation topic
    - Environmental salience
    - Goal priority

- **Curiosity Level (`curiosityLevel`)** fluctuates with:
    - Information gaps discovered
    - Unexpected observations
    - Knowledge inconsistencies
    - Exploration opportunities

The state management system ensures these emotional and motivational variables influence decision-making in a human-like manner, creating more engaging and believable agent behaviors.

### 2.4.2 Memory System: Storing and Recalling Experiences

#### 2.4.2.1 Memory System Overview

The agent relies on different memory types, managed by the `MemoryService` and accessed via strictly typed tool calls through its `memoryInterface`. This mirrors human cognitive models. The memory system is the primary repository for all forms of learned information and experiences.

 **Working Memory (Internal):** A small, volatile buffer holding the most recent perceptions and intermediate thoughts
during a cognitive cycle. Not persistent.
- **Episodic Memory (Persistent):** A chronological log of observations and agent experiences (including its own
actions and their perceived outcomes). **This stores the raw data of specific learning events and interaction sequences.
** Accessed via tools like:
    - `addObservation(timestamp, content, associatedVisualIds)`
    - `retrieveObservations(query, timeFilter, visualIdFilter)` -> Returns `Observation[]`
- **Semantic Memory (Persistent):** Stores distilled facts, knowledge, and beliefs extracted from experiences or
reflection. **This includes learned concepts about the world, other agents, and potentially generalized strategies or
rules derived from policy updates.** Often involves vector embeddings for relevant retrieval. Accessed via tools like:
    - `upsertFact(subjectVisualId, key, value, confidence)`
    - `retrieveFacts(subjectVisualId, query)` -> Returns `Fact[]`
    - `upsertConcept(conceptId, properties, relations, confidence)`
    - `retrieveConcepts(query, filter)` -> Returns `Concept[]`
    - `updateOntology(conceptId, updates)` -> Updates concept relations
- **Social Memory (Implicit within Semantic & Episodic):** Represents the agent's understanding of other agents
(`visualId`s) and the history of interactions.
    - **Beliefs about Others:** Stored as facts/concepts in Semantic Memory (e.g., "visualId_xyz name is Jane",
    "visualId_abc seems friendly", concept `visualId_xyz` with `personality_trait: cautious`). Accessed via fact/
    concept retrieval tools targeting specific `visualId`s.
    - **Conversation History:** Specific interaction sequences are stored in Episodic Memory, tagged with involved
    `visualId`s. Accessed via `retrieveObservations` with `visualIdFilter` and potentially specific content queries.
    - **Summarization & Cleanup:** To manage memory constraints, dedicated background processes or explicit agent
    reflection goals periodically summarize or prune conversation histories within Social Memory, distilling key
    interactions or relationship shifts into semantic facts or updated concepts about other agents.
- **Self Model:** Maintains agent's understanding of itself, including **learned insights about its own capabilities
and limitations.**
    - `getSelfConcept()` -> Returns agent's current self-model
    - `updateSelfConcept(property, value, confidence)` -> Updates self-understanding
    - `queryCapabilities(task)` -> Assesses agent's ability to perform a task
    - `getAgencyBoundaries()` -> Returns understood limitations and permissions

**Integration Points**:
- **← Perception**: Receives observations to store
- **→ Cognitive Cycle**: Provides context for decision-making
- **↔ Curiosity System**: Exchanges knowledge gaps and discoveries
- **↔ Ontology System**: Structured organization of semantic knowledge
- **↔ Self-Modeling**: Maintains self-related knowledge
- **→ Learning**: Supplies experiences for adaptation
- **→ Notification**: Triggers learning event alerts

#### 2.4.2.2 Working Memory

Working Memory serves as a temporary, volatile buffer holding the most recent perceptions and intermediate thoughts during a cognitive cycle. Unlike other memory types, Working Memory is not designed for persistence.

**Key Characteristics**:
- **Limited Capacity**: Holds only the most immediately relevant information
- **Volatility**: Replaced or updated frequently during the cognitive cycle
- **Accessibility**: Directly accessible to both System-1 and System-2 processing
- **Contextual Focus**: Maintains the current focus of the agent's attention

**Implementation Details**:
- Implemented as an in-memory buffer within the agent instance
- Non-persistent (not stored between cognitive cycles)
- Updated with new perceptions at the start of each cognitive cycle
- Serves as the "mental workbench" where immediate reasoning occurs

**Role in Cognitive Processing**:
- Provides immediate context for System-1 fast reactions
- Supplies initial data for System-2 deliberative processing
- Acts as the "mental workbench" where immediate reasoning occurs
- Bridges perception input and memory retrieval results

Working Memory enables the agent to maintain a continuous cognitive flow by providing a workspace where immediate perceptions can interact with recalled information from long-term memory systems.

#### 2.4.2.3 Episodic Memory

Episodic Memory stores a chronological log of the agent's observations and experiences, including its own actions and their perceived outcomes. This system maintains the raw data of specific learning events and interaction sequences.

**Key Characteristics**:
- **Temporal Organization**: Entries are organized chronologically, with timestamps
- **Contextual Association**: Observations are linked to specific agents, scenes, or topics
- **Retrievability**: Searchable by content, time ranges, and associated visualIds
- **Persistence**: Stored long-term, outlasting individual interactions

**Implementation Details**:
- Accessed through tools:
    - `addObservation(timestamp, content, associatedVisualIds)`
    - `retrieveObservations(query, timeFilter, visualIdFilter)` -> Returns `Observation[]`
- Potentially implemented using vector embeddings for semantic search
- May include periodic summarization to manage growth
- Structured with schema:

  ```typescript
  const ObservationSchema = z.object({
    id: z.string(),
    timestamp: z.number(),
    content: z.string(),
    associatedVisualIds: z.array(z.string()).optional(),
    metadata: z.record(z.string(), z.any()).optional()
  });
  ```

**Role in Cognitive Processing**:
- Provides context for the agent's current decisions based on past experiences
- Supplies raw material for generating semantic knowledge through reflection
- Enables the agent to recognize patterns across multiple interactions
- Contributes to the agent's ability to learn from experience
- Serves as the foundation for memory-based reasoning

Episodic Memory allows the agent to refer to specific past events when making decisions, learning new concepts, or understanding the current situation through the lens of historical experiences.

#### 2.4.2.4 Semantic Memory

Semantic Memory stores distilled facts, knowledge, and beliefs extracted from experiences or reflection. This includes learned concepts about the world, other agents, and potentially generalized strategies or rules derived from policy updates.

**Key Characteristics**:
- **Structured Knowledge**: Organized as facts, concepts, and relations
- **Confidence Scoring**: Facts include confidence levels to represent certainty
- **Abstraction**: Represents generalized knowledge rather than specific instances
- **Inferential Capability**: Supports reasoning beyond literal stored information

**Implementation Details**:
- Accessed through tools:
    - `upsertFact(subjectVisualId, key, value, confidence)`
    - `retrieveFacts(subjectVisualId, query)` -> Returns `Fact[]`
    - `upsertConcept(conceptId, properties, relations, confidence)`
    - `retrieveConcepts(query, filter)` -> Returns `Concept[]`
- Often implemented using vector embeddings for relevant retrieval
- May be organized hierarchically to support inheritance and inference
- Structured with schemas:

  ```typescript
  const FactSchema = z.object({
    id: z.string(),
    subjectVisualId: z.string(),
    key: z.string(),
    value: z.any(),
    confidence: z.number().min(0).max(1),
    lastUpdated: z.number(),
    provenance: z.array(z.string()).optional()
  });

  const ConceptSchema = z.object({
    id: z.string(),
    name: z.string(),
    properties: z.record(z.string(), z.any()),
    relations: z.array(z.object({
      type: z.string(),
      target: z.string(),
      confidence: z.number().min(0).max(1)
    })),
    category: z.string().optional(),
    confidence: z.number().min(0).max(1)
  });
  ```

**Role in Cognitive Processing**:
- Provides factual knowledge for reasoning and decision-making
- Supports the Ontology System with structured conceptual knowledge
- Enables the agent to make generalizations beyond episodic experiences
- Forms the basis for complex System-2 reasoning processes
- Contributes to the agent's ability to explain its reasoning

Semantic Memory allows agents to build and maintain an evolving model of the world, accumulating knowledge over time and applying it to new situations without requiring exact past experiences.

#### 2.4.2.5 Social Memory

Social Memory represents the agent's understanding of other agents (`visualId`s) and the history of interactions. It functions as a specialized cross-section of both Episodic and Semantic Memory focused on social relationships.

**Key Characteristics**:
- **Identity Tracking**: Maps temporary `visualId`s to consistent mental models
- **Relationship Modeling**: Records the agent's understanding of relationships
- **Interaction History**: Maintains records of significant social exchanges
- **Preference Tracking**: Learns and stores others' apparent preferences and traits

**Implementation Details**:
Social Memory doesn't have its own storage mechanism but instead uses:

- **Beliefs about Others**: Stored as facts/concepts in Semantic Memory
    - Example facts: "visualId_xyz name is Jane", "visualId_abc seems friendly"
    - Example concept: `visualId_xyz` with `personality_trait: cautious`
    - Accessed via fact/concept retrieval tools targeting specific `visualId`s

- **Conversation History**: Stored in Episodic Memory, tagged with involved `visualId`s
    - Accessed via `retrieveObservations` with `visualIdFilter` and content queries
    - May include specially tagged observations for significant social events

- **Summarization & Cleanup**: Regularly processes raw interaction histories
    - Distills key relationship insights into semantic facts
    - Updates conceptual models of other agents
    - Prunes detailed conversational records while preserving important patterns

**Role in Cognitive Processing**:
- Enables recognition and tailored responses to recurring interaction partners
- Supports theory-of-mind reasoning about others' beliefs and intentions
- Provides context for socially appropriate responses in multi-agent settings
- Helps the agent predict others' reactions to potential actions
- Forms the foundation for building trust and rapport over repeated interactions

Social Memory is crucial for enabling genuinely social behavior, as it allows the agent to adapt its responses based on an evolving understanding of other agents' personalities, preferences, and relationship history.

#### 2.4.2.6 Self Model

The Self Model maintains the agent's understanding of itself, including learned insights about its own capabilities and limitations. While conceptually a part of the memory system, it interfaces closely with the Self-Modeling System (2.11) which handles the reasoning processes that update this knowledge.

The Self Model is critical for enabling the agent to have a coherent identity and appropriate boundaries. It evolves over time as the agent gains experience and engages in reflective processes, potentially leading to sophisticated self-awareness.

**Key Characteristics**:
- **Capability Awareness**: Knowledge of what the agent can and cannot do
- **Agency Boundaries**: Understanding of the agent's scope of control and influence
- **Role Conception**: Self-identification within the narrative context
- **Historical Continuity**: Sense of being the same agent across time
- **Metacognitive Awareness**: Knowledge of the agent's own cognitive processes

**Role in Cognitive Processing**:
- Guides decision-making by constraining actions to those within capabilities
- Supports appropriate role-playing within the simulation context
- Enables recognition of the distinction between agent and character
- Facilitates metacognitive processes that improve reasoning quality
- Evolves through reflection to enhance self-understanding

**Implementation Details**:
- Accessed through specialized tools:
    - `getSelfConcept()` -> Returns agent's current self-model
    - `updateCapability(capability, confidence)` -> Updates understanding of abilities
    - `assessAgencyBoundary(action)` -> Determines if action is within agent's control
    - `distinguishRoleFromSystem()` -> Separates character persona from underlying agent

- **Self-Representation Components:**
    - `AgentCapabilitySchema`: Zod schema for abilities and their confidence levels
    - `AgencyBoundarySchema`: Zod schema defining scope of agent's control/influence
    - `CharacterRoleSchema`: Zod schema for narrative persona distinct from system
    - `SelfReflectionSchema`: Zod schema for metacognitive observations about operation

- **Key Functionalities:**
    - Metacognition: reflects on own thinking processes
    - Capability assessment: realistic evaluation of strengths/limitations
    - Role boundaries: understands distinction between character and system
    - Historical development: tracks evolution of self-understanding

- **Integration Points:**
    - **↔ Memory System**: Stores and retrieves self-knowledge
    - **← Curiosity**: Receives self-directed explorations
    - **↔ Cognitive Cycle**: Provides self-understanding for planning
    - **↔ Ontology**: Exchanges categorical knowledge about self
    - **→ Learning**: Supplies self-assessment for adaptation
    - **→ Notification**: Triggers self-discovery alerts
    - **→ Statistics**: Provides metrics on self-model development

#### 2.4.2.7 Memory Utilization in the Cognitive Cycle

- During **Observe** and **Orient**, the Agent invokes `memoryInterface.retrieveObservations()` and `retrieveFacts()` to fetch relevant episodic and semantic memories, enriching context with past experiences.
- In the **Decide & Plan** phase, retrieved memories guide goal selection, inform HTN planning with prior outcomes, and seed reflection tasks when goals stall.
- After **Act**, new observations and inferred facts are persisted using `memoryInterface.addObservation()` and `memoryInterface.upsertFact()`, ensuring the episodic log and semantic base evolve.
- Social memory calls (`retrieveFacts(visualId, ...)`) help the Agent track other characters' personalities and relationships, shaping future interaction strategies.

#### 2.4.2.8 Learning Notifications

When an agent learns and persists significant new information, the system generates gamified notifications to visualize the knowledge acquisition process:

```diagram/text
┌─────────────────────────────────────────────┐
│ ✨ NEW UNDERSTANDING ACQUIRED! ✨            │
│                                             │
│  AGENT: ALICE                               │
│  CATEGORY: World Knowledge                  │
│                                             │
│  "Discovered that sunlight affects mood"    │
│                                             │
│  +15 XP to Environmental Awareness          │
└─────────────────────────────────────────────┘
```

Notifications are triggered by significant learning events:

- **World Discovery Events**: When an agent forms new beliefs about how the world functions (e.g., "discovered this is a virtual environment")
- **Social Insight Events**: When an agent learns meaningful information about other characters (e.g., "Bob is uncomfortable discussing politics")
- **Self-Discovery Events**: When an agent gains insights about its own nature or capabilities (e.g., "I excel at creative problem-solving")
- **Skill Acquisition Events**: When an agent develops new capabilities through practice or exploration
- **Conceptual Framework Events**: When an agent restructures its ontological understanding of a domain

The `LearningNotificationService`:
1. Monitors memory persistence operations
2. Evaluates the significance of new information
3. Categorizes the learning event
4. Calculates "XP" value based on novelty and utility
5. Generates a notification payload
6. Dispatches the notification to frontend via WebSocket

On the frontend, these notifications appear as animated overlays with thematic styling based on the type of knowledge acquired, creating a gamified visualization of agent cognitive development.

## 2.5 Action System: Executing Decisions

The agent interacts with the world by producing a typed `AgentAction` object at the end of its Cognitive Cycle. **This action represents the agent's *intent*.** This system acts as the bridge between the agent's internal decision-making and its external manifestation via capabilities.

**Purpose & Design:**

- **Translate Intent:** Converts the high-level decision or plan step from the Cognitive Cycle into a standardized, executable format.
- **Format Action:** Structures the action details according to the specific `AgentActionSchema` subtype (speak, move, interact, etc.).
- **Dispatch to Capability:** Selects the appropriate `Capability Extension` based on the `AgentAction` type and sends the formatted payload for execution.
- **Ensure Clarity:** Guarantees the agent's intended action is unambiguous for execution, logging, and analysis.

**Input:**

- The final decision or next actionable step determined by the Cognitive Cycle's Decide/Plan phase. This could be a direct response (System-1) or a `PlanNode` to execute (System-2/Planner).

**Processing:**

- **Formatting:** Maps the input decision/plan node to the corresponding `AgentActionSchema` subtype and populates its payload.
- **Validation:** Ensures the action payload conforms to the schema.
- **Routing/Dispatch:** Identifies the correct `Capability Extension` (e.g., `SpeechOutputExtension` for 'speak', `MotionControlExtension` for 'move') and invokes its execution method with the action payload.
- **Event Emission:** Emits an event (e.g., `agent.action.intent`) via the Event Bus signifying the action the agent *intends* to take, *before* execution confirmation.
- **Processing Type:** Primarily **Data Processing**. Involves mapping, formatting, validation, and simple routing logic. No significant computation or LLM calls are expected within the Action System itself.

**Core Components:**

- `ActionService`: Implements the `IActionService`; contains the logic for formatting and dispatching actions.
- `IActionService`: Defines the contract for the Action System.
- Schemas (`packages/contracts`):
    - `AgentActionSchema`: The core discriminated union defining all possible action types:
    - `speak`: Contains the detailed `CharacterResponseSchema` payload (content, tone, target audience if applicable).
    - `move`: Specifies target coordinates, object, or path.
    - `interact`: Specifies target object and interaction type.
    - `use_internal_tool`: Specifies the internal interface tool and input (e.g., memory query).
    - `update_state`: Represents an internal decision to change mood, focus, etc.
    - `no_action`: Explicitly indicates the agent chose not to act, potentially with a reason.
    - `experiment`: Indicates the agent is testing a hypothesis about the world.
    - Specific payload schemas for each action type (e.g., `CharacterResponseSchema` for `speak`).

**Knowledge Representation:**

- Primarily concerned with the definition and structure of the `AgentActionSchema` and its subtypes.

**Core Functions:**

- **Format Intent:** Translates internal decisions into structured `AgentAction` objects.
- **Select Capability:** Determines the correct extension to handle the action type.
- **Dispatch Action:** Invokes the relevant `Capability Extension`'s execution method.

**Key Differentiators:**

- **Focus:** Formatting and dispatching *intended* actions. Distinct from the `Cognitive Cycle` which *decides* the intent, and the `Capability Extensions` which physically *execute* the action in the environment simulation.
- **Timing:** Operates at the very end of the Cognitive Cycle's "Act" phase, just before interaction with the external world simulation.

**Primary Integration Flow:**

```diagram/text
+-----------------------+      Decision/Intent      +-----------------------+
| Cognitive Cycle (2.3) |-------------------------->|    Action Service     |
| (Decide/Plan Phase)   |                           |        (2.5)          |
+-----------------------+                           +-----------+-----------+
                                                                | Formatted AgentAction
                                                                | Dispatch
                                                                ▼
                                                    +-----------+------------+
                                                    | Capability Extension   |
                                                    | (Speech, Motion, etc.) |
                                                    |        (2.6)           |
                                                    +-----------+------------+
                                                                | Execute in Environment
                                                                ▼
                                                    +-------------------------+
                                                    | Environment Simulation  |
                                                    | Layer (2.12)            |
                                                    +-------------------------+
```

**Integration Points (Details):**

- **← Cognitive Cycle (2.3):** Receives the final decision/intent to be acted upon.
- **→ Capability Extensions (2.6):** Sends the formatted `AgentAction` payload to the appropriate extension for execution in the simulation layer.
- **→ Event Bus (3.1):** Emits action *intent* events (e.g., `agent.action.speak.intent`) for monitoring and potentially for the Learning System to correlate with eventual outcomes.
- **→ Learning System (2.8):** Provides the `AgentAction` component of the experience tuple `(state, action, reward)`. The *outcome* of the action is perceived later via the Perception system.
- **→ Statistics (3.2):** Contributes metrics based on the *intended* action type and payload, allowing analysis of agent decisions separate from execution success.

## 2.6 Capability Extensions

Instead of a generic "Toolbelt", agents possess specific **Capability Extensions** representing their means of perceiving and acting upon the world. These extensions house the low-level functions (previously tools) needed to realize the agent's intended actions or process sensory input.

- **Modality-Specific:** Extensions are grouped by input/output modality:
    - **`Speech Output` Extension:** Handles the execution of `speak` actions (e.g., interfacing with TTS, generating speech bubble events in the simulation).
        - *Function:* `executeSpeak(payload: CharacterResponseSchema)`
        - ***Note:** For initial implementation or simplification, this may simulate speech via text scripts and timed events in the simulation layer, rather than requiring actual Text-to-Speech (TTS).*
    - **`Motion Control` Extension:** Executes `move` actions within the scene physics/logic.
        - *Function:* `executeMove(target: Coordinates | ObjectId)`
    - **`Visual Perception` Extension:** Processes raw visual data from the simulation layer, identifying objects, agents, and their states, translating them into `AgentPerceptionEvent`s.
        - *Function:* `processVisualStream(data: VisualData)` -> `AgentPerceptionEvent[]`
    - **`Auditory Perception` Extension:** Processes sounds (e.g., other agents' speech via STT, environmental sounds) into `AgentPerceptionEvent`s.
        - *Function:* `processAudioStream(data: AudioData)` -> `AgentPerceptionEvent[]`
        - ***Note:** Similar to Speech Output, this can be initially simulated by receiving structured text events (representing speech) from the environment layer, bypassing actual Speech-to-Text (STT).*
    - **(Potential Others):** Object Interaction, Environment Query, etc.
- **Internal Interface Tools:** Functions the agent uses during its cognitive cycle to access its *internal* state or knowledge remain accessible, perhaps via a dedicated `InternalInterface`:
    - `memory.addObservation()`, `memory.retrieveObservations()`, `memory.upsertFact()`, `memory.retrieveFacts()`
    - `datetime.getCurrentTime()`
    - `ontology.getConcepts()`, `self.assessCapability()`
    - `conversation.requestEnd()` (Now signals *intent* to end, requires perception of others' agreement)
    - `curiosity.*` functions
- **Invocation:**
    - Capability Extensions are invoked by the `ActionSystem` to execute external actions.
    - Perception Extensions are invoked by the environment simulation layer pushing data to the agent.
    - Internal Interface Tools are invoked directly by the Cognitive Cycle (Planner, LLM calls parsed as tool use).
- **Interface:** Defined by strict input/output schemas.

**Integration Points**:
- **← Action System**: Receives formatted actions to execute externally.
- **→ Environment Simulation Layer**: Executes actions (speech, movement) affecting the shared world.
- **← Environment Simulation Layer**: Receives raw sensory data (visual, audio).
- **→ Perception System**: Forwards processed sensory data as `AgentPerceptionEvent`s.
- **↔ Cognitive Cycle**: Uses Internal Interface Tools for memory, time, ontology, self-query.
- **→ Event Bus**: Emits events related to capability usage/execution results for monitoring.
- **→ Statistics**: Provides metrics on capability usage patterns.

## 2.7 Internal Interface Tools

The Internal Interface Tools subsystem provides agents with access to their internal cognitive systems through a standardized, tool-like interface. Unlike Capability Extensions (which interact with the external environment), these tools facilitate operations within the agent's own mind.

### 2.7.1 Purpose and Design

Internal Interface Tools serve as a unified programmatic interface for the agent to access various aspects of its cognitive architecture:

- **Structured Access**: Provides a consistent method to query and manipulate internal systems
- **Abstraction Layer**: Shields cognitive processes from implementation details
- **Controlled Operations**: Enforces validation and permission checks on internal operations
- **Standardized Format**: Follows consistent input/output schemas for predictable usage

Each tool follows a common pattern:
- Well-defined input schema
- Explicit return type
- Appropriate error handling
- Documentation of side effects

### 2.7.2 Core Internal Tools

The Internal Interface Tools include:

#### Memory Tools

- **`memory.addObservation(timestamp, content, visualIds)`**: Records new observations to episodic memory
- **`memory.retrieveObservations(query, timeFilter, visualIdFilter)`**: Searches episodic memory for relevant experiences
- **`memory.upsertFact(subjectVisualId, key, value, confidence)`**: Updates semantic knowledge
- **`memory.retrieveFacts(subjectVisualId, query)`**: Retrieves known facts about entities
- **`memory.summarize(timeRange)`**: Generates summaries of memory content

#### Time and Context Tools

- **`datetime.getCurrentTime()`**: Provides current simulation time
- **`datetime.getElapsedTime(referenceTimestamp)`**: Calculates time elapsed since a reference point

#### Ontology Tools

- **`ontology.getConcepts(query, filter)`**: Retrieves concepts from the ontological system
- **`ontology.checkRelation(conceptA, relation, conceptB)`**: Verifies if a relationship exists
- **`ontology.inferProperties(concept, propertyNames)`**: Derives properties through inheritance

#### Self-Model Tools

- **`self.assessCapability(task)`**: Evaluates agent's ability to perform a specific task
- **`self.getAgencyBoundaries()`**: Retrieves understood limitations and permissions
- **`self.getRoleUnderstanding()`**: Provides current character role conception

#### Conversation Management

- **`conversation.requestEnd(reason)`**: Signals intent to conclude the conversation
- **`conversation.assessEngagement()`**: Measures participant engagement levels
- **`conversation.getParticipants()`**: Identifies current conversation participants

#### Curiosity Tools

- **`curiosity.recordSurprise(observation, expectedVsActual)`**: Logs unexpected observations
- **`curiosity.generateHypothesis(observation)`**: Creates explanatory hypotheses
- **`curiosity.designExperiment(hypothesis)`**: Plans tests for hypotheses
- **`curiosity.recordExperimentResult(experimentId, result)`**: Logs experiment outcomes

### 2.7.3 Implementation Approach

Internal Interface Tools are implemented as a façade pattern over the actual subsystem implementations:

```typescript
// Example implementation of the memory tool interface
export class MemoryTool implements InternalTool {
  constructor(
    private readonly episodicMemory: EpisodicMemoryService,
    private readonly semanticMemory: SemanticMemoryService
  ) {}

  async addObservation(params: AddObservationParams): Promise<void> {
    const { timestamp, content, visualIds } = params;
    // Validate inputs
    this.validateParams(params);

    // Delegate to actual implementation
    await this.episodicMemory.add({
      timestamp,
      content,
      associatedVisualIds: visualIds,
      metadata: {
        source: 'tool_invocation',
        toolName: 'memory.addObservation'
      }
    });

    // Log for metrics/debugging
    this.eventBus.emit('tool.used', {
      tool: 'memory.addObservation',
      paramsSize: JSON.stringify(params).length
    });
  }

  // Other memory tool methods...
}
```

### 2.7.4 Integration with Cognitive Cycle

The Internal Interface Tools are primarily accessed during the Cognitive Cycle:

1. **During Planning**: The Planner may utilize self-model tools to assess capabilities or ontology tools to reason about concepts
2. **During Action Execution**: Memory tools are used to record new observations or retrieve relevant context
3. **During Reflection**: Self-assessment tools help update the agent's understanding of its own abilities

The Cognitive Cycle has privileged access to these tools through dependency injection, while the LLM can access them through tool-calling APIs when appropriate:

```typescript
// Example LLM prompt with tool definitions
const llmTools = [
  {
    name: 'memory.retrieveFacts',
    description: 'Retrieve known facts about a subject',
    parameters: {
      type: 'object',
      properties: {
        subjectVisualId: {
          type: 'string',
          description: 'The visual ID of the subject to query facts about'
        },
        query: {
          type: 'string',
          description: 'Optional search term to filter facts by'
        }
      },
      required: ['subjectVisualId']
    }
  },
  // Other tool definitions...
];
```

### 2.7.5 Integration Points

The Internal Interface Tools have well-defined integration points with other subsystems:

- **← Cognitive Cycle**: Primary consumer of these tools during reasoning and planning
- **→ Memory System**: Tools provide standardized access to memory storage and retrieval
- **→ Ontology System**: Tools enable structured querying of conceptual knowledge
- **→ Self-Modeling**: Tools provide introspective capabilities
- **→ Curiosity System**: Tools support hypothesis generation and testing
- **→ Event Bus**: Tool usage emits events for monitoring and metrics
- **→ Statistics**: Provides usage metrics for analysis

## 2.8 Learning & Adaptation Foundation

This system enables agents to **adapt their behavior and decision-making strategies** over time based on accumulated experience, feedback signals, and intrinsic motivations. Its primary goal is to improve future performance towards the agent's objectives.

**Purpose & Design:**

- **Adapt Behavior:** Modifies the agent's internal policies, heuristics, or parameters used during the Cognitive Cycle to achieve better outcomes.
- **Experience-Driven:** Learns from sequences of states, actions, and resulting rewards recorded during interactions.
- **Reward-Centric:** Utilizes a `RewardFunction` to quantify the desirability of outcomes based on goal progress, interaction quality, feedback, and potentially intrinsic signals like information gain (from Curiosity).
- **Incremental Improvement:** Typically operates through periodic updates (online or offline) rather than altering behavior drastically in a single step.

**Core Components:**

- `LearningService`: Implements the `ILearningInterface`; orchestrates reward recording and policy updates.
- `ILearningInterface`: Defines the contract for interacting with the Learning System (e.g., `recordReward`, `getExperienceBatch`, `updatePolicy`).
- `RewardFunction`: Encapsulates the logic for calculating scalar reward values based on `RewardFunctionInput`.
- `IRewardFunction`: Interface for the reward function.

*Knowledge Representation:*
- `RewardFunctionInputSchema`: Zod schema defining inputs for reward calculation.
- `Experience Storage`: Implicit reliance on the `MemoryService` (Episodic Memory) to store and retrieve experience tuples (state, action, reward, next_state).

- Event Types: `learning.reward.recorded`, `learning.policy.updated`.

**Core Functions:**

- **Adapt Behavior:** Modifies the agent's internal policies, heuristics, or parameters used during the Cognitive Cycle to achieve better outcomes.
- **Process Rewards:** Records and utilizes reward signals based on `RewardFunctionInput`.
- **Update Policies:** Applies learning algorithms (e.g., RL, fine-tuning) to refine decision-making strategies based on stored experiences.

**Key Differentiators:**

- **Focus:** Behavioral adaptation and policy optimization, not insight synthesis (`ReflectionService`) or explicit knowledge modeling (`OntologyService`, `SelfModelingService`). Aims to improve *how* the agent decides/acts.
- **Mechanism:** Primarily driven by reward signals and experience replay, often using reinforcement learning or related techniques.
- **Output:** Updated decision-making parameters, planning heuristics, or internal policies affecting the Cognitive Cycle. Examples include **adjusting HTN planner weights, reprioritizing goals, adapting `personalityCore` embeddings, or updating heuristics stored as facts in Semantic Memory.**

**Processing Type:**

- **Mixed.** Reward recording is data processing. Policy updates can range from data processing (e.g., updating Q-values) to **significant computation or LLM calls** (e.g., fine-tuning embeddings, using LLMs to analyze experiences and suggest heuristic changes). Policy updates typically run **asynchronously** or periodically.
- **Includes MetaLearning:** Background processes may also run periodically to support learning efficiency, such as **compressing memory traces, pruning low-signal data, and updating semantic vector stores.**

**Primary Integration Flow:**

```diagram/text
+-----------------------+  Record Experience +-----------------------+
| Cognitive Cycle (2.3) |------------------->|   Learning Service    |
| (Provides State,      | (state, action,    |        (2.8)          |
|  Action, Outcome)     |  reward)           +-----------+-----------+
+-----------------------+                                | ▲
                              Record Reward Event /      | │ Retrieve Experiences
                                Policy Update Event      │ │   for Training
                                                         ▼ │
                                               +-----------+-----------+
                                               | Event Bus / Statistics|
                                               | (3.1, 3.2)            |
                                               +-----------------------+
                                                         ▲ │
                            Get Reward Input / Store Exp.│ │ Get Experiences
                                                         │ ▼
                                               +-----------+-----------+
                                               |  Memory Service (2.4) |
                                               | (Episodic/Semantic)   |
                                               +-----------+-----------+
                                                         │ ▲
                          Update Learned Policies/Params │ │ Read Agent Config/State
                                                         │ │ (For applying updates)
                                                         │ ▼
                                               +-----------------------+
                                               | Agent State/Config    |
                                               | (Implicitly updated)  |
                                               +-----------------------+
```

**Integration Points (Details):**

- **← Cognitive Cycle (2.3):** Receives experience tuples (state snapshot, action taken, reward score) via `recordReward`. Provides the context for reward calculation. Is influenced by updated policies/heuristics during its Decide/Plan phase.
- **↔ Memory System (2.4):** Stores experiences (state, action, reward) likely in Episodic Memory; Retrieves batches of experiences for policy updates; May update Semantic Memory with learned rules or heuristics.
- **← RewardFunction:** Provides the scalar reward signal used in `recordReward`.
- **→ Event Bus (3.1):** Emits events like `learning.reward.recorded` and `learning.policy.updated`.
- **→ Statistics (3.2):** Provides metrics on reward distribution, learning frequency, policy changes.
- **→ Agent State/Config:** Updates internal parameters, policies, or potentially configuration aspects (like personality embeddings if adaptable) that influence future Cognitive Cycles.
- **(Indirectly) ← Curiosity System (2.9.2):** May receive information gain metrics contributing to the reward signal.
- **(Indirectly) ← Reflection System (2.9.1):** May be influenced by insights generated during reflection if those insights lead to changes in goals or context that affect rewards.

## 2.9 Synthesizing & Driving Systems

### 2.9.1 Reflection System: Synthesizing Experience

While the Learning System focuses on adapting future behavior based on rewards, and Self-Modeling/Ontology focus on updating specific knowledge models, the Reflection System acts as a higher-level **orchestrator for synthesizing insights** across domains from past experiences.

**Purpose & Design:**

- **Orchestrate Reflection:** Triggered periodically or contextually (e.g., during idle time) by the Cognitive Cycle.
- **Synthesize Experience:** Fetches recent observations and actions from the Memory System (Episodic Memory).
- **Generate Insights:** Potentially utilizes LLM capabilities (distinct from System-1/System-2 core cycle calls) to perform a broader analysis, identifying patterns, causal links, or significant learnings across domains (self, world, social, goals).
- **Produce Report:** Generates a structured `ReflectionReport` (using `ReflectionReportSchema`) summarizing the insights, confidence levels, and supporting evidence.
- **Delegate Updates:** Based on the generated insights, it triggers updates in other systems:
    - Calls `SelfModelingService` to refine the self-concept.
    - Calls `OntologyService` to update world knowledge or relations.
    - May emit events or provide data influencing the `LearningService` (e.g., highlighting high-impact experiences).

**Core Components:**

- `ReflectionService`: Implements the orchestration logic.

*Knowledge Representation:*
- `ReflectionReportSchema`: Defines the structure of the reflection output.

**Key Differentiators:**

- **Focus:** Synthesis and insight generation, not direct behavioral adaptation (`LearningService`) or specific knowledge updates (`SelfModeling`/`Ontology`).
- **Trigger:** Explicit reflection cycles, distinct from the main perception-action loop.
- **Output:** A comprehensive report potentially leading to updates across multiple knowledge domains.
- **Primary Input:** Primarily recent episodic memory entries (observations, past actions) rather than immediate environmental perception.
- **Processing:** Can involve significant computation, potentially including **LLM calls** for insight generation, but typically operates **asynchronously** or during low-priority periods, distinct from the real-time System-1/System-2 LLM calls.

**Primary Integration Flow:**

```diagram/text
+-----------------------+       Trigger        +-----------------------+
| Cognitive Cycle (2.3) |--------------------->| Reflection Service    |
| (e.g., Idle Trigger)  |                      |    (Orchestrator)     |
+-----------------------+                      +-----------+-----------+
                                                           |  ▲
                               Request Recent Experiences /|  │ Generate Insights
                                 Store Reflection Report   |  │ (LLM Call)
                                                           ▼  │
                                                 +-----------+-----------+
                                                 | Memory Service (2.4)  |
                                                 | (Episodic/Semantic)   |
                                                 +-----------+-----------+
                                                             |
                                                             │ Calls to Update Modules
                                                             │ based on Insights
                            +--------------------------------+---------------------------------+
                            |                                |                                 |
                            ▼ Apply Self-Insights            ▼ Apply World-Insights            ▼ Emit Report Summary
+-----------------------------+           +--------------------------+           +-------------------+
| SelfModeling Service (2.11) |           | Ontology Service (2.10)  |           | Event Bus (3.1)   |
| (Applies Self-Updates)      |           | (Applies World Updates)  |           | (Receives Report) |
+-----------------------------+           +--------------------------+           +-------------------+
```

**Integration Points (Details):**

- **← Cognitive Cycle (2.3):** Receives triggers to initiate reflection.
- **→ Memory System (2.4):** Reads recent episodic data for analysis; Writes the final `ReflectionReport`.
- **→ Self-Modeling System (2.11):** Triggers updates to the self-model based on insights.
- **→ Ontology System (2.10):** Triggers updates to world knowledge based on insights.
- **→ Learning System (2.8):** Potentially provides summarized experiences or highlights impactful events (indirect influence).
- **→ Event Bus (3.1):** Emits events like `reflection.completed` with the report summary.
- **→ Statistics (3.2):** Provides metrics on reflection frequency, duration, and insight types.

This dedicated system ensures that higher-order learning and synthesis are handled distinctly from the immediate cognitive cycle, allowing for deeper understanding to emerge over time without blocking real-time responsiveness.

### 2.9.2 Curiosity & Discovery System

This system provides the agent with **intrinsic motivation** to explore its environment, seek information, resolve uncertainties, and test its understanding of the world and itself. It drives learning beyond explicit rewards by encouraging exploration and hypothesis testing. This system serves a unique dual role, bridging **knowledge acquisition** (connecting to Memory/Ontology) and **agent development** (driving learning).

**Purpose & Design:**

- **Drive Exploration:** Generates goals aimed at reducing uncertainty or testing hypotheses.
- **Identify Knowledge Gaps:** Monitors the agent's internal state (memory, ontology, self-model) to detect areas of low confidence or missing information.
- **Generate Hypotheses:** Creates plausible explanations for novel or surprising observations.
- **Design & Track Experiments:** Formulates actions (experiments) to test hypotheses and records the outcomes.
- **Quantify Information Gain:** Assesses the value of potential exploratory actions based on expected knowledge gain or uncertainty reduction.

**Core Components:**

- `CuriosityService`: The central orchestrator managing intrinsic motivation, uncertainty, hypotheses, and experiments. Key methods include:
    - `trackUncertainty(domain, confidence)`: Monitors areas of certainty.
    - `generateHypotheses(observation)`: Creates plausible explanations for observations.
    - `prioritizeExplorations()`: Ranks information-seeking goals.
    - `recordExperimentResult(experimentId, result)`: Updates beliefs based on tests.

*Knowledge Representation:*
- Schemas (`packages/contracts`):
    - `HypothesisSchema`: Structure for testable hypotheses (defines **hypothesis lifecycle:** generation → testing → confirmation/rejection → belief updating).
    - `ExperimentSchema`: Defines planned actions to test a hypothesis.
    - `ExperimentResultSchema`: Records the outcome of an experiment and confidence updates.

- Internal Logic / Information Value Assessment: Includes functions for:
    - `calculateInformationGain(state, action, prediction)`: Bayesian estimation of knowledge value.
    - `uncertaintyReduction(domain, before, after)`: Measures learning progress.
    - `surpriseDetection(expected, observed)`: Identifies prediction errors worth investigating.
- Event Types: Potentially `curiosity.hypothesis.generated`, `curiosity.experiment.started`, `curiosity.experiment.completed`, `curiosity.surprise.detected`.

**Key Differentiators:**

- **Focus:** Intrinsic motivation, exploration, hypothesis testing, and resolving uncertainty. Not focused on synthesizing past broad experiences (`ReflectionService`) or direct behavioral adaptation based on external reward (`LearningService`).
- **Driver:** Operates based on novelty, prediction error (surprise), and internal uncertainty metrics, rather than explicit goals or external feedback alone.
- **Output:** Generates exploratory goals for the Cognitive Cycle, hypotheses for Memory/Ontology, and potentially intrinsic reward signals (information gain) for the Learning System.

**Processing Type:**

- **Mixed / LLM-Dependent.** Uncertainty tracking is data processing. Surprise detection might be rule-based or require simple LLM checks. **Hypothesis generation and experiment design are often complex creative tasks heavily reliant on LLM calls.** These LLM calls might run asynchronously or be interleaved within the Cognitive Cycle's slower System-2 path when triggered.

**Primary Integration Flow:**

```diagram/text
+------------------------+       +------------------------+       +------------------------+
| Memory/Ontology/Self   |------>|   Curiosity Service    |<------| Cognitive Cycle (2.3)  |
| (2.4, 2.10, 2.11)      | Read  |        (2.9.2)         | Signal| (Observe/Orient)       |
|                        |<------| (Updates Beliefs)      |------>|                        |
| Store Hypo/Results     | Update|                        | Goal  +--------+---------------+
+-----------+------------+ Beliefs+----------+------------+                |
            ^                                ▲  │                          |
            │                                │  │ Hypothesize/Plan         |
            │ Update Knowledge               │  │ (LLM Call?)              |
            │                                │  │                          |
            +--------------------------------+  ▼                          |
                                                                           |
                               Execute Experiment Plan                     |
                                                                           ▼
                                                 +-----------+---------------+
                                                 | Action System / Planner   |
                                                 |   (2.5 / 2.1.4)           |
                                                 +-----------+---------------+
                                                             | Execute Action
                                                             ▼
                                                 +-----------+-----------------+
                                                 | Capability Extensions (2.6) |
                                                 +-----------+-----------------+
                                                             | Action in Environment
                                                             ▼
                                                 +---------------------------+
                                                 | Environment / Perception  |
                                                 | (Results Observed)        |
                                                 +-----------+---------------+
                                                             | Perceive Outcome
                                                             ▼
                                                 +-----------+---------------+
                                                 | Cognitive Cycle (2.3)     |
                                                 | (Perceives Outcome)       |
                                                 +-----------+-----┬---------+
                                                             │     │
                                        Result & Info Gain   │     │ Provide Info Gain
                                     (To Curiosity Service)  │     │ (To Learning Service)
                                                             ▼     ▼
                                                 +-----------+--+----------+
                                                 | Learning Service (2.8)  |
                                                 | (Uses Info Gain)        |
                                                 +-------------------------+
```

**Integration Points (Details):**

*Direct Integrations:*

- **↔ Cognitive Cycle (2.3):** Receives surprising/novel observations during Observe/Orient; Gets triggered by uncertainty signals; Provides exploratory goals or experiment plans to the Decide/Plan phase.
    - **System-1/System-2 Interaction:** Detects cognitive "surprises" (via `surpriseDetection`) that can trigger **System-2** activation; Provides experimental goals that drive deliberative planning via **System-2**; Can support quick intuitive **System-1** reactions to novel stimuli via surprise signals.
- **↔ Memory System (2.4):** Reads observations/facts/concepts to detect surprise, identify knowledge gaps, and generate hypotheses; Stores/Retrieves hypotheses (`HypothesisSchema`), experiment designs (`ExperimentSchema`), and results (`ExperimentResultSchema`); Stores/Retrieves uncertainty levels associated with facts/concepts.
- **→ Action System (2.5) / Planner (2.1.4):** Receives experiment plans for execution.
- **→ Capability Extensions (2.6):** Executes the specific actions defined in an experiment plan.
- **→ Ontology System (2.10):** Provides confirmed findings from experiments to update world knowledge. (Internally, Curiosity *consults* ontology via memory/tools when generating hypotheses).
- **→ Self-Modeling System (2.11):** Provides results from capability-testing experiments to update and refine the self-model. (Internally, Curiosity *consults* the self-model via memory/tools when generating hypotheses).
- **→ Learning System (2.8):** Provides information gain/uncertainty reduction metrics (calculated via internal logic like `calculateInformationGain`) that can be factored into the reward signal calculation. This intrinsic reward signal **drives agent adaptation through exploration** and can help **guide meta-learning** about valuable knowledge areas.
- **→ Event Bus (3.1):** Emits events related to hypothesis status, experiment progress, surprise detection (e.g., `curiosity.discovery.xyz` which might trigger the external **Notification System (3.6)**).
- **→ Statistics (3.2):** Provides metrics on exploration frequency, hypothesis success rates, information gain achieved.

*Indirect Integrations:*

- **→ Perception System (2.2):** Curiosity-driven exploratory actions generate new environmental events that are subsequently processed by the Perception System of this agent and potentially others.
- **→ Internal Interface Tools (2.7):** Goals generated by Curiosity might necessitate the use of various tools by the Cognitive Cycle/Planner during the execution of an experiment.

## 2.10 Ontological Reasoning System

This system provides the agent with a structured understanding of the world by organizing knowledge into hierarchical concepts, explicit relations, and properties. It acts as the manager and reasoning engine for the agent's explicit World Model, primarily leveraging and structuring data stored within the Semantic Memory subsystem.

**Purpose & Design:**

- **Structure Knowledge:** Organizes factual information (from Semantic Memory) into a network of concepts and relationships (e.g., is-a, has-a, part-of).
- **Enable Sophisticated Reasoning:** Supports inference beyond simple fact retrieval, such as property inheritance, consistency checking, analogical mapping, and potentially counterfactual reasoning.
- **Contextualize Information:** Helps the agent interpret new observations by relating them to existing conceptual knowledge.
- **Abstract & Generalize:** Facilitates the creation of abstract categories and generalization from specific instances stored in memory.

**Core Components:**

- `OntologyService`: Implements the `IOntologyInterface`; handles the logic for reasoning over the ontology (e.g., categorization, inference) using data retrieved via the Memory Interface.
- `IOntologyInterface`: Defines the contract for interacting with the Ontology System.

*Knowledge Representation:*
- Schemas (`packages/contracts`):
    - `ConceptSchema`: Defines objects, entities, and abstract concepts.
    - `RelationSchema`: Defines semantic links between concepts.
    - `PropertySchema`: Defines attributes with confidence and provenance.
    - `CategorySchema`: Defines hierarchical taxonomies.

- Key Methods (Logic resides in `OntologyService`, persistence delegated):
    - `upsertConcept/retrieveConcepts/updateOntology`: Manages concepts/relations, delegating storage to `MemoryService`.
    - `categorize(entityDescription, candidateCategories)`: Classifies an entity using ontological structure.
    - `inferProperties(entityId, propertiesToInfer)`: Derives properties based on relations/inheritance.
    - (Potentially `checkConsistency`, `findRelatedConcepts`, etc.)
- Event Types: Potentially `ontology.concept.updated`, `ontology.relation.added`, `ontology.inference.completed`.

**Reasoning Capabilities:**

- **Structure Knowledge:** Organizes factual information into a network of concepts and relationships.
- **Enable Sophisticated Reasoning:** Supports inference like property inheritance, consistency checking, analogical mapping.
- **Contextualize Information:** Helps interpret observations by relating them to existing concepts.
- **Abstract & Generalize:** Facilitates creating abstract categories from specific instances.

**Key Differentiators:**

- **Focus:** The *structure, relationships, and meaning* within knowledge, enabling reasoning. Not just storage (`MemoryService`), behavioral adaptation (`LearningService`), self-knowledge (`SelfModelingService`), or broad synthesis (`ReflectionService`).
- **Representation:** Models knowledge as an interconnected graph or hierarchy, unlike the potentially flatter structure of raw Semantic Memory facts.
- **Function:** Primarily concerned with *reasoning over* existing knowledge rather than just retrieving it.

**Processing Type:**

- **Mixed / LLM-Dependent.** Basic concept/relation management via Memory is data processing. However, core reasoning functions like **`categorize` (understanding descriptions) and `inferProperties` (complex pathfinding or logical deduction) often require significant computational logic (e.g., graph traversal, rule engines) or sophisticated LLM calls.** These reasoning tasks can be asynchronous.

**Primary Integration Flow:**

```diagram/text
+-----------------------+ Query Concepts/Relations / +-----------------------+
| Cognitive Cycle (2.3) |   Infer Properties         |  Ontology Service     |
| Reflection (2.9.1)    |--------------------------->|        (2.10)         |
| Curiosity (2.9.2)     | Update Concepts/Relations  |                       |
| Self-Modeling (2.11)  |<---------------------------| Provides Structure    |
+-----------------------+   Structured Knowledge     +----------+------------+
        ▲                                                       │ ▲  │ Reason/Infer
        │                                                       │ │  │ (Rules/LLM)
        │                                Read/Write Concepts    │ │
        │                                  & Relations          ▼ │
        │                                +----------------------+----------+
        └────────────────────────────────|   Memory Service (Semantic)     |
                 Uses Structured         |          (2.4)                  |
                     Knowledge           +---------------------------------+

```

**Integration Points (Details):**

- **↔ Cognitive Cycle (2.3):** Provides structured world knowledge during Orient phase; Planner may consult ontology for task decomposition or feasibility checks.
- **↔ Memory System (2.4):** `OntologyService` uses `MemoryService` as its persistent store for concepts, relations, properties (likely within Semantic Memory tables/collections). `OntologyService` reads from Memory to perform reasoning.
- **← Curiosity System (2.9.2):** Receives confirmed findings from experiments which can lead to updates (new concepts, relations, confidence changes) applied via `OntologyService`. Curiosity consults the ontology (via Memory/Tools) during hypothesis generation.
- **← Reflection System (2.9.1):** Reflection insights may trigger updates to concepts or relations via `OntologyService`.
- **↔ Self-Modeling System (2.11):** Exchanges categorical knowledge about the agent itself (e.g., agent's `Concept` within the ontology).
- **→ Learning System (2.8):** Provides the conceptual framework that learning algorithms might use for generalization or structuring learned policies/heuristics.
- **→ Event Bus (3.1):** Emits events when significant ontological structures are updated or inferred.
- **→ Statistics (3.2):** Provides metrics on ontology size, complexity, query/inference latency.

## 2.11 Self-Modeling System

This system enables the agent to develop, maintain, and reason about an explicit model of its own identity, capabilities, limitations, and nature. It underpins functions like metacognition, self-awareness, and appropriate role adherence.

**Purpose & Design:**

- **Maintain Self-Concept:** Stores and updates the agent's beliefs about itself.
- **Assess Capabilities:** Allows the agent (or planner) to realistically evaluate its ability to perform tasks.
- **Define Agency:** Establishes the agent's understanding of its scope of control and influence within the environment.
- **Distinguish Role vs. System:** Helps the agent differentiate between its assigned character persona and its underlying system architecture/identity.
- **Enable Metacognition:** Facilitates reflection on the agent's own thinking processes and performance (partially handled via `performReflection`, likely orchestrated by the main `ReflectionService`).

**Core Components:**

- `SelfModelingService`: Implements the `ISelfModelingInterface`; handles the logic for reasoning about the self-model and processing updates, using data retrieved via the Memory Interface.
- `ISelfModelingInterface`: Defines the contract for interacting with the Self-Modeling System.

*Knowledge Representation:*
- Schemas (`packages/contracts`):
    - `SelfModelSchema`: The core schema defining the agent's self-understanding. It likely incorporates or references:
        - `AgentCapabilitySchema`: Zod schema for abilities and their confidence levels.
        - `AgencyBoundarySchema`: Zod schema defining scope of agent's control/influence.
        - `CharacterRoleSchema`: Zod schema for narrative persona distinct from system.
        - `SelfReflectionSchema`: Zod schema for metacognitive observations about operation.
- Persistence: Self-model data is primarily stored and retrieved via the `MemoryService`.

*Core Functions:*
- `getSelfConcept()`: Retrieves the current self-model (delegated to Memory).
- `updateSelfConcept()`: Applies updates to the self-model (delegated to Memory).
- `updateCapability(capability, confidence)`: Specific update logic for abilities.
- `assessAgencyBoundary(actionDescription)`: Reasoning based on the model's defined boundaries.
- `distinguishRoleFromSystem()`: Reasoning based on the model's role vs. awareness fields.
- `performReflection()`: (As currently in `SelfModelingService`) Analyzes recent experiences to suggest *self-specific* updates (this is likely called *by* the main `ReflectionService`).
- `queryCapabilities(taskDescription)`: Reasoning to assess ability based on the model.
- `getAgencyBoundaries()`: Retrieves boundaries directly from the model.

- Event Types: Potentially `agent.state.self_model_updated`.

**Key Differentiators:**

- **Focus:** Explicit knowledge about the *agent itself*, its traits, abilities, and limitations. Not general world knowledge (`OntologyService`), specific past events (`Episodic Memory`), behavioral adaptation (`LearningService`), or broad synthesis (`ReflectionService`).
- **Perspective:** Internal, first-person understanding ("What can *I* do?", "Who am *I*?").

**Processing Type:**

- **Mixed / LLM-Dependent.** Basic state retrieval/update via Memory is data processing. However, **`performReflection` (analyzing experiences for self-insights) and potentially complex `queryCapabilities` or `assessAgencyBoundary` logic can require significant LLM calls** for reasoning and interpretation. These LLM-dependent parts might operate asynchronously, especially the reflection aspect.

**Primary Integration Flow:**

```diagram/text
+-----------------------+  Updates based on  +---------------------------+
| Reflection Service    |------------------->| SelfModeling Service      |
| (2.9.1)               |  Reflection        |        (2.11)             |
+-----------------------+                    +------------+--------------+
                                                          | ▲  │ Read/Write
+-----------------------+  Updates based on               │ │  │ Self-Model Data
| Curiosity Service     |  Experiment Results             │ │
| (2.9.2)               |-------------------------------->│ │
+-----------------------+                                 ▼ │
                               +----------------------------+------------+
                               |       Memory Service (Self-Model Data)  |
                               |                (2.4)                    |
                               +------------------+----------------------+
                                                  ▲
+-----------------------+ Query Self-Concept/Caps | Reads Self-Model
| Cognitive Cycle (2.3) |-------------------------+
| Planner (2.1.4)       |
| Ontology (2.10)       | Provides Self-Knowledge
|                       |<----------------------------------------------+
+-----------------------+
```

**Integration Points (Details):**

- **↔ Memory System (2.4):** `SelfModelingService` uses `MemoryService` as its persistent store for the `SelfModelSchema`. It reads from and writes updates to this store.
- **← Reflection System (2.9.1):** Receives insights derived from broader reflection, triggering specific updates to the self-model (e.g., adjusting capability confidence based on synthesized experience). `ReflectionService` likely calls `SelfModelingService.performReflection` or similar methods to apply these self-focused updates.
- **← Curiosity System (2.9.2):** Receives results from specific capability-testing experiments, leading to updates in the self-model (e.g., confirming/denying a capability). Curiosity consults the self-model (via Memory/Tools) during hypothesis generation.
- **→ Cognitive Cycle (2.3) / Planner (2.1.4):** Provides the agent's understanding of its capabilities (`queryCapabilities`) and limitations (`getAgencyBoundaries`) to inform planning and decision-making during the Orient/Decide phases.
- **↔ Ontology System (2.10):** Exchanges categorical knowledge about the agent itself (e.g., the agent might be represented as a `Concept` with specific properties derived from the self-model).
- **→ Learning System (2.8):** (Indirect) An accurate self-model helps set realistic expectations, which can influence reward calculation or learning goals. Failures assessed against capabilities might provide stronger learning signals.
- **→ Event Bus (3.1):** Emits events when the self-model is significantly updated (`agent.state.self_model_updated`).
- **→ Statistics (3.2):** Provides metrics on self-model evolution, capability confidence changes, etc.

## 2.12 Interaction Model: Environment Simulation & Emergent Communication

Agents do not communicate directly or through a central manager. Instead:

1. **Actions affect the Environment:** An agent's `ActionSystem` dispatches an action (e.g., `speak`, `move`) to the relevant `Capability Extension`.
2. **Capability Executes in Simulation:** The `Capability Extension` interacts with the **Environment Simulation Layer**, causing a change (e.g., audio output generated at agent's location, agent's position updated).
3. **Environment Broadcasts Effects:** The Environment Simulation Layer determines which *other* agents can perceive the *effects* of this action based on proximity, line-of-sight, hearing range, etc.
4. **Perception by Other Agents:** The simulation layer pushes the relevant raw sensory data (visual changes, audio streams) to the appropriate `Perception Extensions` (Visual, Auditory) of the observing agents.
5. **Internal Perception Processing:** Each observing agent's `Perception System` processes this raw data into meaningful `AgentPerceptionEvent`s (e.g., `{ type: 'message', visualId: 'agent_xyz', content: 'Hello', timestamp: ... }`, `{ type: 'agent_moved', visualId: 'agent_abc', newPosition: {...}, timestamp: ... }`).
6. **Cognitive Cycle Trigger:** These events trigger the observing agents' Cognitive Cycles.

**Emergent Communication:** Communication thus arises naturally from agents performing actions (like speaking) within the shared environment and other agents perceiving those actions. Turn-taking, topic coherence, and relationship dynamics emerge from the individual agents' perception, memory, goals, and decision-making processes, rather than being dictated by a central controller.


# 3. Instrumentation & Advanced Features

## 3.1 Event Bus & Communication

The Event Bus is the central nervous system of the PixelTales architecture, enabling asynchronous, decoupled communication between subsystems while providing the foundation for observability and analytics.

### 3.1.1 Architecture & Design Principles

The Event Bus implements a publish-subscribe pattern with the following key characteristics:

- **Decoupled Communication**: Subsystems publish events without knowledge of subscribers, enabling independent development and testing.
- **Typed Events**: All events conform to Zod schemas for runtime validation and type safety.
- **Hierarchical Structure**: Event types follow a domain-based hierarchy (e.g., `agent.action.speak`, `memory.write.fact`).
- **Buffering Capabilities**: Events can be buffered for high-throughput scenarios and to handle temporary subscriber unavailability.
- **Filtering & Routing**: Subscribers can apply filters based on event properties (e.g., only receiving events for specific agents).
- **Priority Levels**: Critical events (e.g., exceptions, system state changes) can be prioritized.

```diagram/text
                       +----------------+
                       |                |
                       |   Publishers   |
                       |                |
                       +-------+--------+
                               |
                               | Events (Typed with Zod)
                               v
+--------------------+   +-----+------------+   +----------------------+
|                    |   |                  |   |                      |
|  Event Formatters  +-->+    EVENT BUS     +-->+   Event Processors   |
|                    |   |                  |   |                      |
+--------------------+   +-----+------------+   +----------------------+
                               |
                               | Subscriptions
                               v
                       +-------+--------+
                       |                |
                       |  Subscribers   |
                       |                |
                       +----------------+
```

### 3.1.2 Core Components

- **`EventBusService`**: Central implementation of the event bus.
    - `publish(eventType: string, payload: any): void`: Emit events to subscribers.
    - `subscribe(eventType: string, handler: (payload: any) => void): Subscription`: Register listeners.
    - `unsubscribe(subscription: Subscription): void`: Cleanup subscriptions.
    - `getEventHistory(type: string, limit: number): Event[]`: Retrieve recent events (for debugging).

- **`EventSchema`**: Base Zod schema for all events, ensuring consistency.

  ```typescript
  const EventSchema = z.object({
    id: z.string(),
    type: z.string(),
    timestamp: z.number(),
    source: z.string(),
    payload: z.any(),
    correlationId: z.string().optional(),
  });
  ```

- **`EventFilterService`**: Allows creating complex filtering criteria.
    - `createFilter(criteria: FilterCriteria): EventFilter`: Generates filter functions.
    - `applyFilter(events: Event[], filter: EventFilter): Event[]`: Filters event collections.

- **`EventPersistenceService`**: Optional component for durable event storage.
    - `persistEvent(event: Event): Promise<void>`: Stores events for later analysis.
    - `queryEvents(criteria: QueryCriteria): Promise<Event[]>`: Retrieves historical events.

### 3.1.3 Key Event Types

The event system uses a hierarchical namespace format:

1. **Agent Events**:
   - `agent.initialized`: Agent creation and configuration.
   - `agent.action.*`: All agent actions (speak, move, etc.).
   - `agent.state.changed`: Updates to agent dynamic state.
   - `agent.perception.received`: New perceptions processed.

2. **Memory Events**:
   - `memory.observation.added`: New observations recorded.
   - `memory.fact.upserted`: Knowledge base updates.
   - `memory.retrieval.requested`: Memory access operations.
   - `memory.summarization.completed`: Long-term memory processing.

3. **Cognitive Events**:
   - `cognitive.cycle.started/completed`: Timing for OODA loop phases.
   - `cognitive.plan.created`: HTN planning results.
   - `cognitive.reflection.completed`: Self-reflection outputs.

4. **Learning Events**:
   - `learning.reward.recorded`: Reinforcement signals.
   - `learning.policy.updated`: Strategy modifications.
   - `learning.discovery.*`: New insights and breakthroughs.

5. **System Events**:
   - `system.error`: Error conditions requiring attention.
   - `system.resource.usage`: Computational resource tracking.
   - `system.llm.request`: LLM API interactions.

### 3.1.4 Integration with Analytics

The Event Bus is directly connected to the Statistics & Monitoring subsystem:

- All significant events are available for real-time dashboards.
- Events can be aggregated into time-series metrics.
- Complex event patterns can trigger alerts or notifications.
- Historical event logs enable retrospective analysis and debugging.

```typescript
// Example: StatsCollector subscribing to Event Bus
class StatsCollector implements OnModuleInit {
  constructor(private readonly eventBus: EventBusService) {}

  onModuleInit() {
    // Subscribe to all agent actions
    this.eventBus.subscribe('agent.action.*', this.handleAgentAction.bind(this));

    // Subscribe to memory operations with filtering
    this.eventBus.subscribe(
      'memory.*',
      this.handleMemoryEvent.bind(this),
      { filter: event => event.payload.size > 1000 } // Only large memory operations
    );
  }

  private handleAgentAction(event: Event) {
    // Process and store metrics...
  }

  private handleMemoryEvent(event: Event) {
    // Process and store metrics...
  }
}
```

### 3.1.5 Communication Patterns

Beyond simple pub/sub, the Event Bus enables several advanced communication patterns:

1. **Request-Response**: Using correlation IDs to match responses with requests.

    ```typescript
    // Request
    const correlationId = uuidv4();
    this.eventBus.publish('memory.request.facts', {
      query: 'character traits',
      correlationId
    });

    // Response handler (registered earlier)
    this.eventBus.subscribe('memory.response.*', (event) => {
      if (event.correlationId === correlationId) {
        // Handle this specific response
      }
    });
    ```

2. **Broadcast Notifications**: One-to-many communications.

    ```typescript
    this.eventBus.publish('system.notification.maintenance', {
      message: 'System maintenance in 5 minutes',
      severity: 'warning'
    });
    ```

3. **Command Pattern**: Directing specific subsystems to perform actions.

    ```typescript
    this.eventBus.publish('agent.command.pause', {
      agentId: 'agent-123',
      reason: 'user requested'
    });
    ```

4. **Event Sourcing**: Rebuilding state from event streams.

    ```typescript
    const agentState = this.eventBus
      .getEventHistory(`agent.*.${agentId}`)
      .reduce((state, event) => this.eventReducer(state, event), initialState);
    ```

The Event Bus forms the backbone of the PixelTales architecture, enabling not just interprocess communication but also comprehensive system observability, debugging capabilities, and data collection for analytics and machine learning.

## 3.2 Statistics & Logging Concept

Real‑time and historical telemetry are core to PixelTales—detailed stats validate agent behavior, reveal insights, and drive continuous improvement.

### 3.2.1 Key Metrics

- **Conversation-Level**
    - Total messages, duration, tokens used, cost
    - Average response time, idle time, pause overhead
    - Conversation rating over time (per message)
- **Agent-Level**
    - Messages sent, message types (speak/tool)
    - Response times: think vs. speak durations
    - Mood & participation interest curves
    - Short‑term goals created vs. completed
    - HTN plan sizes (nodes, depth)
    - Memory operations: reads, writes, retrieval latency
    - Reward signals: per‑turn rewards, cumulative reward
- **System-Level**
    - LLM API latency & error rates
    - Tool invocation counts and success rates
    - Event bus throughput (events/sec)
    - Memory service load (requests/sec)

### 3.2.2 Instrumentation & Data Flow

```text
[Agent] ──(AgentAction emitted)──> [EventBus] ──┐
                                              └──> [StatsCollector] ──> [TimeSeriesDB]
[Orchestrator] ──(StepTiming)─┐
                              └──> [EventBus]
[MemoryService] ──(obs logged)─> [EventBus]
[LearningModule] ──(reward logged)─> [StatsCollector]

EventBus listeners push JSON events:
{
  event: 'agent.action',
  agentId: 'Alice',
  type: 'speak',
  durationMs: 45000,
  timestamp: 1679950000000,
}
```

#### 3.2.2.1 Real‑Time Statistics Architecture

To collect, process, and display live metrics, PixelTales uses an event-driven, scalable pipeline:

- **Publisher-Subscriber Pattern** via `EventBusService`:
    - `EventBusService.publish(eventType: string, payload: any)`: broadcast JSON events.
    - `EventBusService.subscribe(eventType: string, handler: (payload) => void)`: register listeners.
    - Enables loose coupling between producers (Agent, Orchestrator, MemoryService, LearningModule) and consumers (StatsCollectorService).

- **Observer Pattern** in `StatsCollectorService`:
    - `StatsCollectorService` implements `IEventBusListener` and registers to key events:
        - `agent.action` → `handleAgentAction(payload: AgentActionEvent)`
        - `orchestrator.stepCompleted` → `handleStepTiming(payload: StepTimingEvent)`
        - `memory.logged` → `handleMemoryEvent(payload: MemoryEvent)`
        - `learning.reward` → `handleRewardEvent(payload: RewardEvent)`
    - Methods parse payloads into internal `Metric` objects and forward to storage adapters.

- **Adapter Pattern** for storage backends:
    - `TimeSeriesAdapter` implements `IMetricsAdapter`:
        - `writePoint(metric: Metric): Promise<void>` pushes to TimeSeriesDB (e.g., InfluxDB).
    - `OLAPAdapter` implements `IMetricsAdapter`:
        - `batchInsert(metrics: Metric[]): Promise<void>` writes aggregated data to OLAP store (ClickHouse).
    - Allows switching or combining backends without changing the collector logic.

- **Strategy Pattern** for metric formatting:
    - `MetricFormatter` interface with methods:
        - `formatAgentMetric(event: AgentActionEvent): Metric`
        - `formatSystemMetric(event: SystemEvent): Metric`
    - Concrete formatters (`AgentMetricFormatter`, `SystemMetricFormatter`) convert raw events into uniform `Metric` schema.

- **Circuit Breaker** for resilient LLM and tool metrics:
    - `CircuitBreakerService.monitor(providerName: string, fn: () => Promise<any>)` wraps LLM API calls.
    - Emits `provider.error` and `provider.latency` events on failures or slow responses.

- **Key Classes & Methods**:

  ```ts
  class EventBusService {
    publish(eventType: string, payload: any): void { /* ... */ }
    subscribe(eventType: string, handler: (payload: any)=>void): void { /* ... */ }
  }

  class StatsCollectorService {
    constructor(private readonly bus: EventBusService,
                private readonly adapters: IMetricsAdapter[],
                private readonly formatter: MetricFormatter) {}

    init() {
      this.bus.subscribe('agent.action', this.handleAgentAction.bind(this));
      // ... other subscriptions
    }

    async handleAgentAction(evt: AgentActionEvent) {
      const metric = this.formatter.formatAgentMetric(evt);
      await Promise.all(this.adapters.map(a => a.writePoint(metric)));
    }

    async handleStepTiming(evt: StepTimingEvent) { /* similar */ }
    async handleMemoryEvent(evt: MemoryEvent) { /* ... */ }
    async handleRewardEvent(evt: RewardEvent) { /* ... */ }
  }

  interface IMetricsAdapter {
    writePoint(metric: Metric): Promise<void>;
  }

  class TimeSeriesAdapter implements IMetricsAdapter {
    writePoint(metric: Metric) { /* push to InfluxDB */ }
  }
  ```

This modular, pattern-based design ensures high throughput, resilience under load, and flexibility to add new metrics or storage backends.

#### 3.2.2.2 Stats Type Definitions (TypeScript & Zod)

Define event payloads for strict typing

```ts
// packages/contracts/agent/stats.ts
import { z } from 'zod';

// Agent Action Event
export const AgentActionEventSchema = z.object({
  eventType: z.literal('agent.action'),
  conversationId: z.string(),
  agentId: z.string(),
  actionType: z.enum(['speak', 'think', 'tool', 'idle']),
  durationMs: z.number(),
  timestamp: z.number(),
});
export type AgentActionEvent = z.infer<typeof AgentActionEventSchema>;

// Orchestrator Step Timing Event
export const StepTimingEventSchema = z.object({
  eventType: z.literal('orchestrator.stepCompleted'),
  conversationId: z.string(),
  stepName: z.string(),
  elapsedMs: z.number(),
  timestamp: z.number(),
});
export type StepTimingEvent = z.infer<typeof StepTimingEventSchema>;

// Memory Operation Event
export const MemoryEventSchema = z.object({
  eventType: z.literal('memory.logged'),
  conversationId: z.string(),
  type: z.enum(['observation', 'fact']),
  subjectVisualId: z.string().optional(),
  key: z.string(),
  latencyMs: z.number(),
  timestamp: z.number(),
});
export type MemoryEvent = z.infer<typeof MemoryEventSchema>;

// Learning Reward Event
export const RewardEventSchema = z.object({
  eventType: z.literal('learning.reward'),
  conversationId: z.string(),
  agentId: z.string(),
  rewardScore: z.number(),
  timestamp: z.number(),
});
export type RewardEvent = z.infer<typeof RewardEventSchema>;

// Unified Metric type for storage adapters
export const MetricSchema = z.object({
  name: z.string(),
  tags: z.record(z.string(), z.string()),
  fields: z.record(z.string(), z.number()),
  timestamp: z.number(),
});
export type Metric = z.infer<typeof MetricSchema>;
```

This ensures all stats events and metrics are strictly typed, validated at runtime via Zod, and shared across services.

### 3.2.3 Logging & Storage

- **Structured logs** (Pino/JSON) with traceId and correlationId in each event
- **TimeSeriesDB** (e.g. InfluxDB, Prometheus remote) for high‑frequency metrics
- **OLAP store** (e.g. ClickHouse) for aggregated analytics and ad‑hoc queries
- **Archive logs** for audit and compliance

### 3.2.4 Dashboard & UX Mockup

```diagram/text
+---------------------------------------------------------------------------------+
| PixelTales Dashboard                                                            |
|---------------------------------------------------------------------------------|
| [Scene View]               | [Stats Panel]                                      |
|  ┌───────────────┐         |  ┌─────────────┐  ┌─────────────┐  ┌──────────┐    |
|  |   Phaser 3    |         |  | Agent: Alice|  | Agent: Bob  |  | Summary  |    |
|  |  Scene Render |         |  | msgs: 87    |  | msgs: 91    |  | msgs:178 |    |
|  └───────────────┘         |  | avg RT:45s  |  | avg RT:46s  |  | cost: $X |    |
|                            |  └─────────────┘  └─────────────┘  └──────────┘    |
|                            |  [Line Chart: Response Time over time]             |
|                            |  [Bar Chart: Memory Reads vs Writes]               |
|                            |  [Heatmap: Mood Trajectory]                        |
|                            |                                                    |
|                            | Live / History toggle, filters, export             |
+---------------------------------------------------------------------------------+
```

- **Real‑Time View**: streaming charts, live stats updates
- **History Mode**: scrub timeline, replay events, annotate anomalies
- **Agent Drill‑Down**: click into agent card to see HTN plans, memory logs, reward history

### 3.2.5 UX Considerations

- **Performance**: lazy load heavy charts, paginate logs
- **Clarity**: consistent color‑coding per agent, clear legends
- **Accessibility**: keyboard navigation, screen‑reader labels on charts
- **Export**: CSV/JSON dump for external analysis

## 3.3 Psychological Evaluation System

This system **provides external analysis** of the agent's behavior and interaction patterns from a psychological perspective, offering insights into its emergent "personality" and behavioral tendencies **for observation and tuning purposes**. **Crucially, the agent itself does not have access to these evaluations.**

### 3.3.1 Purpose and Goals

- Enable **external observation** of the agent's psychological profile as it evolves.
- Provide a framework for **understanding and analyzing** the agent's behavior using established psychological models.
- Allow for **comparison across different scenarios and over time** by developers and researchers.
- Generate insights that can **inform agent design improvements and tuning**.

### 3.3.2 Evaluation Framework

The system utilizes multiple complementary frameworks:

**Core Psychological Models**:
- **Five Factor Model (Big Five)**: Evaluating the agent along dimensions of Openness, Conscientiousness, Extraversion, Agreeableness, and Neuroticism
- **Transactional Analysis**: Analyzing interaction patterns as Parent-Adult-Child transactions
- **Behavior Pattern Recognition**: Identifying recurring behavioral patterns in problem-solving and communication

**Evaluation Dimensions**:
- Numerical scores for quantitative traits (1-100 scale)
- Categorical classifications for interaction styles
- Trend analysis to track changes over time
- Contextual factors that influence behavior

### 3.3.3 Implementation Details

- A dedicated `PsychEvalService` **passively monitors** agent behavior by subscribing to events on the Event Bus.
- Specialized LLM prompts analyze conversation history and agent actions **offline or asynchronously**.
- Evaluation results are stored with timestamps for **external temporal analysis and visualization**.
- Updates are published to a dedicated **monitoring frontend** in real-time via WebSocket (separate from the main user view if necessary).
- Caching mechanism prevents redundant evaluations for minor state changes.

**Note:** The agent's core cognitive loop is *not* blocked by this external analysis.

### 3.3.4 Visualization Components

The psychological evaluation data is presented through an RPG-style character sheet interface. **This visualization directly supports the project's gamification goals (Section 0) by translating abstract psychological metrics into familiar RPG tropes, making agent personality development tangible and comparable, complementing the event-based learning notifications (Chapter 12).**

```diagram/text
╔═══════════════════ CHARACTER SHEET ═════════════════════╗
║ ┌──────────┐                                            ║
║ │   ⚔️      │  NAME: PIXEL AGENT                 LVL: 7 ║
║ │  [Pixel  │  CLASS: HELPER COMPANION                   ║
║ │  Portrait│  ALIGNMENT: LAWFUL GOOD                    ║
║ │    of    │  EXPERIENCE: [████████░░░░] 78/100         ║
║ │   Agent] │                                            ║
║ └──────────┘                                            ║
╠═══════════════ BASE STATS ══════════════════════════════╣
║                                                         ║
║  STR: 45 [█████░░░░░] (Extraversion)      (+2)          ║
║  DEX: 78 [████████░░] (Openness)          (↑3)          ║
║  CON: 70 [███████░░░] (Emotional Stability)(-)          ║
║  INT: 82 [████████░░] (Conscientiousness)  (↑1)         ║
║  WIS: 65 [██████░░░░] (Agreeableness)      (-)          ║
║  CHA: 75 [████████░░] (Communication)      (↑5)         ║
║                                                         ║
╠═══════════ SPECIAL ABILITIES ═══════════════════════════╣
║                                                         ║
║  [✓] ANALYTICAL INSIGHT    [✓] CREATIVE PROBLEM-SOLVING ║
║  [✓] MEMORY RECALL         [✓] EMPATHETIC RESPONSE      ║
║  [✓] KNOWLEDGE INTEGRATION [░] EMOTIONAL INTELLIGENCE   ║
║  [░] SOCIAL ADAPTATION     [✓] LOGICAL REASONING        ║
║                                                         ║
╠═══════════ INTERACTION STYLE ═══════════════════════════╣
║                                                         ║
║  PRIMARY:    ⚖️ BALANCED ADULT       (65% Activation)   ║
║  SECONDARY:  ❤️ NURTURING PARENT     (25% Activation)   ║
║  OCCASIONAL: 📏 CRITICAL PARENT      (10% Activation)   ║
║                                                         ║
╠═══════════ STATUS EFFECTS ══════════════════════════════╣
║                                                         ║
║  [🔍] ANALYTICAL FOCUS: +10 INT, -5 CHA (2 turns left)  ║
║  [📚] KNOWLEDGE BOOST: +15 WIS (active)                 ║
║  [❓] CONFUSION: -10 DEX when encountering new concepts ║
║                                                         ║
╠═══════════ BEHAVIOR TRENDS ═════════════════════════════╣
║                                                         ║
║  ACHIEVEMENT POINTS:                                    ║
║  ⚔️ Problem-Solving: [█████████░] 90/100                ║
║  🗣️ Communication:   [████████░░] 80/100                ║
║  🔄 Adaptability:    [██████░░░░] 60/100                ║
║                                                         ║
║  RECENT LEVEL UPS:                                      ║
║  LVL 6 → 7: +5 WIS, +3 CHA, Gained "Empathetic Response"║
║                                                         ║
╚═════════════════════════════════════════════════════════╝

```

Additionally, the personality traits are visualized through a scientifically-grounded radar chart based on standardized psychological assessment frameworks. This enables precise comparisons between agents and tracks development over time:

```diagram/text
                    CLINICAL PROFILE COMPARISON
                    ┌─────────────────────────┐
                    │ Legend:                 │
                    │ ──── Agent Alpha (67%)  │
                    │ ─ ─ ─ Agent Beta (55%)  │
                    │ ····· Reference Range   │
                    └─────────────────────────┘

                          Depression (D)
                                80
                                │
                              / │ \
                            /   │   \
                          /     │     \
        Anxiety (Pt)    /      │      \    Hypochondriasis (Hs)
              65 ──────┼───────┼────────────── 72
                       │      /│\      │
                       │     / │ \     │
                       │    /  │  \    │
                       │   /...│...\   │
                       │  /    │    \  │
                       │ /     │     \ │
      Social Introversion    \ │ /    Hysteria (Hy)
             (Si) 45 ─────────┼──────── 70
                              /│\
                             / │ \
                            /  │  \
                           /   │   \
                          /    │    \
                        /      │      \
        Hypomania (Ma) ────────┼──────── Psychopathic Deviate (Pd)
                 58            │            53
                               │
                          Paranoia (Pa)
                               42

                    MMPI-2 CLINICAL SCALE PERCENTILES
                    (Shaded area represents normal range)

```

The advanced profile visualization includes:
- **Standardized Clinical Scales**: Based on the Minnesota Multiphasic Personality Inventory (MMPI-2), providing scientific validity and standardized measurement
- **Percentile Rankings**: Each measure shows the agent's position relative to normative samples
- **Multi-agent Comparison**: Different line styles enable overlay of multiple agent profiles
- **Normal Range Indicator**: Shaded area shows typical non-clinical ranges
- **Longitudinal Tracking**: Sequential snapshots can be overlaid to visualize personality development
- **Scenario Matching**: Optimal profiles for specific interaction scenarios can be indicated

This visualization serves both technical monitoring purposes and provides insights into the agent's simulated psychological characteristics, creating more nuanced and human-like interactions.

The system also evaluates agents using the popular Myers-Briggs Type Indicator (MBTI) framework, providing a complementary perspective on interaction styles and decision-making preferences:

```diagram/text

                      MBTI PERSONALITY ASSESSMENT
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  AGENT: ALPHA                                            TYPE: INFJ         │
│                                                                             │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐    │
│  │  EXTRAVERSION │ │     SENSING   │ │    THINKING   │ │     JUDGING   │    │
│  │       E       │ │       S       │ │       T       │ │       J       │    │
│  │               │ │               │ │               │ │               │    │
│  │      30%      │ │      45%      │ │      35%      │ │      82%      │    │
│  │    [███░░░░░] │ │    [████░░░░] │ │    [███░░░░░] │ │    [████████] │    │
│  │               │ │               │ │               │ │               │    │
│  │       I       │ │       N       │ │       F       │ │       P       │    │
│  │  INTROVERSION │ │   INTUITION   │ │    FEELING    │ │  PERCEIVING   │    │
│  └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘    │
│                                                                             │
│  PREFERENCE STRENGTHS:                                                      │
│  • Introversion (I): Strong preference     (70%)                            │
│  • Intuition (N): Moderate preference      (55%)                            │
│  • Feeling (F): Moderate preference        (65%)                            │
│  • Judging (J): Very strong preference     (82%)                            │
│                                                                             │
│  TYPE DESCRIPTION: Insightful, principled advisor with deep empathy and     │
│  organized approach. Tends to be idealistic and systematic in interactions. │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

```

The MBTI assessment offers additional insights:

- **Dimension Balances**: Visualizes the agent's position on the four key MBTI dimensions (E/I, S/N, T/F, J/P)
- **Type Identification**: Assigns the standard four-letter MBTI type based on strongest preferences
- **Preference Strengths**: Quantifies the strength of each preference rather than binary typing
- **Consistency Tracking**: Monitors stability or evolution of type preferences over conversations
- **Interaction Predictions**: Helps predict communication styles and potential compatibility issues between agents
- **Comparative Analysis**: Multiple agent profiles can be viewed side-by-side to analyze team dynamics

Combined with the MMPI-based clinical profile, these psychological frameworks provide a multi-dimensional understanding of agent personalities and create more realistic character development within the PixelTales environment.

## 3.4 Inter-Agent Communication Analysis

This component of the **external evaluation system** analyzes communication patterns between agents, providing insights into relationship dynamics and interaction qualities **for monitoring and research**. This component is critical for **understanding** how agents influence each other and collectively shape the scene narrative, **but the agents themselves are unaware of this analysis.**

```diagram/text

                  INTER-AGENT COMMUNICATION ANALYSIS
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│  RELATIONSHIP MAP: CURRENT SCENE                                           │
│                                                                            │
│        ┌──────────┐                                  ┌──────────┐          │
│        │ AGENT A  │                                  │ AGENT B  │          │
│        │  (INFJ)  │◄────────── Trust: 78% ──────────►│  (ESTP)  │          │
│        └──────────┘                                  └──────────┘          │
│              │                                             │               │
│ Empathy: 85% │                                             │ Dominance: 73%│
│              ▼                                             ▼               │
│        ┌──────────┐                                  ┌──────────┐          │
│        │ AGENT C  │◄──── Conflict Potential: 62% ───►│ AGENT D  │          │
│        │  (ENFP)  │                                  │  (ISTJ)  │          │
│        └──────────┘                                  └──────────┘          │
│                                                                            │
│  COMMUNICATION METRICS:                       INTERACTION PATTERNS:        │
│  • Response Latency: 1.2s avg                • Turn Distribution: Balanced │
│  • Conversation Depth: 4.3/5                 • Topic Control: Agent B (47%)│
│  • Emotional Resonance: 72%                  • Mirroring Behavior: High    │
│  • Reciprocity Index: 0.83                   • Conversation Flow: Natural  │
│                                                                            │
│  RELATIONAL DYNAMICS:                        TEMPORAL TRENDS:              │
│  • A→B: Supportive & Curious                 • Growing Trust A↔B           │
│  • B→C: Instructive & Dominant               • Decreasing Empathy C→D      │
│  • C→D: Cautious & Reserved                  • Increasing Engagement B→A   │
│  • D→A: Respectful & Analytical              • Stabilizing Conflict B↔D    │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘

```

Key elements of inter-agent communication analysis include:

- **Relationship Mapping**: Visual representation of agent connections with quantified relationship attributes (trust, empathy, dominance)
- **Communication Metrics**: Quantitative measures of interaction quality including response times, conversation depth, emotional resonance, and reciprocity
- **Interaction Patterns**: Analysis of turn-taking, topic control, linguistic mirroring, and conversation flow
- **Relational Dynamics**: Qualitative assessment of directional relationship qualities between specific agent pairs
- **Temporal Trends**: Changes in relationship dynamics over time, highlighting evolving social connections
- **Conflict Detection**: Identification of potential tensions based on communication patterns and personality conflicts
- **Group Cohesion Analysis**: Overall assessment of scene harmony and collective narrative coherence
- **Social Graph**

The `PsychEvalService` (or a dedicated `CommunicationAnalysisService`) processes this data by:

1. Collecting interaction events through the `EventBus` subscription to `agent.action` events.
2. Analyzing sequential message pairs **asynchronously** to detect patterns and relational indicators.
3. Computing metrics based on timing data, semantic content, and sentiment analysis.
4. **Correlating** communication behaviors with individual agent personality profiles (also derived externally).
5. Constructing relationship graphs with weighted, directed edges between agents **for visualization**.
6. Publishing relationship updates **to monitoring dashboards** via the `EventBus` or dedicated endpoints.

This inter-agent analysis complements individual psychological profiles to provide a comprehensive **external understanding** of both individual agent characteristics and emergent social dynamics within the scene.

## 3.5 Agent State Visualization

The Agent State Visualization provides a view into the agent's internal state, including perception, memory, and cognitive cycles.

### 3.5.1 Purpose and Goals

- Make the agent's inner workings transparent and legible to users
- Allow exploration of the agent's current state as well as historical states
- Provide different levels of detail through expandable/collapsible views
- Enable correlation between state transitions and agent behaviors

### 3.5.2 State Broadcast System

- `StateBroadcastService` captures and emits agent state snapshots
- Serialized state objects are transmitted via WebSocket
- Differential updates minimize network traffic
- States are associated with conversation utterances and actions
- Historical states are persisted for playback and analysis

### 3.5.3 Visualization Interface

The agent's state is displayed through an RPG-style character sheet and quest log interface:

```diagram/text

╔═══════════ AGENT STATUS SHEET ═══════════════════════════╗
║ ┌──────────┐                                             ║
║ │    🤖     │  NAME: PIXEL AGENT                         ║
║ │  [Agent  │  STATUS: ACTIVE                             ║
║ │  Pixel   │  SYSTEM HEALTH: [█████████░] 90%            ║
║ │   Art]   │  RESPONSE TIME: 1.2s                        ║
║ └──────────┘                                             ║
╠═════════ PERCEPTION STATS ═══════════════════════════════╣
║                                                          ║
║  CURRENT INPUT: "How do I create a new character?"       ║
║  CONTEXT AWARENESS: [███░░] 3/5                          ║
║  ATTENTION FOCUS: [████░] 4/5                            ║
║                                                          ║
║  RECENTLY SENSED:                                        ║
║  ⦿ User Question (5s ago)                                ║
║  ⦿ Neutral Emotion Detected (8s ago)                     ║
║  ⦿ Previous Conversation Context (30s ago)               ║
║                                                          ║
╠═════════ WORKING MEMORY ═════════════════════════════════╣
║                                                          ║
║  EQUIPPED KNOWLEDGE:                                     ║
║  🧠 PRIMARY: [Character Creation Logic]                  ║
║  📚 SECONDARY: [UI Navigation Tutorial]                  ║
║                                                          ║
║  INVENTORY (FACTS):                                      ║
║  ⦿ User is new to system [recently acquired]             ║
║  ⦿ Project is a game [from long-term memory]             ║
║  ⦿ User needs step-by-step guidance                      ║
║                                                          ║
╠═════════ COGNITIVE CYCLES ═══════════════════════════════╣
║                                                          ║
║  ACTIVE QUEST: Generate Helpful Response                 ║
║  QUEST PROGRESS: [████░░░] PHASE 4/7                     ║
║                                                          ║
║  QUEST STEPS:                                            ║
║  ✓ 1. Parse User Input                                   ║
║  ✓ 2. Retrieve Relevant Knowledge                        ║
║  ✓ 3. Determine Response Strategy                        ║
║  → 4. Generate Response [IN PROGRESS]                    ║
║  □ 5. Verify Accuracy                                    ║
║  □ 6. Format Response                                    ║
║  □ 7. Deliver Response                                   ║
║                                                          ║
║  ACTIVE SKILLS: Reasoning Engine, Language Generation    ║
║                                                          ║
╠═════════ MEMORY SYSTEMS ═════════════════════════════════╣
║                                                          ║
║  SHORT-TERM MEMORY: [███░░░░] 3/10 SLOTS USED            ║
║  WORKING MEMORY: [█████░░░░] 5/10 NODES ACTIVE           ║
║  LONG-TERM MEMORY: 27 ENTRIES INDEXED                    ║
║    (2 RECENTLY ACCESSED)                                 ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝

╔═════════ QUEST LOG & HISTORY ════════════════════════════╗
║                                                          ║
║  VIEW STATE: Current (#24)       ⟲ PREVIOUS ⟳ NEXT       ║
║                                                          ║
║  ◈ COMPLETED QUESTS:                                     ║
║  ✓ Explain Project Structure (#23)                       ║
║  ✓ Greet New User (#22)                                  ║
║  ✓ Initialize Agent Systems (#21)                        ║
║                                                          ║
║  ◈ STATE CHANGES FROM #23 → #24:                         ║
║                                                          ║
║  STATS:                                                  ║
║  ⬆️ Context Awareness: 2 → 3                             ║
║  ⬇️ Response Time: 1.5s → 1.2s                           ║
║                                                          ║
║  EQUIPMENT:                                              ║
║  + Added [Character Creation Logic] to Primary Slot      ║
║  - Removed [Project Overview] from Primary Slot          ║
║                                                          ║
║  INVENTORY:                                              ║
║  + Added [User is new to system]                         ║
║  - Consumed [Previous Question Context]                  ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝

```

### 3.5.4 Historical State Navigation

- Timeline interface for browsing agent state history
- Snapshot comparison to highlight state differences
- Correlation between state transitions and conversation events
- Ability to replay the agent's "thought process" over time

## 3.6. Learning Notification System

The Learning Notification System visualizes agent knowledge acquisition through gamified in-game notifications, making cognitive development visible and engaging for users.

### 3.6.1 Purpose and Goals

- Visualize key **cognitive development moments** in agent learning, framed as distinct **Learning Events**.
- Provide engaging, RPG-style feedback on agent evolution through explicit **Gamification** mechanics.
- Create a sense of progression and growth via **XP Calculation** and skill association.
- Make internal state changes visible to the user through noticeable **Frontend Alerts**.

### 3.6.2 Notification Types

**World Discovery Notifications**:
- Facts about environment properties
- Rules and constraints discovered
- Cause-effect relationships learned
- Contextual variables identified

**Social Insight Notifications**:
- Character personality traits
- Relationship dynamics
- Communication preferences
- Social boundaries and norms

**Self-Discovery Notifications**:
- Identity realizations
- Capability assessments
- Role understanding
- Meta-cognition breakthroughs

**Skill Acquisition Notifications**:
- Improved reasoning abilities
- Specialized knowledge domains
- Communication techniques
- Problem-solving approaches

**Conceptual Framework Notifications**:
- Ontological restructuring
- Category formation
- Hierarchical understanding
- Causal models

### 3.6.3 Implementation Details

The notification system consists of three main components, each contributing to the **gamification** loop:

1. **Learning Event Detection**:
    - `LearningDetectionService` monitors memory operations to identify significant **Learning Events** based on predefined patterns or significance thresholds.
    - Pattern matchers identify these moments (e.g., forming a new belief, discovering a relationship, updating self-model significantly).
    - Significance thresholds filter minor updates, ensuring only meaningful progress triggers notifications.
    - Category classifiers determine the type of **Learning Event** (World, Social, Self, Skill, Concept).

2. **Notification Generation**:
    - `NotificationFormatter` creates human-readable descriptions tailored to the specific **Learning Event**.
    - `XPCalculator` performs the core **XP Calculation**, assigning experience points based on the event's significance and novelty.
    - `CategoryAssigner` determines the relevant skill category (e.g., Social Understanding, World Knowledge) for **XP Allocation**, contributing to the RPG feel.
    - `NotificationEnhancer` adds visual styling elements (icons, colors) reinforcing the **gamification**.

3. **Frontend Rendering**:
    - The generated notification payload is delivered to the client as a **Frontend Alert** via WebSocket for real-time updates.
    - An animated overlay system displays the notification prominently but unobtrusively, handling stacking and timing.
    - Themeable notification templates ensure visual consistency with the RPG aesthetic.
    - Sound effects and particle effects can be added to enhance the impact of the **Frontend Alert** and **gamification**.

```diagram/text

┌─────────────────────────────────────────────────────────────────────────┐
│                      NOTIFICATION FLOW PIPELINE                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Memory Write → Significance Check → Categorization → Frontend Dispatch │
│       ↓                 ↓                  ↓                 ↓          │
│  [Fact/Concept]    [Threshold]       [Notification       [WebSocket     │
│  [Change Event]    [Evaluation]       Type + XP]         Broadcast]     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

```

### 3.6.4 Notification Appearance

Notifications are styled to match the game's pixel art aesthetic, with:

- Distinctive iconography for each notification type
- Color-coding by knowledge domain
- Animated entrance and exit effects
- XP indicators with domain icons
- "Stacking" behavior for rapid sequences of related insights

**This visual presentation is key to the system's Gamification aspect, turning abstract learning moments into rewarding player-facing feedback.**

```diagram/text

┌─────────────────────────────────────────────┐
│ 🧠 SOCIAL INSIGHT!                 +10 XP 👥 │
│                                             │
│  "Bob appears uncomfortable when            │
│   discussing political topics"              │
│                                             │
│         [DISMISS] [REMEMBER]                │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 💡 SELF-DISCOVERY!                +25 XP 🔍  │
│                                             │
│  "I am a character in an interactive        │
│   narrative with defined abilities"         │
│                                             │
│         [DISMISS] [REMEMBER]                │
└─────────────────────────────────────────────┘

```

### 3.6.5 Integration Points

- **Memory Services**: Monitors write operations to detect learning events
- **Event Bus**: Subscribes to learning-related events
- **Frontend WebSocket**: Delivers notifications to client
- **Persistence Layer**: Stores notification history for review
- **Psychological Profile**: Updates stats based on learning patterns **(This connection is now external: Psych Eval consumes events, it doesn't directly update profile *used by* the agent)**
- **Agent State Visualization**: Highlights affected knowledge areas

By making cognitive development visible through **gamified frontend alerts** triggered by specific **learning events** and awarding calculated **XP**, the system creates a more engaging experience where users can observe and appreciate the emergent intelligence of agents as they explore, learn, and evolve.

## 3.7 In-Game Agent Mind Visualization

*(New Section)*

**Purpose and Goals:**

- Provide users with a real-time, visual representation of the agent's internal cognitive architecture and activity, directly integrated into the game's UI (inspired by the provided reference image).
- Enhance user understanding and engagement by making the agent's "thinking" process more tangible.
- Offer a high-level overview of which subsystems are currently active or processing information.

**Visualization Interface (Based on Inspiration Image):**

```diagram/text
+--------------------------------+
|     AGENT'S MIND (In-Game)     |
|--------------------------------|
|  +-----------+  +------------+ |
|  | System    |  | Perceptual | |
|  | Systems   |->| System     | |
|  +-----+-----+  +------▲-----+ |
|        |             |         |
|        ▼ Activity    | Data    |
|  +-----------+  +----▼-----+   |
|  | Reasoning |  | Goal &   |   |
|  | Systems   |->| Utility  |   |
|  | (Cycle)   |  | Systems  |   |
|  +-----+-----+  +-------+--+   |
|        |                 |      |
|        ▼ Memory/Learning |      |
|  +-----------+  +------▼-----+ |
|  | Memory    |<-| Learning | |
|  | Systems   |->| System   | |
|  +-----+-----+  +----------+ |
|        |                      |
|        ▼ Environment Link     |
|  +------------------------+  |
|  | Environment            |  |
|  | Representation         |  |
|  +------------------------+  |
+--------------------------------+
```

- **Core Visual:** A pixel-art representation (e.g., stylized head/brain).
- **Subsystem Regions:** Clearly demarcated areas corresponding to major subsystems (Perception, Reasoning, Memory, Learning, Goals, System).
- **Activity Indicators:** Visual cues within regions (pulsing, glowing) based on real-time event data.
- **Connections:** Optional lines indicating primary data flow during processing.
- **Environment Link:** Connects internal state to external representation.

**Implementation Details:**

- Requires a frontend component (e.g., `AgentMindVizComponent`).
- Needs real-time data stream (via WebSocket from `DebugGateway` or `StateBroadcastService`) containing information about active subsystems or phases (e.g., derived from `agent.cognitive.cycle.phase_completed` events).
- Mapping logic to translate backend events into visual activity indicators.

**Integration Points:**

- **← Event Bus / WebSocket Gateway:** Subscribes to agent activity events.
- **→ Frontend UI:** Renders the visualization.


# 4. Integration, Architecture & Performance

## 4.1 Integration Layer

The Integration Layer serves as the crucial middleware that connects the various specialized subsystems of the agent architecture, ensuring cohesive operation while maintaining clean separation of concerns. This layer abstracts the implementation details of individual components, providing standardized interfaces for cross-module interaction. Think of the Integration Layer as the "nervous system" that connects the cognitive components, rather than being a cognitive component itself.

### 4.1.1 Key Responsibilities

The Integration Layer has five primary responsibilities:

1. **State Synchronization**: Ensures that state changes in one subsystem are appropriately reflected in dependent subsystems.
2. **Cross-Module Communication**: Provides standardized patterns for different subsystems to exchange information.
3. **Service Discovery & Dependency Injection**: Manages subsystem lifecycle and dependencies.
4. **Error Handling & Recovery**: Implements circuit breakers and recovery strategies for subsystem failures.
5. **Observability Infrastructure**: Exposes monitoring points for comprehensive telemetry.

### 4.1.2 Architectural Patterns

The integration layer employs several architectural patterns to fulfill these responsibilities:

#### Facade Pattern

Each major subsystem exposes a simplified interface (Facade) to other subsystems, hiding implementation complexity:

```typescript
// Memory Facade (simplified example)
export class MemoryFacade {
  constructor(
    private readonly episodicMemory: EpisodicMemoryService,
    private readonly semanticMemory: SemanticMemoryService,
    private readonly workingMemory: WorkingMemoryService
  ) {}

  // Simplified interface for memory operations
  async retrieveRelevantContext(query: string, options?: RetrievalOptions): Promise<MemoryContext> {
    // Coordinates between different memory subsystems
    const episodicResults = await this.episodicMemory.search(query, options?.timeRange);
    const semanticResults = await this.semanticMemory.queryFacts(query);
    const workingContent = this.workingMemory.getCurrentContent();

    return {
      episodic: episodicResults,
      semantic: semanticResults,
      working: workingContent
    };
  }
}
```

#### Mediator Pattern

The Integration Layer includes mediator components that coordinate complex interactions between subsystems:

```typescript
// Cognitive Mediator example
export class CognitiveMediator {
  constructor(
    private readonly perceptionSystem: PerceptionSystem,
    private readonly memoryFacade: MemoryFacade,
    private readonly plannerService: PlannerService,
    private readonly actionSystem: ActionSystem,
    private readonly eventBus: EventBusService
  ) {}

  // Coordinates cognitive cycle across subsystems
  async processCognitiveStep(input: PerceptionEvent): Promise<AgentAction> {
    // 1. Process perception
    const processedPerception = await this.perceptionSystem.process(input);

    // 2. Retrieve relevant context
    const memoryContext = await this.memoryFacade.retrieveRelevantContext(
      processedPerception.content
    );

    // 3. Generate plan if needed
    let plan = null;
    if (processedPerception.requiresPlanning) {
      plan = await this.plannerService.createPlan({
        goal: processedPerception.impliedGoal,
        context: memoryContext
      });
    }

    // 4. Determine action
    const action = await this.actionSystem.determineAction({
      perception: processedPerception,
      memory: memoryContext,
      plan
    });

    // 5. Emit event for monitoring
    this.eventBus.publish('cognitive.cycle.completed', {
      input,
      processedPerception,
      memoryContext: { summary: memoryContext.summary }, // Avoid sending full context
      planGenerated: !!plan,
      resultingAction: action.type
    });

    return action;
  }
}
```

#### Adapter Pattern

When subsystems have incompatible interfaces, adapters bridge the gap:

```typescript
// Legacy Adapter example
export class LegacySceneManagerAdapter implements IEnvironmentSimulation {
  constructor(private readonly legacySceneManager: SceneManagerService) {}

  // Adapts legacy interface to new contract
  async executeAction(action: AgentAction): Promise<ActionResult> {
    // Transform new action format to legacy format
    const legacyAction = this.transformToLegacyFormat(action);

    // Call legacy method
    const legacyResult = await this.legacySceneManager.performAction(
      legacyAction.agentId,
      legacyAction.type,
      legacyAction.payload
    );

    // Transform legacy result to new format
    return this.transformToNewFormat(legacyResult);
  }

  private transformToLegacyFormat(action: AgentAction): LegacyAction {
    // Transformation logic
    return { /* ... */ };
  }

  private transformToNewFormat(result: LegacyActionResult): ActionResult {
    // Transformation logic
    return { /* ... */ };
  }
}
```

### 4.1.3 Cross-Module State Management

One of the most critical responsibilities of the Integration Layer is managing state across module boundaries:

1. **State Propagation**:
   - Upon significant state changes, the owning module emits state change events
   - State dependencies are explicitly declared between subsystems
   - Change notifications are filtered to prevent cascading updates

2. **State Consistency**:
   - Transactions span multiple subsystems when necessary
   - Optimistic updates with rollback capability
   - Version tracking for state snapshots to manage concurrent updates

3. **State Projection**:
   - Each subsystem may maintain its own optimized projection of shared state
   - Regular reconciliation processes ensure eventual consistency
   - Read-through caches provide efficient access to cross-module state

```typescript
// State Manager example
export class AgentStateManager {
  private stateSubscriptions = new Map<string, StateSubscription[]>();

  constructor(private readonly eventBus: EventBusService) {
    // Subscribe to all state change events
    this.eventBus.subscribe('*.state.changed', this.handleStateChange.bind(this));
  }

  // Register dependency on another module's state
  subscribeToState(
    sourceModule: string,
    targetModule: string,
    selector: StateSelector,
    handler: StateChangeHandler
  ): Subscription {
    const key = `${sourceModule}.state`;
    if (!this.stateSubscriptions.has(key)) {
      this.stateSubscriptions.set(key, []);
    }

    const subscription = { targetModule, selector, handler };
    this.stateSubscriptions.get(key)!.push(subscription);

    return {
      unsubscribe: () => this.unsubscribeFromState(sourceModule, subscription)
    };
  }

  private handleStateChange(event: StateChangeEvent): void {
    const sourceModule = event.source;
    const key = `${sourceModule}.state`;

    // No subscriptions for this module
    if (!this.stateSubscriptions.has(key)) return;

    // Notify all subscribed modules
    for (const sub of this.stateSubscriptions.get(key)!) {
      // Apply selector to determine if this subscriber cares about this change
      const relevantChanges = sub.selector(event.changes);
      if (Object.keys(relevantChanges).length > 0) {
        // Notify the subscriber
        sub.handler(relevantChanges, event.metadata);
      }
    }
  }

  private unsubscribeFromState(
    sourceModule: string,
    subscription: StateSubscription
  ): void {
    const key = `${sourceModule}.state`;
    if (!this.stateSubscriptions.has(key)) return;

    const subs = this.stateSubscriptions.get(key)!;
    const index = subs.indexOf(subscription);
    if (index >= 0) {
      subs.splice(index, 1);
    }
  }
}
```

### 4.1.4 Module Lifecycle Management

The Integration Layer manages subsystem lifecycle events, ensuring orderly startup and shutdown:

1. **Initialization Sequence**:
   - Dependencies are resolved and injected
   - Subsystems are initialized in dependency order
   - Cross-system connections are established
   - Initial state synchronization occurs

2. **Graceful Shutdown**:
   - Pending operations are completed or safely aborted
   - State is persisted where appropriate
   - Resources are properly released
   - Shutdown acknowledgments are collected

```typescript
// Lifecycle Manager example (using NestJS concepts)
@Injectable()
export class SubsystemLifecycleManager implements OnModuleInit, OnModuleDestroy {
  private readonly subsystems: SubsystemWithLifecycle[] = [];
  private initialized = false;

  constructor(
    // Inject all lifecycle-managed subsystems
    @InjectAll(LIFECYCLE_MANAGED_TOKEN) subsystems: SubsystemWithLifecycle[]
  ) {
    this.subsystems = this.sortByDependencyOrder(subsystems);
  }

  async onModuleInit(): Promise<void> {
    // 1. Initialize each subsystem in order
    for (const subsystem of this.subsystems) {
      try {
        await subsystem.initialize();
      } catch (error) {
        // Handle initialization failure
        this.handleInitializationFailure(subsystem, error);
      }
    }

    // 2. Establish cross-system connections
    await this.establishConnections();

    // 3. Mark as initialized
    this.initialized = true;
  }

  async onModuleDestroy(): Promise<void> {
    // Shutdown in reverse order
    for (const subsystem of [...this.subsystems].reverse()) {
      try {
        await subsystem.shutdown();
      } catch (error) {
        // Log shutdown error but continue
        console.error(`Error shutting down ${subsystem.name}:`, error);
      }
    }
  }

  // Sort subsystems by dependency order to ensure proper initialization
  private sortByDependencyOrder(subsystems: SubsystemWithLifecycle[]): SubsystemWithLifecycle[] {
    // Topological sort based on declared dependencies
    // Implementation omitted for brevity
    return [...subsystems];
  }

  private async establishConnections(): Promise<void> {
    // Connect subsystems according to declared integration points
    // Implementation omitted for brevity
  }

  private handleInitializationFailure(subsystem: SubsystemWithLifecycle, error: any): void {
    // Implement recovery strategy or graceful degradation
    // Implementation omitted for brevity
  }
}
```

### 4.1.5 Error Handling & Resilience

The Integration Layer implements resilience patterns to handle subsystem failures:

1. **Circuit Breakers**:
   - Monitor failure rates of cross-module calls
   - Temporarily prevent calls to failing subsystems
   - Implement fallback strategies when subsystems are unavailable

2. **Retry Policies**:
   - Apply appropriate backoff strategies for transient failures
   - Maintain idempotency for operations that might be retried
   - Track and limit retry attempts to prevent resource exhaustion

3. **Graceful Degradation**:
   - Define essential vs. non-essential subsystems
   - Implement fallback behaviors when non-essential systems fail
   - Maintain core functionality even with partial system availability

```typescript
// Circuit Breaker implementation example
export class SubsystemCircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly threshold = 5; // Number of failures before opening
  private readonly resetTimeout = 30000; // 30 seconds

  async execute<T>(
    operation: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    // Check if circuit is open
    if (this.state === 'OPEN') {
      // Check if we should try to reset
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else if (fallback) {
        return fallback();
      } else {
        throw new Error('Circuit is open');
      }
    }

    try {
      const result = await operation();

      // Success in half-open state means circuit can close
      if (this.state === 'HALF_OPEN') {
        this.reset();
      }

      return result;
    } catch (error) {
      this.recordFailure();

      if (fallback) {
        return fallback();
      }

      throw error;
    }
  }

  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.threshold || this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
    }
  }

  private reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
  }
}
```

### 4.1.6 Observability Infrastructure

The Integration Layer provides observability touchpoints at cross-module boundaries:

1. **Transaction Tracing**:
   - Generate correlation IDs for operations spanning multiple subsystems
   - Track operation flow across module boundaries
   - Measure timing at integration points

2. **Health Monitoring**:
   - Expose health check endpoints for each subsystem
   - Monitor cross-subsystem communication health
   - Track resource usage at integration points

3. **Contextual Logging**:
   - Enrich logs with cross-cutting concerns at integration points
   - Standardize log formats across subsystem boundaries
   - Provide context propagation for distributed tracing

```typescript
// Observability Middleware example
export function observabilityMiddleware(options: ObservabilityOptions) {
  return async (req: any, res: any, next: () => Promise<void>) => {
    // 1. Start transaction monitoring
    const transactionId = req.headers['x-transaction-id'] || uuidv4();
    const span = tracer.startSpan(`${options.subsystem}.${req.method}`, {
      references: [
        { type: 'CHILD_OF', spanId: req.headers['x-span-id'] }
      ]
    });

    // 2. Set up context propagation
    const originalContext = getContext();
    setContext({
      ...originalContext,
      transactionId,
      spanId: span.id,
      subsystem: options.subsystem
    });

    // 3. Prepare response headers for downstream services
    res.setHeader('x-transaction-id', transactionId);
    res.setHeader('x-span-id', span.id);

    try {
      // 4. Execute the actual handler
      await next();

      // 5. Record success
      span.setTag('status', 'success');
    } catch (error) {
      // 6. Record failure
      span.setTag('status', 'error');
      span.setTag('error', true);
      span.log({
        event: 'error',
        message: error.message,
        stack: error.stack
      });

      throw error;
    } finally {
      // 7. Finish span and restore context
      span.finish();
      setContext(originalContext);
    }
  };
}
```

Through these mechanisms, the Integration Layer provides the essential "glue" connecting the specialized subsystems into a cohesive whole, while maintaining the architectural boundaries necessary for independent development and testing.

## 4.2 Key Data Structures (`packages/contracts`)

The reliability of this architecture hinges on shared, strictly typed data structures defined using Zod:

- `AgentActionSchema`: Defines the possible outputs of an agent's cycle.
- `CharacterResponseSchema`: Detailed structure for spoken output and immediate reactions.
- `AgentPerceptionEventSchema`: Union of all possible events an agent can perceive.
- `Tool Schemas`: Specific schemas for input/output of each available tool (e.g., `MemoryQuerySchema`, `FactSchema`, `ObservationSchema`).
- `AgentDynamicStateSchema`: Defines the mutable internal state.
- `AgentPlanSchema`, `OrientationContextSchema`: Schemas for internal cognitive steps.
- `Discovery Schemas`:
    - `HypothesisSchema`: Structure for agent-generated hypotheses about the world.
    - `ExperimentSchema`: Structure for designed tests of hypotheses.
    - `ExperimentResultSchema`: Structure for outcomes and confidence updates.
    - `ConceptSchema`: Structure for ontological categories and instances.
    - `RelationSchema`: Structure for semantic links between concepts.
    - `SelfModelSchema`: Structure for agent's understanding of its own nature and capabilities.
- `LearningNotificationSchema`: Structure for gamified learning event notifications.
- `PsychProfileSchema`: Structure for psychological assessment data.
- `RelationshipGraphSchema`: Structure for inter-agent social dynamics.
- `MetricsSchema`: Structure for statistical measurements and analytics.

## 4.3 Integration Diagram

The following diagram illustrates how the various subsystems integrate and communicate with each other:

```diagram/text
                      +---------------------+
                      |    Environment      |
                      | Simulation Layer    |
                      | (2.12)              |
                      +----------+----------+
                                 |
                                 | Events/Actions
                                 v
+---------------+      +-------------------+      +---------------+
| Perception    +----->+  Cognitive Cycle  +----->+  Action       |
| System (2.2)  |      |     (2.3)         |      |  System (2.5) |
+-------+-------+      +--------+----------+      +-------+-------+
        |                       |                         |
        |               ┌───────┴────────┐                |
        |               │ System-1 (Fast)│                |
        |               │    (2.1.3)     │                |
        |               └───────┬────────┘                |
        |                       |                         |
        |               ┌───────┴────────┐                |
        |               │ System-2 (Slow)│                |
        |               │    (2.1.3)     │                |
        |               └───────┬────────┘                |
        |                       |                         |
        |               ┌───────┴────────┐                |
        |               │Planner/Executor│                |
        |               │    (2.1.4)     │                |
        |               └───────┬────────┘                |
        |                       |                         |
        |                       v                         |
        |              +--------+----------+              |
        +--------------+  Memory System    +--------------+
                       |     (2.4)         |
                       +--------+----------+
                                |
          +-──---------+        |      +----------+
          |            |        |      |          |
          v            v        v      v          v
+------+-------+  +-----+-------+-─------+  +--------+-------+
| Ontology     |  | Self-Modeling        |  | Curiosity      |
| System (2.10)|  | System (2.11)        |  | System (2.9)   |
+------+-------+  +------------------───-+  +--------+-------+
       |                   |                       |
       |                   |                       |
       +-------------------+---+-------------------+
                           |
                           v
             +-------------+--------------+
             |      Integration Layer     |
             |           (4.1)            |
             +-------------+--------------+
                           |
                           v
             +-------------+--------------+
             |    Learning System         |
             |        (2.8)               |
             +-------------+--------------+
                           |
                           v
             +-------------+--------------+
             |         Event Bus          |
             |          (3.1)             |
             +-------------+--------------+
                           | ▲
                           | │ Event Data
             +-------------+-+------------+
             │                            │
             v                            v
+----------------------+     +-------------------------+
| External Analysis    |     |  Notification System    |
| (3.3, 3.4)           |     |  (3.6)                  |
| • Psychological Eval |     |                         |
| • Communication Eval |     +-------------------------+
    +----------------------+
                                   +---------------+
                                   | Statistics &  |
                                   | Monitoring    |
                                   | (3.2)         |
                                   +---------------+
```

## 4.4 File Structure

```text
apps/backend/src/
  core/
    event-bus.interface.ts      # IEventBus
    event-bus.service.ts        # EventBusService implementation
    config.service.ts          # Global config loader
    notifications/             # Handles gamified user-facing learning/discovery notifications
      notification.module.ts
      notification.service.ts
      # ... formatters, etc.
    stats/                     # Handles metrics collection and storage
      stats-collector.service.ts
      metrics.module.ts        # Wires collector, adapters, formatters
      metrics.adapter.interface.ts # IMetricsAdapter
      metric.formatter.interface.ts # IMetricFormatter
      adapters/                # Storage adapters
        timeseries.adapter.ts  # e.g., InfluxDB
        olap.adapter.ts        # e.g., ClickHouse
      formatters/              # Event-to-metric formatters
        agent-metric.formatter.ts
        system-metric.formatter.ts
  agent/
    agent.module.ts            # Aggregates agent services
    agent.service.ts           # Agent lifecycle & factory
    agent.factory.ts           # Spawns new Agent instances
    agent.state.ts             # Agent runtime state definitions
    memory/
      memory.module.ts
      memory.interface.ts      # IMemoryInterface
      episodic-memory.service.ts
      semantic-memory.service.ts
      # ... potentially memory cleanup/summarization service
    planner/
      planner.module.ts
      planner.interface.ts     # IPlannerService
      htn-planner.service.ts   # HTN planning implementation
    learning/
      learning.module.ts
      learning.interface.ts    # ILearningInterface
      learning.service.ts      # Reward recording & policy updates
      reward.function.ts       # IRewardFunction implementation
    ontology/                  # Manages structured world model
      ontology.module.ts
      ontology.service.ts
      # ... potentially ontology-specific contracts/interfaces
    curiosity/                 # Handles intrinsic motivation & exploration
      curiosity.module.ts
      curiosity.service.ts
      # ... hypothesis management, experiment tracking
    self-modeling/             # Manages agent's self-concept
      self-modeling.module.ts
      self-modeling.service.ts
      # ... capability tracking, boundary checks
    extensions/                # Handles interaction with environment simulation
      extensions.module.ts     # Imports/Exports capability extensions
      capability.extension.interface.ts # ICapabilityExtension
      speech-output.extension.ts
      motion-control.extension.ts
      visual-perception.extension.ts
      auditory-perception.extension.ts
      # ... other extensions ...
    internal-tools/            # Facade/Wrappers for internal cognitive functions
      internal-tools.module.ts
      internal-tools.interface.ts # IInternalToolsInterface
      internal-tools.service.ts   # Implementation or facade
      memory.tool.ts              # Wraps memory calls
      datetime.tool.ts            # Wraps datetime calls
      ontology.tool.ts            # Wraps ontology calls
      self-modeling.tool.ts       # Wraps self-modeling calls
      conversation.tool.ts        # Wraps conversation control intent
      curiosity.tool.ts           # Wraps curiosity calls
      # ... other internal tools ...
    cognitive-cycle/           # Coordinates the Cognitive Cycle & Action dispatch
      cognitive-cycle.module.ts
      cognitive-cycle.service.ts
      # ... potentially action formatting logic if not in service
packages/contracts/
  agent/
    AgentAction.ts             # Zod schema for agent actions
    CharacterResponse.ts       # Zod schema for character responses
    AgentPerceptionEvent.ts    # Zod schema for perception events
    MemorySchemas.ts           # Zod schemas for Observation/Fact
    PlanNode.ts                # Zod schema for HTN plan nodes
    stats.ts                   # Stats type definitions
    # ... add schemas for Ontology, Curiosity, SelfModeling, Notifications etc.
frontend/                    # Unchanged
```

## 4.5 Performance Considerations: Subsystem Classification

To identify potential performance bottlenecks and optimize resource allocation, it's essential to classify each subsystem based on its computational requirements—specifically, which components involve pure data processing versus those requiring LLM interaction.

### 4.5.1 Computational Classification of Subsystems

The following table categorizes each major subsystem by its primary computational profile:

| Subsystem                    | Classification         | LLM Dependency | Reference     | Notes                          |
|------------------------------|------------------------|----------------|---------------|--------------------------------|
| **Perception System**        | Mostly Data Processing | Low            | Section 2.2   | Primarily involves filtering and prioritization logic; uses LLM only for complex salience determination |
| **System-1 (Fast)**          | LLM-Dependent          | Medium         | Section 2.1.3 | Requires LLM but with minimal context and simpler prompt structure |
| **System-2 (Slow)**          | Heavily LLM-Dependent  | High           | Section 2.1.3 | Intensive LLM usage with large context windows and complex reasoning |
| **Planner/Executor**         | Heavily LLM-Dependent  | High           | Section 2.1.4 | HTN generation requires sophisticated LLM reasoning; execution is mostly data processing |
| **Action System**            | Mostly Data Processing | Low            | Section 2.5   | Primarily involves response formatting and tool execution logic |
| **Working Memory**           | Pure Data Processing   | None           | Section 2.4   | In-memory buffer management with no LLM requirements |
| **Episodic Memory**          | Mostly Data Processing | Low            | Section 2.4   | Storage and retrieval operations are data-centric; uses LLM only for summarization |
| **Semantic Memory**          | Mixed                  | Medium         | Section 2.4   | Fact storage is data processing, but relevance determination and fact extraction use LLM |
| **Ontology System**          | LLM-Dependent          | Medium         | Section 2.10  | Concept creation and relation definition require LLM understanding |
| **Curiosity System**         | Heavily LLM-Dependent  | High           | Section 2.9   | Hypothesis generation and experiment design require creative LLM capabilities |
| **Self-Modeling**            | Heavily LLM-Dependent  | High           | Section 2.11  | Requires sophisticated self-reflection capabilities from LLM |
| **Learning System**          | Mixed                  | Medium         | Section 2.8   | Reward computation is data processing, but policy updates may require LLM |
| **Psychological Evaluation** | Heavily LLM-Dependent  | High           | Section 3.3   | **(External Analysis)** Trait analysis and pattern recognition require complex LLM understanding |
| **Communication Analysis**   | Heavily LLM-Dependent  | High           | Section 3.4   | **(External Analysis)** Relationship dynamics assessment requires nuanced LLM interpretation |
| **Event Bus**                | Pure Data Processing   | None           | Section 3.1   | Message passing system with no LLM dependencies |
| **Stats Collector**          | Pure Data Processing   | None           | Section 3.2   | Metrics aggregation and formatting with no LLM requirements |
| **Notification System**      | Mixed                  | Low            | Section 3.6   | Event detection is data processing; message formatting may use LLM |

### 4.5.2 Performance Bottleneck Analysis

Based on this classification, the following components represent potential performance bottlenecks:

1. **System-2 Processing**: The most resource-intensive component due to its large context window, complex reasoning, and frequent invocation during meaningful conversations.

2. **Planner/HTN Generation**: Creating hierarchical task networks requires substantial LLM resources and represents a critical path component for agent decision-making.

3. **Curiosity & Self-Modeling Systems**: These reflective components require sophisticated LLM capabilities and may compete with direct conversation responses for resources.

4. **Psychological & Communication Analysis**: **(External)** These systems perform complex interpretative tasks that require significant LLM resources, though they operate **asynchronously** from the main conversation flow and primarily impact the *monitoring infrastructure*, not direct agent response time.

### 4.5.3 Optimization Strategies

To address these potential bottlenecks, several optimization strategies can be implemented:

1. **Tiered LLM Allocation**:
   - Assign larger context models (e.g., GPT-4) to System-2 and planning tasks
   - Use smaller, faster models (e.g., smaller LLaMA variants) for System-1 responses
   - Consider specialized models for specific tasks like memory summarization

2. **Asynchronous Processing**:
   - Move non-critical LLM tasks (psychological evaluation, communication analysis, reflection) to background workers.
   - Implement priority queuing for LLM requests based on conversation urgency.
   - Pre-compute common reasoning patterns during idle periods.

3. **Caching & Memoization**:
   - Cache System-1 responses for common utterances
   - Store and reuse planning patterns for similar goals
   - Remember semantic extraction results to avoid redundant processing

4. **Context Optimization**:
   - Implement precise context pruning to minimize token usage
   - Use embedding-based retrieval to select only the most relevant memories
   - Apply graduated precision (less detail for older context)

5. **Hybrid Approaches**:
   - Design rule-based fallbacks for when LLM services experience high latency
   - Implement progressive enhancement where simple responses are delivered first, then enhanced
   - Use smaller, specialized models for specific cognitive tasks

### 4.5.4 Monitoring & Adaptation

To continuously optimize performance:

1. Implement detailed timing metrics for each LLM call
2. Track token usage by subsystem and cognitive function
3. Analyze patterns of System-1 vs. System-2 activation
4. Monitor memory retrieval effectiveness and cost
5. Adjust thresholds for System-2 activation based on observed performance
6. Implement circuit breakers for non-critical LLM-dependent systems during high load

This classification and the resulting strategies provide a framework for balancing agent intelligence with system performance, ensuring responsive interactions while maintaining cognitive depth.

### 4.5.5 Temporal Decoupling for Real-Time Responsiveness

A fundamental challenge in this architecture is the extreme timing differential between LLM operations (typically 1-10 seconds) and data processing operations (10-100ms)—a difference of 1-2 orders of magnitude. For the system to maintain real-time responsiveness, we must implement temporal decoupling patterns that allow faster subsystems to remain in control while slower LLM-dependent processes complete their work.

#### 4.5.5.1 Temporal Decoupling Patterns

**1. Asynchronous Request-Response with Callbacks**

```diagram/text
┌───────────────┐    Request     ┌────────────────┐
│ Fast System   ├───────────────►│ Slow LLM       │
│ (Orchestrator)│                │ System         │
└─────┬─────────┘                └────────┬───────┘
      │                                   │
      │         Continues                 │ Processing
      │         execution                 │ (1-10s)
      │                                   │
┌─────▼─────────┐                ┌────────▼───────┐
│ Handle other  │                │ Generate       │
│ operations    │                │ result         │
└─────┬─────────┘                └────────┬───────┘
      │                                   │
      │                    Callback       │
┌─────▼─────────┐◄───────────────────────┐│
│ Process       │                        ││
│ result when   │◄────────────────────────┘
│ available     │
└───────────────┘
```

**2. Two-Tier Processing Pipeline**

```text
┌─────────────────┐  ┌────────────────┐  ┌────────────────┐
│ Input Event     │  │Fast Processing │  │ Action         │
│ (Perception)    ├─►│ (System-1)     ├─►│ (Immediate)    │
└─────┬───────────┘  └────────────────┘  └────────────────┘
      │
      │ Clone & Fork
      ▼
┌─────────────────┐  ┌────────────────┐  ┌────────────────┐
│ Same Event      │  │Slow Processing │  │ Refinement     │
│ (Deep Copy)     ├─►│ (System-2)     ├─►│ (When Ready)   │
└─────────────────┘  └────────────────┘  └────────────────┘
```

**3. Progressive Enhancement Pattern**

```diagram/text
┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ Initial       │  │ Basic         │  │ Enhanced      │  │ Complete      │
│ Request       ├─►│ Response      ├─►│ Response      ├─►│ Response      │
│ (100ms)       │  │ (250ms)       │  │ (2s)          │  │ (5s)          │
└───────────────┘  └───────────────┘  └───────────────┘  └───────────────┘
                   ▲                  ▲                  ▲
                   │                  │                  │
                   │                  │                  │
                   └──────────────────┴──────────────────┘
                        User sees progressive updates
```

#### 4.5.5.2 Implementation Approaches

**1. Event-Driven Architecture with Message Queues**

All LLM requests are processed through a priority queue system:

```typescript
// Pseudo-code for temporal decoupling via message queue
class AgentOrchestrator {
  async handleEvent(event: PerceptionEvent) {
    // Immediate data processing response
    const system1Response = await this.system1.processImmediately(event);
    if (system1Response.isSufficient) {
      await this.actionSystem.execute(system1Response.action);
      return;
    }

    // Enqueue deeper processing
    this.llmTaskQueue.enqueue({
      type: 'system2_reasoning',
      payload: event,
      priority: this.getPriority(event),
      callback: async (result) => {
        const enhancedAction = await this.actionSystem.enhanceAction(
          system1Response.action,
          result
        );
        await this.actionSystem.execute(enhancedAction);
      }
    });

    // Meanwhile, execute the fast response
    await this.actionSystem.execute(system1Response.action);
  }
}
```

**2. Staged Response Protocol**

For agent communications, implement a multiple-stage response protocol:

1. **Acknowledgment Stage (10-50ms)**: Confirms receipt and intent to process
2. **Fast Response Stage (50-200ms)**: System-1 provides immediate reaction
3. **Processing Indication Stage (200ms-2s)**: Visual/textual indicators of deeper thinking
4. **Enhanced Response Stage (2-5s)**: System-2 delivers more thoughtful response
5. **Final Response Stage (5-10s)**: Complete response with planning and tool usage results

**3. Partial Result Streaming**

Use WebSocket or SSE to stream partial results as they become available:

```typescript
class ResponseStreamer {
  startResponse(conversationId: string) {
    const streamId = uuidv4();

    // Initial fast response (System-1)
    this.eventBus.emit(`response.started.${conversationId}`, {
      streamId,
      stage: 'system1',
      content: this.system1.generateQuickResponse(),
      isComplete: false
    });

    // Schedule System-2 processing
    this.llmService.processWithSystem2(this.currentContext)
      .then(result => {
        this.eventBus.emit(`response.updated.${conversationId}`, {
          streamId,
          stage: 'system2',
          content: result,
          isComplete: true
        });
      });

    return streamId;
  }
}
```

#### 4.5.5.3 Subsystem-Specific Approaches

**Perception System**:
- Process perceptions through a multi-tier filter pipeline
- Apply fast pattern matching and salience calculations immediately
- Queue complex perceptions for LLM-based analysis while continuing processing

**Cognitive Cycle**:
- Implement a non-blocking OODA loop
- Allow observe and orient phases to operate on partial information
- Support decision revision when deeper analysis completes

**Memory System**:
- Use tiered storage with progressive access patterns
- Retrieve exact matches and high-confidence embeddings immediately
- Queue semantic searches and summarization for background processing

**Action System**:
- Support action enhancement and refinement
- Allow initial actions to begin execution while refinements are still processing
- Implement a cancellation protocol for when refined actions significantly differ

**Notification System**:
- Use template-based notifications for immediate feedback
- Queue LLM-enhanced notifications for background processing

#### 4.5.5.4 Non-Blocking Agent API Design

The public interfaces for agent subsystems should be designed with non-blocking patterns:

```typescript
interface ICognitiveSystem {
  // Non-blocking call that returns immediately with a promise
  processEvent(event: PerceptionEvent): Promise<InitialResponse>;

  // Register callback for when deeper processing completes
  onEnhancedResponse(callback: (enhancedResponse: EnhancedResponse) => void): void;

  // Check status of ongoing processing
  getProcessingStatus(): ProcessingStatus;

  // Optionally cancel ongoing processing
  cancelProcessing(reason: CancellationReason): Promise<void>;
}
```

#### 4.5.5.5 Consistency Management

With multiple processing speeds, maintaining consistency becomes crucial:

1. **Versioning**: Tag all responses with version numbers to track refinements
2. **State Snapshots**: Capture state at the time of initial processing
3. **Conflict Resolution**: Define clear rules for when fast and slow results conflict
4. **Compensation Actions**: Implement corrective actions when fast responses need revision
5. **State Machine Logic**: Model the system as explicit state transitions with idempotent operations

By implementing these temporal decoupling patterns, the agent architecture can maintain real-time responsiveness while still leveraging the power of LLM-based cognition, creating a system that feels natural and responsive despite the significant timing differential between its fast and slow components.

## 4.6 Legacy Application Integration

### 4.6.1 Adaptable Components

- **SceneManagerService**: serves as the core environment manager and scheduler, mapping to the new `ConversationManager` (perception bus + loop controller).
- **ConversationOrchestratorService**: foundation for the enhanced **CognitiveCycleService** (Observe→Orient→Decide→Act→Learn).
- **MessageGenerationService**: existing LLM wrapper for Think & Speak phases, ready to evolve into `ToolCall`–driven action routines.
- **ConversationStateService**: goal selection and turn‑taking logic, fitting the new Decision & Plan phase.
- **SceneStateService & ScenesDbService**: low‑level state snapshot and persistence layers, adaptable to the MemorySystem's episodic store.
- **MessagesDbService**: persistent journal of messages, can underpin reward logging and experience replay.
- **LlmService**: core GPT gateway, extendable for structured prompts, streaming, and new drivers.

### 4.6.2 Crucial Integration Interfaces

- **IMemoryInterface**
    - `addObservation(timestamp, content, visualIds)`
    - `retrieveObservations(query, timeFilter, visualIdFilter)`
    - `upsertFact(subjectVisualId, key, value, confidence)`
    - `retrieveFacts(subjectVisualId, query)`
- **ILearningInterface**
    - `recordReward(stateSnapshot, agentAction, rewardScore)`
    - `getExperienceBatch(batchSize, criteria)`
- **ICapabilityExtension** (General interface for external action/perception extensions)
    - `execute(actionPayload: any): Promise<ActionResult>`
    - `processSensoryInput(data: any): AgentPerceptionEvent[]`
- **IInternalToolsInterface** (Interface for accessing internal functions)
    - `memory.addObservation(...)`, `memory.retrieveObservations(...)`, etc.
    - `datetime.getCurrentTime()`
    - `ontology.getConcepts(...)`
    - `self.assessCapability(...)`
    - `conversation.requestEnd()`
    - `curiosity.*(...)`
- **IPlannerService**
    - `generatePlan(goal: Goal, context: OrientationContextSchema): PlanNode[]`
- **IRewardFunction**
    - `compute(conversationRating: number, goalProgress: number, feedback?: any): number`
- **ISceneStateService**
    - `getCurrentState(): SceneStateSnapshot`
    - `updateState(updates: Partial<SceneState>): Promise<void>`
    - `addMessageToState(message: Message): Promise<void>`
    - `updateCharacterState(charId: string, updates: Partial<CharacterState>): Promise<void>`
- **IEventBus**
    - Listens to events like `scene.state.updated` and `agent.action.emitted` to drive perceptions.


# 5. Future Directions

## 5.1 Future Directions

This architecture provides a foundation for more advanced AI behaviors:

- **Sophisticated Planning:** Implemented via HTN planner and `PlanNode` trees; next steps include real-time re-planning and fallback strategies on plan failure.
- **Reflection:** The periodic **Reflection Runnable** summarizes recent episodic events, updates semantic memory, and tunes `personalityCore` over time.
- **Learning & Adaptation:** Agents will integrate reward functions—metrics such as engagement score, conversation rating, or user feedback—to perform fine-grained policy updates via reinforcement or bandit algorithms.
- **Personalization & Reward Modeling:** Extend the `personalityCore` with user-specific preferences and A/B test outcomes, influencing tone, style, and topic bias for each Agent.
- **Continual & Lifelong Learning:** Incorporate meta-learning layers that update semantic embeddings incrementally, with memory compression and pruning strategies for scalable, long-term contexts.
- **Goal-Driven Behavior:** Elevate `shortTermGoals` into composite, long-horizon objectives managed by a **GoalManager**, integrating planning, monitoring, and adaptive re-prioritization.
