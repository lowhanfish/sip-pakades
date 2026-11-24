import { SiteHeader } from "@/app/(publish)/_components/site-header";
import { SiteFooter } from "@/app/(publish)/_components/site-footer";

export default function MasyarakatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site-shell min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
