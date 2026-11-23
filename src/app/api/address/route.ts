import { jsonOk } from "@/lib/api";
import { listProvinces, listWards } from "@/lib/address/vn-admin";

export async function GET(req: Request) {
  const province = new URL(req.url).searchParams.get("province") || "";
  return jsonOk({
    provinces: listProvinces(),
    wards: province ? listWards(province) : [],
  });
}
