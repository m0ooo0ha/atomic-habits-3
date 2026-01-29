import { prisma } from "@/lib/prisma";
import { Badge, Card, SectionTitle } from "@/components/ui";

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day + (day === 0 ? -6 : 1);
  result.setDate(diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

export default async function DashboardPage() {
  const problems = await prisma.problem.findMany({
    orderBy: { totalScore: "desc" },
    take: 3
  });

  const weekStart = startOfWeek(new Date());
  const evidenceCount = await prisma.evidence.count({
    where: { createdAt: { gte: weekStart } }
  });

  return (
    <div className="space-y-8">
      <SectionTitle hint={`عدد الأدلة هذا الأسبوع: ${evidenceCount}`}>أفضل 3 مشاكل</SectionTitle>
      <div className="grid gap-6 md:grid-cols-3">
        {problems.map((problem) => (
          <Card key={problem.id} className="space-y-4">
            <div className="space-y-2">
              <Badge tone="accent">الدرجة {problem.totalScore}</Badge>
              <h3 className="text-lg">{problem.title}</h3>
              <p className="text-sm text-slate-600">{problem.description}</p>
            </div>
            <div className="text-xs text-slate-500">التكرار: {problem.frequencyText}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
