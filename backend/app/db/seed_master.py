from datetime import UTC, date, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.auth import Role, User
from app.models.master import (
    MasterDistrict,
    MasterLetterClassification,
    MasterOfficialPosition,
    MasterPotentialCategory,
    MasterReportType,
    MasterServiceType,
    MasterTourismCategory,
    MasterVillage,
    ReportPeriod,
)
from app.models.operational import (
    GovernmentAnnouncement,
    GovernmentOfficial,
    GovernmentRegulation,
    IncomingLetter,
    LetterDisposition,
    OutgoingLetter,
    QuarterlyReport,
    RegionalPotential,
    ReportStatusHistory,
    ServiceRequest,
    ServiceStatusHistory,
    TouristDestination,
)

DISTRICT_LAEYA_ID = "550e8400-e29b-41d4-a716-446655440011"
VILLAGE_PUUNGGALUKU_ID = "660e8400-e29b-41d4-a716-446655440002"
VILLAGE_TOROBULU_ID = "660e8400-e29b-41d4-a716-446655440016"

DISTRICTS_DATA = [
    ("740501", "Tinanggea", "tinanggea", "Kel. Tinanggea, Kec. Tinanggea", -4.4622, 122.2481, False),
    ("740502", "Angata", "angata", "Desa Motaha, Kec. Angata", -4.1628, 122.1422, False),
    ("740503", "Andoolo", "andoolo", "Kel. Potoro, Kec. Andoolo", -4.3167, 122.2833, False),
    ("740504", "Palangga", "palangga", "Kel. Palangga, Kec. Palangga", -4.3461, 122.3694, False),
    ("740505", "Landono", "landono", "Kel. Landono, Kec. Landono", -4.0833, 122.2667, False),
    ("740506", "Lainea", "lainea", "Desa Lainea, Kec. Lainea", -4.3667, 122.5833, False),
    ("740507", "Konda", "konda", "Kel. Konda, Kec. Konda", -4.0894, 122.4956, False),
    ("740508", "Ranomeeto", "ranomeeto", "Kel. Ranomeeto, Kec. Ranomeeto", -4.0417, 122.4417, False),
    ("740509", "Kolono", "kolono", "Kel. Kolono, Kec. Kolono", -4.3458, 122.7167, False),
    ("740510", "Moramo", "moramo", "Kel. Lapuko, Kec. Moramo", -4.1667, 122.6833, False),
    (
        "740511",
        "Laeya",
        "laeya",
        "Jl. Poros Kendari - Andoolo, Kel. Puunggaluku, Kec. Laeya, Kab. Konawe Selatan",
        -4.2738,
        122.4664,
        True,
    ),
    ("740512", "Lalembuu", "lalembuu", "Kel. Atari Indah, Kec. Lalembuu", -4.4167, 122.15, False),
    ("740513", "Benua", "benua", "Desa Horodopi, Kec. Benua", -4.2167, 122.1167, False),
    ("740514", "Palangga Selatan", "palangga-selatan", "Desa Lakara, Kec. Palangga Selatan", -4.4667, 122.3833, False),
    ("740515", "Mowila", "mowila", "Desa Mowila, Kec. Mowila", -4.05, 122.2167, False),
    ("740516", "Moramo Utara", "moramo-utara", "Kel. Lalowaru, Kec. Moramo Utara", -4.0833, 122.6667, False),
    ("740517", "Buke", "buke", "Desa Buke, Kec. Buke", -4.3, 122.3667, False),
    ("740518", "Wolasi", "wolasi", "Desa Wolasi, Kec. Wolasi", -4.1667, 122.45, False),
    ("740519", "Laonti", "laonti", "Desa Ulusawa, Kec. Laonti", -4.4333, 122.85, False),
    ("740520", "Baito", "baito", "Desa Baito, Kec. Baito", -4.25, 122.3167, False),
    ("740521", "Basala", "basala", "Desa Basala, Kec. Basala", -4.2833, 122.0833, False),
    ("740522", "Ranomeeto Barat", "ranomeeto-barat", "Desa Lameuru, Kec. Ranomeeto Barat", -4.0333, 122.3667, False),
    ("740523", "Kolono Timur", "kolono-timur", "Desa Tumbu-Tumbu Jaya, Kec. Kolono Timur", -4.3667, 122.7833, False),
    ("740524", "Sabulakoa", "sabulakoa", "Desa Sabulakoa, Kec. Sabulakoa", -4.1167, 122.3333, False),
    ("740525", "Andoolo Barat", "andoolo-barat", "Desa Anese, Kec. Andoolo Barat", -4.3333, 122.2167, False),
]

LAEYA_VILLAGES_DATA = [
    (None, "7405111001", "Ambalodangge", "kelurahan", 8.4, 1620, 430, -4.258, 122.455, "Kelurahan di wilayah utara Kecamatan Laeya."),
    (VILLAGE_PUUNGGALUKU_ID, "7405111002", "Puunggaluku", "kelurahan", 11.2, 2890, 760, -4.2738, 122.4664, "Ibu kota Kecamatan Laeya sekaligus pusat layanan administrasi SIP-PAKADES."),
    (None, "7405112003", "Aepodu", "desa", 9.8, 1140, 305, -4.245, 122.478, "Desa agraris dengan komoditas utama padi sawah."),
    (None, "7405112004", "Ambakumina", "desa", 10.5, 980, 260, -4.289, 122.435, "Desa dengan potensi perkebunan kakao dan lada."),
    (None, "7405112005", "Ambesea", "desa", 12.1, 1320, 350, -4.262, 122.492, "Desa berkembang dengan sektor pertanian terpadu."),
    (None, "7405112006", "Anduna", "desa", 14.3, 1210, 320, -4.301, 122.448, "Desa dengan bentang alam perbukitan."),
    (None, "7405112007", "Anggoroboti", "desa", 9.2, 870, 235, -4.249, 122.441, "Desa produktif sektor palawija."),
    (None, "7405112008", "Labokeo", "desa", 13.7, 1480, 390, -4.315, 122.489, "Desa jalur selatan Laeya."),
    (None, "7405112009", "Laeya", "desa", 15.0, 1590, 415, -4.283, 122.472, "Desa sejarah asal nama Kecamatan Laeya."),
    (None, "7405112010", "Lambakara", "desa", 11.6, 1050, 280, -4.294, 122.502, "Desa dengan potensi tambak dan mangrove."),
    (None, "7405112011", "Lamong Jaya", "desa", 10.9, 1370, 365, -4.268, 122.449, "Desa sentra peternakan sapi."),
    (None, "7405112012", "Lerepako", "desa", 16.4, 1430, 378, -4.328, 122.462, "Desa pesisir dan wisata alam."),
    (None, "7405112013", "Ombu-Ombu Jaya", "desa", 12.8, 1180, 312, -4.279, 122.428, "Desa perkebunan jambu mete dan kakao."),
    (None, "7405112014", "Puuwulo", "desa", 11.0, 960, 254, -4.254, 122.509, "Desa pertanian pangan."),
    (None, "7405112015", "Rambu-Rambu", "desa", 13.5, 1120, 298, -4.307, 122.477, "Desa perkebunan dan kerajinan rakyat."),
    (VILLAGE_TOROBULU_ID, "7405112016", "Torobulu", "desa", 18.2, 2450, 640, -4.3556, 122.4958, "Desa pelabuhan penyeberangan Torobulu–Tampo."),
    (None, "7405112017", "Wonua Kongga", "desa", 14.1, 1260, 334, -4.291, 122.456, "Desa agraris padi dan jagung."),
]


async def run_seed(db: AsyncSession) -> None:
    existing_role = (await db.execute(select(Role).limit(1))).scalar_one_or_none()
    if existing_role is not None:
        return

    # 1. Roles
    roles = [
        Role(code="superadmin_kab", name="Superadmin Kab. / Sistem"),
        Role(code="admin_kecamatan", name="Admin Kecamatan"),
        Role(code="camat_sekcam", name="Camat / Sekcam"),
        Role(code="kasi_pelayanan", name="Kasi / Petugas Layanan"),
        Role(code="operator_desa", name="Operator Desa/Kelurahan"),
    ]
    db.add_all(roles)
    await db.flush()

    # 2. 25 Districts
    for idx, (code, name, slug, addr, lat, lng, is_def) in enumerate(DISTRICTS_DATA, start=1):
        did = DISTRICT_LAEYA_ID if is_def else f"550e8400-e29b-41d4-a716-4466554400{idx:02d}"
        db.add(
            MasterDistrict(
                id=did,
                code=code,
                name=name,
                slug=slug,
                office_address=addr,
                phone="(0401) 319xxxx" if is_def else None,
                email=f"kec.{slug}@konaweselatankab.go.id",
                service_hours="Senin–Jumat, 08.00–16.00 WITA",
                vision=(
                    "Terwujudnya Pelayanan Publik Kecamatan Laeya yang Prima, Transparan, dan Berdaya Saing."
                    if is_def
                    else f"Mewujudkan tata kelola pemerintahan Kecamatan {name} yang profesional."
                ),
                mission=(
                    "1. Meningkatkan kualitas pelayanan administrasi kecamatan melalui SIP-PAKADES.\n2. Memperkuat pembinaan pemerintahan 17 desa/kelurahan."
                    if is_def
                    else f"Meningkatkan pelayanan administrasi dan pembinaan desa/kelurahan di Kecamatan {name}."
                ),
                latitude=lat,
                longitude=lng,
                is_active=True,
                is_default=is_def,
                created_by="system-seed",
            )
        )
    await db.flush()

    # 3. 17 Villages in Laeya
    for idx, (vid, code, name, vtype, area, pop, kk, lat, lng, desc) in enumerate(
        LAEYA_VILLAGES_DATA, start=1
    ):
        db.add(
            MasterVillage(
                id=vid or f"660e8400-e29b-41d4-a716-4466554400{idx:02d}",
                district_id=DISTRICT_LAEYA_ID,
                code=code,
                name=name,
                slug=name.lower().replace(" ", "-"),
                type=vtype,
                description=desc,
                history=f"{'Kelurahan' if vtype == 'kelurahan' else 'Desa'} {name} di Kecamatan Laeya.",
                boundaries={"north": "Kec. Laeya", "south": "Kec. Laeya", "east": "Kec. Laeya", "west": "Kec. Laeya"},
                area_km2=area,
                dusun_count=4 if vtype == "kelurahan" else 3,
                rw_count=6,
                rt_count=14,
                population_total=pop,
                household_total=kk,
                latitude=lat,
                longitude=lng,
                is_active=True,
                created_by="system-seed",
            )
        )
    await db.flush()

    # 4. Reference Masters
    positions = [
        MasterOfficialPosition(id="pos-camat", code="CAMAT", name="Camat", level="kecamatan", sort_order=1, is_leadership=True),
        MasterOfficialPosition(id="pos-sekcam", code="SEKCAM", name="Sekretaris Camat", level="kecamatan", sort_order=2, is_leadership=False),
        MasterOfficialPosition(id="pos-kasi", code="KASI", name="Kepala Seksi (Kasi)", level="kecamatan", sort_order=3, is_leadership=False),
        MasterOfficialPosition(id="pos-kades", code="KADES", name="Kepala Desa / Lurah", level="desa", sort_order=1, is_leadership=True),
        MasterOfficialPosition(id="pos-sekdes", code="SEKDES", name="Sekretaris Desa / Lurah", level="desa", sort_order=2, is_leadership=False),
    ]
    pot_cats = [
        MasterPotentialCategory(id="cat-pertanian", code="PERTANIAN", name="Pertanian Pangan", default_unit="Ha"),
        MasterPotentialCategory(id="cat-perkebunan", code="PERKEBUNAN", name="Perkebunan", default_unit="Ha"),
        MasterPotentialCategory(id="cat-perikanan", code="PERIKANAN", name="Perikanan & Kelautan", default_unit="Ton/Tahun"),
        MasterPotentialCategory(id="cat-peternakan", code="PETERNAKAN", name="Peternakan Rakyat", default_unit="Ekor"),
        MasterPotentialCategory(id="cat-umkm", code="UMKM", name="UMKM & Perdagangan", default_unit="Unit Usaha"),
    ]
    tour_cats = [
        MasterTourismCategory(id="tcat-bahari", code="BAHARI", name="Wisata Bahari"),
        MasterTourismCategory(id="tcat-alam", code="ALAM", name="Wisata Alam"),
        MasterTourismCategory(id="tcat-eko", code="EKOWISATA", name="Ekowisata"),
        MasterTourismCategory(id="tcat-budaya", code="BUDAYA", name="Wisata Budaya & Sejarah"),
    ]
    rep_types = [
        MasterReportType(id="rt-lppd", code="LPPD-TW", name="Laporan Penyelenggaraan Pemerintahan Desa/Kelurahan"),
        MasterReportType(id="rt-apbdes", code="APBDES-TW", name="Laporan Realisasi Keuangan / APBDes Triwulanan"),
        MasterReportType(id="rt-trantib", code="TRANTIB-TW", name="Laporan Kependudukan & Trantibum"),
        MasterReportType(id="rt-aset", code="PEMB-TW", name="Laporan Pembangunan, Aset Desa & Potensi Wilayah"),
    ]
    periods = [
        ReportPeriod(
            id="per-2026-3",
            code="2026-TW3",
            name="TW III 2026",
            period_year=2026,
            period_quarter=3,
            start_date=date(2026, 7, 1),
            end_date=date(2026, 9, 30),
            deadline_at=datetime(2026, 10, 15, 16, 0, tzinfo=UTC),
            is_open=False,
        ),
        ReportPeriod(
            id="per-2026-4",
            code="2026-TW4",
            name="TW IV 2026",
            period_year=2026,
            period_quarter=4,
            start_date=date(2026, 10, 1),
            end_date=date(2026, 12, 31),
            deadline_at=datetime(2027, 1, 15, 16, 0, tzinfo=UTC),
            is_open=True,
        ),
    ]
    cls_list = [
        MasterLetterClassification(id="cls-140", code="140", name="Pemerintahan Desa / Kelurahan"),
        MasterLetterClassification(id="cls-400", code="400", name="Kesejahteraan Rakyat"),
        MasterLetterClassification(id="cls-500", code="500", name="Perekonomian & UMKM"),
        MasterLetterClassification(id="cls-800", code="800", name="Kepegawaian & Perangkat"),
    ]
    srv_types = [
        MasterServiceType(
            id="srv-nikah",
            code="SIP-NKH",
            name="Rekomendasi / Dispensasi Nikah",
            description="Surat pengantar dan rekomendasi nikah ke KUA Kecamatan.",
            sla_days=2,
            letter_classification_id="cls-400",
            requirements=[
                {"code": "pengantar_desa", "label": "Surat Pengantar Nikah (N1–N4) dari Desa/Kelurahan", "required": True},
                {"code": "ktp_kk", "label": "Fotokopi KTP-el & Kartu Keluarga Calon Mempelai", "required": True},
            ],
        ),
        MasterServiceType(
            id="srv-iumk",
            code="SIP-IUMK",
            name="Rekomendasi Izin Usaha Mikro & Kecil (IUMK)",
            description="Surat keterangan dan rekomendasi izin usaha mikro/kecil.",
            sla_days=3,
            letter_classification_id="cls-500",
            requirements=[
                {"code": "pengantar_desa", "label": "Surat Keterangan Usaha dari Kepala Desa / Lurah", "required": True},
                {"code": "ktp_kk", "label": "Fotokopi KTP-el & Kartu Keluarga Pemohon", "required": True},
            ],
        ),
        MasterServiceType(
            id="srv-kependudukan",
            code="SIP-ADK",
            name="Pengantar Administrasi Kependudukan & Pertanahan",
            description="Rekomendasi pindah datang, SKTM khusus, & register ahli waris.",
            sla_days=3,
            letter_classification_id="cls-140",
            requirements=[
                {"code": "pengantar_desa", "label": "Surat Pengantar Resmi dari Desa/Kelurahan", "required": True},
                {"code": "ktp_kk", "label": "Fotokopi KTP-el & Kartu Keluarga Pemohon", "required": True},
            ],
        ),
    ]
    db.add_all(positions + pot_cats + tour_cats + rep_types + periods + cls_list + srv_types)
    await db.flush()

    # 5. Initial 6 Users (password: demo1234)
    pw_hash = hash_password("demo1234")
    users = [
        User(id="770e8400-e29b-41d4-a716-446655440001", username="superadmin", full_name="Admin Kabupaten Konsel", email="superadmin@konaweselatankab.go.id", password_hash=pw_hash, role_code="superadmin_kab", district_id=None, village_id=None, avatar_url="/img/logo-konsel.webp"),
        User(id="770e8400-e29b-41d4-a716-446655440002", username="admin_laeya", full_name="Admin Kecamatan Laeya", email="admin.laeya@konaweselatankab.go.id", password_hash=pw_hash, role_code="admin_kecamatan", district_id=DISTRICT_LAEYA_ID, village_id=None, avatar_url="/img/logo-konsel.webp"),
        User(id="770e8400-e29b-41d4-a716-446655440003", username="camat_laeya", full_name="Ansar", email="camat.laeya@konaweselatankab.go.id", nip="197805142005011008", password_hash=pw_hash, role_code="camat_sekcam", district_id=DISTRICT_LAEYA_ID, village_id=None, avatar_url="/img/camat-laeya.webp"),
        User(id="770e8400-e29b-41d4-a716-446655440004", username="kasi_laeya", full_name="Kasi Pelayanan Kec. Laeya", email="pelayanan.laeya@konaweselatankab.go.id", password_hash=pw_hash, role_code="kasi_pelayanan", district_id=DISTRICT_LAEYA_ID, village_id=None),
        User(id="770e8400-e29b-41d4-a716-446655440005", username="op_torobulu", full_name="Operator Desa Torobulu", email="torobulu@laeya.konaweselatankab.go.id", password_hash=pw_hash, role_code="operator_desa", district_id=DISTRICT_LAEYA_ID, village_id=VILLAGE_TOROBULU_ID),
        User(id="770e8400-e29b-41d4-a716-446655440006", username="op_puunggaluku", full_name="Operator Kel. Puunggaluku", email="puunggaluku@laeya.konaweselatankab.go.id", password_hash=pw_hash, role_code="operator_desa", district_id=DISTRICT_LAEYA_ID, village_id=VILLAGE_PUUNGGALUKU_ID),
    ]
    db.add_all(users)
    await db.flush()

    # 6. Initial Operational Data for Kec. Laeya
    now = datetime.now(UTC)
    db.add_all([
        GovernmentOfficial(
            id="off-1",
            district_id=DISTRICT_LAEYA_ID,
            village_id=None,
            position_id="pos-camat",
            full_name="Ansar",
            nip="197805142005011008",
            sk_number="SK.821/104/2024",
            photo_url="/img/camat-laeya.webp",
            welcome_message="Selamat datang di Portal Resmi SIP-PAKADES Kecamatan Laeya, Kabupaten Konawe Selatan.",
            is_active=True,
        ),
        GovernmentOfficial(
            id="off-2",
            district_id=DISTRICT_LAEYA_ID,
            village_id=None,
            position_id="pos-sekcam",
            full_name="Hendra Wijaya, S.Sos",
            sk_number="SK.821/108/2024",
            is_active=True,
        ),
        GovernmentOfficial(
            id="off-3",
            district_id=DISTRICT_LAEYA_ID,
            village_id=VILLAGE_PUUNGGALUKU_ID,
            position_id="pos-kades",
            full_name="Darwis, S.Sos",
            sk_number="SK.141/22/2025",
            is_active=True,
        ),
        GovernmentOfficial(
            id="off-4",
            district_id=DISTRICT_LAEYA_ID,
            village_id=VILLAGE_TOROBULU_ID,
            position_id="pos-kades",
            full_name="H. Syahrir",
            sk_number="SK.141/18/2023",
            is_active=True,
        ),
        RegionalPotential(
            id="pot-1",
            district_id=DISTRICT_LAEYA_ID,
            village_id=VILLAGE_TOROBULU_ID,
            category_id="cat-perikanan",
            title="Perikanan Tangkap & Pelabuhan Penyeberangan Torobulu",
            description="Sentra hasil tangkapan ikan pelagis dan simpul logistik laut Torobulu–Tampo.",
            metric_value=485,
            metric_unit="Ton/Tahun",
            period_year=2026,
        ),
        RegionalPotential(
            id="pot-2",
            district_id=DISTRICT_LAEYA_ID,
            village_id=VILLAGE_PUUNGGALUKU_ID,
            category_id="cat-umkm",
            title="Pasar Sentral & UMKM Olahan Hasil Bumi Puunggaluku",
            description="Pusat perdagangan kecamatan dan pelaku usaha mikro berizin IUMK.",
            metric_value=148,
            metric_unit="Unit Usaha",
            period_year=2026,
        ),
        TouristDestination(
            id="tour-1",
            district_id=DISTRICT_LAEYA_ID,
            village_id=VILLAGE_TOROBULU_ID,
            category_id="tcat-bahari",
            name="Pantai & Kawasan Pesisir Torobulu",
            description="Destinasi pesisir dengan panorama Teluk Tiworo dan kuliner ikan bakar segar.",
            address="Desa Torobulu, Kec. Laeya, Kab. Konawe Selatan",
            facilities=["Area Parkir", "Gazebo Pesisir", "Kuliner Seafood"],
            opening_hours="Setiap Hari, 06.00–19.00 WITA",
            ticket_info="Gratis / Retribusi Parkir Lokal",
            latitude=-4.3556,
            longitude=122.4958,
        ),
        GovernmentAnnouncement(
            id="ann-1",
            district_id=DISTRICT_LAEYA_ID,
            title="Rapat Koordinasi & Evaluasi Pelaporan Triwulan IV Tahun 2026",
            slug="rapat-koordinasi-pelaporan-triwulan-iv-2026",
            category="berita",
            excerpt="Camat Laeya memimpin rapat koordinasi bersama seluruh Kepala Desa dan Lurah.",
            content="Kantor Kecamatan Laeya menggelar rapat koordinasi bersama 15 Kepala Desa dan 2 Lurah terkait ketepatan waktu pelaporan triwulanan.",
            status="terbit",
            published_at=now,
        ),
        GovernmentRegulation(
            id="reg-1",
            district_id=DISTRICT_LAEYA_ID,
            title="Standar Operasional Prosedur (SOP) Pelayanan Administrasi SIP-PAKADES Kecamatan Laeya",
            regulation_number="SK Camat No. 140/12/2026",
            year=2026,
            category="SOP Pelayanan",
            description="Pedoman alur pelayanan, persyaratan berkas, dan target SLA layanan Kecamatan Laeya.",
            status="terbit",
        ),
    ])

    rep1 = QuarterlyReport(
        id="rep-1",
        district_id=DISTRICT_LAEYA_ID,
        village_id=VILLAGE_TOROBULU_ID,
        report_type_id="rt-lppd",
        period_id="per-2026-3",
        title="LPPD Triwulan III 2026 Desa Torobulu",
        status="terverifikasi",
        submission_version=1,
        submitted_at=now - timedelta(days=30),
        verified_by="770e8400-e29b-41d4-a716-446655440003",
        verified_at=now - timedelta(days=28),
        summary_payload={"jumlah_kegiatan": 14, "rapat_bpd": 3},
        created_by="770e8400-e29b-41d4-a716-446655440005",
    )
    rep2 = QuarterlyReport(
        id="rep-2",
        district_id=DISTRICT_LAEYA_ID,
        village_id=VILLAGE_PUUNGGALUKU_ID,
        report_type_id="rt-apbdes",
        period_id="per-2026-4",
        title="Realisasi Keuangan TW IV 2026 Kel. Puunggaluku",
        status="diajukan",
        submission_version=1,
        submitted_at=now - timedelta(days=1),
        summary_payload={"realisasi_persen": 84.5},
        created_by="770e8400-e29b-41d4-a716-446655440006",
    )
    db.add_all([
        rep1,
        rep2,
        ReportStatusHistory(report_id="rep-1", from_status="draf", to_status="terverifikasi", note="Terverifikasi", submission_version=1, changed_by_name="Ansar"),
        ReportStatusHistory(report_id="rep-2", from_status="draf", to_status="diajukan", note="Diajukan", submission_version=1, changed_by_name="Operator Kel. Puunggaluku"),
    ])

    sr1 = ServiceRequest(
        id="sr-1",
        registration_number="SIP-740511-2026-0042",
        district_id=DISTRICT_LAEYA_ID,
        village_id=VILLAGE_PUUNGGALUKU_ID,
        service_type_id="srv-nikah",
        applicant_name="Ahmad Saputra",
        applicant_nik="7405110101980003",
        applicant_phone="085241110001",
        applicant_address="Lingk. II Kel. Puunggaluku",
        village_cover_letter_no="474.2/18/KEL-PGL/XI/2026",
        status="diproses",
        sla_days=2,
        sla_due_at=now + timedelta(days=2),
        notes="Berkas pengantar N1-N4 lengkap",
        created_by="770e8400-e29b-41d4-a716-446655440004",
    )
    db.add_all([
        sr1,
        ServiceStatusHistory(service_request_id="sr-1", status="diterima", note="Berkas diterima", public_note="Permohonan didaftarkan dengan pengantar kelurahan.", changed_by_name="Kasi Pelayanan Kec. Laeya"),
        ServiceStatusHistory(service_request_id="sr-1", status="diproses", note="Naik meja Camat", public_note="Berkas lengkap, sedang proses tanda tangan Camat.", changed_by_name="Kasi Pelayanan Kec. Laeya"),
        IncomingLetter(
            id="in-1",
            district_id=DISTRICT_LAEYA_ID,
            village_id=VILLAGE_TOROBULU_ID,
            classification_id="cls-140",
            agenda_number="AGD-2026-089",
            origin_letter_number="140/21/DES-TRB/XI/2026",
            origin_sender="Pemerintah Desa Torobulu",
            letter_date=date(2026, 11, 20),
            received_date=date(2026, 11, 21),
            subject="Permohonan Pembinaan & Monitoring Bumdes Pesisir",
            urgency="segera",
            disposition_status="didisposisikan",
        ),
        LetterDisposition(
            id="disp-1",
            incoming_letter_id="in-1",
            target_user_id="770e8400-e29b-41d4-a716-446655440004",
            target_user_name="Kasi Pelayanan Kec. Laeya",
            instruction="Jadwalkan kunjungan pembinaan minggu depan.",
            status="didisposisikan",
        ),
        OutgoingLetter(
            id="out-1",
            district_id=DISTRICT_LAEYA_ID,
            village_id=VILLAGE_TOROBULU_ID,
            classification_id="cls-500",
            letter_number="500/041/KEC-LAEYA/XI/2026",
            letter_type="rekomendasi",
            recipient="Hasnah Rahayu (UMKM Torobulu)",
            letter_date=date(2026, 11, 21),
            subject="Surat Rekomendasi Izin Usaha Mikro dan Kecil (IUMK)",
        ),
    ])

    await db.commit()
