import { z } from "zod";
import { handleApiError, jsonOk } from "@/lib/api";
import { recordAudit } from "@/lib/admin-audit";
import { STAFF_ROLES } from "@/lib/rbac";
import { enforceAdmin } from "@/lib/rbac-access";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  userId: z.string().min(1),
  roles: z.array(z.enum(STAFF_ROLES)),
});

export async function GET(req?: Request) {
  try {
    await enforceAdmin(req);
    const users = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true, email: true, name: true, roleAssignments: { select: { role: true } } },
      orderBy: { email: "asc" },
    });
    return jsonOk({
      users: users.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roleAssignments.map((row) => row.role),
        legacy: user.roleAssignments.length === 0,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const session = await enforceAdmin(req);
    const body = bodySchema.parse(await req.json());
    const before = await prisma.userRoleAssignment.findMany({ where: { userId: body.userId }, select: { role: true } });
    await prisma.$transaction([
      prisma.userRoleAssignment.deleteMany({ where: { userId: body.userId } }),
      ...body.roles.map((role) => prisma.userRoleAssignment.create({ data: { userId: body.userId, role } })),
    ]);
    await recordAudit({
      access: session.access,
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "ROLE_ASSIGN",
      entityType: "User",
      entityId: body.userId,
      before: { roles: before.map((row) => row.role) },
      after: { roles: body.roles },
      req,
    });
    return jsonOk({ roles: body.roles });
  } catch (err) {
    return handleApiError(err);
  }
}
