# PixelTales MVP Tasks

## Current Implementation Status

- ✅ Basic scene setup with Phaser
- ✅ Character sprites and animations
- ✅ WebSocket communication
- ✅ Basic conversation system
- ✅ Speech bubbles with dynamic positioning
- ✅ Character visual feedback (tint, bounce)
- ✅ Turn-based conversation
- ✅ Dynamic message timing
- ✅ Unlimited conversation history
- ✅ Character-specific colors
- ✅ Progress indicator for message timing
- ✅ Conversation history navigation
- ✅ History mode UI polish
- ✅ Conversation history display in UI
- ✅ Backend Migration: DB ORM (SQLAlchemy zu Drizzle)
- ✅ Backend Migration: Default Scene Konfiguration
- ✅ Backend Migration: WebSocket (Socket.IO zu NestJS Gateway)
- ✅ Backend Migration: Health-Check Endpunkt

## High Priority Tasks

### 1. Conversation Context Management

**Status**: 🚧 IN PROGRESS
**Priority**: HIGHEST
**Requirements**:
- [x] Implement proper context windowing
    - [x] Set up message limits for conversation history (currently limited to 20 messages)
    - [x] Implement token counting for proper token limits
    - [x] Implement sliding window mechanism
    - [x] Add context pruning logic
- [ ] Add conversation summarization
    - [ ] Implement summary generation
    - [ ] Add summary storage and retrieval
    - [ ] Integrate summaries into context
- [ ] Handle conversation state persistence
    - [ ] Implement state serialization
    - [ ] Add state recovery mechanisms
    - [ ] Handle interruptions gracefully
- [x] Implement proper conversation ending conditions
    - [x] Add farewell detection
    - [x] Implement topic exhaustion detection
    - [x] Add graceful conversation closure
- [ ] Add conversation topic tracking
    - [ ] Implement topic extraction
    - [ ] Add topic history
    - [ ] Track topic changes

**Implementation Notes**:
- Added TokenCounter utility for estimating token counts across different LLM providers
- Implemented dynamic context window pruning based on available token budget
- Added token usage tracking in the database
- Implemented smart context preservation (keeping early and recent messages, dropping middle)
- Added safeguards against context overflow with fallback to smaller windows

### 2. Tool Implementation

**Status**: 🚧 IN PROGRESS
**Priority**: HIGH
**Requirements**:

#### Required Tools (MVP)

- [ ] Memory System
    - [ ] Implement in-memory key/value store
    - [ ] Create memory retrieval function
    - [ ] Add memory context integration
    - [ ] Add memory cleanup on conversation end

- [ ] DateTime System
    - [ ] Create datetime access function
    - [ ] Add conversation duration tracking
    - [ ] Implement system prompt updates
    - [ ] Add timezone handling
    - [ ] Create formatted time outputs

- [x] Conversation Control
    - [x] Implement end conversation request
    - [x] Add agreement tracking system
    - [x] Create timeout mechanism (3min)
    - [ ] Add conversation state transitions
    - [x] Implement graceful closure

#### Optional Tools (Post-MVP)

- [ ] Weather System
    - [ ] Create fantasy weather generator
    - [ ] Add weather state persistence
    - [ ] Implement weather changes
    - [ ] Add weather effects on conversation

- [ ] News System
    - [ ] Implement news API integration
    - [ ] Add news filtering
    - [ ] Create news context integration
    - [ ] Add news update mechanism

- [ ] Movement System
    - [ ] Implement position tracking
    - [ ] Add pathfinding
    - [ ] Create movement validation
    - [ ] Add collision detection
    - [ ] Implement character animations

### 3. Backend Migration: LLM Integration

**Status**: 🚧 IN PROGRESS
**Date Added**: 2023-06-10
**Priority**: HIGH
**Requirements**:
- [x] Vervollständige LLM-Integration in NestJS
    - [x] Erweitere `LlmService` mit allen Features des Python-`LLMManager`
    - [x] Implementiere strukturierte Ausgabe-Types (äquivalent zu `CharacterResponse`)
    - [x] Ersetze Mocks in `ConversationOrchestratorService._generateMessage` durch echte LLM-Aufrufe
    - [x] Füge Retry-Mechanismen und Backoff-Strategien hinzu
- [x] Upgrade auf moderne LangChain.js Funktionalitäten
    - [x] Implementiere `RunnableSequence` für Charakterantworten
    - [x] Füge Output Parser für strukturiertes Response-Format hinzu
    - [x] Passe den system prompt für LangChain.js format an
- [x] Implementiere robuste Fehlerbehandlung
    - [x] Füge Error-Logging mit strukturierten Details hinzu
    - [x] Implementiere Fallback-Mechanismen für API-Ausfälle

**Implementation Notes**:
- Enhanced `_generateMessage` method with robust retry logic and structured error handling
- Improved conversation history preparation with proper message formatting
- Enhanced system prompt with richer character and scene context
- Added trace IDs for better error tracking and debugging
- Implemented differentiated error handling for LLM vs database errors
- Updated LlmService to use modern `.pipe()` method instead of RunnableSequence.from()

### 4. Spritesheet Builder Implementation

**Status**: 🚧 IN PROGRESS
**Date Added**: 2023-06-20
**Priority**: HIGH
**Requirements**:
- [x] Build core UI components for character sprite generation
    - [x] Create multi-step generation process UI
    - [x] Implement character name input fields
    - [x] Add preview components for sprites and animation sheets
    - [x] Create coordinate extraction visualization
- [ ] Implement backend API endpoints
    - [x] Generate base sprite endpoint
    - [ ] Generate animation sheet endpoint (not yet tested)
    - [ ] Extract coordinates endpoint (not yet tested)
    - [ ] Finalize spritesheet endpoint (not yet tested)
- [x] Create spritesheet service in backend
    - [x] Implement image extraction and manipulation
    - [ ] Add coordinate extraction logic (not yet tested)
    - [ ] Implement template-based animation generation (not yet tested)
- [ ] Fix image generation with sprite references
    - [x] Extract reference sprites correctly
    - [x] Pass reference to LLM properly
    - [ ] Debug LLM response handling for image generation
    - [ ] Address API limitations for image generation with references

**Implementation Notes**:
- Sprite reference extraction is working correctly
- Reference is properly passed to the LLM service
- Current issue: LLM response doesn't include the expected image output when using sprite references
- Further investigation needed to determine if the API supports this functionality or if an alternative approach is required
- Potential workaround: Implement local image manipulation for simple sprite modifications instead of relying on LLM for all image generation steps
- Since we're still testing and fixing step 1 (generate base sprite), we haven't been able to test the other steps in the process yet

### 5. Character State Management

**Status**: ⭕ NOT STARTED
**Requirements**:
- [ ] Implement proper character state machines
- [ ] Add more character animations
- [ ] Improve character positioning logic
- [ ] Add character mood indicators
- [ ] Implement proper character interaction zones

### 6. UI/UX Improvements

**Status**: 🚧 IN PROGRESS
**Requirements**:
- ✅ Add proper UI layout
- ✅ Add conversation history view toggle
- ✅ Implement side/bottom view layout
- ✅ Add collapsible conversation history
- 🚧 Implement responsive design
- ⭕ Add user preferences
- 🚧 Improve accessibility
- ⭕ Add sound effects (optional for MVP)
- ⭕ Add basic tutorial or help system

## Medium Priority Tasks

### 7. Backend Migration: Tests

**Status**: ⭕ NOT STARTED
**Date Added**: 2023-06-10
**Requirements**:
- [ ] Füge Unit-Tests für Backend-Services hinzu
    - [ ] LLM Service Tests
    - [ ] SceneManager Service Tests
    - [ ] Conversation Service Tests
- [ ] Implementiere End-to-End Tests
    - [ ] API Endpunkt Tests
    - [ ] WebSocket-Kommunikation Tests
    - [ ] LLM Integration Tests
- [ ] Füge Mocks für externe Dienste hinzu
    - [ ] LLM API Mocks
    - [ ] Datenbank Mocks

### 8. Backend Migration: Prompt Engineering

**Status**: 🚧 IN PROGRESS
**Date Added**: 2023-06-10
**Requirements**:
- [x] Migriere fortgeschrittenes Prompt-Engineering aus Python-Backend
    - [x] System-Prompts optimieren
    - [x] Kontext-Management verbessern
    - [x] Message-Formatting Templates erstellen
- [ ] Implementiere Rollen und Charakterbeschreibungen
    - [ ] Character Persona Templates
    - [ ] Stimmungs- und Kontext-Anweisungen
- [ ] Dokumentiere Prompt-Struktur und Best Practices

**Implementation Notes**:
- Enhanced system prompt preparation to include more character details
- Improved message formatting for better conversation context
- Added dynamic instructions based on conversation stage

## Low Priority Tasks

### 9. Scene Polish

**Status**: ⭕ DEPRIORITIZED
**Requirements**:
- [ ] Add transition animations between states
- [ ] Add visual feedback for system states
- [ ] Optimize asset loading
- [ ] Add loading screen

### 10. Conversation History Display

**Background**: History mode implemented but needs polish and improvements.
**Current Status**: ✅ COMPLETED
- ✅ UI controls positioning improved
- ✅ Navigation controls added
- ✅ Basic metadata display implemented
- ✅ History state management working
- ✅ Progress indicator added
- ✅ Character tint transitions improved
- ✅ Pixel art styling implemented
- ✅ Loading states added
- ✅ Smooth transitions added
- ✅ Chat-like history view in UI added

**Requirements**:
- ✅ Add keyboard shortcuts for navigation
- ✅ Add visual feedback for navigation actions
- ✅ Improve control styling to match pixel art theme
- ✅ Add typing indicators
- ✅ Improve metadata formatting
- ✅ Add auto-scroll to latest message in live mode
- ✅ Add smooth transitions between messages
- ✅ Add loading states for message navigation

### 11. Message Timing System Refinement

**Status**: ✅ COMPLETED
**Current**: Implementation complete with:
- ✅ Base pause between messages
- ✅ Dynamic speaking time based on message length
- ✅ Visual countdown indicator
- ✅ Smooth transitions between messages

### 12. Error Handling & Connection Management

**Status**: ✅ COMPLETED
**Current**: Core functionality complete with UI improvements:
- ✅ WebSocket reconnection logic implemented
- ✅ Backend connection handling complete
- ✅ Cleanup on disconnect implemented
- ✅ Retry mechanisms with backoff implemented
- ✅ Visual connection status indicator added
- ✅ Error messages displayed appropriately

### 13. Performance Optimization

**Background**: Ensure smooth operation with many messages
**Requirements**:
- [ ] Implement proper asset management
- [ ] Optimize render pipeline
- [ ] Add proper garbage collection
- [ ] Implement proper memory management
- [ ] Add performance monitoring

### 14. Documentation

**Background**: Need proper documentation for MVP
**Requirements**:
- [ ] Create user documentation
- [ ] Add developer documentation
- [ ] Create deployment guide
- [ ] Document API endpoints
- [ ] Document WebSocket events

### 15. Token Usage Optimization & Analytics

**Status**: ⭕ NOT STARTED
**Priority**: MEDIUM
**Date Added**: 2023-06-15
**Requirements**:
- [ ] Implement token usage analytics
    - [ ] Add token usage reporting API endpoint
    - [ ] Track token usage by character/conversation
    - [ ] Implement usage visualization in admin panel
    - [ ] Add daily/monthly usage limits
- [ ] Cost tracking and optimization
    - [ ] Calculate approximate cost based on token usage and model pricing
    - [ ] Implement cost reporting
    - [ ] Add budget control mechanisms (warnings, limits)
    - [ ] Track cost efficiency metrics
- [ ] Advanced token management
    - [ ] Replace approximation with exact token counting for OpenAI (via tiktoken)
    - [ ] Add token caching for repeated prompts/responses
    - [ ] Implement adaptive model selection based on context complexity
    - [ ] Optimize system prompts for token efficiency
- [ ] Token-triggered summarization
    - [ ] Use token counter to decide when to summarize long conversations
    - [ ] Implement automatic pruning for token budget management
    - [ ] Create escalating compression levels based on conversation length

## Notes

- Priority is based on MVP requirements from `pixeltales-plan.md`
- Tasks should be completed in order of priority
- Each task should be properly tested before moving to the next
- Regular updates to this file as tasks are completed or new requirements are identified

## Task Status Legend

- ✅ Completed
- 🚧 In Progress
- ❌ Blocked
- ⭕ Not Started

## Next Steps (Current Focus)

- ✅ Implement token counting for proper context windowing
- ✅ Add dynamic context pruning based on token limits
- ⭕ Implement memory system for persistent character memories
- ⭕ Add token usage analytics and cost tracking
- ⭕ Optimize system prompts for token efficiency
