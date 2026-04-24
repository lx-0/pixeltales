"""Dump the FastAPI OpenAPI schema to backend/openapi.json.

Run from the backend/ directory: uv run python -m scripts.dump_openapi
(importing app.main creates asyncio tasks, so we wrap it in asyncio.run)
"""

import asyncio
import json
import sys
from pathlib import Path


async def _main() -> None:
    from app.main import app

    out = Path(__file__).resolve().parents[1] / "openapi.json"
    schema = app.openapi()
    out.write_text(json.dumps(schema, indent=2, sort_keys=True) + "\n")
    print(f"wrote {out} ({len(schema.get('paths', {}))} paths)", file=sys.stderr)


if __name__ == "__main__":
    asyncio.run(_main())
