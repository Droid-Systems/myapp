import { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ | Alvarado Associates - Frequently Asked Questions",
  description: "Find answers to common questions about investing with Alvarado Associates — returns, property types, minimum investments, withdrawals, and more.",
  alternates: { canonical: "https://alvaradoassociatepartners.com/faq" },
  openGraph: {
    title: "FAQ | Alvarado Associates",
    description: "Answers to your most common real estate investment questions.",
    url: "https://alvaradoassociatepartners.com/faq",
    type: "website",
  },
};

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
