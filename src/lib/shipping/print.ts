export function reviewPrintAccess(role: string | null | undefined) {
  if (!role) return { ok: false as const, status: 307 as const, location: "/dang-nhap" };
  if (role !== "ADMIN") return { ok: false as const, status: 307 as const, location: "/" };
  return { ok: true as const, status: 200 as const };
}

export type SlipShipment = {
  shipmentNumber: string;
  trackingCode: string | null;
  status: string;
  items: { name: string; sku: string; quantity: number }[];
};

export function buildSlips(input: {
  orderNumber: string;
  customerName: string;
  phone: string;
  address: string;
  shipments: SlipShipment[];
}) {
  return {
    packing: input.shipments.map((shipment) => ({
      title: "Phiếu đóng gói",
      orderNumber: input.orderNumber,
      shipmentNumber: shipment.shipmentNumber,
      trackingCode: shipment.trackingCode,
      customerName: input.customerName,
      phone: input.phone,
      address: input.address,
      items: shipment.items,
    })),
    picking: input.shipments.map((shipment) => ({
      title: "Phiếu xuất kho",
      orderNumber: input.orderNumber,
      shipmentNumber: shipment.shipmentNumber,
      items: shipment.items,
    })),
  };
}
