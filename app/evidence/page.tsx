import { createEvidence } from "@/app/actions";
import { prisma } from "@/lib/prisma";
import { Badge, Card, SectionTitle } from "@/components/ui";

const TAGS = ["انتظار", "تعقيد", "فوضى", "أخطاء", "هدر", "تجربة سيئة", "أخرى"];

export default async function EvidencePage() {
  const evidenceList = await prisma.evidence.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-8">
      <Card>
        <SectionTitle hint="إضافة دليل جديد">إضافة دليل</SectionTitle>
        <form action={createEvidence} className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm">
            نوع الدليل
            <select name="type" className="rounded-lg border border-slate-200 p-2">
              <option value="ملاحظة ميدانية">ملاحظة ميدانية</option>
              <option value="شكوى/تقييم">شكوى/تقييم</option>
              <option value="قياس وقت/خطوات">قياس وقت/خطوات</option>
              <option value="workaround/ترقيع">workaround/ترقيع</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm md:col-span-2">
            نص الدليل
            <textarea name="text" rows={3} className="rounded-lg border border-slate-200 p-2" required />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            رابط (اختياري)
            <input name="url" type="url" className="rounded-lg border border-slate-200 p-2" />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            مكان (اختياري)
            <input name="place" className="rounded-lg border border-slate-200 p-2" />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            دقائق (اختياري)
            <input name="minutes" type="number" className="rounded-lg border border-slate-200 p-2" />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            خطوات (اختياري)
            <input name="steps" type="number" className="rounded-lg border border-slate-200 p-2" />
          </label>
          <label className="flex flex-col gap-2 text-sm md:col-span-2">
            رابط مرفق (اختياري)
            <input name="attachmentUrl" className="rounded-lg border border-slate-200 p-2" />
          </label>
          <div className="md:col-span-2">
            <p className="text-sm text-slate-600">الوسوم السريعة</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {TAGS.map((tag) => (
                <label key={tag} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="tags" value={tag} className="h-4 w-4" />
                  {tag}
                </label>
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <button className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white">
              حفظ الدليل
            </button>
          </div>
        </form>
      </Card>

      <div className="space-y-4">
        <SectionTitle hint={`عدد الأدلة: ${evidenceList.length}`}>قائمة الأدلة</SectionTitle>
        <div className="grid gap-4">
          {evidenceList.map((evidence) => (
            <Card key={evidence.id} className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="accent">{evidence.type}</Badge>
                {(evidence.tags as string[]).map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
              <p className="text-sm text-slate-700">{evidence.text}</p>
              <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                {evidence.place ? <span>المكان: {evidence.place}</span> : null}
                {evidence.minutes ? <span>الدقائق: {evidence.minutes}</span> : null}
                {evidence.steps ? <span>الخطوات: {evidence.steps}</span> : null}
              </div>
              {evidence.url ? (
                <a className="text-xs text-sky-600" href={evidence.url}>
                  رابط مرتبط
                </a>
              ) : null}
              {evidence.attachmentUrl ? (
                <a className="text-xs text-sky-600" href={evidence.attachmentUrl}>
                  مرفق
                </a>
              ) : null}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
