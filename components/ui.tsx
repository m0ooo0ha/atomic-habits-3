import type { ReactNode } from "react";
import clsx from "clsx";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx("rounded-2xl border border-slate-200 bg-white p-6 shadow-sm", className)}>
      {children}
    </div>
  );
}

export function Badge({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "accent" }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        tone === "accent" ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-700"
      )}
    >
      {children}
    </span>
  );
}

export function SectionTitle({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-lg">{children}</h2>
      {hint ? <p className="text-sm text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function JsonBlock({ data }: { data: unknown }) {
  return (
    <pre className="max-h-96 overflow-auto rounded-xl bg-slate-900 p-4 text-left text-sm text-slate-100">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
