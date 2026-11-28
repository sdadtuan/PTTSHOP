"use client";

import { useState } from "react";
import Link from "next/link";

type Question = { id: string; prompt: string; options: { id: string; label: string }[] };
type Hit = { id: string; name: string; slug: string; price: number | null };

export function QuizForm({ questions }: { questions: Question[] }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<{ products: Hit[]; href: string } | null>(null);

  async function choose(optionId: string) {
    const next = [...answers, optionId];
    if (step + 1 < questions.length) {
      setAnswers(next);
      setStep(step + 1);
      return;
    }
    const res = await fetch("/api/style-quiz/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionIds: next }),
    });
    const data = await res.json();
    setResult({ products: data.products || [], href: data.href || "/san-pham" });
  }

  if (result) {
    return (
      <div className="mt-8">
        <h2 className="text-xl font-semibold">Gợi ý từ câu trả lời</h2>
        {result.products.length === 0 ? <p className="mt-3 text-sm">Chưa có sản phẩm khớp. Xem danh sách gần nhất.</p> : (
          <ul className="mt-4 grid grid-cols-2 gap-3">
            {result.products.map((item) => (
              <li key={item.id}>
                <Link href={`/san-pham/${item.slug}`} className="block rounded border p-3">
                  <span className="font-medium">{item.name}</span>
                  {item.price != null ? <span className="mt-1 block text-sm">{item.price.toLocaleString("vi-VN")}đ</span> : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link href={result.href} className="mt-4 inline-flex rounded bg-neutral-900 px-4 py-2 text-sm text-white">Xem danh sách đã lọc</Link>
      </div>
    );
  }

  const question = questions[step];
  return (
    <div className="mt-8">
      <p className="text-sm text-neutral-500">Câu {step + 1}/{questions.length}</p>
      <h2 className="mt-2 text-xl font-semibold">{question.prompt}</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {question.options.map((option) => (
          <button key={option.id} type="button" className="rounded border px-4 py-2" onClick={() => void choose(option.id)}>
            {option.label}
          </button>
        ))}
      </div>
      <Link href="/san-pham" className="mt-6 inline-block text-sm text-neutral-500 underline">Bỏ qua</Link>
    </div>
  );
}
