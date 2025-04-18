# PixelTales Monorepo Architecture

This document outlines the technical architecture of the PixelTales monorepo, managed using pnpm workspaces and Turborepo.

## Directory Structure

The monorepo is organized as follows:

```
turborepo/
├── apps/
│   ├── backend/      # NestJS Backend Application (CJS)
│   └── frontend/     # React + Vite Frontend Application (ESM) (To be added later)
├── packages/
│   ├── contracts/    # Shared TypeScript code (types, interfaces, schemas)
│   └── ui/           # Shared React UI components (To be added later, if needed)
├── docs/             # Project documentation (like this file)
├── turbo.json        # Turborepo configuration
├── pnpm-workspace.yaml # pnpm workspace definition
├── package.json      # Root package.json (defines workspaces, root dev dependencies like turbo)
└── tsconfig.base.json # Base TypeScript config (optional, for sharing common settings)
```

## Core Technologies

- **Monorepo Management:** [pnpm Workspaces](https://pnpm.io/workspaces) for managing dependencies and local package linking.
- **Task Runner & Build Cache:** [Turborepo](https://turbo.build/) for orchestrating tasks (build, dev, lint, test) across packages and providing fast build caching.
- **Backend:** [NestJS](https://nestjs.com/) (Node.js, TypeScript). Compiles to **CommonJS (CJS)** by default.
- **Frontend:** [React](https://react.dev/) + [Vite](https://vitejs.dev/) (TypeScript). Operates natively with **ES Modules (ESM)**.
- **Shared Packages:** Written in TypeScript.

## Handling CJS/ESM Differences in Shared Packages

This is a critical aspect of the architecture to allow seamless sharing between the CJS backend and ESM frontend.

1. **Dedicated Build Step for Shared Packages:**
    - Shared packages (like `packages/contracts`) **must** have their own build step.
    - We use [`tsup`](https://tsup.egoist.dev/) for this, configured to output **both CJS and ESM** formats from the TypeScript source.
    - The `package.json` of the shared package defines the entry points for both formats:

        ```json
        // Example: packages/contracts/package.json
        {
          "name": "@pixeltales/contracts",
          "version": "0.1.0",
          "private": true,
          "main": "./dist/index.js", // CJS entry point
          "module": "./dist/index.mjs", // ESM entry point
          "types": "./dist/index.d.ts", // TypeScript definitions
          "scripts": {
            "build": "tsup src/index.ts --format cjs,esm --dts",
            "dev": "tsup src/index.ts --format cjs,esm --dts --watch"
          },
          "devDependencies": {
            "tsup": "^...",
            "typescript": "^..."
          }
        }
        ```

2. **Backend Consumption (NestJS):**
    - NestJS (running as CJS) will automatically resolve and import the CJS version (`dist/index.js`) based on the `main` field.

3. **Frontend Consumption (Vite):**
    - Vite (running as ESM) will automatically resolve and import the ESM version (`dist/index.mjs`) based on the `module` field.
    - Vite imports the *built* JavaScript code from the shared package's `dist` folder (linked via `node_modules`), avoiding the need to transpile the shared package's source code directly within Vite.

## Build Process & Orchestration (Turborepo)

- Turborepo (`turbo.json`) orchestrates the build process.
- The `build` pipeline is configured with `"dependsOn": ["^build"]`. This ensures that when `turbo run build` is executed:
    1. Turborepo first builds all packages in `packages/*` that have a `build` script (e.g., `packages/contracts`).
    2. Only after the dependencies are built, Turborepo builds the applications in `apps/*` (e.g., `apps/backend`, `apps/frontend`).
- Turborepo's caching significantly speeds up subsequent builds.

## Development Workflow (Hot Reloading)

- The `dev` pipeline in `turbo.json` is configured to run the development servers/watchers for all relevant packages concurrently (`"cache": false, "persistent": true`).
- Running `turbo run dev` will typically start:
    - `pnpm run dev` for `packages/contracts` (`tsup --watch`).
    - `pnpm run start:dev` for `apps/backend` (NestJS watch mode).
    - `pnpm run dev` for `apps/frontend` (Vite dev server).
- **Hot Reloading Behavior:**
    - Changes in `apps/backend/src` trigger NestJS HMR/reload.
    - Changes in `apps/frontend/src` trigger Vite HMR.
    - Changes in `packages/contracts/src`:
        - `tsup --watch` automatically rebuilds the package.
        - **Vite (Frontend):** Usually detects changes in the built files (`dist`) and triggers HMR/reload automatically. 👍
        - **NestJS (Backend):** Often **does not** automatically detect changes in the built files of dependencies. A **manual restart** of the backend (`Ctrl+C` and `turbo run dev --filter=backend`) might be necessary after the shared package rebuilds.

## Linting & Formatting

- Linters (e.g., ESLint) and formatters (e.g., Prettier) should be configured at the root level and potentially extended/overridden in individual packages.
- Turborepo can run linting tasks across the entire monorepo (`turbo run lint`).
