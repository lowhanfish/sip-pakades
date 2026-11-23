import asyncio

from app.db.seed_master import run_seed
from app.db.session import AsyncSessionLocal


async def main() -> None:
    async with AsyncSessionLocal() as db:
        await run_seed(db)
    print("Seeding database sippakades selesai.")


if __name__ == "__main__":
    asyncio.run(main())
