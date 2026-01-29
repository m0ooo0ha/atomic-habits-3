import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-8">
        <h2 className="text-2xl">مرحبًا بك في مصنع اكتشاف المشاكل</h2>
        <p className="mt-2 text-slate-600">
          ابدأ بجمع الأدلة، ثم حوّلها إلى بطاقات مشكلة، وادرسها واختبرها خلال 7-14 يومًا.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/evidence"
            className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white"
          >
            إضافة دليل
          </Link>
          <Link
            href="/problems"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700"
          >
            استعراض المشاكل
          </Link>
        </div>
      </div>
    </div>
  );
}
