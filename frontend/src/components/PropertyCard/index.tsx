"use client";

import React from "react";
import { InvestmentProperty } from "@/types/investment";
import Link from "next/link";

interface PropertyCardProps {
  property: InvestmentProperty;
}

const PropertyCard = ({ property }: PropertyCardProps) => {
  const fundingPercentage =
    property.investmentType === "pooled"
      ? (property.currentFunded / property.targetAmount) * 100
      : 100;

  const remainingAmount =
    property.investmentType === "pooled"
      ? property.targetAmount - property.currentFunded
      : 0;

  const CATEGORY_LABELS: Record<string, string> = {
    airbnb_arbitrage: "Airbnb Arbitrage",
    airbnb_mortgage: "Airbnb Mortgage",
    for_sale: "For Sale",
  };

  const CATEGORY_COLORS: Record<string, string> = {
    airbnb_arbitrage: "#2563eb",
    airbnb_mortgage: "#9333ea",
    for_sale: "#16a34a",
  };

  const getCategoryStyle = (): React.CSSProperties => ({
    backgroundColor: CATEGORY_COLORS[property.category] || "#6b7280",
    color: "#fff",
  });

  const getCategoryLabel = (): string =>
    CATEGORY_LABELS[property.category] || property.category;

  const getTypeStyle = (): React.CSSProperties => {
    return {
      backgroundColor: property.investmentType === "individual" ? "#16a34a" : "#ea580c",
      color: "#fff",
    };
  };

  const getStatusBadge = () => {
    const colors = {
      available: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      "fully-funded": "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
      "coming-soon": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      closed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return colors[property.status];
  };

  return (
    <Link
      href={`/dashboard/property-market/properties/${property.id}`}
      className="group block rounded-xl border border-gray-200 bg-white shadow transition-all hover:border-primary hover:shadow-xl dark:border-gray-800 dark:bg-gray-dark"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden rounded-t-xl">
        {property.images[0] ? (
          <img
            src={property.images[0]}
            alt={property.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary/10 dark:bg-primary/20">
            <span className="text-5xl font-bold text-primary">
              {property.title?.charAt(0)?.toUpperCase() || "P"}
            </span>
          </div>
        )}
        {/* Category Badge */}
        <div className="absolute left-3 top-3">
          <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold shadow-md" style={getCategoryStyle()}>
            {getCategoryLabel()}
          </span>
        </div>
        {/* Type Badge */}
        <div className="absolute right-3 top-3">
          <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold shadow-md" style={getTypeStyle()}>
            {property.investmentType === "individual" ? "Individual" : "Pooled"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title and Location */}
        <h3 className="mb-2 text-lg font-bold text-black dark:text-white line-clamp-2">
          {property.title}
        </h3>
        <p className="mb-3 flex items-center text-sm text-body-color dark:text-body-color-dark">
          <svg
            className="mr-1 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {property.location}
        </p>

        {/* Property Details */}
        <div className="mb-4 flex items-center gap-4 text-sm text-body-color dark:text-body-color-dark">
          <span className="flex items-center">
            <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {property.bedrooms} Beds
          </span>
          <span className="flex items-center">
            <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
            </svg>
            {property.bathrooms} Baths
          </span>
          <span>{property.area}</span>
        </div>

        {/* Pooled Investment Progress */}
        {property.investmentType === "pooled" && (
          <div className="mb-4">
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-body-color dark:text-body-color-dark">
                Funded: ${property.currentFunded.toLocaleString()}
              </span>
              <span className="font-semibold text-black dark:text-white">
                Target: ${property.targetAmount.toLocaleString()}
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-2 rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(fundingPercentage, 100)}%` }}
              />
            </div>
            <p className="mt-1 flex justify-between text-xs">
              <span className="text-body-color dark:text-body-color-dark">
                ${remainingAmount.toLocaleString()} remaining
              </span>
              <span className="font-semibold text-primary">
                {fundingPercentage.toFixed(1)}%
              </span>
            </p>
          </div>
        )}

        {/* Price and ROI */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-body-color dark:text-body-color-dark">
              {property.investmentType === "individual" ? "Property Worth" : "Min Investment"}
            </p>
            <p className="text-2xl font-bold text-black dark:text-white">
              ${(property.investmentType === "individual" ? property.price : property.minInvestment).toLocaleString()}
            </p>
            {property.investmentType === "individual" && (
              <p className="mt-1 text-xs text-body-color dark:text-body-color-dark">
                {property.category === "for_sale" ? "Minimum Bid" : "Amount Required"}: <span className="font-semibold text-primary">${property.minInvestment.toLocaleString()}</span>
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-body-color dark:text-body-color-dark">
              {property.category === "for_sale" ? "Possible Annual ROI" : "Annual ROI"}
            </p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {property.expectedROI}%
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {property.features.slice(0, 3).map((feature, index) => (
              <span
                key={index}
                className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                {feature}
              </span>
            ))}
            {property.features.length > 3 && (
              <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                +{property.features.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Status and View Details */}
        <div className="flex items-center justify-between">
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge()}`}>
            {property.status === "fully-funded" ? "Fully Funded" : property.status.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
          </span>
          <span className="text-sm font-semibold text-primary group-hover:underline">
            View Details →
          </span>
        </div>
      </div>
    </Link>
  );
};

export default PropertyCard;
