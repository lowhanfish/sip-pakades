import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SIP-PAKADES | Sistem Informasi Kecamatan & Desa Kab. Konawe Selatan",
  description:
    "Portal Penyelenggaraan Pemerintahan, Pelayanan Administrasi Terpadu Kecamatan (PATEN), dan Pelaporan Desa/Kelurahan Kabupaten Konawe Selatan.",
  icons: {
    icon: "/img/logo-konsel.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={plusJakarta.variable}>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
