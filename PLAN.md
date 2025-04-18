# PixelTales - Where AI Characters Tell Their Stories

An infinite conversation system where AI characters tell their stories.

## Idea

```text
* Infinite gpt talk. Two defined characters talk to each other in an endless conversation. The model is randomly selected. The history can be seen. View is rpg npc like. Text to speech. 2 sec pause between messages (after speech end).
```

Inspired by: <https://youtu.be/g39AagVW0s0?t=261>

## Design

Two (or more) characters, each with a name and a role description (system prompt).

**Example Characters:**

```text
Character 1:
Name: John
Visual: A man in his 30s with a beard and glasses.
Role: You are a man who is romantically interested in the woman you are talking to.

Character 2:
Name: Jane
Visual: A woman in her 20s with long hair and blue eyes.
Role: You are a woman who is not interested in love.
```

## Features

- Characters are represented as Agents
- Conversation is real-time and public (same for all visitors)
- The model of each character is randomly selected when the conversation starts
- The history of each conversation can be seen (incl which models were used)
- View is pixel art rpg npc scene like
    - e.g. two characters in a room, the conversation is displayed as speech bubbles above their heads
- Conversation is read via text to speech (needs library where an event is thrown when the speech finishes)
- 2 sec pause between agent message responses (after speech finishes)
- At certain occasions the conversation is ended and the characters are replaced with new ones (verified visitors can vote for prompt proposals), the old conversation is archived and a new conversation starts. Occasions: all characters agree to end the conversation, or all characters end up in a farewell loop.
- Tools the Agents can use:
    - Set/read memory (key/value store)
    - Read current datetime (maybe not required, if datetime can be updated in system prompt)
    - Request end conversation (valid for 3min until the other agents agree)
    - Optional: Read current weather (fantasy location) *nice to have*
    - Optional: Check latest news (standard news api) *nice to have*
    - Optional: Walk to (x,y) (inside the scene) *nice to have*
- Context the Agents have:
    - The current conversation history (incl system prompt)
        - Core System Prompt
        - Character Role System Prompt
        - Metadata about the conversation (as system prompt messages, updated each request)
            - Current datetime
            - Conversation duration
        - Conversation history (as user/assistant messages, updated each request)
    - The current scene context derived from scene state (accessible map, character states, object states, visibility, communicatability etc.)
    - The list of available tools

## Technical Requirements

- model agnostic framework
- library for text to speech
- library for graphics

## MVP Specifications

- 2 defined characters
- 2 sec +x (determined via response length) pause between messages
- No text to speech
- Pixel art scene: room with two characters with speech bubbles above their heads
- No voting for prompt proposals
- No optional tools
- Conversation history is visible
- Model agnostic framework, llm requests routed through backend
- Strong typing
- sqlite local db

## Technical Stack

### Frontend (React SPA)

#### Core Framework

- **Vite + React**
    - Modern build tooling
    - Fast HMR
    - Better development experience
- **TailwindCSS**
    - Pixel art styling
    - Responsive design

#### Scene Rendering Options

1. **Phaser 3** (Recommended)
    - Game-focused framework
    - Built-in scene management
    - Sprite animation system
    - Built-in physics (if needed)
    - Asset loading system
    - Built-in input handling
    - Speech bubble plugins
    - Extensive documentation
    - Active community
    - Less boilerplate code

2. **PixiJS** (Alternative)
    - Lower-level rendering
    - WebGL optimization
    - More flexible/customizable
    - Lighter weight
    - Better for custom rendering
    - Manual scene management
    - More code required

#### Comparison for Our Use Case

1. **Phaser Advantages**
    - Ready-made scene management
    - Built-in sprite animation
    - Easy speech bubble implementation
    - Game-oriented features
    - Less code for basic features
    - Better suited for RPG-style scenes
    - More examples and tutorials

2. **PixiJS Advantages**
    - More control over rendering
    - Lighter bundle size
    - Better performance for simple scenes
    - Lower-level customization
    - Better for custom visual effects

#### Recommended Approach

For this project, **Phaser 3** would be more suitable because:
- RPG-style scene is a core requirement
- Speech bubbles are essential
- Character animations needed
- Scene management important
- Quick MVP development preferred
- Less custom rendering needed

### Backend (Python)

#### Core Framework

- **FastAPI**
    - High-performance async
    - WebSocket support
    - Native Pydantic integration
    - OpenAPI documentation
    - Easy WebSocket implementation

#### Multi-Agent Framework

After careful evaluation of our requirements:
- Two or more characters as agents
- Real-time conversation with WebSocket
- Memory/state management for characters
- Simple tool set (memory, datetime, end conversation)
- Conversation history management
- Model agnostic approach

We have chosen **LangChain** as our agent framework for the following reasons:

**Key Advantages**
- Built-in memory management systems
- Proven multi-agent conversation patterns
- Production-ready and stable
- Rich ecosystem of tools and integrations
- Comprehensive conversation chain management
- Strong community support and documentation
- Ready-made components for our use case

**Implementation Considerations**
- Will use Pydantic models for API schemas
- Custom WebSocket implementation needed
- Additional type validation layer required
- Memory systems will use Redis backend
- Agent tools will be implemented as LangChain tools
- Conversation chains for character interactions

**Integration Strategy**
1. Core Agent Setup
   - Define character agents using ConversationChain
   - Implement memory with Redis-backed memory class
   - Set up conversation buffer for history
   - Configure model-agnostic callbacks

2. FastAPI Integration
   - Custom Pydantic models for API schemas
   - WebSocket handlers for real-time updates
   - Type validation middleware
   - Error handling middleware

3. Tool Implementation
   - Memory tools using Redis
   - DateTime tools with system prompt updates
   - Conversation control tools
   - Custom tool validation

4. Testing Approach
   - Mock LLM responses
   - Memory system unit tests
   - WebSocket integration tests
   - End-to-end conversation tests

#### State Management

- **Redis**
    - Real-time agent states
    - Pub/Sub for WebSocket
    - Memory store
    - Fast key-value access

#### Database

- **SQLite** (MVP)
    - Local development
    - Simple setup
    - Built-in Python support
- **PostgreSQL** (Production)
    - JSON field support
    - ACID compliance
    - Async support with asyncpg

### API Integration

#### WebSocket Communication

- **FastAPI WebSockets**
    - Real-time updates
    - Native async support
    - Client state management
- **Socket.IO** (Client)
    - Reliable connection
    - Auto-reconnection
    - Event-based API

#### Speech Synthesis

- **Web Speech API** (MVP)
    - Browser implementation
    - Event-based completion
- **Azure Cognitive Services** (Production)
    - Higher quality voices
    - Better control
    - More reliable

### Development & Testing

#### Development Environment

- **Poetry**
    - Dependency management
    - Virtual environments
    - Lock file support
- **Pre-commit**
    - Code formatting
    - Type checking
    - Linting

#### Testing

- **Pytest**
    - Async testing
    - WebSocket testing
    - Mock LLM responses
- **Playwright**
    - E2E testing
    - Visual testing
    - WebSocket testing

### Deployment

- **Docker Compose**
    - Local development
    - Service orchestration
    - Easy scaling
- **Monitoring**
    - Sentry (Errors)
    - Prometheus (Metrics)
    - Grafana (Dashboards)

### Migration Path

1. **MVP Phase**
    - Start with PydanticAI
    - Basic agent interactions
    - SQLite storage
    - Web Speech API

2. **Production Phase**
    - Scale with PostgreSQL
    - Add Azure Speech
    - Implement monitoring
    - Container deployment

#### Recommended Implementation Strategy

1. **Core Setup**
   - Implement RAG for conversation context
   - Set up Logfire monitoring
   - Configure multi-model support
   - Enable streaming validation

2. **Memory System**
   - Implement Redis-backed memory
   - Set up context management
   - Configure state persistence
   - Optimize context windows

3. **Development Tools**
   - Set up Rich console debugging
   - Configure live monitoring
   - Implement visual tracking
   - Enable performance profiling

4. **Testing Framework**
   - Set up mock responses
   - Configure validation tests
   - Implement performance tests
   - Enable visual debugging

### Data Models

#### Metadata Structure

1. **Conversation Metadata**
   - Scenario
     - Scene
       - id
       - map (walkable areas)
       - state
       - image (base64)
       - Object List
         - id
         - state
         - image (base64)
       - Suggested by
       - Created at
       - Proposal Details
         - Role description
         - Scene description
         - Character name
         - Visual description
         - Model preference
         - Votes
         - Status (pending/approved/rejected)
     - Character List
       - Model used
       - Role
       - Visual
         - Description
         - Base64
   - Token Usage
     - Total tokens per model
     - Total cost per model
     - Running total

2. **Message Metadata**
   - Timestamp
   - Character ID
   - Model used
   - Tokens used
   - Cost
   - Processing time
   - Speech duration

### Scene Management

1. **Scene Proposal System**
   - Verified visitor voting system
   - Structured proposal format:
     - Role description (required)
     - Scene description (required)
     - Character name (required)
     - Visual description (required)
     - Model preference (optional)
   - Content moderation
     - NSFW content detection
     - Inappropriate content filtering
     - Language moderation
     - Theme appropriateness check
   - Voting mechanics
     - Vote duration
     - Minimum vote threshold
     - Approval criteria
     - Rejection handling

2. **Conversation End Conditions**
   - Agreement detection
     - All characters explicitly agree
     - Timeout after agreement (3 minutes)
   - Farewell loop detection
     - Pattern recognition
     - Repetition threshold
     - Time-based thresholds
   - Cleanup procedures
     - Conversation archival
     - State cleanup
     - New conversation initialization
     - Character replacement

### Future Features

- Connect own agent
- LLM character arena

### Implementation Details

#### Memory Management

1. **Hybrid Memory System**
   - Conversation Summary Memory for long-term context retention
   - Entity Memory for tracking characters, objects, and relationships
   - Redis Backend for state persistence and real-time access
   - Automatic cleanup routines for conversation end
   - Memory compression for token optimization

2. **Token Management**
   - Active token counting and budget allocation
   - Dynamic message summarization
   - Per-character token budgets
   - Model-specific token limits
   - Compression strategies for long conversations

3. **Conversation Chain Setup**
   - Individual conversation chains per character
   - Shared scene context management
   - Turn-based interaction system
   - Context window optimization
   - Response validation and filtering
   - Model-agnostic chain configuration

4. **WebSocket Implementation**
   - Real-time state synchronization
   - Speech timing and duration calculation
   - Client state reconciliation
   - Connection pool management
   - Event-based communication protocol
   - Automatic reconnection handling

5. **Scene State Management**
   - Real-time state tracking system
   - Redis pub/sub for state updates
   - Scene context aggregation
   - State validation and consistency
   - Character position management
   - Object interaction tracking
   - Environment state monitoring

6. **End Detection System**
   - Pattern-based farewell detection
   - Multi-character agreement tracking
   - Conversation timeout management
   - State cleanup procedures
   - Loop detection algorithms
   - Graceful termination protocols

7. **Character Interaction System**
   - Turn management and scheduling
   - Response timing control
   - Character state synchronization
   - Interaction radius enforcement
   - Visual feedback coordination
   - Animation state management

8. **Data Persistence Layer**
   - Redis for real-time state
   - SQLite for conversation archives
   - Efficient query patterns
   - Data compression strategies
   - Backup and recovery procedures
   - Migration protocols

9. **Event Management System**
   - Centralized event dispatcher
   - Type-safe event definitions
   - Priority-based event handling
   - Error recovery mechanisms
   - Event logging and monitoring
   - Performance tracking

10. **Security Measures**
    - Input validation and sanitization
    - Rate limiting implementation
    - Connection authentication
    - State manipulation prevention
    - Content moderation system
    - Error handling protocols

11. **Visitor Management System**
    - Active visitor tracking
    - Connection state monitoring
    - Conversation pause/resume logic
    - Visitor count tracking
    - Session management
    - Heartbeat mechanism

12. **Conversation Orchestration**
    - Backend-controlled message flow
    - 5-second base pause timing
    - Response length-based pause extension
    - Model assignment system
    - State broadcast system
    - Client synchronization

### MVP Implementation Plan

#### Phase 1: Project Setup

1. **Repository Structure**
   - Frontend directory (Vite + React)
   - Backend directory (FastAPI)
   - Shared types directory
   - Configuration files
   - Documentation

2. **Development Environment**
   - Poetry setup with dependencies
   - Pre-commit hooks configuration
   - Environment variables structure
   - Docker development setup
   - VSCode configuration

3. **Base API Structure**
   - FastAPI application setup
   - WebSocket endpoints
   - Basic error handling
   - CORS configuration
   - Health check endpoints

4. **Visitor Management Setup**
   - Active connection tracking
   - Session management system
   - Heartbeat implementation
   - Connection state monitoring
   - Cleanup routines

#### Phase 2: Core Backend Features

1. **Database Layer**
   - SQLite schema design
   - Base models creation
   - Migration system setup
   - Repository pattern implementation
   - Basic CRUD operations

2. **LangChain Integration**
   - Character agent setup
   - Conversation chain
   - Memory system implementation
   - Fixed model assignment
   - Response validation
   - Orchestration system

3. **State Management**
   - Redis connection setup
   - State persistence logic
   - Pub/sub implementation
   - Session management
   - Visitor tracking
   - Pause/resume logic

4. **Conversation Control**
   - Backend orchestration
   - Message flow control
   - Timing system (5s + length)
   - Visitor presence checks
   - State synchronization
   - Error recovery

#### Phase 3: Frontend Foundation

1. **React Application**
   - Project structure setup
   - Routing configuration
   - State management setup
   - WebSocket client
   - Basic UI components

2. **Phaser Integration**
   - Scene setup
   - Asset loading system
   - Character sprites
   - Speech bubble implementation
   - Basic animations

3. **Core UI Features**
   - Conversation display
   - Message history view
   - Character information
   - Basic controls
   - Error handling

#### Phase 4: Character System

1. **Character Management**
   - Two basic characters
   - Role definitions
   - System prompts
   - State tracking
   - Model assignment
   - Turn management

2. **Conversation Logic**
   - Backend-controlled flow
   - Timing system (5s + length)
   - Response processing
   - Context management
   - History tracking
   - Visitor state checks

3. **Basic Tools**
   - Memory store/retrieve
   - Datetime access
   - End conversation request
   - State queries
   - Context updates

#### Phase 5: Scene Implementation

1. **Visual Elements**
   - Room background
   - Character positioning
   - Speech bubble styling
   - Message animations
   - UI polish

2. **Interaction System**
   - Character state display
   - Message timing
   - Pause implementation
   - Visual feedback
   - State synchronization

3. **History System**
   - Conversation archival
   - Model tracking
   - Token counting
   - History display
   - Archive browsing

#### Phase 6: Testing & Deployment

1. **Testing Setup**
   - Unit tests
   - Integration tests
   - WebSocket testing
   - Visual testing
   - Performance testing

2. **Documentation**
   - API documentation
   - Setup instructions
   - Development guide
   - Deployment guide
   - User documentation

3. **Deployment Preparation**
   - Environment configuration
   - Docker compose setup
   - Basic monitoring
   - Logging setup
   - Backup system

#### Phase 7: Polish & Optimization

1. **Performance**
   - Response optimization
   - Asset optimization
   - State management efficiency
   - Memory usage optimization
   - Connection handling
   - Visitor tracking optimization

2. **User Experience**
   - Loading states
   - Error messages
   - Responsive design
   - Animation smoothness
   - Interface polish
   - Connection status indicators

3. **Quality Assurance**
   - Bug fixing
   - Edge case handling
   - Browser testing
   - Load testing
   - Security review
   - Visitor management testing

4. **Orchestration Testing**
   - Flow control validation
   - Timing accuracy tests
   - State synchronization checks
   - Recovery mechanism testing
   - Load balancing verification

### Implementation Details

#### Agent Context Structure

1. **Conversation History Context**
   - Core System Prompt
     - Basic conversation rules
     - Response format requirements
     - Tool usage guidelines
     - Conversation parameters
   - Character Role Prompt
     - Character personality
     - Interaction style
     - Role-specific behaviors
     - Visual description
   - Conversation Metadata (updated per request)
     - Current datetime
     - Conversation duration
     - Active participants
     - Current scene description
   - Message History
     - User/assistant message format
     - Timestamped entries
     - Model attribution
     - Token usage tracking

2. **Scene Context**
   - Spatial Information
     - Accessible map areas
     - Character positions
     - Object locations
     - Interaction zones
   - State Information
     - Character states
       - Current activity
       - Animation state
       - Speaking status
       - Interaction availability
     - Object states
       - Interaction status
       - Visual state
       - Accessibility
     - Environmental states
       - Time of day
       - Scene conditions
       - Ambient effects
   - Communication Context
     - Line of sight validation
     - Distance-based interaction rules
     - Multi-character conversation zones
     - Speech bubble placement

3. **Tool Context**
   - Available Tools List
     - Memory operations
     - Datetime access
     - End conversation request
     - State queries
   - Tool Permissions
     - Usage limits
     - Cooldown periods
     - Access conditions
   - Tool State
     - Current usage counts
     - Last used timestamps
     - Operation results

#### Visitor Management System

1. **Connection Tracking**
   - Active visitor counter
   - Connection state monitoring
   - WebSocket heartbeat system
   - Session tracking
   - Reconnection handling
   - Connection quality metrics

2. **Conversation Control**
   - Automatic pause when no visitors
   - Resume on visitor connection
   - State preservation during pauses
   - Graceful pause/resume transitions
   - Client notification system
   - Connection threshold settings

3. **Session Management**
   - Visitor session tracking
   - Authentication handling
   - Permission management
   - Session persistence
   - Cleanup procedures
   - Session recovery

#### Backend Orchestration System

1. **Conversation Flow Control**
   - Centralized message orchestration
   - Backend-triggered responses
   - Message queuing system
   - Flow rate control
   - Error handling and recovery
   - State consistency checks

2. **Timing Management**
   - 5-second base pause enforcement
   - Dynamic pause calculation
     - Base pause (5s)
     - Length-based extension
     - Network delay compensation
   - Synchronization mechanisms
   - Client-side timing validation
   - Drift correction

3. **State Broadcasting**
   - Real-time state updates
   - Client state synchronization
   - Broadcast optimization
   - State verification
   - Recovery mechanisms
   - Partial state updates

4. **Model Management**
   - Fixed model assignment
   - Model state tracking
   - Response validation
   - Error handling
   - Fallback mechanisms
   - Performance monitoring

5. **Client Synchronization**
   - State consistency checks
   - Time synchronization
   - Event ordering
   - Conflict resolution
   - Recovery procedures
   - Version control

### Project Name: PixelTales

#### Name Analysis

- **Visual Style**: "Pixel" directly references the retro gaming aesthetic
- **Content**: "Tales" captures the storytelling and conversation aspects
- **Balance**: Perfect blend of visual and functional elements
- **Simplicity**: Two words, easy to remember and type
- **Versatility**: Works for both technical and general audiences
- **Accessibility**: Approachable for both casual users and researchers

#### Key Strengths

1. **Visual Identity**
   - Immediately suggests pixel art style
   - Perfect for retro gaming aesthetic
   - Easy to create distinctive branding
   - Potential for pixel art logo animations
   - Strong visual recognition potential

2. **Storytelling Focus**
   - Emphasizes narrative aspects
   - Suggests ongoing conversations
   - Implies content creation
   - Evokes nostalgia and engagement
   - Appeals to gaming community

3. **Technical Subtlety**
   - Doesn't force AI/research aspects into the name
   - Allows focus on user experience first
   - Keeps technical aspects in background
   - Reduces potential AI skepticism
   - Enables broader market appeal
   - Flexibility for future development
   - Avoids technical intimidation

4. **Branding Potential**
   - Memorable and distinctive
   - Works well as domain name (pixeltales.com/ai/org)
   - Strong social media presence (@PixelTales)
   - Easy logo development
   - Merchandising possibilities
   - Cross-platform consistency
   - Hashtag potential (#PixelTales)
   - Community building opportunities
   - Academic citation friendly
   - Conference presentation appropriate

#### Strategic Advantages

1. **Dual Appeal**
   - Research Community: Suitable for academic papers and conferences
   - General Public: Approachable and engaging for everyday users
   - Gaming Community: Resonates with retro gaming enthusiasts
   - AI Community: Subtle but clear connection to AI research

2. **Growth Potential**
   - Can expand into various domains without renaming
   - Suitable for both research papers and casual blog posts
   - Works for technical documentation and marketing
   - Adaptable for future AI developments

#### Usage Guidelines

- Use "PixelTales" as one word in code
- Display as "PixelTales" in UI elements
- Possible taglines:
    - Primary: "Where AI Characters Tell Their Stories"
    - Research: "Advancing Conversational AI Through Interactive Storytelling"
    - Technical: "An Open-Source LLM Research Platform"
- Use lowercase "pixeltales" for technical elements (packages, repositories)
- Use "PT" as abbreviation in technical contexts when needed
