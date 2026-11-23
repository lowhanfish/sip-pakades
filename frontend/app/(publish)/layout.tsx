import { SiteHeader } from "./_components/site-header";
import { SiteFooter } from "./_components/site-footer";
import { ClayBackground } from "@/components/ui/ClayBackground";

export default function PublishLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <ClayBackground />
      <SiteHeader />
      <main className="flex-1 relative z-10">{children}</main>
      <SiteFooter />
    </div>
  );
}
