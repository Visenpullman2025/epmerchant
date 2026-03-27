import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "易派商家版",
  description: "易派商家版 Stage 2"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
