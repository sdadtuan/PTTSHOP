import { describe, expect, it } from "vitest";
import { DEFAULT_QUIZ, combineFilters, questionIsSensitive, quizIsOpen, quizNav, quizResult, type QuizCandidate } from "@/lib/quiz";

const shirt: QuizCandidate = {
  id: "shirt", name: "Áo", slug: "ao", forSale: true, isDemo: false, stock: 2, price: 200000,
  categorySlug: "ao-thun", gender: "UNISEX",
};
const pants: QuizCandidate = {
  id: "pants", name: "Quần", slug: "quan", forSale: true, isDemo: false, stock: 1, price: 400000,
  categorySlug: "quan", gender: "MALE",
};
const demo: QuizCandidate = { ...shirt, id: "demo", slug: "demo-ao", isDemo: true };
const gone: QuizCandidate = { ...pants, id: "gone", stock: 0 };

describe("style quiz", () => {
  it("stays closed until enabled with 4 to 7 questions", () => {
    expect(quizIsOpen({ enabled: false, activeQuestions: 4 })).toBe(false);
    expect(quizIsOpen({ enabled: true, activeQuestions: 3 })).toBe(false);
    expect(quizIsOpen({ enabled: true, activeQuestions: 4 })).toBe(true);
    expect(quizIsOpen({ enabled: true, activeQuestions: 8 })).toBe(false);
    expect(quizNav([{ href: "/san-pham", label: "Sản phẩm" }], false).map((item) => item.href)).toEqual(["/san-pham"]);
  });

  it("ships a default set that does not ask age or weight and starts off", () => {
    expect(DEFAULT_QUIZ.length).toBeGreaterThanOrEqual(4);
    expect(DEFAULT_QUIZ.length).toBeLessThanOrEqual(7);
    expect(DEFAULT_QUIZ.some((question) => questionIsSensitive(question.prompt))).toBe(false);
    expect(questionIsSensitive("Bạn bao nhiêu tuổi")).toBe(true);
    expect(questionIsSensitive("Cân nặng của bạn")).toBe(true);
    expect(DEFAULT_QUIZ.some((question) => question.options.some((option) => option.priceMax))).toBe(false);
  });

  it("returns real products and falls back to a broader listing", () => {
    const matched = quizResult([shirt, pants, demo, gone], combineFilters([{ gender: "MALE" }]));
    expect(matched.products.map((item) => item.id).sort()).toEqual(["pants", "shirt"]);
    expect(matched.products.some((item) => item.isDemo || item.stock <= 0)).toBe(false);
    const empty = quizResult([shirt], combineFilters([{ categorySlug: "khong-co" }]));
    expect(empty.products.map((item) => item.id)).toEqual(["shirt"]);
    expect(empty.href).toBe("/san-pham");
    expect(empty.relaxed).toBe(true);
  });
});
