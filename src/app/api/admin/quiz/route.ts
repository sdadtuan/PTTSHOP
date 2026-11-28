import { z } from "zod";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { enforceAdmin } from "@/lib/rbac-access";
import { prisma } from "@/lib/prisma";
import { DEFAULT_QUIZ, questionIsSensitive } from "@/lib/quiz";

const saveSchema = z.object({
  enabled: z.boolean(),
  questions: z.array(z.object({
    prompt: z.string().trim().min(1).max(160),
    options: z.array(z.object({
      label: z.string().trim().min(1).max(80),
      categorySlug: z.string().trim().max(80).nullable().optional(),
      gender: z.enum(["MALE", "FEMALE", "UNISEX"]).nullable().optional(),
      priceMax: z.number().int().positive().nullable().optional(),
    })).min(1).max(6),
  })).max(7),
});

export async function GET(req: Request) {
  try {
    await enforceAdmin(req);
    const [settings, questions] = await Promise.all([
      prisma.quizSettings.findUnique({ where: { id: "default" } }),
      prisma.quizQuestion.findMany({ orderBy: { position: "asc" }, include: { options: { orderBy: { position: "asc" } } } }),
    ]);
    return jsonOk({
      enabled: settings?.enabled === true,
      questions: questions.map((question) => ({
        prompt: question.prompt,
        isActive: question.isActive,
        options: question.options.map((option) => ({
          label: option.label,
          categorySlug: option.categorySlug,
          gender: option.gender,
          priceMax: option.priceMax,
        })),
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: Request) {
  try {
    await enforceAdmin(req);
    const body = saveSchema.parse(await req.json());
    if (body.questions.some((question) => questionIsSensitive(question.prompt))) {
      return jsonError("Không hỏi tuổi hoặc cân nặng");
    }
    if (body.enabled && (body.questions.length < 4 || body.questions.length > 7)) {
      return jsonError("Cần 4 đến 7 câu khi bật quiz");
    }
    await prisma.$transaction(async (tx) => {
      await tx.quizOption.deleteMany();
      await tx.quizQuestion.deleteMany();
      await tx.quizSettings.upsert({
        where: { id: "default" },
        create: { id: "default", enabled: body.enabled },
        update: { enabled: body.enabled },
      });
      for (const [index, question] of body.questions.entries()) {
        await tx.quizQuestion.create({
          data: {
            prompt: question.prompt,
            position: index,
            isActive: true,
            options: {
              create: question.options.map((option, position) => ({
                label: option.label,
                position,
                categorySlug: option.categorySlug || null,
                gender: option.gender || null,
                priceMax: option.priceMax ?? null,
              })),
            },
          },
        });
      }
    });
    return jsonOk({ saved: true });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    await enforceAdmin(req);
    const existing = await prisma.quizQuestion.count();
    if (existing > 0) return jsonError("Đã có câu. Sửa trên form, không ghi đè.");
    await prisma.quizSettings.upsert({
      where: { id: "default" },
      create: { id: "default", enabled: false },
      update: { enabled: false },
    });
    for (const [index, question] of DEFAULT_QUIZ.entries()) {
      await prisma.quizQuestion.create({
        data: {
          prompt: question.prompt,
          position: index,
          isActive: true,
          options: {
            create: question.options.map((option, position) => ({
              label: option.label,
              position,
              categorySlug: option.categorySlug || null,
              gender: option.gender || null,
              priceMax: option.priceMax ?? null,
            })),
          },
        },
      });
    }
    return jsonOk({ installed: true, enabled: false });
  } catch (err) {
    return handleApiError(err);
  }
}
