import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Property Listings | Alvarado Associates - Browse Investment Properties",
  description: "Browse available real estate investment properties on Alvarado Associates. Find individual and pooled investment opportunities with strong projected returns.",
  alternates: { canonical: "https://alvaradoassociatepartners.com/listings" },
  keywords: [
    "investment properties",
    "real estate listings",
    "fractional ownership",
    "pooled investment",
    "Airbnb investment property",
    "buy to let investment",
  ],
  openGraph: {
    title: "Property Listings | Alvarado Associates",
    description: "Browse available real estate investment properties with strong projected returns.",
    url: "https://alvaradoassociatepartners.com/listings",
    type: "website",
  },
};

export default function ListingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
