"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import PropertyForm, { PropertyFormValues } from "../../_components/PropertyForm";

export default function EditPropertyPage() {
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetch() {
      try {
        const res = await api.adminGetProperty(id);
        if (res.success && res.data) {
          setProperty(res.data);
        } else {
          setError("Property not found.");
        }
      } catch {
        setError("Failed to load property.");
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-black" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">{error || "Property not found."}</p>
          <Link href="/admin/properties" className="mt-4 inline-block text-sm text-black underline">
            Back to Properties
          </Link>
        </div>
      </div>
    );
  }

  // Helper: join array fields to comma-separated strings for the form
  const arr = (val: any): string =>
    Array.isArray(val) ? val.join(", ") : (val ?? "");
  const str = (val: any): string =>
    val != null ? String(val) : "";

  // Map API property to form values
  const initialValues: Partial<PropertyFormValues> = {
    // Core
    title: str(property.title),
    subject: str(property.subject),
    location: str(property.location),
    description: str(property.description),
    type: str(property.type),
    category: property.category ?? "airbnb_arbitrage",
    investmentType: property.investmentType ?? "pooled",
    investmentStatus: property.investmentStatus ?? "open",
    riskLevel: str(property.riskLevel),
    // Financials
    price: str(property.price),
    minInvestment: str(property.minInvestment),
    maxInvestment: str(property.maxInvestment),
    targetAmount: str(property.targetAmount),
    monthlyReturn: str(property.monthlyReturn),
    duration: str(property.duration),
    // Property details
    bedrooms: str(property.bedrooms),
    bathrooms: str(property.bathrooms),
    parking: str(property.parking),
    sqft: str(property.sqft),
    features: arr(property.features),
    latitude: str(property.latitude),
    longitude: str(property.longitude),
    // Manager
    managerName: str(property.managerName),
    managerRole: str(property.managerRole),
    managerPhone: str(property.managerPhone),
    // Flags
    isFeatured: property.isFeatured ?? false,
    isActive: property.isActive ?? true,
    // For Sale: Interior
    fullBathrooms: str(property.fullBathrooms),
    heating: arr(property.heating),
    cooling: arr(property.cooling),
    appliancesIncluded: arr(property.appliancesIncluded),
    laundry: arr(property.laundry),
    interiorFeatures: arr(property.interiorFeatures),
    flooring: arr(property.flooring),
    windows: arr(property.windows),
    basement: str(property.basement),
    fireplaceCount: str(property.fireplaceCount),
    fireplaceFeatures: arr(property.fireplaceFeatures),
    totalStructureArea: str(property.totalStructureArea),
    totalLivableArea: str(property.totalLivableArea),
    // For Sale: Exterior
    levels: str(property.levels),
    stories: str(property.stories),
    patioAndPorch: arr(property.patioAndPorch),
    exteriorFeatures: arr(property.exteriorFeatures),
    poolFeatures: arr(property.poolFeatures),
    hasSpa: property.hasSpa ?? false,
    spaFeatures: arr(property.spaFeatures),
    fencing: arr(property.fencing),
    // For Sale: Lot
    lotFeatures: arr(property.lotFeatures),
    additionalStructures: str(property.additionalStructures),
    parcelNumber: str(property.parcelNumber),
    // For Sale: Construction
    homeType: str(property.homeType),
    propertySubtype: str(property.propertySubtype),
    constructionMaterials: arr(property.constructionMaterials),
    foundation: arr(property.foundation),
    roof: arr(property.roof),
    yearBuilt: str(property.yearBuilt),
    // For Sale: Utilities
    sewer: arr(property.sewer),
    water: arr(property.water),
    utilitiesForProperty: arr(property.utilitiesForProperty),
    // For Sale: Community & HOA
    communityFeatures: arr(property.communityFeatures),
    security: arr(property.security),
    subdivision: str(property.subdivision),
    hasHOA: property.hasHOA ?? false,
    hoaFee: str(property.hoaFee),
    region: str(property.region),
    // For Sale: Listing & Tax
    pricePerSqft: str(property.pricePerSqft),
    taxAssessedValue: str(property.taxAssessedValue),
    annualTaxAmount: str(property.annualTaxAmount),
    dateOnMarket: property.dateOnMarket ? String(property.dateOnMarket).slice(0, 10) : "",
    daysOnMarket: str(property.daysOnMarket),
    listingTerms: arr(property.listingTerms),
    // For Sale: Market Value
    zestimate: str(property.zestimate),
    estimatedSalesRangeLow: str(property.estimatedSalesRangeLow),
    estimatedSalesRangeHigh: str(property.estimatedSalesRangeHigh),
    rentZestimate: str(property.rentZestimate),
    zestimateChangePercent: str(property.zestimateChangePercent),
    zestimateChangeYears: str(property.zestimateChangeYears),
    // For Sale: Climate Risks
    floodZone: str(property.floodZone),
    floodZoneDescription: str(property.floodZoneDescription),
    fireRisk: str(property.fireRisk),
    windRisk: str(property.windRisk),
    airQualityRisk: str(property.airQualityRisk),
    firstStreetUrl: str(property.firstStreetUrl),
    // For Sale: Getting Around
    walkScore: str(property.walkScore),
    walkScoreDescription: str(property.walkScoreDescription),
    bikeScore: str(property.bikeScore),
    bikeScoreDescription: str(property.bikeScoreDescription),
    transitScore: str(property.transitScore),
    transitScoreDescription: str(property.transitScoreDescription),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/admin/properties"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Property</h1>
            <p className="max-w-xs truncate text-sm text-gray-500">{property.title}</p>
          </div>
        </div>

        <PropertyForm
          mode="edit"
          propertyId={id}
          initialValues={initialValues}
          existingImages={Array.isArray(property.images) ? property.images : []}
        />
      </div>
    </div>
  );
}
