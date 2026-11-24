import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buildSlips, reviewPrintAccess } from "@/lib/shipping/print";

export default async function PrintSlipsPage({ params }: { params: Promise<{ orderId: string }> }) {
  const session = await auth();
  const gate = reviewPrintAccess(session?.user?.role);
  if (!gate.ok) {
    redirect(gate.location === "/dang-nhap" ? "/dang-nhap?callbackUrl=/admin/van-chuyen" : "/");
  }
  const { orderId } = await params;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, shipments: { include: { items: true }, orderBy: { createdAt: "asc" } } },
  });
  if (!order) return <p>Không tìm thấy đơn.</p>;
  const slips = buildSlips({
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    phone: order.customerPhone,
    address: order.address,
    shipments: order.shipments.map((shipment) => ({
      shipmentNumber: shipment.shipmentNumber || "",
      trackingCode: shipment.trackingCode,
      status: shipment.status || "",
      items: shipment.items.map((item) => {
        const source = order.items.find((row) => row.id === item.orderItemId);
        return { name: source?.name || "Sản phẩm", sku: `${source?.color || ""}/${source?.size || ""}`, quantity: item.quantity || 0 };
      }),
    })),
  });

  return (
    <div className="space-y-8 bg-white text-sm">
      <style>{`@media print { .slip { break-after: page; } @page { margin: 12mm; } }`}</style>
      {slips.packing.map((slip) => (
        <section key={`pack-${slip.shipmentNumber}`} className="slip">
          <h1 className="text-xl font-bold">{slip.title}</h1>
          <p>Đơn {slip.orderNumber} · Kiện {slip.shipmentNumber}</p>
          <p>Mã vận đơn: {slip.trackingCode || "Chưa có"}</p>
          <p>{slip.customerName} · {slip.phone}</p>
          <p>{slip.address}</p>
          <ul className="mt-3">{slip.items.map((item) => <li key={`${item.name}-${item.sku}`}>{item.quantity} × {item.name} ({item.sku})</li>)}</ul>
        </section>
      ))}
      {slips.picking.map((slip) => (
        <section key={`pick-${slip.shipmentNumber}`} className="slip">
          <h1 className="text-xl font-bold">{slip.title}</h1>
          <p>Đơn {slip.orderNumber} · Kiện {slip.shipmentNumber}</p>
          <ul className="mt-3">{slip.items.map((item) => <li key={`${item.name}-${item.sku}`}>{item.quantity} × {item.name} ({item.sku})</li>)}</ul>
        </section>
      ))}
      {order.shipments.length === 0 ? <p>Đơn chưa có kiện để in.</p> : null}
    </div>
  );
}
