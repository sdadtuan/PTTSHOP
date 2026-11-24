import { handleApiError, jsonOk } from "@/lib/api";
import { integrationStatus } from "@/lib/integrations-view";
import { enforceAdmin } from "@/lib/rbac-access";

export async function GET(req?: Request) {
  try {
    await enforceAdmin(req);
    return jsonOk({ integrations: integrationStatus(process.env) });
  } catch (err) {
    return handleApiError(err);
  }
}
