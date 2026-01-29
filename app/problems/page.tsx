import Link from "next/link";
import { createProblemFromForm, suggestProblemsFromEvidence } from "@/app/actions";
import { prisma } from "@/lib/prisma";
import { Badge, Card, SectionTitle } from "@/components/ui";

export default async function ProblemsPage() {
  const problems = await prisma.problem.findMany({ orderBy: { totalScore: "desc" } });

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card>
          <SectionTitle hint="تحويل الأدلة إلى بطاقات">اقترح مشاكل من الأدلة</SectionTitle>
          <form action={suggestProblemsFromEvidence}>
            <button className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white">
              اقترح مشاكل من الأدلة
            </button>
          </form>
        </Card>
        <Card>
          <SectionTitle hint="إضافة مشكلة يدويًا">مشكلة جديدة</SectionTitle>
          <form action={createProblemFromForm} className="space-y-3 text-sm">
            <input
              name="title"
              placeholder="عنوان المشكلة"
              className="w-full rounded-lg border border-slate-200 p-2"
              required
            />
            <textarea
              name="description"
              placeholder="وصف المشكلة"
              className="w-full rounded-lg border border-slate-200 p-2"
              rows={3}
              required
            />
            <input
              name="whoHurts"
              placeholder="من يتألم؟ (customer/employee/owner/all)"
              className="w-full rounded-lg border border-slate-200 p-2"
            />
            <input
              name="whenHappens"
              placeholder="متى تظهر؟"
              className="w-full rounded-lg border border-slate-200 p-2"
            />
            <input
              name="frequencyText"
              placeholder="التكرار"
              className="w-full rounded-lg border border-slate-200 p-2"
            />
            <input
              name="workaround"
              placeholder="workaround الحالي"
              className="w-full rounded-lg border border-slate-200 p-2"
            />
            <input
              name="metricOne"
              placeholder="مقياس واحد"
              className="w-full rounded-lg border border-slate-200 p-2"
            />
            <button className="rounded-full border border-slate-200 px-4 py-2 text-sm">
              حفظ المشكلة
            </button>
          </form>
        </Card>
      </div>

      <div className="space-y-4">
        <SectionTitle hint={`إجمالي المشاكل: ${problems.length}`}>قائمة المشاكل</SectionTitle>
        <div className="grid gap-4">
          {problems.map((problem) => (
            <Card key={problem.id} className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="accent">الدرجة {problem.totalScore}</Badge>
                <Badge>{problem.frequencyText}</Badge>
              </div>
              <h3 className="text-lg">{problem.title}</h3>
              <p className="text-sm text-slate-600">{problem.description}</p>
              <Link className="text-sm text-sky-600" href={`/problems/${problem.id}`}>
                عرض التفاصيل
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
