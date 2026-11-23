import { DistrictItem, MenuItem, UserProfile, VillageItem } from "@/types/global";

const NOW = "2026-11-23T08:00:00Z";

export const DISTRICT_LAEYA_ID = "550e8400-e29b-41d4-a716-446655440011";
export const VILLAGE_PUUNGGALUKU_ID = "660e8400-e29b-41d4-a716-446655440002";
export const VILLAGE_TOROBULU_ID = "660e8400-e29b-41d4-a716-446655440016";

const RAW_DISTRICTS: Array<{
  id?: string;
  code: string;
  name: string;
  slug: string;
  office_address: string;
  lat: number;
  lng: number;
  is_default?: boolean;
}> = [
  { code: "740501", name: "Tinanggea", slug: "tinanggea", office_address: "Kel. Tinanggea, Kec. Tinanggea", lat: -4.4622, lng: 122.2481 },
  { code: "740502", name: "Angata", slug: "angata", office_address: "Desa Motaha, Kec. Angata", lat: -4.1628, lng: 122.1422 },
  { code: "740503", name: "Andoolo", slug: "andoolo", office_address: "Kel. Potoro, Kec. Andoolo", lat: -4.3167, lng: 122.2833 },
  { code: "740504", name: "Palangga", slug: "palangga", office_address: "Kel. Palangga, Kec. Palangga", lat: -4.3461, lng: 122.3694 },
  { code: "740505", name: "Landono", slug: "landono", office_address: "Kel. Landono, Kec. Landono", lat: -4.0833, lng: 122.2667 },
  { code: "740506", name: "Lainea", slug: "lainea", office_address: "Desa Lainea, Kec. Lainea", lat: -4.3667, lng: 122.5833 },
  { code: "740507", name: "Konda", slug: "konda", office_address: "Kel. Konda, Kec. Konda", lat: -4.0894, lng: 122.4956 },
  { code: "740508", name: "Ranomeeto", slug: "ranomeeto", office_address: "Kel. Ranomeeto, Kec. Ranomeeto", lat: -4.0417, lng: 122.4417 },
  { code: "740509", name: "Kolono", slug: "kolono", office_address: "Kel. Kolono, Kec. Kolono", lat: -4.3458, lng: 122.7167 },
  { code: "740510", name: "Moramo", slug: "moramo", office_address: "Kel. Lapuko, Kec. Moramo", lat: -4.1667, lng: 122.6833 },
  {
    id: DISTRICT_LAEYA_ID,
    code: "740511",
    name: "Laeya",
    slug: "laeya",
    office_address: "Jl. Poros Kendari - Andoolo, Kel. Puunggaluku, Kec. Laeya, Kab. Konawe Selatan",
    lat: -4.2738,
    lng: 122.4664,
    is_default: true,
  },
  { code: "740512", name: "Lalembuu", slug: "lalembuu", office_address: "Kel. Atari Indah, Kec. Lalembuu", lat: -4.4167, lng: 122.15 },
  { code: "740513", name: "Benua", slug: "benua", office_address: "Desa Horodopi, Kec. Benua", lat: -4.2167, lng: 122.1167 },
  { code: "740514", name: "Palangga Selatan", slug: "palangga-selatan", office_address: "Desa Lakara, Kec. Palangga Selatan", lat: -4.4667, lng: 122.3833 },
  { code: "740515", name: "Mowila", slug: "mowila", office_address: "Desa Mowila, Kec. Mowila", lat: -4.05, lng: 122.2167 },
  { code: "740516", name: "Moramo Utara", slug: "moramo-utara", office_address: "Kel. Lalowaru, Kec. Moramo Utara", lat: -4.0833, lng: 122.6667 },
  { code: "740517", name: "Buke", slug: "buke", office_address: "Desa Buke, Kec. Buke", lat: -4.3, lng: 122.3667 },
  { code: "740518", name: "Wolasi", slug: "wolasi", office_address: "Desa Wolasi, Kec. Wolasi", lat: -4.1667, lng: 122.45 },
  { code: "740519", name: "Laonti", slug: "laonti", office_address: "Desa Ulusawa, Kec. Laonti", lat: -4.4333, lng: 122.85 },
  { code: "740520", name: "Baito", slug: "baito", office_address: "Desa Baito, Kec. Baito", lat: -4.25, lng: 122.3167 },
  { code: "740521", name: "Basala", slug: "basala", office_address: "Desa Basala, Kec. Basala", lat: -4.2833, lng: 122.0833 },
  { code: "740522", name: "Ranomeeto Barat", slug: "ranomeeto-barat", office_address: "Desa Lameuru, Kec. Ranomeeto Barat", lat: -4.0333, lng: 122.3667 },
  { code: "740523", name: "Kolono Timur", slug: "kolono-timur", office_address: "Desa Tumbu-Tumbu Jaya, Kec. Kolono Timur", lat: -4.3667, lng: 122.7833 },
  { code: "740524", name: "Sabulakoa", slug: "sabulakoa", office_address: "Desa Sabulakoa, Kec. Sabulakoa", lat: -4.1167, lng: 122.3333 },
  { code: "740525", name: "Andoolo Barat", slug: "andoolo-barat", office_address: "Desa Anese, Kec. Andoolo Barat", lat: -4.3333, lng: 122.2167 },
];

export const INITIAL_DISTRICTS: DistrictItem[] = RAW_DISTRICTS.map((d, idx) => ({
  id: d.id ?? `550e8400-e29b-41d4-a716-4466554400${String(idx + 1).padStart(2, "0")}`,
  code: d.code,
  name: d.name,
  slug: d.slug,
  office_address: d.office_address,
  phone: d.is_default ? "(0401) 319xxxx" : null,
  email: d.is_default ? "kec.laeya@konaweselatankab.go.id" : `kec.${d.slug}@konaweselatankab.go.id`,
  service_hours: "Senin–Jumat, 08.00–16.00 WITA",
  vision: d.is_default
    ? "Terwujudnya Pelayanan Publik Kecamatan Laeya yang Prima, Transparan, dan Berdaya Saing Menuju Konawe Selatan Setara."
    : `Mewujudkan tata kelola pemerintahan dan pelayanan masyarakat Kecamatan ${d.name} yang profesional dan akuntabel.`,
  mission: d.is_default
    ? "1. Meningkatkan kualitas pelayanan administrasi kecamatan (SIP-PAKADES).\n2. Memperkuat koordinasi pembinaan penyelenggaraan pemerintahan 17 desa/kelurahan.\n3. Mendorong pengembangan potensi wilayah pertanian, pesisir, dan pariwisata lokal."
    : `Meningkatkan pelayanan administrasi terpadu dan pembinaan desa/kelurahan di Kecamatan ${d.name}.`,
  latitude: d.lat,
  longitude: d.lng,
  is_active: true,
  is_default: Boolean(d.is_default),
  village_count: d.is_default ? 17 : 0,
  created_by: "system-seed",
  updated_by: "system-seed",
  created_at: NOW,
  updated_at: NOW,
}));

const RAW_LAEYA_VILLAGES: Array<{
  id?: string;
  code: string;
  name: string;
  type: "desa" | "kelurahan";
  area: number;
  pop: number;
  kk: number;
  lat: number;
  lng: number;
  desc: string;
}> = [
  { code: "7405111001", name: "Ambalodangge", type: "kelurahan", area: 8.4, pop: 1620, kk: 430, lat: -4.258, lng: 122.455, desc: "Kelurahan di wilayah utara Kecamatan Laeya dengan potensi perdagangan dan pertanian." },
  { id: VILLAGE_PUUNGGALUKU_ID, code: "7405111002", name: "Puunggaluku", type: "kelurahan", area: 11.2, pop: 2890, kk: 760, lat: -4.2738, lng: 122.4664, desc: "Ibu kota Kecamatan Laeya sekaligus pusat pemerintahan dan layanan SIP-PAKADES." },
  { code: "7405112003", name: "Aepodu", type: "desa", area: 9.8, pop: 1140, kk: 305, lat: -4.245, lng: 122.478, desc: "Desa agraris dengan komoditas utama padi sawah dan hortikultura." },
  { code: "7405112004", name: "Ambakumina", type: "desa", area: 10.5, pop: 980, kk: 260, lat: -4.289, lng: 122.435, desc: "Desa dengan potensi perkebunan kakao, lada, dan peternakan rakyat." },
  { code: "7405112005", name: "Ambesea", type: "desa", area: 12.1, pop: 1320, kk: 350, lat: -4.262, lng: 122.492, desc: "Desa berkembang dengan sektor pertanian terpadu dan UMKM olahan pangan." },
  { code: "7405112006", name: "Anduna", type: "desa", area: 14.3, pop: 1210, kk: 320, lat: -4.301, lng: 122.448, desc: "Desa dengan bentang alam perbukitan dan perkebunan kelapa dalam." },
  { code: "7405112007", name: "Anggoroboti", type: "desa", area: 9.2, pop: 870, kk: 235, lat: -4.249, lng: 122.441, desc: "Desa produktif pada sektor palawija dan perkebunan rakyat." },
  { code: "7405112008", name: "Labokeo", type: "desa", area: 13.7, pop: 1480, kk: 390, lat: -4.315, lng: 122.489, desc: "Desa di jalur selatan Laeya dengan potensi perikanan darat dan perkebunan." },
  { code: "7405112009", name: "Laeya", type: "desa", area: 15.0, pop: 1590, kk: 415, lat: -4.283, lng: 122.472, desc: "Desa sejarah asal nama Kecamatan Laeya dengan potensi pertanian dan budaya lokal." },
  { code: "7405112010", name: "Lambakara", type: "desa", area: 11.6, pop: 1050, kk: 280, lat: -4.294, lng: 122.502, desc: "Desa dengan potensi perikanan tambak dan kebun kelapa." },
  { code: "7405112011", name: "Lamong Jaya", type: "desa", area: 10.9, pop: 1370, kk: 365, lat: -4.268, lng: 122.449, desc: "Desa maju dengan sentra peternakan sapi dan pertanian hortikultura." },
  { code: "7405112012", name: "Lerepako", type: "desa", area: 16.4, pop: 1430, kk: 378, lat: -4.328, lng: 122.462, desc: "Desa pesisir dan perbukitan dengan potensi wisata alam serta perikanan." },
  { code: "7405112013", name: "Ombu-Ombu Jaya", type: "desa", area: 12.8, pop: 1180, kk: 312, lat: -4.279, lng: 122.428, desc: "Desa dengan potensi perkebunan jambu mete, kakao, dan UMKM lokal." },
  { code: "7405112014", name: "Puuwulo", type: "desa", area: 11.0, pop: 960, kk: 254, lat: -4.254, lng: 122.509, desc: "Desa dengan sumber daya air bersih alami dan pertanian pangan." },
  { code: "7405112015", name: "Rambu-Rambu", type: "desa", area: 13.5, pop: 1120, kk: 298, lat: -4.307, lng: 122.477, desc: "Desa dengan potensi perkebunan dan kerajinan masyarakat." },
  { id: VILLAGE_TOROBULU_ID, code: "7405112016", name: "Torobulu", type: "desa", area: 18.2, pop: 2450, kk: 640, lat: -4.3556, lng: 122.4958, desc: "Desa pelabuhan strategis penyeberangan Torobulu–Tampo dengan potensi kelautan, perikanan, dan wisata bahari." },
  { code: "7405112017", name: "Wonua Kongga", type: "desa", area: 14.1, pop: 1260, kk: 334, lat: -4.291, lng: 122.456, desc: "Desa agraris dengan sektor unggulan padi, jagung, dan peternakan." },
];

export const INITIAL_VILLAGES: VillageItem[] = RAW_LAEYA_VILLAGES.map((v, idx) => ({
  id: v.id ?? `660e8400-e29b-41d4-a716-4466554400${String(idx + 1).padStart(2, "0")}`,
  district_id: DISTRICT_LAEYA_ID,
  district_name: "Laeya",
  code: v.code,
  name: v.name,
  slug: v.name.toLowerCase().replace(/\s+/g, "-"),
  type: v.type,
  description: v.desc,
  history: `${v.type === "kelurahan" ? "Kelurahan" : "Desa"} ${v.name} merupakan bagian dari wilayah administratif Kecamatan Laeya, Kabupaten Konawe Selatan.`,
  boundaries: {
    north: "Wilayah Kecamatan Laeya",
    south: "Wilayah Kecamatan Laeya / Teluk Tiworo",
    east: "Wilayah Kecamatan Laeya",
    west: "Wilayah Kecamatan Laeya",
  },
  area_km2: v.area,
  dusun_count: v.type === "kelurahan" ? 4 : 3,
  rw_count: 6,
  rt_count: 14,
  population_total: v.pop,
  household_total: v.kk,
  latitude: v.lat,
  longitude: v.lng,
  is_active: true,
  created_by: "system-seed",
  updated_by: "system-seed",
  created_at: NOW,
  updated_at: NOW,
}));

export const MOCK_USERS: UserProfile[] = [
  {
    id: "770e8400-e29b-41d4-a716-446655440001",
    username: "superadmin",
    full_name: "Admin Kabupaten Konsel",
    email: "superadmin@konaweselatankab.go.id",
    phone: "08114000001",
    nip: "198501012010011001",
    role: "superadmin_kab",
    role_label: "Superadmin Kab. / Sistem",
    district_id: null,
    district_name: null,
    village_id: null,
    village_name: null,
    avatar_url: "/img/logo-konsel.webp",
    is_active: true,
    last_login_at: NOW,
    created_at: NOW,
  },
  {
    id: "770e8400-e29b-41d4-a716-446655440002",
    username: "admin_laeya",
    full_name: "Admin Kecamatan Laeya",
    email: "admin.laeya@konaweselatankab.go.id",
    phone: "08114000002",
    nip: "198703122012011004",
    role: "admin_kecamatan",
    role_label: "Admin Kecamatan",
    district_id: DISTRICT_LAEYA_ID,
    district_name: "Laeya",
    village_id: null,
    village_name: null,
    avatar_url: "/img/logo-konsel.webp",
    is_active: true,
    last_login_at: NOW,
    created_at: NOW,
  },
  {
    id: "770e8400-e29b-41d4-a716-446655440003",
    username: "camat_laeya",
    full_name: "Ansar",
    email: "camat.laeya@konaweselatankab.go.id",
    phone: "08114000003",
    nip: "197805142005011008",
    role: "camat_sekcam",
    role_label: "Camat / Sekcam",
    district_id: DISTRICT_LAEYA_ID,
    district_name: "Laeya",
    village_id: null,
    village_name: null,
    avatar_url: "/img/camat-laeya.webp",
    is_active: true,
    last_login_at: NOW,
    created_at: NOW,
  },
  {
    id: "770e8400-e29b-41d4-a716-446655440004",
    username: "kasi_laeya",
    full_name: "Kasi Pelayanan Kec. Laeya",
    email: "paten.laeya@konaweselatankab.go.id",
    phone: "08114000004",
    nip: "198908202014022003",
    role: "kasi_pelayanan",
    role_label: "Kasi / Petugas Layanan",
    district_id: DISTRICT_LAEYA_ID,
    district_name: "Laeya",
    village_id: null,
    village_name: null,
    avatar_url: null,
    is_active: true,
    last_login_at: NOW,
    created_at: NOW,
  },
  {
    id: "770e8400-e29b-41d4-a716-446655440005",
    username: "op_torobulu",
    full_name: "Operator Desa Torobulu",
    email: "torobulu@laeya.konaweselatankab.go.id",
    phone: "08114000005",
    nip: null,
    role: "operator_desa",
    role_label: "Operator Desa/Kelurahan",
    district_id: DISTRICT_LAEYA_ID,
    district_name: "Laeya",
    village_id: VILLAGE_TOROBULU_ID,
    village_name: "Torobulu",
    avatar_url: null,
    is_active: true,
    last_login_at: NOW,
    created_at: NOW,
  },
  {
    id: "770e8400-e29b-41d4-a716-446655440006",
    username: "op_puunggaluku",
    full_name: "Operator Kel. Puunggaluku",
    email: "puunggaluku@laeya.konaweselatankab.go.id",
    phone: "08114000006",
    nip: null,
    role: "operator_desa",
    role_label: "Operator Desa/Kelurahan",
    district_id: DISTRICT_LAEYA_ID,
    district_name: "Laeya",
    village_id: VILLAGE_PUUNGGALUKU_ID,
    village_name: "Puunggaluku",
    avatar_url: null,
    is_active: true,
    last_login_at: NOW,
    created_at: NOW,
  },
];

export const BASE_ADMIN_MENUS: MenuItem[] = [
  { code: "dashboard", label: "Dashboard", path: "/admin", icon: "layout-dashboard" },
  {
    code: "master",
    label: "Data Master",
    path: "/admin/master/kecamatan",
    icon: "database",
    children: [
      { code: "master-kecamatan", label: "Master Kecamatan", path: "/admin/master/kecamatan", icon: "map-pin" },
      { code: "master-desa", label: "Master Desa/Kelurahan", path: "/admin/master/desa", icon: "building-2" },
    ],
  },
];
