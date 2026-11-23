import asyncio
from datetime import UTC, datetime, timedelta
from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.db.seed_master import DISTRICT_LAEYA_ID, VILLAGE_PUUNGGALUKU_ID, VILLAGE_TOROBULU_ID
from app.models.master import MasterVillage
from app.models.operational import (
    GovernmentAnnouncement,
    GovernmentRegulation,
    IncomingLetter,
    OutgoingLetter,
    QuarterlyReport,
    RegionalPotential,
    ReportStatusHistory,
    ServiceRequest,
    ServiceStatusHistory,
    TouristDestination,
)


async def sync_dummy_data() -> None:
    now = datetime.now(UTC)
    async with AsyncSessionLocal() as db:
        # Lookup village IDs by name for Laeya
        villages = (
            await db.execute(select(MasterVillage).where(MasterVillage.district_id == DISTRICT_LAEYA_ID))
        ).scalars().all()
        v_map = {v.name: v.id for v in villages}
        aepodu_id = v_map.get("Aepodu", VILLAGE_PUUNGGALUKU_ID)
        ambakumina_id = v_map.get("Ambakumina", VILLAGE_PUUNGGALUKU_ID)
        lamong_id = v_map.get("Lamong Jaya", VILLAGE_PUUNGGALUKU_ID)
        lambakara_id = v_map.get("Lambakara", VILLAGE_TOROBULU_ID)
        lerepako_id = v_map.get("Lerepako", VILLAGE_TOROBULU_ID)

        # 1. Announcements (Berita & Pengumuman) with 3D Clay Thumbnails
        ann_updates = [
            {
                "id": "ann-1",
                "title": "Rapat Koordinasi & Evaluasi Pelaporan Triwulan IV Tahun 2026",
                "slug": "rapat-koordinasi-pelaporan-triwulan-iv-2026",
                "category": "berita",
                "excerpt": "Camat Laeya memimpin rapat koordinasi bersama seluruh Kepala Desa dan Lurah mengenai ketepatan waktu LPPD dan APBDes.",
                "content": "Kantor Kecamatan Laeya menggelar rapat koordinasi bersama 15 Kepala Desa dan 2 Lurah terkait ketepatan waktu pelaporan triwulanan serta percepatan layanan SIP-PAKADES.",
                "thumbnail_url": "/img/berita-rakor.webp",
                "published_at": now,
            },
            {
                "id": "ann-2",
                "title": "Maklumat Pelayanan SIP-PAKADES & Digitalisasi Surat Pengantar Desa",
                "slug": "maklumat-pelayanan-sip-pakades-kecamatan-laeya",
                "category": "pengumuman",
                "excerpt": "Informasi jam operasional loket SIP-PAKADES Kantor Kecamatan Laeya serta integrasi pengantar dari desa dan kelurahan.",
                "content": "Loket Pelayanan Administrasi Kecamatan (SIP-PAKADES) Kecamatan Laeya buka Senin hingga Jumat pukul 08.00–16.00 WITA. Warga dapat melacak berkas secara daring lewat nomor registrasi.",
                "thumbnail_url": "/img/berita-layanan.webp",
                "published_at": now - timedelta(days=2),
            },
            {
                "id": "ann-3",
                "title": "Musrenbang Kecamatan Laeya Fokus Infrastruktur Pesisir & Pertanian",
                "slug": "musrenbang-kecamatan-laeya-2026",
                "category": "agenda",
                "excerpt": "Pembahasan prioritas pembangunan jalan usaha tani, irigasi, dan penguatan ekonomi nelayan pesisir Torobulu.",
                "content": "Musyawarah Perencanaan Pembangunan (Musrenbang) tingkat Kecamatan Laeya menyepakati 18 program prioritas lintas desa tahun anggaran mendatang.",
                "thumbnail_url": "/img/berita-musrenbang.webp",
                "published_at": now - timedelta(days=5),
            },
            {
                "id": "ann-4",
                "title": "Jadwal Pelayanan Keliling SIP-PAKADES ke Desa Wilayah Selatan",
                "slug": "jadwal-pelayanan-keliling-desa-selatan",
                "category": "pengumuman",
                "excerpt": "Tim pelayanan kecamatan turun langsung memfasilitasi pengurusan SKTM, IUMK, dan legalisasi administrasi warga.",
                "content": "Untuk mendekatkan akses layanan publik, tim SIP-PAKADES Kecamatan Laeya hadir setiap hari Kamis di Balai Desa Lerepako dan Torobulu.",
                "thumbnail_url": "/img/gedung-kecamatan.webp",
                "published_at": now - timedelta(days=8),
            },
        ]

        for a_data in ann_updates:
            existing = (await db.execute(select(GovernmentAnnouncement).where(GovernmentAnnouncement.id == a_data["id"]))).scalar_one_or_none()
            if existing:
                existing.thumbnail_url = a_data["thumbnail_url"]
                existing.excerpt = a_data["excerpt"]
            else:
                db.add(GovernmentAnnouncement(
                    id=a_data["id"],
                    district_id=DISTRICT_LAEYA_ID,
                    title=a_data["title"],
                    slug=a_data["slug"],
                    category=a_data["category"],
                    excerpt=a_data["excerpt"],
                    content=a_data["content"],
                    thumbnail_url=a_data["thumbnail_url"],
                    status="terbit",
                    published_at=a_data["published_at"],
                ))

        # 2. Potensi Wilayah (5 Sektor Lengkap)
        pot_items = [
            ("pot-3", aepodu_id, "cat-pertanian", "Lahan Persawahan Irigasi Padi Sawah", "Lumbung padi lokal dengan pola tanam dua kali setahun dan dukungan kelompok tani aktif.", 340, "Ha"),
            ("pot-4", lamong_id, "cat-peternakan", "Sentra Pembibitan Sapi Potong & Ternak Terpadu", "Pengembangan ternak sapi Bali terintegrasi dengan pakan hijauan dan pupuk organik.", 620, "Ekor"),
            ("pot-5", ambakumina_id, "cat-perkebunan", "Komoditas Kakao, Lada & Kelapa Dalam", "Perkebunan rakyat unggulan dengan program peremajaan tanaman kakao dan lada.", 415, "Ha"),
        ]
        for pid, vid, cid, title, desc, val, unit in pot_items:
            exists = (await db.execute(select(RegionalPotential).where(RegionalPotential.id == pid))).scalar_one_or_none()
            if not exists:
                db.add(RegionalPotential(
                    id=pid, district_id=DISTRICT_LAEYA_ID, village_id=vid, category_id=cid,
                    title=title, description=desc, metric_value=val, metric_unit=unit, period_year=2026
                ))

        # 3. Destinasi Wisata (3 Destinasi dengan cover_image)
        tour_updates = [
            ("tour-1", VILLAGE_TOROBULU_ID, "tcat-bahari", "Pantai & Kawasan Pesisir Torobulu", "Destinasi pesisir dengan panorama Teluk Tiworo dan kuliner ikan bakar segar.", "Desa Torobulu, Kec. Laeya, Kab. Konawe Selatan", ["Area Parkir", "Gazebo Pesisir", "Kuliner Seafood"], "Setiap Hari, 06.00–19.00 WITA", "Gratis / Retribusi Parkir Lokal", "/img/wisata-torobulu.webp", -4.3556, 122.4958),
            ("tour-2", lerepako_id, "tcat-alam", "Air Terjun & Permandian Alam Lerepako", "Wisata alam air terjun bertingkat dengan kolam alami jernih di tengah hutan hijau.", "Desa Lerepako, Kec. Laeya, Kab. Konawe Selatan", ["Jalur Trekking", "Gazebo", "Toilet Umum", "Area Kemah"], "Setiap Hari, 07.00–17.00 WITA", "Rp 5.000 / Orang", "/img/wisata-air-terjun.webp", -4.328, 122.462),
            ("tour-3", lambakara_id, "tcat-eko", "Ekowisata Hutan Mangrove Lambakara", "Kawasan pelestarian bakau pesisir dengan jembatan kayu edukasi dan spot foto senja.", "Desa Lambakara, Kec. Laeya, Kab. Konawe Selatan", ["Jembatan Kayu", "Menara Pandang", "Perahu Nelayan"], "Setiap Hari, 06.30–18.00 WITA", "Rp 5.000 / Orang", "/img/wisata-mangrove.webp", -4.294, 122.502),
        ]
        for tid, vid, cid, name, desc, addr, fac, hrs, tkt, img, lat, lng in tour_updates:
            ex = (await db.execute(select(TouristDestination).where(TouristDestination.id == tid))).scalar_one_or_none()
            if ex:
                ex.cover_image_url = img
            else:
                db.add(TouristDestination(
                    id=tid, district_id=DISTRICT_LAEYA_ID, village_id=vid, category_id=cid,
                    name=name, description=desc, address=addr, facilities=fac,
                    opening_hours=hrs, ticket_info=tkt, cover_image_url=img, latitude=lat, longitude=lng, is_published=True
                ))

        # 4. Regulasi Tambahan
        reg_items = [
            ("reg-2", "SK Camat Tim Verifikasi Laporan Triwulan Desa/Kelurahan", "SK Camat No. 140/24/2026", 2026, "SK Camat", "Penetapan tim verifikator kelengkapan laporan LPPD dan APBDes tingkat Kecamatan Laeya."),
            ("reg-3", "Pedoman Penguatan Ketahanan Pangan & BUMDes", "Perdes Bersama No. 04/2026", 2026, "Perdes", "Sinergi pengelolaan lumbung pangan desa dan unit usaha BUMDes wilayah Laeya."),
        ]
        for rid, title, num, yr, cat, desc in reg_items:
            ex = (await db.execute(select(GovernmentRegulation).where(GovernmentRegulation.id == rid))).scalar_one_or_none()
            if not ex:
                db.add(GovernmentRegulation(
                    id=rid, district_id=DISTRICT_LAEYA_ID, title=title, regulation_number=num,
                    year=yr, category=cat, description=desc, status="terbit"
                ))

        # 5. Permohonan Layanan Tambahan (0041 & 0040) agar semua sample tracking works!
        sr_items = [
            ("sr-2", "SIP-740511-2026-0041", VILLAGE_TOROBULU_ID, "srv-iumk", "Siti Marlina", "7405114502920001", "081342220099", "Dusun II Desa Torobulu", "503/11/DESA-TRB/XI/2026", "selesai", 2, "Usaha Kuliner Ikan Bakar Pesisir", "Surat Izin Usaha Mikro telah diterbitkan dan ditandatangani."),
            ("sr-3", "SIP-740511-2026-0040", aepodu_id, "srv-kependudukan", "Budi Santoso", "7405111203890004", "082190001122", "Dusun I Desa Aepodu", "470/08/DESA-AEP/XI/2026", "diterima", 1, "SKTM Beasiswa Pendidikan", "Berkas diterima oleh loket SIP-PAKADES dan dijadwalkan verifikasi."),
        ]
        for sid, reg_no, vid, stype, aname, nik, phone, addr, cov, st, sla, notes, pub_note in sr_items:
            ex = (await db.execute(select(ServiceRequest).where(ServiceRequest.id == sid))).scalar_one_or_none()
            if not ex:
                db.add(ServiceRequest(
                    id=sid, registration_number=reg_no, district_id=DISTRICT_LAEYA_ID, village_id=vid,
                    service_type_id=stype, applicant_name=aname, applicant_nik=nik, applicant_phone=phone,
                    applicant_address=addr, village_cover_letter_no=cov, status=st, sla_days=sla,
                    sla_due_at=now + timedelta(days=sla), notes=notes,
                    created_by="770e8400-e29b-41d4-a716-446655440004"
                ))
                db.add(ServiceStatusHistory(
                    service_request_id=sid, status=st, note=notes, public_note=pub_note,
                    changed_by_name="Kasi Pelayanan Kec. Laeya"
                ))

        # 6. Laporan Triwulan & Persuratan Tambahan
        if not (await db.execute(select(QuarterlyReport).where(QuarterlyReport.id == "rep-3"))).scalar_one_or_none():
            db.add(QuarterlyReport(
                id="rep-3", district_id=DISTRICT_LAEYA_ID, village_id=aepodu_id, report_type_id="rt-lppd",
                period_id="per-2026-4", title="LPPD Triwulan IV 2026 Desa Aepodu", status="terverifikasi",
                submission_version=1, submitted_at=now - timedelta(days=3), verified_at=now - timedelta(days=1),
                verified_by="770e8400-e29b-41d4-a716-446655440003", summary_payload={"jumlah_kegiatan": 11},
                created_by="770e8400-e29b-41d4-a716-446655440005"
            ))
            db.add(ReportStatusHistory(
                report_id="rep-3", from_status="diajukan", to_status="terverifikasi",
                note="Lengkap sesuai pedoman", submission_version=1, changed_by_name="Ansar"
            ))

        if not (await db.execute(select(IncomingLetter).where(IncomingLetter.id == "in-2"))).scalar_one_or_none():
            db.add(IncomingLetter(
                id="in-2", district_id=DISTRICT_LAEYA_ID, village_id=aepodu_id, classification_id="cls-140",
                agenda_number="AGD-2026-090", origin_letter_number="140/21/AEP/2026", origin_sender="Pemerintah Desa Aepodu",
                subject="Usulan Perbaikan Saluran Irigasi Tersier Blok B", letter_date=now.date(),
                received_date=now.date(), urgency="biasa", disposition_status="didisposisikan", created_by="770e8400-e29b-41d4-a716-446655440003"
            ))

        if not (await db.execute(select(OutgoingLetter).where(OutgoingLetter.id == "out-2"))).scalar_one_or_none():
            db.add(OutgoingLetter(
                id="out-2", district_id=DISTRICT_LAEYA_ID, classification_id="cls-500",
                letter_number="474/89/KC-LY/2026", letter_type="edaran", recipient="Seluruh Kepala Desa & Lurah se-Kec. Laeya",
                subject="Edaran Percepatan Pelayanan Administrasi SIP-PAKADES", letter_date=now.date(),
                created_by="770e8400-e29b-41d4-a716-446655440003"
            ))

        await db.commit()
        print("Dummy data synced successfully into database!")


if __name__ == "__main__":
    asyncio.run(sync_dummy_data())
