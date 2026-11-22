import { PolicyDocument, policyMetadata } from "@/components/legal/policy-page";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return policyMetadata("huong-dan-chon-size");
}

export default function Page() {
  return <PolicyDocument slug="huong-dan-chon-size" />;
}
