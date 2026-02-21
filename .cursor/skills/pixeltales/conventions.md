# PixelTales Coding Conventions & Patterns

## General Rules

- **TypeScript strict mode** everywhere — explicit typing, no implicit `any`
- **Max 500 lines per file** — refactor into modules if approaching limit
- **DRY principle** — check existing code before writing new
- **Zod-first contracts** — define schemas in `packages/contracts` before implementation
- **No .env files** — never create, edit, or read them; update `.env.sample` instead
- **No touch/mkdir** — create files directly
- **No service start/stop** — don't start Docker or other services

## NestJS Backend Patterns

### Module Structure
Every feature follows NestJS module pattern:
```
feature/
├── feature.module.ts          # NestJS module with providers/exports
├── feature.interface.ts       # Interface + injection token
├── feature.service.ts         # Implementation
└── feature-specific-files.ts
```

### Dependency Injection
Use string tokens for interfaces:
```typescript
export const MEMORY_INTERFACE = 'MEMORY_INTERFACE';

@Module({
  providers: [{ provide: MEMORY_INTERFACE, useClass: MemoryService }],
  exports: [MEMORY_INTERFACE],
})
```

Inject via `@Inject()`:
```typescript
constructor(@Inject(MEMORY_INTERFACE) private readonly memory: IMemoryInterface) {}
```

### Event Bus Usage
Never couple modules directly — use EventBusService:
```typescript
this.eventBus.publish(EventBusService.createEvent('agent.action.intent', payload));
this.eventBus.subscribe('agent.cognitive.cycle.phase_completed', handler);
```

### Agent State Management
- `AgentRuntimeState` in `agent.state.ts` holds live agent state
- `AgentFactory` creates initial state from config
- `AgentService` manages agent lifecycle + perception buffer
- Processing lock (`isProcessing`) prevents concurrent cycles per agent

## Contract Schemas (packages/contracts)

### File Naming
- PascalCase for schema files: `AgentAction.ts`, `MemorySchemas.ts`
- Export all from `index.ts` files
- Agent-specific schemas under `src/agent/`
- V1 schemas under `src/v1/`

### Schema Pattern
```typescript
import { z } from 'zod';

export const SomeSchemaSchema = z.object({
  id: z.string(),
  type: z.enum(['a', 'b']),
  data: z.record(z.any()),
  timestamp: z.number(),
});

export type SomeSchema = z.infer<typeof SomeSchemaSchema>;
```

## Frontend Patterns

### Phaser Scenes
- Scenes are classes extending `Phaser.Scene`
- UI overlays as separate scenes (e.g., `FrankensteinUIScene`)
- Game managers handle specific concerns (connections, entities, NPCs)

### React Integration
- Phaser embedded within React components
- shadcn/ui components from `packages/shadcn-ui/`
- Tailwind CSS for styling
- API clients in `src/lib/api/`

### Observer Pattern
Frontend is **read-only observer**:
- No game-altering commands from frontend
- Backend pushes state via WebSocket
- Frontend renders current state
- Single active public scene for all visitors

## Database Conventions

### Drizzle ORM
- Schema definitions in migration files
- Provider in `db/drizzle.provider.ts`
- Module in `db/db.module.ts`
- Migrations numbered sequentially: `0000_`, `0001_`, `0002_`

### Agent Tables
- `episodic_memory` — observations with timestamps and visual IDs
- `semantic_memory` — facts, concepts, relations with confidence scores
- `plans` / `plan_nodes` — HTN plan trees
- `metrics` — stats pipeline output
- `rewards` — learning reward tuples
- `hypotheses` / `experiments` — curiosity system data
- `agent_self_models` — self-concept storage

## File Organization

### New Agent Subsystem Checklist
1. Create folder under `apps/backend/src/agent/<subsystem>/`
2. Define interface + injection token in `<subsystem>.interface.ts`
3. Implement service in `<subsystem>.service.ts`
4. Create NestJS module in `<subsystem>.module.ts`
5. Add Zod schemas in `packages/contracts/src/agent/`
6. Import module in `agent.module.ts`
7. Add events to `DomainEvents.ts` if needed
8. Update `TASKS.md` with progress

### V1 vs Agent Code
- V1 code: `apps/backend/src/v1/`, `apps/frontend/src/v1/`
- Agent code: `apps/backend/src/agent/`, `apps/frontend/src/game/mvp-frankenstein/`
- Shared core: `apps/backend/src/core/`
- Don't mix V1 and agent code in the same modules

## Testing (Planned)

- Unit tests per agent submodule
- Integration tests for EventBus → Stats pipeline
- E2E tests simulating agent conversation
- Zod schema validation in CI

## Documentation Updates

When making changes:
1. Update `TASKS.md` — mark completed, add discovered tasks
2. Update `project-summary.md` — new features/dependencies
3. Update `README.md` — setup changes, new features
4. Comment non-obvious code with `# Reason:` prefix
