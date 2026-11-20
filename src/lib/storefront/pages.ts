import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText } from "@/lib/cms/validate";
import { STOREFRONT_PAGE_SEEDS } from "@/lib/storefront/page-seeds";

export type StorefrontPageView = {
  slug: string;
  title: string;
  description: string | null;
  body: string[];
};

function parseBody(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((line) => typeof line === "string")
      .map((line) => sanitizePlainText(line, 4000));
  } catch {
    return [];
  }
}

let pagesSeeding: Promise<void> | null = null;

/** Idempotent: inserts default static pages only when missing; safe under concurrent first requests. */
export async function ensureStorefrontPagesSeeded() {
  if (pagesSeeding) return pagesSeeding;
  pagesSeeding = seedStorefrontPagesInner().finally(() => {
    pagesSeeding = null;
  });
  return pagesSeeding;
}

async function seedStorefrontPagesInner() {
  for (const seed of STOREFRONT_PAGE_SEEDS) {
    const bodyJson = JSON.stringify(seed.body);
    await prisma.storefrontPage.upsert({
      where: { slug: seed.slug },
      update: {},
      create: {
        slug: seed.slug,
        title: seed.title,
        description: seed.description ?? null,
        bodyJson,
        draftTitle: seed.title,
        draftDescription: seed.description ?? null,
        draftBodyJson: bodyJson,
        sortOrder: seed.sortOrder,
      },
    });
  }
}

export async function getStorefrontPageBySlug(slug: string): Promise<StorefrontPageView | null> {
  await ensureStorefrontPagesSeeded();
  const row = await prisma.storefrontPage.findFirst({ where: { slug, isPublished: true } });
  if (!row) return null;
  return {
    slug: row.slug,
    title: row.title,
    description: row.description,
    body: parseBody(row.bodyJson),
  };
}

export async function listAdminStorefrontPages() {
  await ensureStorefrontPagesSeeded();
  const rows = await prisma.storefrontPage.findMany({ orderBy: [{ sortOrder: "asc" }, { title: "asc" }] });
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    body: parseBody(row.bodyJson),
    draftTitle: row.draftTitle ?? row.title,
    draftDescription: row.draftDescription ?? row.description,
    draftBody: parseBody(row.draftBodyJson || row.bodyJson),
    isPublished: row.isPublished,
    sortOrder: row.sortOrder,
    updatedAt: row.updatedAt,
  }));
}

export type SaveStorefrontPageInput = {
  id: string;
  draftTitle: string;
  draftDescription?: string | null;
  draftBody: string[];
  publish?: boolean;
};

export async function saveStorefrontPage(input: SaveStorefrontPageInput) {
  const title = sanitizePlainText(input.draftTitle, 200);
  const description = input.draftDescription
    ? sanitizePlainText(input.draftDescription, 400)
    : null;
  const draftBodyJson = JSON.stringify(
    input.draftBody.map((line) => sanitizePlainText(line, 4000)).filter(Boolean),
  );

  const data = input.publish
    ? {
        title,
        description,
        bodyJson: draftBodyJson,
        draftTitle: title,
        draftDescription: description,
        draftBodyJson,
      }
    : {
        draftTitle: title,
        draftDescription: description,
        draftBodyJson,
      };

  const row = await prisma.storefrontPage.update({
    where: { id: input.id },
    data,
  });

  revalidatePath(`/${row.slug}`);
  if (row.slug.includes("/")) {
  revalidatePath(`/${row.slug.split("/")[0]}`);
  }

  return row;
}

export async function publishStorefrontPage(id: string) {
  const row = await prisma.storefrontPage.findUniqueOrThrow({ where: { id } });
  return saveStorefrontPage({
    id,
    draftTitle: row.draftTitle ?? row.title,
    draftDescription: row.draftDescription ?? row.description,
    draftBody: parseBody(row.draftBodyJson || row.bodyJson),
    publish: true,
  });
}