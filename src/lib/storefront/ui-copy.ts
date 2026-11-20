import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { DEFAULT_STOREFRONT_UI, type StorefrontUiCopy } from "@/lib/storefront/ui-copy-types";
import { parseStorefrontUi } from "@/lib/storefront/ui-copy-validate";

export type StorefrontUiViewMode = "published" | "draft";

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

const REVALIDATE_PATHS = [
  "/",
  "/lien-he",
  "/san-pham",
  "/bo-suu-tap",
  "/gio-hang",
  "/thanh-toan",
  "/dat-hang-thanh-cong",
  "/yeu-thich",
  "/tai-khoan",
  "/tai-khoan/don-hang",
  "/dang-nhap",
  "/dang-ky",
  "/quen-mat-khau",
  "/tin-tuc",
  "/tuyen-dung",
  "/ve-chung-toi",
  "/danh-gia",
];

let uiCopySeeding: Promise<void> | null = null;

export async function ensureStorefrontUiSeeded() {
  if (uiCopySeeding) return uiCopySeeding;
  uiCopySeeding = seedStorefrontUiInner().finally(() => {
    uiCopySeeding = null;
  });
  return uiCopySeeding;
}

async function seedStorefrontUiInner() {
  const json = JSON.stringify(DEFAULT_STOREFRONT_UI);
  await prisma.storefrontUiCopy.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      contentJson: json,
      draftContentJson: json,
      publishedAt: new Date(),
    },
    update: {},
  });
}

async function loadRow() {
  await ensureStorefrontUiSeeded();
  return prisma.storefrontUiCopy.findUniqueOrThrow({ where: { id: "default" } });
}

export async function getStorefrontUi(mode: StorefrontUiViewMode = "published"): Promise<StorefrontUiCopy> {
  try {
    const row = await loadRow();
    const raw = mode === "draft" ? row.draftContentJson : row.contentJson;
    return parseStorefrontUi(parseJson(raw, DEFAULT_STOREFRONT_UI));
  } catch {
    return DEFAULT_STOREFRONT_UI;
  }
}

export async function getAdminStorefrontUiState() {
  const row = await loadRow();
  const published = parseStorefrontUi(parseJson(row.contentJson, DEFAULT_STOREFRONT_UI));
  const draft = parseStorefrontUi(parseJson(row.draftContentJson, DEFAULT_STOREFRONT_UI));
  return {
    published,
    draft,
    publishedAt: row.publishedAt,
    hasUnpublishedChanges: row.contentJson !== row.draftContentJson,
  };
}

export async function saveStorefrontUiDraft(draft: unknown) {
  const parsed = parseStorefrontUi(draft);
  await prisma.storefrontUiCopy.update({
    where: { id: "default" },
    data: { draftContentJson: JSON.stringify(parsed) },
  });
  return getAdminStorefrontUiState();
}

export async function publishStorefrontUi() {
  const row = await loadRow();
  const draft = parseStorefrontUi(parseJson(row.draftContentJson, DEFAULT_STOREFRONT_UI));
  await prisma.storefrontUiCopy.update({
    where: { id: "default" },
    data: {
      contentJson: JSON.stringify(draft),
      draftContentJson: JSON.stringify(draft),
      publishedAt: new Date(),
    },
  });
  for (const p of REVALIDATE_PATHS) {
    revalidatePath(p);
  }
  revalidatePath("/", "layout");
  return getAdminStorefrontUiState();
}

export async function discardStorefrontUiDraft() {
  const row = await loadRow();
  const published = parseStorefrontUi(parseJson(row.contentJson, DEFAULT_STOREFRONT_UI));
  await prisma.storefrontUiCopy.update({
    where: { id: "default" },
    data: { draftContentJson: JSON.stringify(published) },
  });
  return getAdminStorefrontUiState();
}