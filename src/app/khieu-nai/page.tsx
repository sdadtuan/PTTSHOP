import { PolicyDocument, policyMetadata } from "@/components/legal/policy-page";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return policyMetadata("khieu-nai");
}

export default function Page() {
  return <PolicyDocument slug="khieu-nai" />;
}
