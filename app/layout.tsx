import "./globals.css";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: "Problem Discovery Factory",
  description: "مصنع اكتشاف المشاكل"
};

const navItems = [
  { href: "/dashboard", label: "لوحة التحكم" },
  { href: "/evidence", label: "صندوق الأدلة" },
  { href: "/problems", label: "بطاقات المشاكل" }
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen font-sans">
        <div className="bg-white border-b border-slate-200">
          <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <div>
              <p className="text-sm text-slate-500">Problem Discovery Factory</p>
              <h1 className="text-xl">مصنع اكتشاف المشاكل</h1>
            </div>
            <nav className="flex items-center gap-4 text-sm">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full border border-slate-200 px-3 py-1 text-slate-600 hover:border-slate-300 hover:text-slate-900"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </header>
        </div>
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
