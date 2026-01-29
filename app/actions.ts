"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  clusterEvidence,
  createExperimentKitDraft,
  createProblemCard,
  createStudyPackDraft,
  summarizeEvidence
} from "@/lib/ai";

function parseTags(formData: FormData): string[] {
  const raw = formData.getAll("tags");
  return raw.map((tag) => String(tag));
}

function averageScore(scores: Record<string, number>): number {
  const values = Object.values(scores);
  if (!values.length) return 0;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
}

export async function createEvidence(formData: FormData) {
  const type = String(formData.get("type") || "");
  const text = String(formData.get("text") || "");
  const url = formData.get("url") ? String(formData.get("url")) : null;
  const minutes = formData.get("minutes") ? Number(formData.get("minutes")) : null;
  const steps = formData.get("steps") ? Number(formData.get("steps")) : null;
  const place = formData.get("place") ? String(formData.get("place")) : null;
  const attachmentUrl = formData.get("attachmentUrl")
    ? String(formData.get("attachmentUrl"))
    : null;

  if (!type || !text) return;

  await prisma.evidence.create({
    data: {
      type,
      text,
      url,
      minutes,
      steps,
      place,
      tags: parseTags(formData),
      attachmentUrl
    }
  });

  revalidatePath("/evidence");
  revalidatePath("/dashboard");
}

export async function createProblemFromForm(formData: FormData) {
  const title = String(formData.get("title") || "");
  const description = String(formData.get("description") || "");
  if (!title || !description) return;

  const scores = {
    frequency: 3,
    pain: 3,
    reach: 3,
    payability: 3,
    testability: 3,
    operability: 3
  };

  await prisma.problem.create({
    data: {
      title,
      description,
      whoHurts: String(formData.get("whoHurts") || "customer"),
      whenHappens: String(formData.get("whenHappens") || "غير محدد"),
      frequencyText: String(formData.get("frequencyText") || "غير محدد"),
      impactTime: formData.get("impactTime") ? Number(formData.get("impactTime")) : null,
      impactMoney: formData.get("impactMoney") ? Number(formData.get("impactMoney")) : null,
      impactPainText: String(formData.get("impactPainText") || "غير محدد"),
      workaround: String(formData.get("workaround") || "غير محدد"),
      metricOne: String(formData.get("metricOne") || "غير محدد"),
      scores,
      totalScore: averageScore(scores)
    }
  });

  revalidatePath("/problems");
  revalidatePath("/dashboard");
}

export async function suggestProblemsFromEvidence() {
  const evidence = await prisma.evidence.findMany({ orderBy: { createdAt: "desc" } });
  if (!evidence.length) return;

  const summary = summarizeEvidence(evidence);
  const clusters = clusterEvidence(evidence);

  for (const cluster of clusters.clusters) {
    const draft = createProblemCard(summary, cluster.name);
    const totalScore = averageScore(draft.initialScores);

    const problem = await prisma.problem.create({
      data: {
        title: draft.title,
        description: draft.description,
        whoHurts: draft.whoHurts,
        whenHappens: draft.whenHappens,
        frequencyText: "أسبوعي",
        impactTime: null,
        impactMoney: null,
        impactPainText: "إزعاج وتشويش في العملية",
        workaround: draft.workaround,
        metricOne: draft.metricOne,
        scores: draft.initialScores,
        totalScore
      }
    });

    await prisma.problemEvidence.createMany({
      data: cluster.evidence_ids.map((id) => ({
        problemId: problem.id,
        evidenceId: id
      }))
    });
  }

  revalidatePath("/problems");
  revalidatePath("/dashboard");
}

export async function updateProblem(problemId: string, formData: FormData) {
  const scores = {
    frequency: Number(formData.get("frequency") || 1),
    pain: Number(formData.get("pain") || 1),
    reach: Number(formData.get("reach") || 1),
    payability: Number(formData.get("payability") || 1),
    testability: Number(formData.get("testability") || 1),
    operability: Number(formData.get("operability") || 1)
  };

  await prisma.problem.update({
    where: { id: problemId },
    data: {
      title: String(formData.get("title") || ""),
      description: String(formData.get("description") || ""),
      whoHurts: String(formData.get("whoHurts") || "customer"),
      whenHappens: String(formData.get("whenHappens") || ""),
      frequencyText: String(formData.get("frequencyText") || ""),
      impactTime: formData.get("impactTime") ? Number(formData.get("impactTime")) : null,
      impactMoney: formData.get("impactMoney") ? Number(formData.get("impactMoney")) : null,
      impactPainText: String(formData.get("impactPainText") || ""),
      workaround: String(formData.get("workaround") || ""),
      metricOne: String(formData.get("metricOne") || ""),
      scores,
      totalScore: averageScore(scores)
    }
  });

  revalidatePath(`/problems/${problemId}`);
  revalidatePath("/problems");
  revalidatePath("/dashboard");
}

export async function generateStudyPack(problemId: string) {
  const problem = await prisma.problem.findUnique({ where: { id: problemId } });
  if (!problem) return;

  const content = createStudyPackDraft(problem.title);

  await prisma.studyPack.upsert({
    where: { problemId },
    update: { content },
    create: { problemId, content }
  });

  revalidatePath(`/problems/${problemId}/study`);
}

export async function generateExperiment(problemId: string) {
  const problem = await prisma.problem.findUnique({ where: { id: problemId } });
  if (!problem) return;

  const draft = createExperimentKitDraft(problem.title);

  await prisma.experiment.upsert({
    where: { problemId },
    update: {
      hypothesis: draft.hypothesis,
      plan: {
        wizard_of_oz: draft.wizard_of_oz,
        steps_day_by_day: draft.steps_day_by_day,
        metrics: draft.metrics,
        stealth_pitch: draft.stealth_pitch
      },
      pitchText: draft.stealth_pitch,
      metrics: draft.metrics
    },
    create: {
      problemId,
      hypothesis: draft.hypothesis,
      plan: {
        wizard_of_oz: draft.wizard_of_oz,
        steps_day_by_day: draft.steps_day_by_day,
        metrics: draft.metrics,
        stealth_pitch: draft.stealth_pitch
      },
      pitchText: draft.stealth_pitch,
      metrics: draft.metrics
    }
  });

  revalidatePath(`/problems/${problemId}/experiment`);
}
