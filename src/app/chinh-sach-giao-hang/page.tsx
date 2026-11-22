import { PolicyDocument, policyMetadata } from "@/components/legal/policy-page";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return policyMetadata("chinh-sach-giao-hang");
}

export default function Page() {
  return <PolicyDocument slug="chinh-sach-giao-hang" />;
}
