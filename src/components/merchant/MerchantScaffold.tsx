import Image from "next/image";

type MerchantScaffoldProps = {
  brand: string;
  title: string;
  subtitle: string;
  heroSrc: string;
  heroAlt: string;
  topRight?: React.ReactNode;
  /** 渲染在主内容卡之外（如固定底栏），避免与 `.apple-card` 同层滚动 */
  footer?: React.ReactNode;
  children: React.ReactNode;
};

export default function MerchantScaffold({
  brand,
  title,
  subtitle,
  heroSrc,
  heroAlt,
  topRight,
  footer,
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
      {footer ? footer : null}
    </main>
  );
}
