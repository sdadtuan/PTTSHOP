"use client";

import { useParams } from "next/navigation";
import { ProductEditor } from "@/components/admin/product-editor/product-editor";

export default function AdminProductEditPage() {
  const params = useParams<{ id: string }>();
  return <ProductEditor key={params.id} productId={params.id} />;
}
