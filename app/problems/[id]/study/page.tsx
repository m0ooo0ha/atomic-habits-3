import Link from "next/link";
import { notFound } from "next/navigation";
import { generateStudyPack } from "@/app/actions";
import { prisma } from "@/lib/prisma";
import { Card, JsonBlock, SectionTitle } from "@/components/ui";

export default async function StudyPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams?: { stealth?: string };
}) {
  const problem = await prisma.problem.findUnique({
    where: { id: params.id },
    include: { studyPack: true }
  });

  if (!problem) notFound();

  const stealthMode = searchParams?.stealth === "1";

  const studyContent = problem.studyPack?.content as
    | {
        root_causes: { hypothesis: string; why: string }[];
        current_alternatives: string[];
        why_not_solved: string[];
        pay_signals: string[];
        interview_questions: string[];
        risks: string[];
      }
    | undefined;

  const stealthContent = studyContent
    ? {
        ...studyContent,
        root_causes: studyContent.root_causes.map((item) => ({
          hypothesis: "فرضية قياس الواقع",
          why: item.why
        })),
        interview_questions: studyContent.interview_questions.map(
          (question) => `سؤال واقع: ${question.replace(/حل|منتج|منصة/g, "تحسين التجربة")}`
        ),
        why_not_solved: studyContent.why_not_solved.map(
          (item) => `نقطة قياس: ${item.replace(/حل|منتج|منصة/g, "تجربة")}`
        )
      }
    : null;

  return (
    <div className="space-y-6">
      <Link className="text-sm text-sky-600" href={`/problems/${problem.id}`}>
        العودة إلى المشكلة
      </Link>

      <Card className="space-y-3">
        <SectionTitle hint="مولّد الدراسة السريعة">Study Pack</SectionTitle>
        <p className="text-sm text-slate-600">{problem.title}</p>
        <div className="flex flex-wrap gap-2">
          <form action={generateStudyPack.bind(null, problem.id)}>
            <button className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white">توليد الدراسة</button>
          </form>
          <Link
            className="rounded-full border border-slate-200 px-4 py-2 text-sm"
            href={`/problems/${problem.id}/study?stealth=${stealthMode ? "0" : "1"}`}
          >
            {stealthMode ? "إيقاف Stealth Mode" : "تشغيل Stealth Mode"}
          </Link>
        </div>
      </Card>

      {problem.studyPack ? (
        <Card className="space-y-4">
          <SectionTitle hint={stealthMode ? "النصوص بصياغة قياس الواقع" : "النص الكامل"}>
            محتوى الدراسة (JSON)
          </SectionTitle>
          <JsonBlock data={stealthMode ? stealthContent : problem.studyPack.content} />
          {stealthMode ? (
            <p className="text-sm text-slate-600">
              Stealth Mode: ركّز على قياس الواقع وتحسين التجربة دون ذكر الحل بشكل مباشر.
            </p>
          ) : null}
        </Card>
      ) : (
        <Card>
          <p className="text-sm text-slate-600">لا توجد دراسة بعد. اضغط توليد الدراسة.</p>
        </Card>
      )}
    </div>
  );
}
