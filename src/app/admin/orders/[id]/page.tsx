"use client";

import { useParams } from "next/navigation";
import { OrderDetailClient } from "@/components/admin/order-detail-client";

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  return <OrderDetailClient orderId={params.id} />;
}