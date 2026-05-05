import type { ReactNode } from "react";

export default function StatusBox({
  children,
  tone = "info"
}: {
  children: ReactNode;
  tone?: "error" | "info";
}) {
  return (
    <div
      className="rounded-xl border p-4 text-sm"
      style={{
        borderColor: tone === "info" ? "var(--border)" : "var(--danger)",
        color: tone === "info" ? "var(--muted)" : "var(--danger)"
      }}
    >
      {children}
    </div>
  );
}
