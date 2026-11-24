/** Fallback photo lookup for dummy data (real photos in /public/img, see CREDITS.md). */
export function getTourismImage(name: string, category: string = ""): string {
  const s = `${name} ${category}`.toLowerCase();
  if (s.includes("torobulu") || s.includes("pantai") || s.includes("bahari")) return "/img/wisata-torobulu.webp";
  if (s.includes("air terjun") || s.includes("curug")) return "/img/wisata-air-terjun.webp";
  if (s.includes("mangrove") || s.includes("bakau") || s.includes("pesisir")) return "/img/wisata-mangrove.webp";
  return "/img/wisata-torobulu.webp";
}

export function getPotentialImage(title: string, category: string = ""): string {
  const s = `${title} ${category}`.toLowerCase();
  if (s.includes("ternak") || s.includes("sapi") || s.includes("peternakan")) return "/img/potensi-peternakan.webp";
  if (s.includes("umkm") || s.includes("pasar") || s.includes("dagang") || s.includes("usaha")) return "/img/potensi-umkm.webp";
  if (s.includes("ikan") || s.includes("laut") || s.includes("perikanan") || s.includes("tambak")) return "/img/potensi-perikanan.webp";
  if (s.includes("kebun") || s.includes("kakao") || s.includes("mete") || s.includes("kopi") || s.includes("lada") || s.includes("kelapa")) return "/img/potensi-perkebunan.webp";
  return "/img/potensi-pertanian.webp";
}
