import type { NavLink } from "@/lib/cms/types";

export function lookbookNav(links: NavLink[], publishedCount: number): NavLink[] {
  const rest = links.filter((item) => item.href !== "/lookbook");
  if (publishedCount <= 0) return rest;
  return [...rest, { href: "/lookbook", label: "Lookbook" }];
}

export function lookIsPublic(look: { isPublished: boolean } | null | undefined) {
  return look?.isPublished === true;
}

export type LookVariantChoice = {
  id: string;
  label: string;
  stock: number;
};

export function selectableVariants(variants: LookVariantChoice[]) {
  return variants.filter((item) => item.stock > 0);
}

export function canAddLookItem(selectedId: string | null, variants: LookVariantChoice[]) {
  if (!selectedId) return false;
  return selectableVariants(variants).some((item) => item.id === selectedId);
}
