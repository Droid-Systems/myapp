"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { InvestmentProperty } from "@/types/investment";
import InvestmentModal from "@/components/InvestmentModal";
import BidModal from "@/components/BidModal";
import BuyNowModal from "@/components/BuyNowModal";
import PropertyDetailSkeleton from "@/components/PropertyDetailSkeleton";
import { api } from "@/lib/api";

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<InvestmentProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);
  const [existingInvestment, setExistingInvestment] = useState<{ id: string; amount: number; expectedROI: number; monthlyReturn: number } | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const [showBuyNowModal, setShowBuyNowModal] = useState(false);

  const handleBidSuccess = (bidAmount: number) => {
    setProperty((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        bidCount: (prev.bidCount ?? 0) + 1,
        recentBidAmount: bidAmount,
      };
    });
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [propResult, balResult] = await Promise.all([
          api.getProperty(params.id as string),
          api.getBalanceSummary(),
        ]);
        if (propResult.success && propResult.data) {
          setProperty(propResult.data as InvestmentProperty);
        }
        if (balResult.success && balResult.data) {
          setWalletBalance(balResult.data.balance ?? 0);
        }
      } catch {
        // ignore
      }
      // Fetch existing investment separately so it doesn't break property loading
      try {
        const checkResult = await api.checkPropertyInvestment(params.id as string);
        if (checkResult.success && checkResult.data?.exists && checkResult.data.investment) {
          setExistingInvestment(checkResult.data.investment);
        }
      } catch {
        // ignore - endpoint may not be deployed yet
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id]);

  if (loading) {
    return <PropertyDetailSkeleton />;
  }

  if (!property) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto mb-4 h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg font-semibold text-black dark:text-white">Property not found</p>
          <button
            onClick={() => router.push("/dashboard/property-market/properties")}
            className="mt-4 rounded-lg bg-primary px-6 py-3 font-semibold text-white hover:bg-primary/90"
          >
            Back to Properties
          </button>
        </div>
      </div>
    );
  }

  const fundingPercentage =
    property.investmentType === "pooled"
      ? (property.currentFunded / property.targetAmount) * 100
      : 100;

  const remainingAmount =
    property.investmentType === "pooled"
      ? property.targetAmount - property.currentFunded
      : 0;

  const amount = parseFloat(investmentAmount) || 0;
  const monthlyEarnings = amount * (property.monthlyReturn / 100);
  const annualEarnings = amount * (property.expectedROI / 100);

  const isIndividualClosed =
    property.investmentType === "individual" &&
    ["closed", "fully-funded"].includes(property.status.toLowerCase());

  const CATEGORY_LABELS: Record<string, string> = {
    airbnb_arbitrage: "Airbnb Arbitrage",
    airbnb_mortgage: "Airbnb Mortgage",
    for_sale: "For Sale",
  };

  const CATEGORY_COLORS: Record<string, string> = {
    airbnb_arbitrage: "bg-blue-600 text-white dark:bg-blue-700 dark:text-white",
    airbnb_mortgage: "bg-purple-600 text-white dark:bg-purple-700 dark:text-white",
    for_sale: "bg-green-600 text-white dark:bg-green-700 dark:text-white",
  };

  const getCategoryBadge = () => CATEGORY_COLORS[property.category] || "bg-gray-600 text-white";
  const getCategoryLabel = () => CATEGORY_LABELS[property.category] || property.category;

  const getRiskBadge = () => {
    const colors: Record<string, string> = {
      low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return colors[property.riskLevel] || "bg-gray-100 text-gray-800";
  };

  const formatInvestorCount = (count: number) => {
    return count === 1 ? "1 investor" : `${count} investors`;
  };

  return (
    <div className="min-h-screen">
      <button
        onClick={() => router.push("/dashboard/property-market/properties")}
        className="mb-4 flex items-center text-body-color hover:text-primary dark:text-body-color-dark"
      >
        <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Properties
      </button>

      {/* Image Carousel */}
      <div className="relative mb-6 h-64 overflow-hidden rounded-xl md:h-96">
        {property.images.length > 0 ? (
          <img
            src={property.images[currentImageIndex]}
            alt={property.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary/10 dark:bg-primary/20">
            <span className="text-7xl font-bold text-primary md:text-9xl">
              {property.title?.charAt(0)?.toUpperCase() || "P"}
            </span>
          </div>
        )}
        {property.images.length > 1 && (
          <>
            <button
              onClick={() => setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length)}
              className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentImageIndex((prev) => (prev + 1) % property.images.length)}
              className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <div className="absolute bottom-4 right-4 rounded-lg bg-black/50 px-3 py-1 text-sm text-white">
              {currentImageIndex + 1} / {property.images.length}
            </div>
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-6">
            <div className="mb-3 flex flex-wrap gap-2">
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getCategoryBadge()}`}>
                {getCategoryLabel()}
              </span>
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${property.investmentType === "individual" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"}`}>
                {property.investmentType === "individual" ? "Individual" : "Pooled"}
              </span>
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getRiskBadge()}`}>
                {property.riskLevel.charAt(0).toUpperCase() + property.riskLevel.slice(1)} Risk
              </span>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-black dark:text-white md:text-3xl">{property.title}</h1>
            <p className="flex items-center text-body-color dark:text-body-color-dark">
              <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {property.location}
            </p>
          </div>

          <div className="mb-6 rounded-xl border border-gray-200 bg-white shadow dark:border-gray-800 dark:bg-gray-dark">
            <button
              onClick={() => setAboutOpen((prev) => !prev)}
              className="flex w-full items-center justify-between p-6 text-left"
            >
              <h2 className="text-xl font-bold text-black dark:text-white">About This Property</h2>
              <svg
                className={`h-5 w-5 text-body-color transition-transform duration-300 dark:text-body-color-dark ${aboutOpen ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {aboutOpen && (
              <div className="border-t border-gray-200 px-6 pb-6 pt-4 dark:border-gray-700">
                <p className="text-body-color dark:text-body-color-dark">{property.description}</p>
              </div>
            )}
          </div>

          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow dark:border-gray-800 dark:bg-gray-dark">
            <h2 className="mb-4 text-xl font-bold text-black dark:text-white">Property Details</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <p className="mb-1 text-sm text-body-color dark:text-body-color-dark">Bedrooms</p>
                <p className="text-lg font-semibold text-black dark:text-white">{property.bedrooms}</p>
              </div>
              <div>
                <p className="mb-1 text-sm text-body-color dark:text-body-color-dark">Bathrooms</p>
                <p className="text-lg font-semibold text-black dark:text-white">{property.bathrooms}</p>
              </div>
              <div>
                <p className="mb-1 text-sm text-body-color dark:text-body-color-dark">Parking</p>
                <p className="text-lg font-semibold text-black dark:text-white">{property.parking}</p>
              </div>
              <div>
                <p className="mb-1 text-sm text-body-color dark:text-body-color-dark">Area</p>
                <p className="text-lg font-semibold text-black dark:text-white">{property.area}</p>
              </div>
            </div>
          </div>

          {property.features.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white shadow dark:border-gray-800 dark:bg-gray-dark">
              {(property.category === "airbnb_mortgage" || property.category === "airbnb_arbitrage") ? (
                <>
                  <button
                    onClick={() => setFeaturesOpen((prev) => !prev)}
                    className="flex w-full items-center justify-between p-6 text-left"
                  >
                    <h2 className="text-xl font-bold text-black dark:text-white">Features & Amenities</h2>
                    <svg
                      className={`h-5 w-5 text-body-color transition-transform duration-300 dark:text-body-color-dark ${featuresOpen ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {featuresOpen && (
                    <div className="border-t border-gray-200 px-6 pb-6 pt-4 dark:border-gray-700">
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                        {property.features.map((feature, index) => (
                          <div key={index} className="flex items-center">
                            <svg className="mr-2 h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-black dark:text-white">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-6">
                  <h2 className="mb-4 text-xl font-bold text-black dark:text-white">Features & Amenities</h2>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    {property.features.map((feature, index) => (
                      <div key={index} className="flex items-center">
                        <svg className="mr-2 h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-black dark:text-white">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-6 mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow dark:border-gray-800 dark:bg-gray-dark">
            <h2 className="mb-4 text-xl font-bold text-black dark:text-white">Investment Overview</h2>
            <div className="mb-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-body-color dark:text-body-color-dark">{property.category === "for_sale" ? "Possible Annual ROI" : "Expected ROI"}</span>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">{property.expectedROI}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-body-color dark:text-body-color-dark">Monthly Return</span>
                <span className="font-semibold text-black dark:text-white">{property.monthlyReturn}%</span>
              </div>
              {property.category !== "for_sale" && (
                <div className="flex justify-between">
                  <span className="text-sm text-body-color dark:text-body-color-dark">Duration</span>
                  <span className="font-semibold text-black dark:text-white">{property.duration} months</span>
                </div>
              )}

              {/* Individual/Mortgage Properties - Show Property Worth and Amount Required */}
              {property.investmentType === "individual" && (
                <>
                  <div className="flex justify-between border-t border-gray-200 pt-3 dark:border-gray-700">
                    <span className="text-sm text-body-color dark:text-body-color-dark">{property.category === "for_sale" ? "Property Price" : "Property Worth"}</span>
                    <span className="text-xl font-bold text-black dark:text-white">${property.price.toLocaleString()}</span>
                  </div>
                  {property.category === "for_sale" ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-body-color dark:text-body-color-dark">Minimum Bid</span>
                        <span className="font-semibold text-primary">${property.minInvestment.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-body-color dark:text-body-color-dark">Number of Bids</span>
                        <span className="font-semibold text-black dark:text-white">{property.bidCount ?? property.investorCount ?? 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-body-color dark:text-body-color-dark">Recent Bid Amount</span>
                        <span className="font-semibold text-primary">
                          {property.recentBidAmount ? `$${property.recentBidAmount.toLocaleString()}` : "—"}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-sm text-body-color dark:text-body-color-dark">Amount Required</span>
                      <span className="font-semibold text-primary">${property.minInvestment.toLocaleString()}</span>
                    </div>
                  )}
                </>
              )}

              {/* Pooled/Airbnb Properties - Show Min/Max Investment */}
              {property.investmentType === "pooled" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-body-color dark:text-body-color-dark">Min Investment</span>
                    <span className="font-semibold text-black dark:text-white">${property.minInvestment.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-body-color dark:text-body-color-dark">Max Investment</span>
                    <span className="font-semibold text-black dark:text-white">${property.maxInvestment.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-body-color dark:text-body-color-dark">Target</span>
                    <span className="font-semibold text-black dark:text-white">${property.targetAmount.toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>

            {property.investmentType === "pooled" && (
              <div className="mb-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-body-color dark:text-body-color-dark">Funded: ${property.currentFunded.toLocaleString()}</span>
                  <span className="font-semibold text-primary">{Math.min(fundingPercentage, 100).toFixed(1)}%</span>
                </div>
                <div className="mb-2 h-3 rounded-full bg-gray-200 dark:bg-gray-700">
                  <div className="h-3 rounded-full bg-primary transition-all" style={{ width: `${Math.min(fundingPercentage, 100)}%` }} />
                </div>
                <div className="flex justify-between text-xs text-body-color dark:text-body-color-dark">
                  <span>{formatInvestorCount(property.investorCount)}</span>
                  <span>${remainingAmount.toLocaleString()} remaining</span>
                </div>
              </div>
            )}

            {existingInvestment && (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-semibold text-green-800 dark:text-green-300">You have an active investment</span>
                </div>
                <p className="text-lg font-bold text-green-700 dark:text-green-400">
                  ${existingInvestment.amount.toLocaleString()}
                </p>
                {!isIndividualClosed && (
                  <p className="text-xs text-green-600 dark:text-green-500 mt-1">Add more funds to increase your position</p>
                )}
              </div>
            )}

            {!isIndividualClosed && (
              <>
                <div className="mb-6">
                  <label className="mb-2 block text-sm font-semibold text-black dark:text-white">{property.category === "for_sale" ? "Bid Amount" : existingInvestment ? "Top-Up Amount" : "Investment Amount"}</label>
                  <input
                    type={property.category === "for_sale" ? "text" : "number"}
                    inputMode="decimal"
                    value={investmentAmount}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (property.category === "for_sale") {
                        if (val === "" || /^\d*\.?\d*$/.test(val)) setInvestmentAmount(val);
                      } else {
                        setInvestmentAmount(val);
                      }
                    }}
                    {...(property.category !== "for_sale" && {
                      min: property.minInvestment,
                      max: property.investmentType === "pooled" ? Math.min(property.maxInvestment, remainingAmount) : property.maxInvestment,
                    })}
                    placeholder={property.category === "for_sale" ? "Enter your bid amount" : `Min: $${property.minInvestment.toLocaleString()}`}
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                {amount > 0 && (
                  <div className="mb-6 space-y-3 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-800 dark:text-blue-300">Monthly Earnings</span>
                      <span className="font-bold text-green-600 dark:text-green-400">${monthlyEarnings.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-800 dark:text-blue-300">Annual Earnings</span>
                      <span className="font-bold text-green-600 dark:text-green-400">${annualEarnings.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </>
            )}

            {property.category === "for_sale" ? (
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBidModal(true)}
                  disabled={property.status.toLowerCase() !== "available"}
                  className="flex-1 rounded-lg border border-primary px-6 py-3 font-semibold text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Bid
                </button>
                <button
                  onClick={() => setShowBuyNowModal(true)}
                  disabled={property.status.toLowerCase() !== "available"}
                  className="flex-1 rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Buy Now
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowInvestmentModal(true)}
                disabled={property.status.toLowerCase() !== "available" || amount < property.minInvestment}
                className="w-full rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {property.status.toLowerCase() === "available" ? (existingInvestment ? "Top Up Investment" : "Invest Now") : property.status.toLowerCase() === "fully-funded" ? "Fully Funded" : property.status.toLowerCase() === "closed" ? "Closed" : "Coming Soon"}
              </button>
            )}

            {property.status.toLowerCase() === "available" && amount < property.minInvestment && amount > 0 && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                Minimum bid is ${property.minInvestment.toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {showInvestmentModal && (
        <InvestmentModal
          isOpen={showInvestmentModal}
          onClose={() => setShowInvestmentModal(false)}
          property={property}
          walletBalance={walletBalance}
          initialAmount={amount}
          existingInvestment={existingInvestment}
        />
      )}

      <BidModal
        isOpen={showBidModal}
        onClose={() => setShowBidModal(false)}
        property={{ id: property.id, title: property.title, location: property.location }}
        initialAmount={investmentAmount}
        onSuccess={handleBidSuccess}
      />

      <BuyNowModal
        isOpen={showBuyNowModal}
        onClose={() => setShowBuyNowModal(false)}
        property={{ id: property.id, title: property.title, location: property.location, price: property.price }}
      />
    </div>
  );
}
