"""One-shot DB cleanup: delete all but the latest N snapshots per scene.

Use after upgrading from a pre-retention backend (commit b9ddf22 or
earlier) where snapshots accumulated forever and the DB grew quadratically
with conversation length (every snapshot embeds the full message list).

Defaults to dry-run. Pass --yes to actually delete + VACUUM.

    cd backend
    uv run python -m scripts.prune_snapshots                # dry-run
    uv run python -m scripts.prune_snapshots --yes          # delete + VACUUM
    uv run python -m scripts.prune_snapshots --yes --keep 3 # tighter retention
"""

import argparse
import asyncio
from collections import defaultdict
from pathlib import Path

from sqlalchemy import delete, func, select, text

from app.core.config import settings
from app.db.database import async_session
from app.db.models import DBSceneStateSnapshot


async def _audit() -> tuple[dict[int, int], int, int]:
    """Return (counts_per_scene, total_rows, total_bytes)."""
    async with async_session() as session:
        rows = await session.execute(
            select(
                DBSceneStateSnapshot.scene_id,
                func.count(DBSceneStateSnapshot.id),
                func.sum(func.length(DBSceneStateSnapshot.state)),
            ).group_by(DBSceneStateSnapshot.scene_id)
        )
        counts: dict[int, int] = {}
        total = 0
        bytes_total = 0
        for scene_id, n, b in rows:
            counts[scene_id] = n
            total += n
            bytes_total += int(b or 0)
        return counts, total, bytes_total


async def _prune_one(scene_id: int, keep: int) -> int:
    """Prune snapshots for one scene_id; return number deleted."""
    async with async_session() as session:
        keep_ids_q = (
            select(DBSceneStateSnapshot.id)
            .where(DBSceneStateSnapshot.scene_id == scene_id)
            .order_by(DBSceneStateSnapshot.timestamp.desc())
            .limit(keep)
        )
        keep_ids = [row[0] for row in (await session.execute(keep_ids_q)).all()]
        if not keep_ids:
            return 0
        result = await session.execute(
            delete(DBSceneStateSnapshot)
            .where(DBSceneStateSnapshot.scene_id == scene_id)
            .where(DBSceneStateSnapshot.id.notin_(keep_ids))
        )
        await session.commit()
        # CursorResult.rowcount on async SQLAlchemy returns int; fall back to
        # 0 for backends that don't surface it (in practice always set here).
        return getattr(result, "rowcount", 0) or 0


async def _vacuum() -> None:
    """SQLite VACUUM to reclaim freed space."""
    async with async_session() as session:
        # VACUUM cannot run inside a transaction; raw connection.
        raw = await session.connection()
        await raw.execute(text("VACUUM"))


async def _main(keep: int, apply: bool) -> int:
    counts, total, bytes_total = await _audit()
    if not counts:
        print("no snapshots in DB; nothing to do.")
        return 0

    print(f"current state ({len(counts)} scene(s), {total} snapshots, {bytes_total / 1e6:.1f} MB):")
    expected_keep_total = 0
    expected_delete_total = 0
    per_scene: dict[int, dict[str, int]] = defaultdict(dict)
    for scene_id, n in sorted(counts.items()):
        keep_n = min(n, keep)
        del_n = n - keep_n
        per_scene[scene_id] = {"have": n, "keep": keep_n, "delete": del_n}
        expected_keep_total += keep_n
        expected_delete_total += del_n
        print(f"  scene_id={scene_id}: have={n}, keep={keep_n}, delete={del_n}")
    print(f"plan: keep {expected_keep_total}, delete {expected_delete_total}")

    if not apply:
        print("\ndry-run; pass --yes to apply.")
        return 0

    print("\napplying…")
    deleted = 0
    for scene_id in sorted(counts.keys()):
        n = await _prune_one(scene_id, keep)
        deleted += n
        print(f"  scene_id={scene_id}: deleted {n}")
    print(f"deleted {deleted} rows. running VACUUM…")
    await _vacuum()

    _, total2, bytes_total2 = await _audit()
    print(
        f"after: {total2} snapshots, {bytes_total2 / 1e6:.1f} MB "
        f"(was {bytes_total / 1e6:.1f} MB; -{(bytes_total - bytes_total2) / 1e6:.1f} MB)"
    )
    db_path = Path(settings.SQLITE_URL.removeprefix("sqlite+aiosqlite:///"))
    if db_path.exists():
        print(f"DB file size on disk: {db_path.stat().st_size / 1e6:.1f} MB")
    return 0


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument(
        "--keep",
        type=int,
        default=settings.SCENE_SNAPSHOT_RETENTION,
        help=f"how many latest snapshots to keep per scene_id (default: {settings.SCENE_SNAPSHOT_RETENTION})",
    )
    p.add_argument(
        "--yes",
        action="store_true",
        help="actually delete + VACUUM (default is dry-run)",
    )
    args = p.parse_args()
    raise SystemExit(asyncio.run(_main(keep=args.keep, apply=args.yes)))
