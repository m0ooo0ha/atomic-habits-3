import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.experiment.deleteMany();
  await prisma.studyPack.deleteMany();
  await prisma.problemEvidence.deleteMany();
  await prisma.problem.deleteMany();
  await prisma.evidence.deleteMany();

  const evidence = await prisma.evidence.createMany({
    data: [
      {
        type: "ملاحظة ميدانية",
        text: "المراجعون ينتظرون أكثر من 20 دقيقة لاستلام الرد بسبب نقص الموظفين في الذروة.",
        place: "مركز الخدمة",
        tags: ["انتظار", "هدر"],
        attachmentUrl: null
      },
      {
        type: "شكوى/تقييم",
        text: "التقارير الشهرية تتأخر ويضطر الموظفون لتجميع البيانات يدويًا.",
        url: "https://example.com/review",
        tags: ["تعقيد", "فوضى"]
      },
      {
        type: "قياس وقت/خطوات",
        text: "عملية إدخال طلب جديد تحتاج 12 خطوة.",
        minutes: 18,
        steps: 12,
        tags: ["هدر", "أخطاء"]
      },
      {
        type: "workaround/ترقيع",
        text: "العملاء يرسلون المستندات عبر واتساب لتجنب بوابة الرفع البطيئة.",
        tags: ["تجربة سيئة", "workaround"]
      }
    ]
  });

  const problem = await prisma.problem.create({
    data: {
      title: "انتظار طويل في الذروة",
      description: "يحدث انتظار طويل للمراجعين في مركز الخدمة بسبب نقص الموظفين عند الذروة.",
      whoHurts: "customer",
      whenHappens: "أوقات الذروة اليومية",
      frequencyText: "يومي",
      impactTime: 20,
      impactMoney: null,
      impactPainText: "إزعاج وتأخير في المهام",
      workaround: "توزيع الأرقام يدويًا",
      metricOne: "متوسط وقت الانتظار بالدقائق",
      scores: {
        frequency: 4,
        pain: 4,
        reach: 3,
        payability: 3,
        testability: 4,
        operability: 4
      },
      totalScore: 3.67
    }
  });

  const createdEvidence = await prisma.evidence.findMany();

  if (createdEvidence[0]) {
    await prisma.problemEvidence.create({
      data: { problemId: problem.id, evidenceId: createdEvidence[0].id }
    });
  }

  await prisma.studyPack.create({
    data: {
      problemId: problem.id,
      content: {
        root_causes: [
          {
            hypothesis: "توزيع الموظفين غير متوازن",
            why: "الجدول لا يعكس أوقات الذروة الفعلية."
          }
        ],
        current_alternatives: ["حجز موعد مسبق", "توزيع الأرقام يدويًا"],
        why_not_solved: ["عدم توفر بيانات فورية", "ضعف التنسيق بين الأقسام"],
        pay_signals: ["العملاء يدفعون لتقليل الانتظار", "شكاوى متكررة"],
        interview_questions: ["صف آخر مرة انتظرت فيها في المركز؟"],
        risks: ["خصوصية بيانات الانتظار", "تعقيد التشغيل"]
      }
    }
  });

  await prisma.experiment.create({
    data: {
      problemId: problem.id,
      hypothesis: "إذا وفرنا تنبيهًا مبكرًا للذروة سيقل متوسط الانتظار بنسبة 20%.",
      plan: {
        wizard_of_oz: "تنسيق يدوي بين المشرفين لتبديل المناوبات.",
        steps_day_by_day: [
          { day: 1, task: "جمع بيانات الذروة الحالية" },
          { day: 2, task: "تجربة تبديل مناوبات لمدة ساعتين" }
        ],
        metrics: [
          { name: "usage", how_to_measure: "عدد العملاء الذين تم خدمتهم" },
          { name: "satisfaction", how: "استبيان سريع" },
          { name: "payment", how: "استعداد للدفع لتخفيض الانتظار" }
        ],
        stealth_pitch: "نقيس تجربة الخدمة في الذروة لتحسين وقت الانتظار."
      },
      pitchText: "نقيس تجربة الخدمة في الذروة لتحسين وقت الانتظار.",
      metrics: {
        usage: "عدد العملاء المخدومين",
        satisfaction: "تقييم سريع",
        payment: "استعداد للدفع"
      }
    }
  });

  console.log(`Seeded ${evidence.count} evidence records.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
