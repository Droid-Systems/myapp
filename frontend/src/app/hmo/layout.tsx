import { Metadata } from "next";

export const metadata: Metadata = {
  title: "HMO Investment | Alvarado Associates - Houses in Multiple Occupation",
  description: "Explore HMO investment opportunities with Alvarado Associates. High-yield houses in multiple occupation with professional management and strong rental returns.",
  alternates: { canonical: "https://alvaradoassociatepartners.com/hmo" },
  openGraph: {
    title: "HMO Investment | Alvarado Associates",
    description: "High-yield HMO investment opportunities with professional management.",
    url: "https://alvaradoassociatepartners.com/hmo",
    type: "website",
  },
};

export default function HMOLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
