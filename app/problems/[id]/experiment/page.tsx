import Link from "next/link";
import { notFound } from "next/navigation";
import { generateExperiment } from "@/app/actions";
import { prisma } from "@/lib/prisma";
import { Card, JsonBlock, SectionTitle } from "@/components/ui";

export default async function ExperimentPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams?: { stealth?: string };
}) {
  const problem = await prisma.problem.findUnique({
    where: { id: params.id },
    include: { experiment: true }
  });

  if (!problem) notFound();

  const stealthMode = searchParams?.stealth === "1";

  const plan = problem.experiment?.plan as
    | {
        wizard_of_oz: string;
        steps_day_by_day: { day: number; task: string }[];
        metrics: { name: string; how?: string; how_to_measure?: string }[];
        stealth_pitch: string;
      }
    | undefined;

  const stealthPlan = plan
    ? {
        ...plan,
        wizard_of_oz: "تنفيذ يدوي خفيف لمراقبة الواقع دون ذكر الحل.",
        steps_day_by_day: plan.steps_day_by_day.map((step) => ({
          ...step,
          task: `قياس الواقع: ${step.task.replace(/حل|منتج|منصة/g, "تحسين التجربة")}`
        })),
        stealth_pitch: plan.stealth_pitch
      }
    : null;

  return (
    <div className="space-y-6">
      <Link className="text-sm text-sky-600" href={`/problems/${problem.id}`}>
        العودة إلى المشكلة
      </Link>

      <Card className="space-y-3">
        <SectionTitle hint="خطة اختبار 7-14 يوم">Experiment Kit</SectionTitle>
        <p className="text-sm text-slate-600">{problem.title}</p>
        <div className="flex flex-wrap gap-2">
          <form action={generateExperiment.bind(null, problem.id)}>
            <button className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white">توليد خطة الاختبار</button>
          </form>
          <Link
            className="rounded-full border border-slate-200 px-4 py-2 text-sm"
            href={`/problems/${problem.id}/experiment?stealth=${stealthMode ? "0" : "1"}`}
          >
            {stealthMode ? "إيقاف Stealth Mode" : "تشغيل Stealth Mode"}
          </Link>
        </div>
      </Card>

      {problem.experiment ? (
        <Card className="space-y-4">
          <SectionTitle hint={stealthMode ? "نص العرض بدون كشف الحل" : "النص الكامل"}>
            محتوى الخطة (JSON)
          </SectionTitle>
          <JsonBlock data={stealthMode ? stealthPlan : problem.experiment.plan} />
          <p className="text-sm text-slate-600">نص العرض: {problem.experiment.pitchText}</p>
          {stealthMode ? (
            <p className="text-sm text-slate-600">
              Stealth Mode: استخدم صياغة قياس الواقع وتحسين التجربة بدون ذكر تفاصيل الحل.
            </p>
          ) : null}
        </Card>
      ) : (
        <Card>
          <p className="text-sm text-slate-600">لا توجد خطة بعد. اضغط توليد خطة الاختبار.</p>
        </Card>
      )}
    </div>
  );
}
