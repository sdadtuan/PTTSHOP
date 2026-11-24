import { ApiError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { STAFF_ROLES, canAny, scopeForApi, type Access, type Scope } from "@/lib/rbac";

export async function loadAccess(userId: string, role: string | undefined): Promise<Access> {
  const rows = await prisma.userRoleAssignment.findMany({ where: { userId }, select: { role: true } });
  const roles = rows.map((row) => row.role).filter((item) => (STAFF_ROLES as readonly string[]).includes(item));
  if (role === "ADMIN" && roles.length === 0) return { roles: ["ADMIN"], legacy: true };
  return { roles, legacy: false };
}

export async function enforceAdmin(req?: Request) {
  const session = await requireAdmin();
  const access = await loadAccess(session.user.id, session.user.role);
  if (!req) {
    if (access.legacy) return Object.assign(session, { access });
    throw new ApiError("Bạn không có quyền thực hiện thao tác này.", 403);
  }
  const needed = scopeForApi(new URL(req.url).pathname, req.method);
  if (needed && !canAny(access, needed)) {
    throw new ApiError("Bạn không có quyền thực hiện thao tác này.", 403);
  }
  return Object.assign(session, { access });
}

export function assertScope(access: Access, scope: Scope | Scope[]) {
  if (!canAny(access, scope)) throw new ApiError("Bạn không có quyền thực hiện thao tác này.", 403);
}
