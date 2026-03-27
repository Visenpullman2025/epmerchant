import Image from "next/image";

type MerchantScaffoldProps = {
  brand: string;
  title: string;
  subtitle: string;
  heroSrc: string;
  heroAlt: string;
  topRight?: React.ReactNode;
  children: React.ReactNode;
};

export default function MerchantScaffold({
  brand,
  title,
  subtitle,
  heroSrc,
  heroAlt,
  topRight,
  children
}: MerchantScaffoldProps) {
  return (
    <main className="app-shell">
      <header className="merchant-topbar">
        <span className="merchant-brand">{brand}</span>
        {topRight ? <div>{topRight}</div> : null}
      </header>
      <section className="merchant-hero">
        <Image alt={heroAlt} height={432} priority src={heroSrc} width={720} />
      </section>
      <section className="apple-card">
        {title ? <h1 className="merchant-page-title">{title}</h1> : null}
        {subtitle ? (
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            {subtitle}
          </p>
        ) : null}
        {children}
      </section>
    </main>
  );
}
