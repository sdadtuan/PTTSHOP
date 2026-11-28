import { prisma } from "@/lib/prisma";
import { SAMPLE_EXPERIMENTS, type ExperimentDef } from "@/lib/experiments/assign";

export async function getExperiments(): Promise<ExperimentDef[]> {
  try {
    const rows = await prisma.experiment.findMany();
    if (rows.length === 0) return SAMPLE_EXPERIMENTS;
    return rows.map((row) => ({
      key: row.key,
      enabled: row.enabled,
      variants: row.variants.split(",").map((item) => item.trim()).filter(Boolean),
      trafficPercent: row.trafficPercent,
    }));
  } catch {
    return SAMPLE_EXPERIMENTS;
  }
}
