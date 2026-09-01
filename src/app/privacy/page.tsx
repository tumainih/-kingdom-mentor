import type { Metadata } from "next";
import { PrivacyPolicyView } from "@/components/legal/privacy-policy-view";

export const metadata: Metadata = {
  title: "Privacy Policy — Kingdom AI",
  description: "How Kingdom AI handles your data on device and on our servers.",
};

export default function PrivacyPage() {
  return <PrivacyPolicyView />;
}
