import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Withdrawal Policy | Alvarado Associates",
  description: "Learn about the Alvarado Associates withdrawal policy, including timelines, conditions, and how to access your investment returns.",
  alternates: { canonical: "https://alvaradoassociatepartners.com/withdrawal-policy" },
};

export default function WithdrawalPolicyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
