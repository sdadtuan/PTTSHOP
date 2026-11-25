import { handleApiError } from "@/lib/api";
import { enforceAdmin } from "@/lib/rbac-access";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    await enforceAdmin(req);
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return new Response("Thiếu phiếu", { status: 400 });
    const order = await prisma.supplierOrder.findUniqueOrThrow({
      where: { id },
      include: { supplier: true, order: { include: { items: true } } },
    });
    const skus = await prisma.supplierSku.findMany({ where: { supplierId: order.supplierId } });
    const lines = order.order.items
      .filter((item) => item.supplierId === order.supplierId && item.supplierQty > 0)
      .map((item) => [
        order.poNumber,
        order.supplier.name,
        skus.find((row) => row.variantId === item.variantId)?.supplierSku || "",
        item.name,
        item.color,
        item.size,
        String(item.supplierQty),
      ].join(","));
    const csv = ["phiếu,nhà cung cấp,mã NCC,tên,màu,size,số lượng", ...lines].join("\n");
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${order.fileName || `${order.poNumber}.csv`}"`,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
