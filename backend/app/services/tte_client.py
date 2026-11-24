"""Klien gateway Tanda Tangan Elektronik (Esign Konsel).

Mengikuti panduan integrasi gateway:
  POST /oauth/token                       -> token singkat (maks. 900 detik, tanpa refresh token)
  POST /api/v1/signkonsel                 -> multipart: file, nik, passphrase, tag_koordinat (+ Idempotency-Key)
  GET  /api/v1/signkonsel/{id}            -> status transaksi
  GET  /api/v1/signkonsel/{id}/document   -> PDF hasil (tersedia ±24 jam)

Aturan keamanan yang dijaga di sini:
* passphrase hanya dikirim ke gateway dan tidak pernah dicatat/dikembalikan;
* timeout atau gangguan gateway tidak dianggap gagal: hasilnya `unknown` agar tidak ditandatangani ulang
  secara otomatis;
* kredensial gateway hanya dibaca dari konfigurasi backend.
"""

import time
from dataclasses import dataclass
from typing import Literal, Protocol

import httpx

from app.core.config import get_settings

Outcome = Literal["succeeded", "failed", "unknown"]

# Pesan untuk kode galat gateway yang terdokumentasi.
ERROR_MESSAGES = {
    "signer_passphrase_invalid": "Passphrase ditolak oleh server TTE.",
    "signer_certificate_invalid": "NIK tidak dapat digunakan atau sertifikat belum aktif.",
}


@dataclass
class SignResult:
    outcome: Outcome
    pdf: bytes | None = None
    request_id: str | None = None
    code: str | None = None
    message: str = ""
    # False berarti jangan coba lagi (mis. passphrase salah, agar akun TTE tidak terkunci).
    retry_signing: bool | None = None


@dataclass
class GatewayStatus:
    status: str  # sending | succeeded | failed | unknown
    error_code: str | None = None


class TTEClient(Protocol):
    async def sign(
        self, *, pdf: bytes, nik: str, passphrase: str, tag: str, idempotency_key: str
    ) -> SignResult: ...

    async def status(self, request_id: str) -> GatewayStatus: ...

    async def download(self, request_id: str) -> bytes | None: ...


class TTEConfigError(Exception):
    pass


# ---------------------------------------------------------------- live


class LiveTTEClient:
    def __init__(self, transport: httpx.AsyncBaseTransport | None = None):
        s = get_settings()
        if not (s.TTE_BASE_URL and s.TTE_CLIENT_ID and s.TTE_CLIENT_SECRET):
            raise TTEConfigError("TTE_BASE_URL, TTE_CLIENT_ID, dan TTE_CLIENT_SECRET belum diisi.")
        if not s.TTE_BASE_URL.startswith("https://") and not s.TTE_BASE_URL.startswith("http://localhost"):
            raise TTEConfigError("TTE_BASE_URL harus HTTPS.")
        self._s = s
        self._base = s.TTE_BASE_URL.rstrip("/")
        self._transport = transport
        self._token: str | None = None
        self._token_exp = 0.0

    def _client(self) -> httpx.AsyncClient:
        return httpx.AsyncClient(
            timeout=self._s.TTE_TIMEOUT_SECONDS,
            follow_redirects=False,
            trust_env=False,
            transport=self._transport,
        )

    def _headers(self, token: str, extra: dict[str, str] | None = None) -> dict[str, str]:
        h = {"Authorization": f"Bearer {token}"}
        if self._s.TTE_ORIGIN:
            h["Origin"] = self._s.TTE_ORIGIN
        if extra:
            h.update(extra)
        return h

    async def _access_token(self, http: httpx.AsyncClient, force: bool = False) -> str:
        if not force and self._token and time.monotonic() < self._token_exp - 30:
            return self._token
        res = await http.post(
            f"{self._base}/oauth/token",
            auth=(self._s.TTE_CLIENT_ID, self._s.TTE_CLIENT_SECRET),
            data={"grant_type": "client_credentials", "scope": self._s.TTE_SCOPE},
            headers={"Origin": self._s.TTE_ORIGIN} if self._s.TTE_ORIGIN else None,
        )
        if res.status_code != 200:
            raise TTEConfigError("Gateway menolak kredensial aplikasi TTE. Periksa client_id/client_secret dan scope.")
        body = res.json()
        self._token = body["access_token"]
        self._token_exp = time.monotonic() + float(body.get("expires_in", 900))
        return self._token

    async def sign(
        self, *, pdf: bytes, nik: str, passphrase: str, tag: str, idempotency_key: str
    ) -> SignResult:
        try:
            async with self._client() as http:
                res = await self._post_sign(http, pdf, nik, passphrase, tag, idempotency_key)
                if res.status_code == 401:  # token kedaluwarsa/dicabut: ambil sekali lagi
                    res = await self._post_sign(http, pdf, nik, passphrase, tag, idempotency_key, refresh=True)
        except TTEConfigError as exc:
            return SignResult("failed", message=str(exc), code="gateway_credentials", retry_signing=False)
        except (httpx.TimeoutException, httpx.TransportError):
            # Belum pasti apakah gateway sempat memproses: jangan dianggap gagal.
            return SignResult(
                "unknown",
                message="Koneksi ke gateway TTE terganggu. Periksa status transaksi sebelum mengulang.",
                retry_signing=False,
            )

        ctype = res.headers.get("content-type", "").split(";")[0].strip().lower()
        if res.status_code == 200 and ctype == "application/pdf":
            return SignResult("succeeded", pdf=res.content, request_id=res.headers.get("X-Signing-Request-ID"))

        try:
            err = res.json()
        except ValueError:
            err = {}
        if not isinstance(err, dict):
            err = {}
        code = err.get("code")
        request_id = err.get("request_id")
        message = ERROR_MESSAGES.get(code or "") or str(err.get("message") or "")
        if not message:
            message = f"Gateway TTE mengembalikan HTTP {res.status_code}."

        # 408 dan gangguan 5xx: hasil belum pasti, jangan ditandatangani ulang otomatis.
        if res.status_code in (408, 502, 503, 504) or err.get("status") == "unknown":
            return SignResult("unknown", request_id=request_id, code=code, message=message, retry_signing=False)
        return SignResult(
            "failed",
            request_id=request_id,
            code=code,
            message=message,
            retry_signing=err.get("retry_signing") if isinstance(err.get("retry_signing"), bool) else None,
        )

    async def _post_sign(
        self,
        http: httpx.AsyncClient,
        pdf: bytes,
        nik: str,
        passphrase: str,
        tag: str,
        key: str,
        refresh: bool = False,
    ) -> httpx.Response:
        token = await self._access_token(http, force=refresh)
        return await http.post(
            f"{self._base}/api/v1/signkonsel",
            headers=self._headers(token, {"Idempotency-Key": key}),
            # Hanya empat field yang diizinkan gateway; field lain akan ditolak.
            data={"nik": nik, "passphrase": passphrase, "tag_koordinat": tag},
            files={"file": ("surat.pdf", pdf, "application/pdf")},
        )

    async def status(self, request_id: str) -> GatewayStatus:
        try:
            async with self._client() as http:
                token = await self._access_token(http)
                res = await http.get(f"{self._base}/api/v1/signkonsel/{request_id}", headers=self._headers(token))
        except (httpx.TransportError, TTEConfigError):
            return GatewayStatus("unknown")
        if res.status_code != 200:
            return GatewayStatus("unknown")
        body = res.json()
        status = body.get("status")
        return GatewayStatus(status if status in ("sending", "succeeded", "failed") else "unknown", body.get("error_code"))

    async def download(self, request_id: str) -> bytes | None:
        try:
            async with self._client() as http:
                token = await self._access_token(http)
                res = await http.get(
                    f"{self._base}/api/v1/signkonsel/{request_id}/document", headers=self._headers(token)
                )
        except (httpx.TransportError, TTEConfigError):
            return None
        ctype = res.headers.get("content-type", "").split(";")[0].strip().lower()
        return res.content if res.status_code == 200 and ctype == "application/pdf" else None


# ---------------------------------------------------------------- mock (khusus development)


class MockTTEClient:
    """Simulasi gateway untuk pengembangan dan tes. Tidak menandatangani apa pun secara sah.

    passphrase "salah-passphrase" -> signer_passphrase_invalid; "timeout" -> hasil belum pasti.
    """

    SIGNED_MARK = b"\n%SIMULASI-TTE (bukan tanda tangan sah)\n"

    def __init__(self) -> None:
        self.calls: list[dict[str, str]] = []
        self._results: dict[str, bytes] = {}

    async def sign(
        self, *, pdf: bytes, nik: str, passphrase: str, tag: str, idempotency_key: str
    ) -> SignResult:
        self.calls.append({"nik": nik, "tag": tag, "key": idempotency_key})
        rid = f"mock-{idempotency_key[:12]}"
        signed = pdf + self.SIGNED_MARK
        if passphrase == "salah-passphrase":
            return SignResult(
                "failed", request_id=rid, code="signer_passphrase_invalid",
                message=ERROR_MESSAGES["signer_passphrase_invalid"], retry_signing=False,
            )
        if passphrase == "timeout":
            self._results[rid] = signed  # gateway sebenarnya sempat memproses
            return SignResult(
                "unknown", request_id=rid, message="Gateway TTE tidak merespons tepat waktu.", retry_signing=False
            )
        self._results[rid] = signed
        return SignResult("succeeded", pdf=signed, request_id=rid)

    async def status(self, request_id: str) -> GatewayStatus:
        return GatewayStatus("succeeded" if request_id in self._results else "failed")

    async def download(self, request_id: str) -> bytes | None:
        return self._results.get(request_id)


_mock_singleton = MockTTEClient()
_live_singleton: LiveTTEClient | None = None


def get_tte_client() -> TTEClient:
    """Pilih klien menurut TTE_MODE. Mode mock tidak boleh dipakai di production."""
    s = get_settings()
    mode = s.TTE_MODE.lower()
    if mode == "live":
        global _live_singleton
        if _live_singleton is None:  # token gateway ikut di-cache selama prosesnya hidup
            _live_singleton = LiveTTEClient()
        return _live_singleton
    if mode == "mock":
        if s.APP_ENV.lower() == "production":
            raise TTEConfigError("TTE_MODE=mock tidak boleh dipakai di production.")
        return _mock_singleton
    raise TTEConfigError("Penandatanganan elektronik belum diaktifkan (TTE_MODE=disabled).")


def reset_mock() -> None:
    """Dipakai tes untuk membersihkan status simulasi."""
    _mock_singleton.calls.clear()
    _mock_singleton._results.clear()
