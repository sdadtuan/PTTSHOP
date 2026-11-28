import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Lookbook" };

export default async function LookbookPage() {
  const looks = await prisma.look.findMany({
    where: { isPublished: true },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: { slug: true, title: true, description: true, imageUrl: true },
  });
  if (looks.length === 0) notFound();
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <h1 className="type-title text-3xl font-bold">Lookbook</h1>
      <ul className="mt-8 grid gap-6 sm:grid-cols-2">
        {looks.map((look) => (
          <li key={look.slug}>
            <Link href={`/lookbook/${look.slug}`} className="block rounded border border-neutral-200 p-4">
              <h2 className="text-xl font-semibold">{look.title}</h2>
              {look.description ? <p className="mt-2 text-sm text-neutral-600">{look.description}</p> : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
