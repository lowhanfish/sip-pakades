"""Pembuatan PDF surat layanan sebelum ditandatangani.

Isi surat memakai templat umum. Format baku (kop, kalimat pembuka/penutup) tiap jenis surat mengikuti
ketentuan kecamatan dan dapat disesuaikan di sini tanpa mengubah alur penandatanganan.

Marker posisi tanda tangan (TTE_TAG_COORDINATE) dicetak SATU kali, berwarna putih, tepat di atas nama
penandatangan; gateway menempatkan gambar tanda tangan pada posisi marker itu.
"""

import io
from dataclasses import dataclass
from datetime import date
from functools import lru_cache
from pathlib import Path

from reportlab.graphics import renderPDF
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader, simpleSplit
from reportlab.pdfgen import canvas

from app.core.config import get_settings

_MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus",
           "September", "Oktober", "November", "Desember"]
_ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"]


# Lambang daerah pada kop surat. Ganti berkas ini dengan lambang resmi (PNG transparan) tanpa mengubah kode.
LOGO_PATH = Path(__file__).resolve().parent.parent / "assets" / "logo-konsel.png"


@lru_cache
def _logo() -> ImageReader | None:
    try:
        return ImageReader(str(LOGO_PATH))
    except (OSError, ValueError):
        return None  # surat tetap dibuat tanpa logo bila berkas tidak ada


def format_date_id(d: date) -> str:
    return f"{d.day} {_MONTHS[d.month - 1]} {d.year}"


def roman_month(d: date) -> str:
    return _ROMAN[d.month - 1]


def clean_text(value: str | None) -> str:
    """Buang karakter kontrol dan marker TTE dari teks isian warga agar marker tetap tunggal."""
    tag = get_settings().TTE_TAG_COORDINATE
    text = (value or "").replace(tag, "")
    return "".join(ch for ch in text if ch == "\n" or ch >= " ").strip()


@dataclass
class LetterData:
    district_name: str
    district_address: str
    service_name: str
    letter_number: str | None
    letter_date: date
    applicant_name: str
    applicant_nik: str
    applicant_address: str
    village_name: str
    village_letter_no: str | None
    fields: list[tuple[str, str]]  # (label, isi) dari isian permohonan
    signer_name: str
    signer_nip: str | None
    verification_url: str
    verification_code: str


def render_letter_pdf(d: LetterData) -> bytes:
    tag = get_settings().TTE_TAG_COORDINATE
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4, pageCompression=0)
    c.setTitle(f"{d.service_name} - {d.letter_number or 'draf'}")
    c.setAuthor(f"Kecamatan {d.district_name}")
    width, height = A4
    left, right = 64, width - 64
    text_w = right - left
    y = height - 54

    # ---- kop: lambang di kiri, teks di tengah
    logo_h = 70
    logo = _logo()
    if logo:
        iw, ih = logo.getSize()
        logo_w = logo_h * iw / ih
        c.drawImage(logo, left, y - logo_h + 12, width=logo_w, height=logo_h, mask="auto")
    c.setFont("Helvetica-Bold", 13)
    c.drawCentredString(width / 2, y, "PEMERINTAH KABUPATEN KONAWE SELATAN")
    y -= 17
    c.setFont("Helvetica-Bold", 15)
    c.drawCentredString(width / 2, y, f"KECAMATAN {d.district_name.upper()}")
    y -= 14
    c.setFont("Helvetica", 9)
    c.drawCentredString(width / 2, y, clean_text(d.district_address) or "-")
    y -= 30
    c.setLineWidth(1.6)
    c.line(left, y, right, y)
    c.setLineWidth(0.5)
    c.line(left, y - 3, right, y - 3)
    y -= 34

    # ---- judul
    c.setFont("Helvetica-Bold", 12)
    title = clean_text(d.service_name).upper()
    c.drawCentredString(width / 2, y, title)
    tw = c.stringWidth(title, "Helvetica-Bold", 12)
    c.line((width - tw) / 2, y - 2, (width + tw) / 2, y - 2)
    y -= 16
    c.setFont("Helvetica", 11)
    c.drawCentredString(width / 2, y, f"Nomor: {d.letter_number or '........ (diberikan saat ditandatangani)'}")
    y -= 30

    def para(text: str, font: str = "Helvetica", size: float = 11, indent: float = 0, gap: float = 15) -> None:
        nonlocal y
        c.setFont(font, size)
        for line in simpleSplit(text, font, size, text_w - indent):
            c.drawString(left + indent, y, line)
            y -= gap

    para(f"Yang bertanda tangan di bawah ini, Camat {d.district_name}, Kabupaten Konawe Selatan, "
         "menerangkan dengan sebenarnya bahwa:")
    y -= 4
    rows = [
        ("Nama", d.applicant_name),
        ("NIK", d.applicant_nik),
        ("Alamat", d.applicant_address or "-"),
        ("Desa/Kelurahan", d.village_name),
    ]
    for label, val in rows:
        c.setFont("Helvetica", 11)
        c.drawString(left + 18, y, label)
        c.drawString(left + 130, y, ":")
        lines = simpleSplit(clean_text(val) or "-", "Helvetica-Bold", 11, text_w - 150)
        c.setFont("Helvetica-Bold", 11)
        for ln in lines:
            c.drawString(left + 140, y, ln)
            y -= 15
    y -= 6

    if d.village_letter_no:
        para(f"Berdasarkan surat pengantar dari Kepala Desa/Lurah {d.village_name} "
             f"Nomor {clean_text(d.village_letter_no)}, yang bersangkutan mengajukan permohonan "
             f"{clean_text(d.service_name)} dengan keterangan sebagai berikut:")
    else:
        para(f"Yang bersangkutan mengajukan permohonan {clean_text(d.service_name)} dengan keterangan sebagai berikut:")
    y -= 4
    for label, val in d.fields:
        para(f"{clean_text(label)}: {clean_text(val)}", indent=18)
    y -= 6
    para("Demikian surat ini dibuat untuk dipergunakan sebagaimana mestinya.")

    # ---- blok tanda tangan (kanan bawah)
    sig_x = right - 190
    sy = max(y - 28, 250)
    c.setFont("Helvetica", 11)
    c.drawString(sig_x, sy, f"{d.district_name}, {format_date_id(d.letter_date)}")
    sy -= 15
    c.drawString(sig_x, sy, f"Camat {d.district_name}")
    sy -= 50
    # Marker TTE: putih, ukuran kecil, tunggal.
    c.setFillColorRGB(1, 1, 1)
    c.setFont("Helvetica", 8)
    c.drawString(sig_x + 2, sy + 34, tag)
    c.setFillColorRGB(0, 0, 0)
    c.setFont("Helvetica-Bold", 11)
    name = clean_text(d.signer_name)
    c.drawString(sig_x, sy, name)
    nw = c.stringWidth(name, "Helvetica-Bold", 11)
    c.line(sig_x, sy - 2, sig_x + nw, sy - 2)
    if d.signer_nip:
        c.setFont("Helvetica", 10)
        c.drawString(sig_x, sy - 15, f"NIP. {clean_text(d.signer_nip)}")

    # ---- QR verifikasi keaslian (kiri bawah)
    qr = QrCodeWidget(d.verification_url)
    x0, y0, x1, y1 = qr.getBounds()
    size = 62
    drawing = Drawing(size, size, transform=[size / (x1 - x0), 0, 0, size / (y1 - y0), 0, 0])
    drawing.add(qr)
    renderPDF.draw(drawing, c, left, 78)
    c.setFont("Helvetica", 7.5)
    c.drawString(left + size + 8, 118, "Pindai untuk memeriksa keaslian surat.")
    c.drawString(left + size + 8, 108, f"Kode: {d.verification_code}")
    c.drawString(left + size + 8, 98, "Dokumen ini ditandatangani secara elektronik.")

    c.showPage()
    c.save()
    return buf.getvalue()
