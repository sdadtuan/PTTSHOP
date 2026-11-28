import type { NavLink } from "@/lib/cms/types";

export type QuizFilter = {
  categorySlug?: string | null;
  gender?: string | null;
  priceMax?: number | null;
};

export type QuizCandidate = {
  id: string;
  name: string;
  slug: string;
  forSale: boolean;
  isDemo: boolean;
  stock: number;
  price: number | null;
  categorySlug: string | null;
  gender: string;
};

export const DEFAULT_QUIZ: { prompt: string; options: { label: string; categorySlug?: string | null; gender?: string | null; priceMax?: number | null }[] }[] = [
  {
    prompt: "Bạn muốn bắt đầu từ nhóm nào?",
    options: [
      { label: "Áo" },
      { label: "Quần" },
      { label: "Phụ kiện" },
    ],
  },
  {
    prompt: "Bạn thích tông màu nào?",
    options: [
      { label: "Trung tính" },
      { label: "Đậm" },
      { label: "Không lọc màu" },
    ],
  },
  {
    prompt: "Dành cho ai?",
    options: [
      { label: "Nam", gender: "MALE" },
      { label: "Nữ", gender: "FEMALE" },
      { label: "Không lọc" },
    ],
  },
  {
    prompt: "Bạn muốn xem mức giá nào?",
    options: [
      { label: "Không lọc giá" },
    ],
  },
];

export function questionIsSensitive(prompt: string) {
  return /tuổi|tuoi|cân nặng|can nang|\bkg\b|\bcm\b/i.test(prompt);
}

export function quizIsOpen(input: { enabled: boolean; activeQuestions: number }) {
  return input.enabled === true && input.activeQuestions >= 4 && input.activeQuestions <= 7;
}

export function quizNav(links: NavLink[], open: boolean): NavLink[] {
  const rest = links.filter((item) => item.href !== "/phong-cach");
  return open ? [...rest, { href: "/phong-cach", label: "Phong cách" }] : rest;
}

export function combineFilters(options: QuizFilter[]): QuizFilter {
  const filter: QuizFilter = {};
  for (const option of options) {
    if (option.categorySlug) filter.categorySlug = option.categorySlug;
    if (option.gender) filter.gender = option.gender;
    if (typeof option.priceMax === "number" && option.priceMax > 0) filter.priceMax = option.priceMax;
  }
  return filter;
}

export function listingHref(filter: QuizFilter) {
  const params = new URLSearchParams();
  if (filter.categorySlug) params.set("category", filter.categorySlug);
  if (filter.gender) params.set("gender", filter.gender.toLowerCase());
  if (filter.priceMax) params.set("priceMax", String(filter.priceMax));
  const query = params.toString();
  return query ? `/san-pham?${query}` : "/san-pham";
}

function eligible(products: QuizCandidate[], filter: QuizFilter) {
  return products.filter((item) => {
    if (!item.forSale || item.isDemo || item.stock <= 0) return false;
    if (filter.categorySlug && item.categorySlug !== filter.categorySlug) return false;
    if (filter.gender && item.gender !== filter.gender && item.gender !== "UNISEX") return false;
    if (filter.priceMax && (item.price == null || item.price > filter.priceMax)) return false;
    return true;
  });
}

export function quizResult(products: QuizCandidate[], filter: QuizFilter) {
  const steps: QuizFilter[] = [
    filter,
    { ...filter, priceMax: null },
    { categorySlug: filter.categorySlug ?? null },
    {},
  ];
  for (const step of steps) {
    const hits = eligible(products, step);
    if (hits.length > 0) {
      return { products: hits.slice(0, 8), href: listingHref(step), relaxed: step !== filter };
    }
  }
  return { products: [], href: "/san-pham", relaxed: true };
}
