import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { QuizForm } from "@/components/quiz/quiz-form";
import { quizIsOpen } from "@/lib/quiz";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Phong cách" };

export default async function StyleQuizPage() {
  const [settings, questions] = await Promise.all([
    prisma.quizSettings.findUnique({ where: { id: "default" } }).catch(() => null),
    prisma.quizQuestion.findMany({
      where: { isActive: true },
      orderBy: { position: "asc" },
      take: 7,
      include: { options: { orderBy: { position: "asc" } } },
    }).catch(() => []),
  ]);
  if (!quizIsOpen({ enabled: settings?.enabled === true, activeQuestions: questions.length })) notFound();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="type-title text-3xl font-bold">Tìm phong cách</h1>
      <p className="mt-2 text-sm text-neutral-600">Không cần đăng nhập. Bạn có thể bỏ qua và xem sản phẩm.</p>
      <QuizForm
        questions={questions.map((question) => ({
          id: question.id,
          prompt: question.prompt,
          options: question.options.map((option) => ({ id: option.id, label: option.label })),
        }))}
      />
    </div>
  );
}
