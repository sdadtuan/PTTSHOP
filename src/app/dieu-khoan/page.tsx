import { PolicyDocument, policyMetadata } from "@/components/legal/policy-page";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return policyMetadata("dieu-khoan");
}

export default function Page() {
  return <PolicyDocument slug="dieu-khoan" />;
}
