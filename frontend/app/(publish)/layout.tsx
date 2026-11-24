import { SiteHeader } from "./_components/site-header";
import { SiteFooter } from "./_components/site-footer";

export default function PublishLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="site-shell min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
