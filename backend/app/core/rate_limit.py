import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request, status


class SlidingWindowRateLimiter:
    def __init__(self, max_requests: int = 30, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def check(self, key: str) -> None:
        now = time.monotonic()
        q = self._hits[key]
        while q and now - q[0] > self.window_seconds:
            q.popleft()
        if len(q) >= self.max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Terlalu banyak permintaan. Silakan coba beberapa saat lagi.",
            )
        q.append(now)


login_limiter = SlidingWindowRateLimiter(max_requests=20, window_seconds=60)
public_track_limiter = SlidingWindowRateLimiter(max_requests=40, window_seconds=60)


async def limit_login_requests(request: Request) -> None:
    ip = request.client.host if request.client else "unknown"
    login_limiter.check(f"login:{ip}")


async def limit_track_requests(request: Request) -> None:
    ip = request.client.host if request.client else "unknown"
    public_track_limiter.check(f"track:{ip}")
