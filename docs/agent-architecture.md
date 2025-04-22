# PixelTales Agent Architecture Blueprint (v1.0)

2025 by yesterday AI, <alex@yesterday-ai.de>

## 0. Document Index

- **1. Introduction & Foundation**
    - **1.1. Overall System Goal & Vision**
    - **1.2. Introduction: The Agent-Centric Vision**
    - **1.3. Agentic Subsystems Overview**

- **2. [Core Subsystems](docs/agent-architecture/02-core-subsystems.md)**
    - **2.1. The `Agent`: Core Autonomous Entity**
        - 2.1.1 Agent's Mind – A Unifying View
        - 2.1.2 Theoretical Foundation: Dual-Process Cognition
        - 2.1.3 Implementation in PixelTales
        - 2.1.4 The Planner/Executor: Bridging Thought and Action
        - 2.1.5 Subsystem Integration
        - 2.1.6 Reflection Mechanism
    - **2.2. Perception System: The Agent's Senses**
    - **2.3. Cognitive Cycle: The Agent's Thought Process**
        - 2.3.1 Enhanced Planning (HTN-based)
        - 2.3.2 Reflection – Borrowing from *Thinking, Fast & Slow*
        - 2.3.3 Orchestration of Asynchronous Subsystems
        - 2.3.4 Cognitive Context Composition
        - 2.3.5 Context Selection for LLM Interaction
    - **2.4. Internal State & Memory System**
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
    - **2.5. Action System: Executing Decisions**
    - **2.6. Capability Extensions**
    - **2.7. Internal Interface Tools**
        - 2.7.1 Purpose and Design
        - 2.7.2 Core Internal Tools
        - 2.7.3 Implementation Approach
        - 2.7.4 Integration with Cognitive Cycle
        - 2.7.5 Integration Points
    - **2.8. Learning & Adaptation Foundation**
    - **2.9. Curiosity & Discovery System**
    - **2.10. Ontological Reasoning System**
    - **2.11. Self-Modeling System**
    - **2.12. Interaction Model: Environment Simulation & Emergent Communication**

- **3. [Instrumentation & Advanced Features](docs/agent-architecture/03-instrumentation-features.md)**
    - **3.1. Event Bus & Communication**
        - 3.1.1 Architecture & Design Principles
        - 3.1.2 Core Components
        - 3.1.3 Key Event Types
        - 3.1.4 Integration with Analytics
        - 3.1.5 Communication Patterns
    - **3.2. Statistics & Logging Concept**
        - 3.2.1 Key Metrics
        - 3.2.2 Instrumentation & Data Flow
            - 3.2.2.1 Real-Time Statistics Architecture
            - 3.2.2.2 Stats Type Definitions (TypeScript & Zod)
        - 3.2.3 Logging & Storage
        - 3.2.4 Dashboard & UX Mockup
        - 3.2.5 UX Considerations
    - **3.3. Psychological Evaluation System**
        - 3.3.1 Purpose and Goals
        - 3.3.2 Evaluation Framework
        - 3.3.3 Implementation Details
        - 3.3.4 Visualization Components
    - **3.4. Inter-Agent Communication Analysis**
    - **3.5. Agent State Visualization**
        - 3.5.1 Purpose and Goals
        - 3.5.2 State Broadcast System
        - 3.5.3 Visualization Interface
        - 3.5.4 Historical State Navigation
    - **3.6. Learning Notification System**
        - 3.6.1 Purpose and Goals
        - 3.6.2 Notification Types
        - 3.6.3 Implementation Details
        - 3.6.4 Notification Appearance
        - 3.6.5 Integration Points

- **4. [Integration, Architecture & Performance](docs/agent-architecture/04-integration-architecture-performance.md)**
    - **4.1. Integration Layer**
        - 4.1.1 Key Responsibilities
        - 4.1.2 Architectural Patterns
            - 4.1.2.1 Facade Pattern
            - 4.1.2.2 Mediator Pattern
            - 4.1.2.3 Adapter Pattern
        - 4.1.3 Cross-Module State Management
        - 4.1.4 Module Lifecycle Management
        - 4.1.5 Error Handling & Resilience
        - 4.1.6 Observability Infrastructure
    - **4.2. Key Data Structures (`packages/contracts`)**
    - **4.3. Integration Diagram**
    - **4.4. File Structure**
    - **4.5. Performance Considerations: Subsystem Classification**
        - 4.5.1 Computational Classification of Subsystems
        - 4.5.2 Performance Bottleneck Analysis
        - 4.5.3 Optimization Strategies
        - 4.5.4 Monitoring & Adaptation
        - 4.5.5 Temporal Decoupling for Real-Time Responsiveness
            - 4.5.5.1 Temporal Decoupling Patterns
            - 4.5.5.2 Implementation Approaches
            - 4.5.5.3 Subsystem-Specific Approaches
            - 4.5.5.4 Non-Blocking Agent API Design
            - 4.5.5.5 Consistency Management
    - **4.6. Legacy Application Integration**
        - 4.6.1 Adaptable Components
        - 4.6.2 Crucial Integration Interfaces

- **5. [Future Directions](docs/agent-architecture/05-future-directions.md)**
    - **5.1. Future Directions**

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

**Curiosity System (2.9)**:
- Serves a dual role connecting both knowledge acquisition and agent development
- Drives intrinsic motivation, exploration, and hypothesis testing
- Bridges between knowledge systems and learning mechanisms

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
