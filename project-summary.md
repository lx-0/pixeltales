# PixelTales Project Summary

## Tech Stack

### Frontend

- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Game Engine**: Phaser 3
- **Styling**: TailwindCSS, shadcn/ui components
- **State Management**: React Context API
- **WebSockets**: Socket.IO Client
- **HTTP Client**: Custom fetch wrappers

### Backend

- **Framework**: NestJS with TypeScript
- **API**: REST endpoints with OpenAPI/Swagger
- **WebSockets**: NestJS WebSocket Gateway
- **Database**: SQLite (development), PostgreSQL (production)
- **ORM**: Drizzle
- **AI Integration**: LangChain.js
- **Image Processing**: Sharp
- **File Storage**: Local filesystem (for assets)

## Project Structure

```
pixeltales/
├── apps/
│   ├── frontend/           # React frontend application
│   │   ├── public/         # Static assets
│   │   └── src/
│   │       ├── components/ # UI components
│   │       ├── game/       # Phaser game implementation
│   │       ├── lib/        # Libraries and utilities
│   │       └── ...
│   │
│   └── backend/            # NestJS backend application
│       ├── src/
│       │   ├── conversation/ # Conversation management
│       │   ├── llm/          # LLM service integration
│       │   ├── spritesheet/  # Spritesheet generation
│       │   ├── image-editor/ # Image manipulation
│       │   └── ...
│       └── ...
│
├── packages/               # Shared packages
│   ├── contracts/          # Type definitions and schemas
│   └── utils/              # Shared utilities
│
└── ...
```

## Special Commands

### Development Setup

```bash
# Install dependencies
pnpm install

# Start development servers (both frontend and backend)
pnpm dev

# Start only frontend
pnpm dev:frontend

# Start only backend
pnpm dev:backend
```

### Build

```bash
# Build all applications
pnpm build

# Build specific application
pnpm build:frontend
pnpm build:backend
```

## Development Notes

### Spritesheet Builder

The spritesheet builder is a multi-step workflow for generating character sprites.

**Current Status**:
- UI implementation is complete with all steps (prompt, base sprite, animation sheet, coordinates, final preview)
- Backend implementation status:
    - Generate base sprite endpoint is implemented but has issues with sprite references
    - Other endpoints (animation sheet, coordinate extraction, finalization) are implemented but not yet tested
    - The reference sprite extraction is working correctly
    - LLM integration for image generation has been implemented
- Currently testing and fixing step 1 (generate base sprite) before proceeding to test subsequent steps

**Current Challenges**:
- There's an issue with the LLM response when using sprite references - the API doesn't seem to support or properly handle the image generation with reference images as expected
- The image reference is correctly extracted and passed to the LLM service, but the response doesn't include the expected image data
- We need to resolve issues with the first step before we can effectively test the remaining steps in the pipeline

**Potential Solutions**:
1. Investigate if the current LLM provider supports image generation with reference images in the format we're using
2. Implement a fallback mechanism that uses local image manipulation techniques when the LLM-based approach fails
3. Consider alternative API providers that better support this type of image generation
4. Explore hybrid approaches that combine simple LLM image generation with local post-processing

**Next Steps**:
- Debug the LLM response handling for image generation
- Implement error handling that provides more detailed information about failures
- Add a fallback mechanism for basic sprite manipulation when LLM generation fails
- Once step 1 is working reliably, test the remaining steps in the pipeline
