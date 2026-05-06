import { Suspense } from "react";
// import Brands from "@/components/Brands";
import ScrollUp from "@/components/Common/ScrollUp";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import WhyInvest from "@/components/WhyInvest";
import TwoWaysToInvest from "@/components/TwoWaysToInvest";
import Team from "@/components/Team";
import Testimonials from "@/components/Testimonials";
import Video from "@/components/Video";
import InvestmentsSkeleton from "@/components/TwoWaysToInvest/InvestmentsSkeleton";
import { Metadata } from "next";
import { getInvestmentOptions } from "@/lib/data";

export const metadata: Metadata = {
  title: "Alvarado Associates - Real Estate Investment Platform",
  description: "Invest in premium real estate opportunities with Alvarado Associates. Access fractional property ownership, mortgage-backed investments, and expert-managed portfolios.",
  metadataBase: new URL("https://alvaradoassociatepartners.com"),
  alternates: {
    canonical: "/",
  },
  keywords: [
    "real estate investment",
    "property investment",
    "fractional property ownership",
    "Airbnb arbitrage",
    "mortgage investment",
    "passive income real estate",
    "Alvarado Associates",
  ],
  openGraph: {
    title: "Alvarado Associates - Real Estate Investment Platform",
    description: "Invest in premium real estate opportunities with Alvarado Associates. Access fractional property ownership, mortgage-backed investments, and expert-managed portfolios.",
    url: "https://alvaradoassociatepartners.com",
    type: "website",
    images: [{ url: "/images/og-image.jpg", width: 1200, height: 630, alt: "Alvarado Associates - Real Estate Investment" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Alvarado Associates - Real Estate Investment Platform",
    description: "Invest in premium real estate with fractional ownership & managed portfolios.",
    images: ["/images/og-image.jpg"],
  },
};

async function InvestmentsSection() {
  const options = await getInvestmentOptions();
  return <TwoWaysToInvest options={options} />;
}

export default function Home() {
  return (
    <>
      <ScrollUp />
      <Hero />
      <HowItWorks />
      <WhyInvest />
      <Suspense fallback={<InvestmentsSkeleton />}>
        <InvestmentsSection />
      </Suspense>
      <Team />
      <Video />
      {/* <Brands /> */}
      <Testimonials />
    </>
  );
}
