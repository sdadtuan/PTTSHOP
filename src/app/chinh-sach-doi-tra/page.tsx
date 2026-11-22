import { PolicyDocument, policyMetadata } from "@/components/legal/policy-page";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return policyMetadata("chinh-sach-doi-tra");
}

export default function Page() {
  return <PolicyDocument slug="chinh-sach-doi-tra" />;
}
