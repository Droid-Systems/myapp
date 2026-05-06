"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { InvestmentProperty } from "@/types/investment";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface Property {
  id: string;
  title: string;
  price: string;
  description: string;
  images: string[];
  bedrooms: number;
  bathrooms: number;
  parking: number;
  status: string;
  investmentType: "individual" | "pooled";
  category: string;
}


// Helper function to map API property data to component format
function mapPropertyData(apiProperty: InvestmentProperty): Property {
  const rawStatus = apiProperty.status || "";
  const formattedStatus = rawStatus
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    id: apiProperty.id,
    title: apiProperty.title,
    price: apiProperty.category === "for_sale"
      ? (apiProperty.price > 0 ? `$${apiProperty.price.toLocaleString()}` : "Contact for price")
      : (apiProperty.investmentType === "pooled"
          ? (apiProperty.minInvestment > 0 ? `$${apiProperty.minInvestment.toLocaleString()}` : (apiProperty.targetAmount > 0 ? `$${apiProperty.targetAmount.toLocaleString()}` : "N/A"))
          : `$${(apiProperty.minInvestment || 0).toLocaleString()}`),
    description: apiProperty.description,
    images: apiProperty.images && apiProperty.images.length > 0 ? apiProperty.images : [
      "/images/how-it-works/property-1.jpg",
      "/images/how-it-works/property-2.jpg",
      "/images/how-it-works/property-3.jpg",
    ],
    bedrooms: apiProperty.bedrooms,
    bathrooms: apiProperty.bathrooms,
    parking: apiProperty.parking,
    status: formattedStatus || "N/A",
    investmentType: apiProperty.investmentType,
    category: apiProperty.category || "",
  };
}

function PropertyCard({ property }: { property: Property }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === property.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? property.images.length - 1 : prev - 1
    );
  };

  return (
    <div className="group overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-500 ease-in-out hover:-translate-y-2 hover:shadow-2xl dark:bg-gray-dark">
      {/* Property Image with Carousel */}
      <div className="relative h-64 w-full overflow-hidden">
        {property.images[currentImageIndex] ? (
          <Image
            src={property.images[currentImageIndex]}
            alt={property.title}
            fill
            className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary/10 dark:bg-primary/20">
            <span className="text-6xl font-bold text-primary">
              {property.title?.charAt(0)?.toUpperCase() || "P"}
            </span>
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black opacity-0 transition-opacity duration-500 ease-in-out group-hover:opacity-10" />

        {/* Category Badge */}
        {property.category && (
          <div className="absolute left-4 top-4 z-10">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold text-white shadow-md ${{
              airbnb_arbitrage: "bg-blue-600",
              airbnb_mortgage: "bg-purple-600",
              for_sale: "bg-green-600",
            }[property.category] ?? "bg-gray-600"}`}>
              {({ airbnb_arbitrage: "Airbnb Arbitrage", airbnb_mortgage: "Airbnb Mortgage", for_sale: "For Sale" } as Record<string, string>)[property.category] ?? property.category}
            </span>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute right-4 top-4 z-10 flex flex-col items-end gap-2">
          <span className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:bg-primary">
            {property.status}
          </span>
          {/* Investment Type Badge */}
          <span className={`rounded-full px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all duration-300 group-hover:scale-105 ${
            property.investmentType === "individual" ? "bg-green-600" : "bg-orange-600"
          }`}>
            {property.investmentType === "individual" ? "Individual" : "Pooled"}
          </span>
        </div>

        {/* Navigation Arrows */}
        {property.images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 opacity-100 shadow-md backdrop-blur-sm transition-all duration-300 ease-in-out hover:scale-110 hover:bg-white hover:shadow-lg active:scale-95 md:left-4 lg:opacity-0 lg:group-hover:opacity-100"
              aria-label="Previous image"
            >
              <svg
                className="h-5 w-5 text-black transition-transform duration-300 hover:-translate-x-1 md:h-6 md:w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 opacity-100 shadow-md backdrop-blur-sm transition-all duration-300 ease-in-out hover:scale-110 hover:bg-white hover:shadow-lg active:scale-95 md:right-4 lg:opacity-0 lg:group-hover:opacity-100"
              aria-label="Next image"
            >
              <svg
                className="h-5 w-5 text-black transition-transform duration-300 hover:translate-x-1 md:h-6 md:w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}

        {/* Photo Count */}
        <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1 rounded-lg bg-black/60 px-3 py-1.5 backdrop-blur-sm">
          <svg
            className="h-4 w-4 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm font-medium text-white">
            {property.images.length}
          </span>
        </div>

        {/* Favorite Heart */}
        <button
          onClick={() => setIsFavorite(!isFavorite)}
          className="absolute bottom-4 right-4 z-10 rounded-full bg-white/80 p-2.5 backdrop-blur-sm transition-all duration-300 ease-in-out hover:scale-110 hover:bg-white hover:shadow-lg"
          aria-label="Add to favorites"
        >
          <svg
            className={`h-6 w-6 transition-all duration-300 ${
              isFavorite
                ? "scale-110 fill-red-500 text-red-500"
                : "fill-none text-black hover:scale-105"
            }`}
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>
      </div>

      {/* Property Details */}
      <div className="p-6">
        <h3 className="mb-3 text-xl font-bold text-black transition-colors duration-300 group-hover:text-primary dark:text-white dark:group-hover:text-primary">
          {property.title}
        </h3>
        <p className="mb-4 text-2xl font-bold text-black transition-all duration-300 group-hover:scale-105 dark:text-white">
          {property.price}
        </p>
        <p className="mb-5 line-clamp-4 text-sm leading-relaxed text-body-color transition-colors duration-300 dark:text-body-color-dark">
          {property.description}
        </p>

        {/* Property Amenities */}
        <div className="mb-6 flex items-center gap-6 border-t border-gray-200 pt-4 transition-colors duration-300 group-hover:border-primary/30 dark:border-gray-700">
          {/* Bedrooms */}
          <div className="flex items-center gap-2 transition-all duration-300 hover:scale-110">
            <svg
              className="h-5 w-5 text-body-color transition-colors duration-300 group-hover:text-primary dark:text-body-color-dark"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            <span className="text-sm font-medium text-body-color transition-colors duration-300 dark:text-body-color-dark">
              {property.bedrooms}
            </span>
          </div>

          {/* Bathrooms */}
          <div className="flex items-center gap-2 transition-all duration-300 hover:scale-110">
            <svg
              className="h-5 w-5 text-body-color transition-colors duration-300 group-hover:text-primary dark:text-body-color-dark"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 00-3.903 4.879L2 14v2a2 2 0 002 2h12a2 2 0 002-2v-2l-2.097-5.121A4 4 0 0012 4H8zm2 5a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium text-body-color transition-colors duration-300 dark:text-body-color-dark">
              {property.bathrooms}
            </span>
          </div>

          {/* Parking */}
          <div className="flex items-center gap-2 transition-all duration-300 hover:scale-110">
            <svg
              className="h-5 w-5 text-body-color transition-colors duration-300 group-hover:text-primary dark:text-body-color-dark"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3z" />
            </svg>
            <span className="text-sm font-medium text-body-color transition-colors duration-300 dark:text-body-color-dark">
              {property.parking}
            </span>
          </div>
        </div>

        {/* View More Button */}
        <Link
          href={`/listings/${property.id}`}
          className="group/btn relative block w-full overflow-hidden rounded-full bg-black px-8 py-3 text-center text-base font-medium text-white transition-all duration-500 ease-in-out hover:scale-105 hover:shadow-xl dark:bg-white dark:text-black"
        >
          <span className="relative z-10 transition-transform duration-300 group-hover/btn:translate-x-1">
            View More
          </span>
          <span className="absolute inset-0 z-0 translate-x-[-100%] bg-primary transition-transform duration-500 ease-in-out group-hover/btn:translate-x-0" />
          <svg
            className="absolute right-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 translate-x-8 opacity-0 transition-all duration-300 group-hover/btn:translate-x-0 group-hover/btn:opacity-100"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}

export default function ListingsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await fetch(`${API_URL}/api/public/properties`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        const list: InvestmentProperty[] = data.data || [];
        setProperties(list.map(mapPropertyData));
      } catch (error: any) {
        console.error("Failed to fetch properties:", error);
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  return (
    <section className="relative z-10 overflow-hidden bg-white pb-12 pt-36 dark:bg-gray-dark md:pb-20 lg:pb-28 lg:pt-40">
      <div className="container mx-auto">
        {/* Investment Section */}
        <div className="mb-16 overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-dark">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left Side - Image with Overlay Text */}
            <div className="relative h-[400px] overflow-hidden lg:h-auto">
              <Image
                src="/images/investment/entire-ownership.jpg"
                alt="Investment Property"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-black/70 to-black/50" />

              {/* Top-left: Earn Monthly */}
              <div className="absolute left-0 top-0 p-8 text-white md:p-12 lg:p-16">
                <p className="mb-2 text-sm font-medium uppercase tracking-wider md:text-base">
                  EARN MONTHLY
                </p>
                <h2 className="text-5xl font-bold md:text-7xl lg:text-6xl">
                  7% -15%
                </h2>
              </div>

              {/* Bottom-right: Investment */}
              <div className="absolute bottom-0 right-0 p-8 text-right text-white md:p-12 lg:p-16">
                <p className="mb-3 text-lg font-semibold uppercase tracking-wide md:text-xl">
                  INVESTMENT
                </p>
                <p className="mb-4 text-5xl font-bold md:text-6xl lg:text-7xl">
                  $15,000
                </p>
                <p className="text-base text-gray-300 md:text-lg">
                  Minimum investment: $15,000
                </p>
              </div>
            </div>

            {/* Right Side - Content */}
            <div className="flex flex-col justify-center bg-white p-8 dark:bg-gray-dark md:p-12 lg:p-16">
              <h3 className="mb-6 text-xl font-bold text-black dark:text-white md:text-2xl lg:text-3xl">
              Own the Lease. Control the Asset. Earn from Day One.
              </h3>
              <p className="mb-8 text-4xl font-bold text-black dark:text-white md:text-5xl">
              $15k+ Entry
              </p>
              <p className="mb-4 text-base leading-relaxed text-body-color dark:text-body-color-dark md:text-lg">
                Gain exclusive access to fully leased Airbnb properties — from sophisticated urban condos to premium private villas — designed specifically for high-net-worth investors seeking strong short-term rental returns.
              </p>
              <p className="mb-4 text-base leading-relaxed text-body-color dark:text-body-color-dark md:text-lg">
                With entry points starting at just $15,000, this is a rare opportunity to participate in the booming hospitality market without the complexity of traditional property ownership.
              </p>
              <p className="mb-4 text-base leading-relaxed text-body-color dark:text-body-color-dark md:text-lg">
                As the leaseholder, you enjoy complete operational control over the asset, along with complimentary stays for personal or holiday use. And should your investment goals evolve, you retain the flexibility to exit by transferring your lease on your own terms.
              </p>
              <p className="text-base font-semibold leading-relaxed text-black dark:text-white md:text-lg">
                This isn&apos;t just an investment. It&apos;s a lifestyle asset that works for you.
              </p>
            </div>
          </div>
        </div>

        {/* Properties Header */}
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold leading-tight text-black dark:text-white sm:text-4xl sm:leading-tight md:text-[45px] md:leading-tight">
            Properties
          </h2>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl bg-white shadow-lg dark:bg-gray-dark"
              >
                <div className="h-64 w-full animate-pulse bg-gray-200 dark:bg-gray-700" />
                <div className="p-6">
                  <div className="mb-3 h-6 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="mb-4 h-8 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="mb-6 space-y-2">
                    <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  </div>
                  <div className="mb-6 flex gap-6">
                    <div className="h-5 w-8 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-5 w-8 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-5 w-8 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  </div>
                  <div className="h-12 w-full animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Properties Grid */
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {properties.length > 0 ? (
              properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))
            ) : (
              <div className="col-span-full py-20 text-center">
                <p className="text-lg text-body-color dark:text-body-color-dark">
                  No properties available at the moment.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
