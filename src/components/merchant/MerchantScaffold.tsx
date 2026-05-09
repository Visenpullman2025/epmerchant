import type { ReactNode } from "react";

type MerchantScaffoldProps = {
  title?: string;
  titleAction?: ReactNode;
  surface?: boolean;
  footer?: ReactNode;
  children: ReactNode;
};

export default function MerchantScaffold({
  title,
  titleAction,
  surface = true,
  footer,
  children
}: MerchantScaffoldProps) {
  const content = (
    <>
      {title ? (
        <div className="merchant-page-header">
          <h1 className="merchant-page-title">{title}</h1>
          {titleAction ? <div className="merchant-page-header-action">{titleAction}</div> : null}
        </div>
      ) : null}
      {children}
    </>
  );

  return (
    <main className="app-shell">
      {surface ? <section className="apple-card">{content}</section> : content}
      {footer ? footer : null}
    </main>
  );
}
