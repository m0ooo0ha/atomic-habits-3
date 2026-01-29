import type { Evidence } from "@prisma/client";

export type EvidenceSummary = {
  summary: string;
  pain_points: string[];
  who: string;
  when: string;
  signals: string[];
};

export type EvidenceCluster = {
  clusters: { name: string; evidence_ids: string[]; reason: string }[];
};

export type ProblemCardDraft = {
  title: string;
  description: string;
  whoHurts: "customer" | "employee" | "owner" | "all";
  whenHappens: string;
  workaround: string;
  metricOne: string;
  initialScores: {
    frequency: number;
    pain: number;
    reach: number;
    payability: number;
    testability: number;
    operability: number;
  };
};

export type StudyPackDraft = {
  root_causes: { hypothesis: string; why: string }[];
  current_alternatives: string[];
  why_not_solved: string[];
  pay_signals: string[];
  interview_questions: string[];
  risks: string[];
};

export type ExperimentKitDraft = {
  hypothesis: string;
  wizard_of_oz: string;
  steps_day_by_day: { day: number; task: string }[];
  metrics: { name: string; how_to_measure?: string; how?: string }[];
  stealth_pitch: string;
};

const DEFAULT_SIGNALS = ["wait", "repeat", "workaround"];

export function summarizeEvidence(evidence: Evidence[]): EvidenceSummary {
  const text = evidence.map((item) => item.text).join(" ");
  const summary = text.length > 120 ? `${text.slice(0, 117)}...` : text;
  const painPoints = evidence.map((item) => item.type).slice(0, 3);
  const who = evidence.some((item) => item.type.includes("موظف")) ? "employee" : "customer";
  const when = evidence[0]?.createdAt.toISOString() ?? "غير محدد";

  return {
    summary: summary || "لا توجد أدلة بعد.",
    pain_points: painPoints.length ? painPoints : ["تعطّل في العملية"],
    who,
    when,
    signals: DEFAULT_SIGNALS
  };
}

export function clusterEvidence(evidence: Evidence[]): EvidenceCluster {
  const grouped = new Map<string, string[]>();

  evidence.forEach((item) => {
    const key = item.type;
    const existing = grouped.get(key) ?? [];
    existing.push(item.id);
    grouped.set(key, existing);
  });

  return {
    clusters: Array.from(grouped.entries()).map(([name, ids]) => ({
      name,
      evidence_ids: ids,
      reason: `تجميع حسب نوع الدليل: ${name}.`
    }))
  };
}

export function createProblemCard(summary: EvidenceSummary, clusterName: string): ProblemCardDraft {
  return {
    title: `مشكلة مرتبطة بـ ${clusterName}`,
    description: `يحدث ${summary.summary} لمن ${summary.who} في سياق ${clusterName} بسبب نقص في الموارد.`,
    whoHurts: summary.who === "employee" ? "employee" : "customer",
    whenHappens: "خلال الخطوة الأكثر ازدحامًا",
    workaround: "تواصل يدوي لتقليل التأخير",
    metricOne: "متوسط الزمن بالدقائق",
    initialScores: {
      frequency: 3,
      pain: 4,
      reach: 3,
      payability: 3,
      testability: 4,
      operability: 3
    }
  };
}

export function createStudyPackDraft(problemTitle: string): StudyPackDraft {
  return {
    root_causes: [
      { hypothesis: "نقص بيانات فورية", why: `لا توجد لوحة مراقبة ل${problemTitle}.` },
      { hypothesis: "توزيع جهود غير متوازن", why: "العمل موزع دون توقع للذروة." },
      { hypothesis: "إجراءات معقدة", why: "كثرة الخطوات تزيد التعطيل." }
    ],
    current_alternatives: ["الحلول اليدوية", "التصعيد الداخلي", "تقسيم العمل"],
    why_not_solved: ["غياب مالك واضح للمشكلة", "تغيير مكلف على المدى القصير"],
    pay_signals: ["استعداد لدفع رسوم لتقليل الوقت", "شكاوى متكررة من العملاء"],
    interview_questions: [
      "صف آخر مرة واجهت فيها المشكلة؟",
      "ما الذي حاولتم فعله لتقليل الأثر؟",
      "ما المؤشر الذي يهمكم قياسه؟",
      "كم مرة تكرر المشكلة أسبوعيًا؟",
      "ما البديل الحالي؟",
      "ما أكبر عائق أمام التغيير؟",
      "ما الذي يجعلكم تدفعون لحلها؟"
    ],
    risks: ["خصوصية البيانات", "تعقيد التشغيل", "تكلفة التنفيذ"]
  };
}

export function createExperimentKitDraft(problemTitle: string): ExperimentKitDraft {
  return {
    hypothesis: `إذا قمنا بتجربة تحسين بسيط في ${problemTitle} سنلاحظ تحسنًا في المؤشر الأساسي خلال 14 يومًا.`,
    wizard_of_oz: "تنفيذ يدوي بإشراف فريق صغير مع مراقبة النتائج.",
    steps_day_by_day: [
      { day: 1, task: "تجهيز العينة وتحديد المؤشرات" },
      { day: 2, task: "بدء التجربة المصغرة ومراقبة المؤشر" },
      { day: 3, task: "إجراء مقابلات سريعة" },
      { day: 7, task: "مراجعة النتائج الأولية" },
      { day: 14, task: "تحليل البيانات واتخاذ قرار المتابعة" }
    ],
    metrics: [
      { name: "usage", how_to_measure: "عدد الحالات التي شملتها التجربة" },
      { name: "satisfaction", how: "تقييم سريع بعد التجربة" },
      { name: "payment", how: "استعداد للدفع مقابل التحسين" }
    ],
    stealth_pitch: "نقيس التجربة الحالية لتقليل الهدر وتحسين رضا المستخدمين."
  };
}
