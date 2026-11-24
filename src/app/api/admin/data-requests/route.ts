import { z } from "zod";
import { handleApiError, jsonOk } from "@/lib/api";
import { enforceAdmin } from "@/lib/rbac-access";
import { prisma } from "@/lib/prisma";

export async function GET(req?: Request) {
  try {
    await enforceAdmin(req);
    const rows = await prisma.consent.findMany({
      where: { kind: "request" },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return jsonOk({ rows });
  } catch (err) {
    return handleApiError(err);
  }
}

const schema = z.object({ id: z.string().min(1) });

export async function POST(req: Request) {
  try {
    await enforceAdmin(req);
    const body = schema.parse(await req.json());
    const row = await prisma.consent.update({
      where: { id: body.id },
      data: { status: "handled", handledAt: new Date() },
    });
    return jsonOk({ id: row.id, handledAt: row.handledAt });
  } catch (err) {
    return handleApiError(err);
  }
}
