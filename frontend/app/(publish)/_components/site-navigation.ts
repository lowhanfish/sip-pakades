export interface SiteNavLink {
  label: string;
  href: string;
}

export const SITE_NAV_LINKS: SiteNavLink[] = [
  { label: "Beranda", href: "/" },
  { label: "Pemerintahan", href: "/pemerintahan" },
  { label: "Desa & Kelurahan", href: "/desa-kelurahan" },
  { label: "Potensi", href: "/potensi-wilayah" },
  { label: "Wisata", href: "/destinasi-wisata" },
  { label: "Layanan PATEN", href: "/layanan" },
  { label: "Lokasi", href: "/lokasi" },
];
