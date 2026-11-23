import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Building2, MapPin } from "lucide-react";

export default function PublishHomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-3xl w-full glass-panel rounded-3xl p-8 md:p-12 text-center space-y-6">
        <div className="flex justify-center">
          <Image
            src="/img/logo-konsel.webp"
            alt="Logo Kabupaten Konawe Selatan"
            width={88}
            height={102}
            priority
            className="drop-shadow-md"
          />
        </div>

        <span className="inline-flex items-center gap-2 rounded-full bg-yellow-100/90 border border-yellow-300/70 px-4 py-1.5 text-xs font-semibold text-slate-800">
          <MapPin className="w-3.5 h-3.5 text-sky-600" />
          Kabupaten Konawe Selatan • Pilot: Kecamatan Laeya
        </span>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
          SIP-PAKADES
        </h1>
        <p className="text-slate-600 max-w-xl mx-auto leading-relaxed">
          Sistem Informasi Pemerintahan & Pelayanan Administrasi Kecamatan dan Desa.
          Fondasi Frontend Tahap 1 telah aktif — Portal Publik lengkap akan dibangun pada Tahap 2.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold px-6 py-3 shadow-md shadow-sky-500/20 transition"
          >
            <ShieldCheck className="w-4 h-4" />
            Login Petugas
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/admin/master/kecamatan"
            className="inline-flex items-center gap-2 rounded-xl bg-yellow-300/90 hover:bg-yellow-300 text-slate-900 font-semibold px-6 py-3 transition"
          >
            <Building2 className="w-4 h-4" />
            Buka Master Wilayah
          </Link>
        </div>
      </div>
    </main>
  );
}
