import Link from "next/link";
import { notFound } from "next/navigation";
import { updateProblem } from "@/app/actions";
import { prisma } from "@/lib/prisma";
import { Badge, Card, SectionTitle } from "@/components/ui";

export default async function ProblemDetailPage({ params }: { params: { id: string } }) {
  const problem = await prisma.problem.findUnique({
    where: { id: params.id },
    include: { evidenceLinks: { include: { evidence: true } } }
  });

  if (!problem) notFound();

  const scores = problem.scores as Record<string, number>;

  return (
    <div className="space-y-8">
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent">الدرجة {problem.totalScore}</Badge>
          <Badge>{problem.frequencyText}</Badge>
        </div>
        <h2 className="text-2xl">{problem.title}</h2>
        <p className="text-sm text-slate-600">{problem.description}</p>
        <div className="flex flex-wrap gap-3 text-sm text-slate-600">
          <span>من يتألم: {problem.whoHurts}</span>
          <span>متى: {problem.whenHappens}</span>
          <span>المقياس: {problem.metricOne}</span>
        </div>
        <div className="flex flex-wrap gap-3 text-sm text-slate-600">
          <span>الأثر الزمني: {problem.impactTime ?? "-"}</span>
          <span>الأثر المالي: {problem.impactMoney ?? "-"}</span>
          <span>أثر الإزعاج: {problem.impactPainText}</span>
        </div>
        <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-3">
          <span>Frequency: {scores.frequency ?? "-"}</span>
          <span>Pain: {scores.pain ?? "-"}</span>
          <span>Reach: {scores.reach ?? "-"}</span>
          <span>Payability: {scores.payability ?? "-"}</span>
          <span>Testability: {scores.testability ?? "-"}</span>
          <span>Operability: {scores.operability ?? "-"}</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link className="rounded-full border border-slate-200 px-4 py-2 text-sm" href={`/problems/${problem.id}/study`}>
            دراسة المشكلة
          </Link>
          <Link
            className="rounded-full border border-slate-200 px-4 py-2 text-sm"
            href={`/problems/${problem.id}/experiment`}
          >
            خطة اختبار
          </Link>
        </div>
      </Card>

      <Card>
        <SectionTitle hint="تعديل البطاقة والتقييم">تعديل المشكلة</SectionTitle>
        <form action={updateProblem.bind(null, problem.id)} className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm">
            العنوان
            <input name="title" defaultValue={problem.title} className="rounded-lg border border-slate-200 p-2" />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            من يتألم؟
            <input name="whoHurts" defaultValue={problem.whoHurts} className="rounded-lg border border-slate-200 p-2" />
          </label>
          <label className="flex flex-col gap-2 text-sm md:col-span-2">
            وصف المشكلة
            <textarea
              name="description"
              defaultValue={problem.description}
              className="rounded-lg border border-slate-200 p-2"
              rows={3}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            متى تظهر؟
            <input
              name="whenHappens"
              defaultValue={problem.whenHappens}
              className="rounded-lg border border-slate-200 p-2"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            التكرار
            <input
              name="frequencyText"
              defaultValue={problem.frequencyText}
              className="rounded-lg border border-slate-200 p-2"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            أثر الوقت (دقائق)
            <input
              name="impactTime"
              type="number"
              defaultValue={problem.impactTime ?? undefined}
              className="rounded-lg border border-slate-200 p-2"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            أثر المال
            <input
              name="impactMoney"
              type="number"
              defaultValue={problem.impactMoney ?? undefined}
              className="rounded-lg border border-slate-200 p-2"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm md:col-span-2">
            أثر الإزعاج
            <input
              name="impactPainText"
              defaultValue={problem.impactPainText}
              className="rounded-lg border border-slate-200 p-2"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm md:col-span-2">
            workaround الحالي
            <input
              name="workaround"
              defaultValue={problem.workaround}
              className="rounded-lg border border-slate-200 p-2"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm md:col-span-2">
            مقياس واحد
            <input
              name="metricOne"
              defaultValue={problem.metricOne}
              className="rounded-lg border border-slate-200 p-2"
            />
          </label>
          <div className="md:col-span-2">
            <SectionTitle hint="1-5 لكل محور">التقييم</SectionTitle>
            <div className="grid gap-3 md:grid-cols-3">
              {([
                ["frequency", "Frequency"],
                ["pain", "Pain"],
                ["reach", "Reach"],
                ["payability", "Payability"],
                ["testability", "Testability"],
                ["operability", "Operability"]
              ] as const).map(([key, label]) => (
                <label key={key} className="flex flex-col gap-2 text-sm">
                  {label}
                  <input
                    name={key}
                    type="number"
                    min={1}
                    max={5}
                    defaultValue={scores[key] ?? 3}
                    className="rounded-lg border border-slate-200 p-2"
                  />
                </label>
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <button className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white">حفظ التعديلات</button>
          </div>
        </form>
      </Card>

      <div className="space-y-4">
        <SectionTitle hint={`عدد الأدلة المرتبطة: ${problem.evidenceLinks.length}`}>الأدلة المرتبطة</SectionTitle>
        <div className="grid gap-4">
          {problem.evidenceLinks.map(({ evidence }) => (
            <Card key={evidence.id} className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="accent">{evidence.type}</Badge>
                {(evidence.tags as string[]).map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
              <p className="text-sm text-slate-700">{evidence.text}</p>
              <div className="text-xs text-slate-500">{evidence.createdAt.toLocaleDateString("ar-SA")}</div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
