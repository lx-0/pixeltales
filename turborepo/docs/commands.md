# PixelTales Monorepo - Common Commands

This file lists the most common commands you'll need during development in the PixelTales monorepo.

**Note:** All commands should be run from the root of the monorepo (`turborepo/` directory).

## Installation

- **Install all dependencies for all packages:**

    ```bash
    pnpm install
    ```

- **Add a dependency to a specific package:**

    ```bash
    # Example: Add zod to the contracts package
    pnpm add zod --filter @pixeltales/contracts
    ```

- **Add a dev dependency to a specific package:**

    ```bash
    # Example: Add vitest to the backend app
    pnpm add vitest --save-dev --filter backend
    ```

- **Add a dependency to the root:** (e.g., for global tools like typescript)

    ```bash
    pnpm add typescript --save-dev -w
    ```

## Development

- **Start all development servers/watchers concurrently:** (Backend, Frontend, Shared Package Watcher)

    ```bash
    turbo run dev
    ```

- **Start only the backend development server:**

    ```bash
    turbo run dev --filter=backend
    ```

- **Start only the frontend development server:** (Once added)

    ```bash
    turbo run dev --filter=frontend
    ```

- **Watch & rebuild only a shared package:**

    ```bash
    turbo run dev --filter=@pixeltales/contracts
    ```

## Building

- **Build all packages & apps:** (Respects dependency order)

    ```bash
    turbo run build
    ```

- **Build only the backend app (and its dependencies):**

    ```bash
    turbo run build --filter=backend
    ```

- **Build only a specific shared package:**

    ```bash
    turbo run build --filter=@pixeltales/contracts
    ```

## Linting & Formatting

- **Run linting across all packages:**

    ```bash
    turbo run lint
    ```

- **Run linting for a specific package:**

    ```bash
    turbo run lint --filter=backend
    ```

- **Format code (assuming a root script is configured):**

    ```bash
    # Example: if you have a "format" script in the root package.json
    pnpm format
    # Or run directly if prettier is a root dev dependency
    pnpm prettier --write "**/*.{ts,tsx,js,json,md}"
    ```

## Cleaning

- **Remove all `node_modules` and build artifacts (`dist`) across the monorepo:**

    ```bash
    # Requires a "clean" script in each package's package.json
    # Example script: "clean": "rimraf node_modules dist .turbo"
    turbo run clean
    rm -rf node_modules # Also remove root node_modules
    ```

## Using CLIs (e.g., NestJS CLI)

When you need to run a CLI specific to a package (like `nest generate`), navigate into that package's directory first:

```bash
cd apps/backend
nest generate service my-new-service
cd ../..
```

Or use `pnpm --filter` to execute commands within a package context from the root:

```bash
pnpm --filter backend run nest generate service my-new-service
```

*(Note: The second approach might require the CLI tool to be listed as a dependency within that specific package.)*

## Database

- **Run migrations:**

```bash
pnpm --filter @pixeltales/database run migrate
```
