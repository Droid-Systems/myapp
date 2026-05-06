"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { InvestmentProperty } from "@/types/investment";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import "@/components/SignupForm/phoneInput.css";
import { z } from "zod";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

const propertyContactSchema = z.object({
  contactName: z.string().min(1, "Name is required."),
  contactEmail: z.string().min(1, "Email is required.").refine(
    (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    "Please enter a valid email."
  ),
  message: z.string().min(5, "Message must be at least 5 characters."),
});

// Dynamically import the map component with SSR disabled
const PropertyMap = dynamic(() => import("@/components/PropertyMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-700" />
  ),
});

// This would typically come from a database or API
// For now, we'll use the same data structure as the listings page
interface PropertyFeatures {
  // ── Interior ──
  fullBathrooms?: number;
  heating?: string[];
  cooling?: string[];
  appliancesIncluded?: string[];
  laundry?: string[];
  interiorFeatures?: string[];
  flooring?: string[];
  windows?: string[];
  basement?: string;
  fireplaceCount?: number;
  fireplaceFeatures?: string[];
  totalStructureArea?: string;
  totalLivableArea?: string;
  // ── Property ──
  levels?: string;
  stories?: number;
  patioAndPorch?: string[];
  exteriorFeatures?: string[];
  poolFeatures?: string[];
  hasSpa?: boolean;
  spaFeatures?: string[];
  fencing?: string[];
  // ── Lot ──
  lotFeatures?: string[];
  additionalStructures?: string;
  parcelNumber?: string;
  // ── Construction ──
  homeType?: string;
  propertySubtype?: string;
  constructionMaterials?: string[];
  foundation?: string[];
  roof?: string[];
  yearBuilt?: number;
  // ── Utilities ──
  sewer?: string[];
  water?: string[];
  utilitiesForProperty?: string[];
  // ── Community & HOA ──
  communityFeatures?: string[];
  security?: string[];
  subdivision?: string;
  hasHOA?: boolean;
  hoaFee?: string;
  region?: string;
  // ── Financial & listing ──
  pricePerSqft?: string;
  taxAssessedValue?: string;
  annualTaxAmount?: string;
  dateOnMarket?: string;
  daysOnMarket?: number;
  listingTerms?: string[];
  // ── Market value ──
  zestimate?: string;
  estimatedSalesRangeLow?: string;
  estimatedSalesRangeHigh?: string;
  rentZestimate?: string;
  zestimateChangePercent?: string;
  zestimateChangeYears?: number;
  priceHistory?: { date: string; price: number; event?: string }[];
  // ── Climate risks ──
  floodZone?: string;
  floodZoneDescription?: string;
  fireRisk?: string;
  windRisk?: string;
  airQualityRisk?: string;
  firstStreetUrl?: string;
  // ── Getting around ──
  walkScore?: number;
  walkScoreDescription?: string;
  bikeScore?: number;
  bikeScoreDescription?: string;
  transitScore?: number;
  transitScoreDescription?: string;
  // ── Legacy (kept for backward compat with mock data) ──
  intercom?: string[];
  interiorDetails?: string[];
  outdoorDetails?: string[];
  utilities?: string[];
  otherFeatures?: string[];
}

interface Property {
  id: number;
  title: string;
  price: string;
  location: string;
  description: string;
  images: string[];
  bedrooms: number;
  bathrooms: number;
  parking: number;
  status: string;
  area: string;
  type: string;
  lotSize?: string;
  rooms?: number;
  customId?: string;
  available?: string;
  floors?: number;
  features?: PropertyFeatures;
  latitude?: number;
  longitude?: number;
  investmentType?: "individual" | "pooled";
  investmentStatus?: string;
  managerName?: string;
  managerRole?: string;
  managerPhone?: string;
  managerPhoto?: string | null;
  targetAmount?: number;
  minInvestmentAmount?: number;
  currentFunded?: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface Review {
  id: string;
  rating: number;
  body?: string;
  comment?: string;
  createdAt: string;
  user: {
    firstName?: string;
    lastName?: string;
    name?: string;
    profilePhoto?: string;
  };
}

// Helper function to map API response to Property interface
function mapApiPropertyToLocal(apiProperty: InvestmentProperty): Property {
  const rawStatus = (apiProperty as any).status || "";
  const formattedStatus = rawStatus
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c: string) => c.toUpperCase());

  return {
    id: parseInt(apiProperty.id) || 1,
    title: apiProperty.title,
    price: apiProperty.investmentType === "pooled"
      ? (apiProperty.minInvestment > 0 ? `$${apiProperty.minInvestment.toLocaleString()}` : (apiProperty.targetAmount > 0 ? `$${apiProperty.targetAmount.toLocaleString()}` : "N/A"))
      : `$${(apiProperty.minInvestment || apiProperty.price || 0).toLocaleString()}`,
    location: apiProperty.location,
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
    area: apiProperty.area,
    type: apiProperty.category ? ({ airbnb_arbitrage: "Airbnb Arbitrage", airbnb_mortgage: "Airbnb Mortgage", for_sale: "For Sale" } as Record<string, string>)[apiProperty.category] ?? apiProperty.category : "Property",
    lotSize: apiProperty.area,
    rooms: apiProperty.bedrooms + 1,
    customId: apiProperty.id,
    available: apiProperty.status === "available" ? "Yes" : "No",
    floors: 1,
    latitude: (apiProperty as any).latitude ?? undefined,
    longitude: (apiProperty as any).longitude ?? undefined,
    investmentType: apiProperty.investmentType,
    investmentStatus: (apiProperty as any).investmentStatus || "",
    targetAmount: apiProperty.targetAmount || 0,
    minInvestmentAmount: apiProperty.minInvestment || 0,
    currentFunded: apiProperty.currentFunded || 0,
    managerName: (apiProperty as any).managerName || "",
    managerRole: (apiProperty as any).managerRole || "",
    managerPhone: (apiProperty as any).managerPhone || "",
    managerPhoto: (apiProperty as any).managerPhoto || null,
    features: {
      // Interior
      fullBathrooms:        (apiProperty as any).fullBathrooms       ?? undefined,
      heating:              (apiProperty as any).heating              || [],
      cooling:              (apiProperty as any).cooling              || [],
      appliancesIncluded:   (apiProperty as any).appliancesIncluded   || [],
      laundry:              (apiProperty as any).laundry              || [],
      interiorFeatures:     (apiProperty as any).interiorFeatures     || apiProperty.features || [],
      flooring:             (apiProperty as any).flooring             || [],
      windows:              (apiProperty as any).windows              || [],
      basement:             (apiProperty as any).basement             || "",
      fireplaceCount:       (apiProperty as any).fireplaceCount       || 0,
      fireplaceFeatures:    (apiProperty as any).fireplaceFeatures    || [],
      totalStructureArea:   (apiProperty as any).totalStructureArea   || "",
      totalLivableArea:     (apiProperty as any).totalLivableArea     || apiProperty.area || "",
      // Property
      levels:               (apiProperty as any).levels               || "",
      stories:              (apiProperty as any).stories              || 0,
      patioAndPorch:        (apiProperty as any).patioAndPorch        || [],
      exteriorFeatures:     (apiProperty as any).exteriorFeatures     || [],
      poolFeatures:         (apiProperty as any).poolFeatures         || [],
      hasSpa:               (apiProperty as any).hasSpa               ?? false,
      spaFeatures:          (apiProperty as any).spaFeatures          || [],
      fencing:              (apiProperty as any).fencing              || [],
      // Lot
      lotFeatures:          (apiProperty as any).lotFeatures          || [],
      additionalStructures: (apiProperty as any).additionalStructures || "",
      parcelNumber:         (apiProperty as any).parcelNumber         || "",
      // Construction
      homeType:             (apiProperty as any).homeType             || "",
      propertySubtype:      (apiProperty as any).propertySubtype      || "",
      constructionMaterials:(apiProperty as any).constructionMaterials|| [],
      foundation:           (apiProperty as any).foundation           || [],
      roof:                 (apiProperty as any).roof                 || [],
      yearBuilt:            (apiProperty as any).yearBuilt            || 0,
      // Utilities
      sewer:                (apiProperty as any).sewer                || [],
      water:                (apiProperty as any).water                || [],
      utilitiesForProperty: (apiProperty as any).utilitiesForProperty || [],
      // Community & HOA
      communityFeatures:    (apiProperty as any).communityFeatures    || [],
      security:             (apiProperty as any).security             || [],
      subdivision:          (apiProperty as any).subdivision          || "",
      hasHOA:               (apiProperty as any).hasHOA               ?? false,
      hoaFee:               (apiProperty as any).hoaFee               || "",
      region:               (apiProperty as any).region               || "",
      // Financial & listing
      pricePerSqft:         (apiProperty as any).pricePerSqft         || "",
      taxAssessedValue:     (apiProperty as any).taxAssessedValue     || "",
      annualTaxAmount:      (apiProperty as any).annualTaxAmount      || "",
      dateOnMarket:         (apiProperty as any).dateOnMarket         || "",
      daysOnMarket:         (apiProperty as any).daysOnMarket         || 0,
      listingTerms:            (apiProperty as any).listingTerms            || [],
      // Market value
      zestimate:               (apiProperty as any).zestimate               || "",
      estimatedSalesRangeLow:  (apiProperty as any).estimatedSalesRangeLow  || "",
      estimatedSalesRangeHigh: (apiProperty as any).estimatedSalesRangeHigh || "",
      rentZestimate:           (apiProperty as any).rentZestimate           || "",
      zestimateChangePercent:  (apiProperty as any).zestimateChangePercent  || "",
      zestimateChangeYears:    (apiProperty as any).zestimateChangeYears    || 0,
      priceHistory:            (apiProperty as any).priceHistory            || [],
      // Climate risks
      floodZone:               (apiProperty as any).floodZone               || "",
      floodZoneDescription:    (apiProperty as any).floodZoneDescription    || "",
      fireRisk:                (apiProperty as any).fireRisk                || "",
      windRisk:                (apiProperty as any).windRisk                || "",
      airQualityRisk:          (apiProperty as any).airQualityRisk          || "",
      firstStreetUrl:          (apiProperty as any).firstStreetUrl          || "",
      // ── Getting around ──
      walkScore:               (apiProperty as any).walkScore               ?? undefined,
      walkScoreDescription:    (apiProperty as any).walkScoreDescription    || "",
      bikeScore:               (apiProperty as any).bikeScore               ?? undefined,
      bikeScoreDescription:    (apiProperty as any).bikeScoreDescription    || "",
      transitScore:            (apiProperty as any).transitScore            ?? undefined,
      transitScoreDescription: (apiProperty as any).transitScoreDescription || "",
      // Legacy
      intercom:        [],
      interiorDetails: apiProperty.features || [],
      outdoorDetails:  [],
      utilities:       [],
      otherFeatures:   [],
    },
  };
}

// Mock data - used as fallback if API fails
const propertyData: Record<number, Property> = {
  1: {
    id: 1,
    title: "Cycladic home in Fira, Greece",
    price: "$25,000",
    location: "Fira, Santorini, Greece",
    description: "Exclusively Marketed by Pam Golding Properties\n\nWelcome to this beautifully designed 4-bedroom home in the sought-after Olijvenhof Estate, Somerset West. Nestled near award-winning wine farms and scenic cycling and walking routes, this home offers the perfect balance of modern elegance and tranquil living.\n\nStep inside to an open-plan living area where Engineered Oak flooring creates a seamless and minimalistic atmosphere. A wood-burning fireplace adds warmth to the living room, which flows effortlessly into the kitchen and dining area—ideal for entertaining.\n\nThe kitchen, a sophisticated blend of wood and marble finishes, is both stylish and functional, with a separate scullery leading to a double garage with direct access. A walk in pantry is a welcome extra feature in this already immaculate work space.\n\nThe home boasts four spacious bedrooms, two of which are en-suite. The main suite is a true retreat, complete with a wood-burning fireplace and a luxurious marble-finished bathroom.\n\nEnjoy year-round outdoor living in the north-facing entertainment area, featuring breathtaking Helderberg Mountain views, a heated pool, and a modern covered braai area—perfect for relaxing or hosting guests.\n\nThis home is equipped with an Inverter system and solar.\n\nA harmonious blend of luxury, comfort, and convenience, this home is ready to welcome its new owners.\n\nContact us today to arrange a viewing!",
    images: [
      "/images/how-it-works/property-1.jpg",
      "/images/how-it-works/property-2.jpg",
      "/images/how-it-works/property-3.jpg",
    ],
    bedrooms: 3,
    bathrooms: 3,
    parking: 2,
    status: "For Rent",
    area: "2,500 sq ft",
    type: "Villa",
    lotSize: "503 ft²",
    rooms: 4,
    customId: "1658",
    available: "Yes",
    floors: 1,
    latitude: 36.4167,
    longitude: 25.4333,
    features: {
      intercom: ["Pergola"],
      interiorDetails: [
        "Bar",
        "Equipped Kitchen",
        "Fireplace",
        "Garage",
        "Gym",
        "Jacuzzi",
        "Kitchen island",
        "Laundry",
        "Media Room",
      ],
      outdoorDetails: [
        "Back yard",
        "Garage Attached",
        "Hot Bath",
        "Outdoor Pool",
        "Parking",
        "Terrace",
      ],
      utilities: ["Central Air", "Electricity", "Natural Gas", "Ventilation", "Water"],
      otherFeatures: [
        "Dining room",
        "Electric vehicle charging",
        "Outdoor pool",
        "Parking",
        "Security",
        "Sewer",
        "Smoke detectors",
        "Washing machine",
        "WiFi",
      ],
    },
  },
  2: {
    id: 2,
    title: "Entire Rental Property Ownership",
    price: "$15,000",
    location: "Downtown Area, City Center",
    description: "Step into full ownership of a profitable Airbnb rental property with an investment as low as $15,000. This property offers excellent returns and is located in a prime area with high tourist traffic. The property comes fully furnished and ready for immediate rental.",
    images: [
      "/images/how-it-works/property-2.jpg",
      "/images/how-it-works/property-1.jpg",
      "/images/how-it-works/property-3.jpg",
    ],
    bedrooms: 4,
    bathrooms: 2,
    parking: 1,
    status: "For Sale",
    area: "3,200 sq ft",
    type: "Apartment",
    latitude: 40.7580,
    longitude: -73.9855,
  },
  3: {
    id: 3,
    title: "Entire Rental Property Ownership",
    price: "$15,000",
    location: "Suburban District, North Side",
    description: "Step into full ownership of a profitable Airbnb rental property with an investment as low as $15,000. Ideal for investors looking for steady rental income with minimal hassle. The property is well-maintained and comes with modern appliances.",
    images: [
      "/images/how-it-works/property-3.jpg",
      "/images/how-it-works/property-1.jpg",
      "/images/how-it-works/property-2.jpg",
    ],
    bedrooms: 2,
    bathrooms: 2,
    parking: 1,
    status: "For Rent",
    area: "1,800 sq ft",
    type: "Condo",
    latitude: 42.0883,
    longitude: -87.6832,
  },
  4: {
    id: 4,
    title: "Entire Rental Property Ownership",
    price: "$15,000",
    location: "Waterfront Area, East Bay",
    description: "Step into full ownership of a profitable Airbnb rental property with an investment as low as $15,000. This stunning waterfront property offers breathtaking views and luxury amenities. Perfect for high-end short-term rentals.",
    images: [
      "/images/how-it-works/property-1.jpg",
      "/images/how-it-works/property-2.jpg",
      "/images/how-it-works/property-3.jpg",
    ],
    bedrooms: 5,
    bathrooms: 3,
    parking: 2,
    status: "For Sale",
    area: "4,500 sq ft",
    type: "Villa",
    latitude: 37.8088,
    longitude: -122.2775,
  },
  5: {
    id: 5,
    title: "Entire Rental Property Ownership",
    price: "$15,000",
    location: "Seattle Washintington, USA",
    description: "Step into full ownership of a profitable Airbnb rental property with an investment as low as $15,000. Located in a charming historic district, this property combines old-world charm with modern conveniences. Excellent for cultural tourism.",
    images: [
      "/images/how-it-works/property-2.jpg",
      "/images/how-it-works/property-3.jpg",
      "/images/how-it-works/property-1.jpg",
    ],
    bedrooms: 3,
    bathrooms: 2,
    parking: 2,
    status: "For Rent",
    area: "2,200 sq ft",
    type: "Townhouse",
    latitude: 47.6062,
    longitude: -122.3321,
  },
  6: {
    id: 6,
    title: "Entire Rental Property Ownership",
    price: "$15,000",
    location: "Business District, Central Hub",
    description: "Step into full ownership of a profitable Airbnb rental property with an investment as low as $15,000. Prime location for business travelers and tourists alike. Modern design with top-tier amenities and excellent connectivity.",
    images: [
      "/images/how-it-works/property-3.jpg",
      "/images/how-it-works/property-2.jpg",
      "/images/how-it-works/property-1.jpg",
    ],
    bedrooms: 4,
    bathrooms: 3,
    parking: 1,
    status: "For Sale",
    area: "3,800 sq ft",
    type: "Penthouse",
    latitude: 40.7074,
    longitude: -74.0113,
  },
};

export default function PropertyDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const propertyId = parseInt(id);

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [isFading, setIsFading] = useState(false);
  const [slideDir, setSlideDir] = useState<"left" | "right">("left");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [whatsSpecialExpanded, setWhatsSpecialExpanded] = useState(false);

  // Contact form state
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSending, setContactSending] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const reviewFormRef = useRef<HTMLDivElement>(null);

  // Fetch property data
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/public/properties/${id}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        const apiProperty = data.data ?? data;
        if (apiProperty && apiProperty.id) {
          setProperty(mapApiPropertyToLocal(apiProperty));
        } else {
          setProperty(propertyData[propertyId] || null);
        }
      } catch {
        setProperty(propertyData[propertyId] || null);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id, propertyId]);

  // Check login state & fetch reviews
  useEffect(() => {
    setIsLoggedIn(localStorage.getItem("isLoggedIn") === "true");

    const fetchReviews = async () => {
      try {
        const res = await fetch(`${API_URL}/api/public/properties/${id}/reviews`);
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        const list = data?.data?.reviews ?? data.data ?? data.reviews ?? [];
        setReviews(Array.isArray(list) ? list : []);
      } catch {
        setReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();
  }, [id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    setReviewSubmitting(true);
    setReviewError(null);
    try {
      const res = await fetch(`${API_URL}/api/reviews/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rating: reviewRating, body: reviewComment.trim() }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to submit review");
      }
      const reviewObj = data.data?.review ?? data.data ?? data.review;
      const newReview: Review = reviewObj?.id ? reviewObj : {
        id: Date.now().toString(),
        rating: reviewRating,
        body: reviewComment.trim(),
        createdAt: new Date().toISOString(),
        user: { name: "You" },
      };
      setReviews((prev) => [newReview, ...prev]);
      setReviewComment("");
      setReviewRating(5);
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 3000);
    } catch (err: any) {
      setReviewError(err.message || "Something went wrong");
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Auto-slide images every 3 seconds with fade effect
  useEffect(() => {
    if (property && property.images.length > 1) {
      const interval = setInterval(() => {
        setIsFading(true);
        setTimeout(() => {
          setCurrentImageIndex((prev) =>
            prev === property.images.length - 1 ? 0 : prev + 1
          );
          setIsFading(false);
        }, 500); // Wait for fade out before changing image
      }, 3000); // 3 seconds

      return () => clearInterval(interval);
    }
  }, [property]);

  // Lightbox keyboard navigation
  useEffect(() => {
    if (!lightboxOpen || !property) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft") setLightboxIndex(prev => (prev - 1 + property.images.length) % property.images.length);
      if (e.key === "ArrowRight") setLightboxIndex(prev => (prev + 1) % property.images.length);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [lightboxOpen, property]);

  // Loading skeleton
  if (loading) {
    return (
      <section className="relative z-10 bg-white pb-12 pt-36 dark:bg-gray-dark md:pb-20 lg:pb-28 lg:pt-40">
        <div className="container mx-auto">
          {/* Back Button Skeleton */}
          <div className="mb-6 h-6 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />

          {/* Title Section Skeleton */}
          <div className="mb-8">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="h-10 w-24 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="h-10 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="h-16 w-32 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="mb-3 h-12 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-6 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>

          {/* Image Gallery Skeleton */}
          <div className="mb-8 overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-dark">
            <div className="h-[400px] w-full animate-pulse bg-gray-200 dark:bg-gray-700 md:h-[500px] lg:h-[600px]" />
            <div className="border-t border-gray-200 p-4 dark:border-gray-700 md:p-6">
              <div className="flex justify-center gap-3 md:gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 w-28 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700 md:h-24 md:w-32" />
                ))}
              </div>
            </div>
          </div>

          {/* Content Grid Skeleton */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="mb-8 h-48 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-700" />
              <div className="mb-8 h-32 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-700" />
              <div className="h-32 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="lg:col-span-1">
              <div className="h-96 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!property) {
    return (
      <section className="relative z-10 overflow-hidden bg-white pb-12 pt-36 dark:bg-gray-dark md:pb-20 lg:pb-28 lg:pt-40">
        <div className="container mx-auto text-center">
          <h1 className="mb-4 text-3xl font-bold text-black dark:text-white">
            Property Not Found
          </h1>
          <Link
            href="/listings"
            className="text-primary hover:underline"
          >
            Back to Listings
          </Link>
        </div>
      </section>
    );
  }

  const nextImage = () => {
    setSlideDir("left");
    setIsFading(true);
    setTimeout(() => {
      setCurrentImageIndex((prev) =>
        prev === property.images.length - 1 ? 0 : prev + 1
      );
      setIsFading(false);
    }, 400);
  };

  const prevImage = () => {
    setSlideDir("right");
    setIsFading(true);
    setTimeout(() => {
      setCurrentImageIndex((prev) =>
        prev === 0 ? property.images.length - 1 : prev - 1
      );
      setIsFading(false);
    }, 400);
  };

  const selectImage = (index: number) => {
    setSlideDir(index > currentImageIndex ? "left" : "right");
    setIsFading(true);
    setTimeout(() => {
      setCurrentImageIndex(index);
      setIsFading(false);
    }, 400);
  };

  return (
    <>
    <section className="relative z-10 bg-white pb-12 pt-36 dark:bg-gray-dark md:pb-20 lg:pb-28 lg:pt-40">
      <div className="container mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/listings"
            className="inline-flex items-center gap-2 text-body-color transition-colors hover:text-primary dark:text-body-color-dark dark:hover:text-primary"
          >
            <svg
              className="h-5 w-5"
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
            <span className="font-medium">Back to Properties</span>
          </Link>
        </div>

        {/* Status Badges and Title */}
        <div className={(property.status.toLowerCase() === "for sale" || property.type.toLowerCase() === "for sale") ? "mb-1" : "mb-8"}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg">
                {property.status}
              </span>
              <span className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white shadow-lg dark:bg-white dark:text-black">
                {property.type}
              </span>
              {property.investmentType && (
                <span className={`rounded-full px-4 py-2 text-sm font-semibold text-white shadow-lg ${
                  property.investmentType === "individual" ? "bg-green-600" : "bg-orange-600"
                }`}>
                  {property.investmentType === "individual" ? "Individual" : "Pooled"}
                </span>
              )}
            </div>

            {/* Price Badge — hidden for for_sale (shown above image instead) */}
            {!(property.status.toLowerCase() === "for sale" || property.type.toLowerCase() === "for sale") && (
              <div className="rounded-xl bg-primary px-4 py-2 shadow-lg">
                <p className="text-xs font-medium text-white opacity-90">
                  {property.investmentType === "pooled" ? "Min Investment" : "Starts from"}
                </p>
                <p className="text-lg font-bold text-white md:text-xl">{property.price}</p>
                {property.investmentType === "pooled" && property.targetAmount ? (
                  <p className="text-xs text-white opacity-80">Target: ${property.targetAmount.toLocaleString()}</p>
                ) : null}
              </div>
            )}
          </div>

          <h1 className="mb-3 text-3xl font-bold text-black dark:text-white md:text-4xl lg:text-5xl">
            {property.title}
          </h1>
          <div className="flex items-start gap-2 text-body-color dark:text-body-color-dark">
            <svg
              className="mt-1 h-5 w-5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-base md:text-lg">{property.location}</span>
          </div>
        </div>

        {/* Price badge for for_sale — normal flow, sits just above image */}
        {(property.status.toLowerCase() === "for sale" || property.type.toLowerCase() === "for sale") && (
          <div className="mb-1 flex justify-end">
            <div className="rounded-xl bg-primary px-5 py-3 shadow-xl">
              <p className="text-xs font-medium text-white opacity-90">Price</p>
              <p className="text-xl font-bold text-white">{property.price}</p>
            </div>
          </div>
        )}

        {/* Main Image Gallery */}
        <div className="mb-8">
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-dark">
          {/* Main Image */}
          <div
            className="relative h-[260px] w-full overflow-hidden sm:h-[360px] md:h-[460px] lg:h-[540px] cursor-zoom-in"
            onClick={() => { setLightboxOpen(true); setLightboxIndex(currentImageIndex); }}
          >
            {property.images[currentImageIndex] ? (
              <Image
                src={property.images[currentImageIndex]}
                alt={`${property.title} - Image ${currentImageIndex + 1}`}
                fill
                className="object-cover"
                style={{
                  opacity: isFading ? 0 : 1,
                  transform: isFading
                    ? slideDir === "left"
                      ? "translateX(-40px)"
                      : "translateX(40px)"
                    : "translateX(0)",
                  transition: "opacity 0.4s ease, transform 0.4s ease",
                }}
                sizes="100vw"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary/10 dark:bg-primary/20">
                <span className="text-8xl font-bold text-primary md:text-9xl">
                  {property.title?.charAt(0)?.toUpperCase() || "P"}
                </span>
              </div>
            )}

            {/* Navigation Arrows — only when more than 1 image */}
            {property.images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2.5 shadow-lg backdrop-blur-sm transition-all hover:scale-110 hover:bg-white active:scale-95 md:left-5 md:p-3"
                  aria-label="Previous image"
                >
                  <svg className="h-5 w-5 text-black md:h-6 md:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2.5 shadow-lg backdrop-blur-sm transition-all hover:scale-110 hover:bg-white active:scale-95 md:right-5 md:p-3"
                  aria-label="Next image"
                >
                  <svg className="h-5 w-5 text-black md:h-6 md:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Counter badge — only when more than 1 image */}
            {property.images.length > 1 && (
              <div className="absolute bottom-3 right-3 rounded-md bg-black/70 px-3 py-1 backdrop-blur-sm">
                <span className="text-xs font-medium text-white md:text-sm">
                  {currentImageIndex + 1} / {property.images.length}
                </span>
              </div>
            )}
          </div>

          {/* Thumbnail strip — sliding window, 3 on mobile, 4 on desktop */}
          {property.images.length > 1 && (() => {
            const totalImages = property.images.length;

            // Calculate visible window start based on current image
            const getWindowStart = (visible: number) => {
              if (totalImages <= visible) return 0;
              let start = currentImageIndex - Math.floor(visible / 2);
              start = Math.max(0, start);
              start = Math.min(totalImages - visible, start);
              return start;
            };

            const mobileVisible = Math.min(totalImages, 3);
            const desktopVisible = Math.min(totalImages, 4);
            const mobileStart = getWindowStart(mobileVisible);
            const desktopStart = getWindowStart(desktopVisible);

            const mobileSlice = property.images.slice(mobileStart, mobileStart + mobileVisible);
            const desktopSlice = property.images.slice(desktopStart, desktopStart + desktopVisible);

            return (
              <div className="border-t border-gray-200 px-4 py-4 dark:border-gray-700 md:px-6 md:py-5">
                {/* Mobile: show 3 */}
                <div className="flex items-center justify-center gap-2 md:hidden">
                  {mobileSlice.map((image, i) => {
                    const realIndex = mobileStart + i;
                    return (
                      <button
                        key={realIndex}
                        onClick={() => selectImage(realIndex)}
                        style={{ width: `${Math.floor(100 / mobileVisible) - 2}%` }}
                        className={`relative aspect-video flex-shrink-0 overflow-hidden rounded-xl transition-all duration-500 ${
                          currentImageIndex === realIndex
                            ? "ring-[3px] ring-primary"
                            : "opacity-60 hover:opacity-100"
                        }`}
                      >
                        <Image src={image} alt={`Thumbnail ${realIndex + 1}`} fill className="object-cover" sizes="33vw" />
                      </button>
                    );
                  })}
                </div>
                {/* Desktop: show 4 */}
                <div className="hidden items-center justify-center gap-3 md:flex">
                  {desktopSlice.map((image, i) => {
                    const realIndex = desktopStart + i;
                    return (
                      <button
                        key={realIndex}
                        onClick={() => selectImage(realIndex)}
                        style={{ width: `${Math.floor(100 / desktopVisible) - 2}%` }}
                        className={`relative aspect-video flex-shrink-0 overflow-hidden rounded-xl transition-all duration-500 ${
                          currentImageIndex === realIndex
                            ? "ring-4 ring-primary"
                            : "opacity-60 hover:opacity-100"
                        }`}
                      >
                        <Image src={image} alt={`Thumbnail ${realIndex + 1}`} fill className="object-cover" sizes="25vw" />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
        </div>

        {/* Overview and Contact Form Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Side - Overview and Description */}
          <div className="lg:col-span-2">
            {/* Overview Section */}
            {(property.status.toLowerCase() === "for sale" || property.type.toLowerCase() === "for sale") ? (
              /* ── For Sale: Zillow-style overview ── */
              <div className="mb-8 rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-dark md:p-8">
                {/* Beds/Baths/Sqft */}
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  {/* Beds / Baths / Sqft stats */}
                  <div className="flex items-center gap-3 sm:gap-5">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-black dark:text-white">{property.bedrooms}</p>
                      <p className="text-xs text-body-color dark:text-body-color-dark">beds</p>
                    </div>
                    <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
                    <div className="text-center">
                      <p className="text-2xl font-bold text-black dark:text-white">{property.bathrooms}</p>
                      <p className="text-xs text-body-color dark:text-body-color-dark">baths</p>
                    </div>
                    <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
                    <div className="text-center">
                      <p className="text-xl font-bold text-black dark:text-white">{property.area.split(" ")[0]}</p>
                      <p className="text-xs text-body-color dark:text-body-color-dark">{property.area.split(" ").slice(1).join(" ")}</p>
                    </div>
                  </div>
                </div>

                {/* Estimated Payment Bar */}
                <div className="mb-6 flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-body-color dark:text-body-color-dark">Est. payment</p>
                    <p className="mt-0.5 text-xl font-bold text-black dark:text-white">
                      {(() => {
                        const priceNum = parseFloat((property.price || "").replace(/[$,]/g, ""));
                        if (!priceNum) return "Contact for details";
                        const monthly = Math.round(priceNum * 0.007);
                        return `$${monthly.toLocaleString()}/mo`;
                      })()}
                    </p>
                  </div>
                  <a
                    href="#contact"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById("contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
                  >
                    Get pre-qualified
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>

                {/* Property Detail Cards */}
                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                    <p className="text-xs font-medium uppercase tracking-wide text-body-color dark:text-body-color-dark">Property Type</p>
                    <p className="mt-1 font-semibold text-black dark:text-white">{property.type}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                    <p className="text-xs font-medium uppercase tracking-wide text-body-color dark:text-body-color-dark">Lot Size</p>
                    <p className="mt-1 font-semibold text-black dark:text-white">{property.lotSize || property.area || "N/A"}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                    <p className="text-xs font-medium uppercase tracking-wide text-body-color dark:text-body-color-dark">Bedrooms</p>
                    <p className="mt-1 font-semibold text-black dark:text-white">{property.bedrooms}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                    <p className="text-xs font-medium uppercase tracking-wide text-body-color dark:text-body-color-dark">Bathrooms</p>
                    <p className="mt-1 font-semibold text-black dark:text-white">{property.bathrooms}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                    <p className="text-xs font-medium uppercase tracking-wide text-body-color dark:text-body-color-dark">Parking</p>
                    <p className="mt-1 font-semibold text-black dark:text-white">
                      {property.parking} {property.parking === 1 ? "space" : "spaces"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                    <p className="text-xs font-medium uppercase tracking-wide text-body-color dark:text-body-color-dark">Price / Sqft</p>
                    <p className="mt-1 font-semibold text-black dark:text-white">
                      {(() => {
                        const priceNum = parseFloat((property.price || "").replace(/[$,]/g, ""));
                        const areaNum = parseFloat((property.area || "").replace(/[^0-9.]/g, ""));
                        if (priceNum && areaNum) return `$${Math.round(priceNum / areaNum).toLocaleString()}`;
                        return "N/A";
                      })()}
                    </p>
                  </div>
                </div>

                {/* What's Special */}
                {property.features &&
                  ((property.features.interiorDetails?.length ?? 0) +
                    (property.features.otherFeatures?.length ?? 0)) > 0 && (
                  <div>
                    <h3 className="mb-3 text-lg font-bold text-black dark:text-white">What&apos;s special</h3>
                    <div className="mb-3 flex flex-wrap gap-2">
                      {[
                        ...(property.features?.interiorDetails || []),
                        ...(property.features?.otherFeatures || []),
                      ].slice(0, 10).map((tag, i) => (
                        <span
                          key={i}
                          className="rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-body-color dark:border-gray-600 dark:text-body-color-dark"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className={`text-sm leading-relaxed text-body-color dark:text-body-color-dark ${whatsSpecialExpanded ? "" : "line-clamp-3"}`}>
                      {property.description.split('\n\n')[0]}
                    </p>
                    <button
                      onClick={() => setWhatsSpecialExpanded((prev) => !prev)}
                      className="mt-2 text-sm font-semibold text-primary hover:underline"
                    >
                      {whatsSpecialExpanded ? "Show less" : "Read more"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* ── Other categories: icon grid overview ── */
              <div className="mb-8 rounded-2xl bg-white p-4 shadow-lg dark:bg-gray-dark md:p-8">
                <h2 className="mb-3 text-lg font-bold text-black dark:text-white md:mb-6 md:text-2xl">
                  Overview
                </h2>
                <div className="grid grid-cols-4 gap-2 md:gap-6">
                  {/* Bedrooms */}
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 md:mb-3 md:h-14 md:w-14">
                      <svg className="h-4 w-4 text-primary md:h-7 md:w-7" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                      </svg>
                    </div>
                    <span className="mb-0.5 text-base font-bold text-black dark:text-white md:mb-1 md:text-2xl">{property.bedrooms}</span>
                    <span className="text-[10px] leading-tight text-body-color dark:text-body-color-dark md:text-sm">Bedrooms</span>
                  </div>

                  {/* Rooms */}
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 md:mb-3 md:h-14 md:w-14">
                      <svg className="h-4 w-4 text-primary md:h-7 md:w-7" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                      </svg>
                    </div>
                    <span className="mb-0.5 text-base font-bold text-black dark:text-white md:mb-1 md:text-2xl">{property.bedrooms + 1}</span>
                    <span className="text-[10px] leading-tight text-body-color dark:text-body-color-dark md:text-sm">Rooms</span>
                  </div>

                  {/* Bathrooms */}
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 md:mb-3 md:h-14 md:w-14">
                      <svg className="h-4 w-4 text-primary md:h-7 md:w-7" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8 4a4 4 0 00-3.903 4.879L2 14v2a2 2 0 002 2h12a2 2 0 002-2v-2l-2.097-5.121A4 4 0 0012 4H8zm2 5a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="mb-0.5 text-base font-bold text-black dark:text-white md:mb-1 md:text-2xl">{property.bathrooms}</span>
                    <span className="text-[10px] leading-tight text-body-color dark:text-body-color-dark md:text-sm">Bathrooms</span>
                  </div>

                  {/* Garages */}
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 md:mb-3 md:h-14 md:w-14">
                      <svg className="h-4 w-4 text-primary md:h-7 md:w-7" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                        <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3z" />
                      </svg>
                    </div>
                    <span className="mb-0.5 text-base font-bold text-black dark:text-white md:mb-1 md:text-2xl">{property.parking}</span>
                    <span className="text-[10px] leading-tight text-body-color dark:text-body-color-dark md:text-sm">Garages</span>
                  </div>
                </div>
              </div>
            )}

            {/* Investment Type Section */}
            {property.investmentType && (
              <div className={`mb-8 flex items-center gap-4 rounded-2xl p-5 ${
                property.investmentType === "individual"
                  ? "bg-green-900/30"
                  : "bg-orange-900/30"
              }`}>
                <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${
                  property.investmentType === "individual" ? "bg-green-600" : "bg-orange-600"
                }`}>
                  {property.investmentType === "individual" ? (
                    <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 14.094A5.973 5.973 0 004 17v1H1v-1a3 3 0 013.75-2.906z" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className={`text-xs font-medium uppercase tracking-wide ${
                    property.investmentType === "individual" ? "text-green-400" : "text-orange-400"
                  }`}>Investment Type</p>
                  <p className="text-base font-bold text-white">
                    {property.investmentType === "individual" ? "Individual Ownership" : "Pooled Investment"}
                  </p>
                  <p className="text-sm text-gray-400">
                    {property.investmentType === "individual" ? "You own 100% of this property" : "Co-invest with multiple investors"}
                  </p>
                </div>
              </div>
            )}

            {/* Details Section */}
            <div className="mt-8 rounded-2xl bg-white shadow-lg dark:bg-gray-dark">
              {/* Details Header */}
              <button
                onClick={() => setOpenSection(openSection === "details" ? null : "details")}
                className="flex w-full items-center justify-between p-6 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 md:p-8"
              >
                <h2 className="text-2xl font-bold text-black dark:text-white">
                  Details
                </h2>
                <svg
                  className={`h-6 w-6 text-black transition-transform duration-300 dark:text-white ${
                    openSection === "details" ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Details Content */}
              {openSection === "details" && (
                <div className="border-t border-gray-200 px-6 pb-6 dark:border-gray-700 md:px-8 md:pb-8">
                  <div className="grid gap-4 pt-6 md:grid-cols-2 md:gap-x-12">
                    {/* Property ID */}
                    <div className="flex justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
                      <span className="font-semibold text-black dark:text-white">Property ID:</span>
                      <span className="text-body-color dark:text-body-color-dark">{property.id}</span>
                    </div>

                    {/* Price */}
                    <div className="flex justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
                      <span className="font-semibold text-black dark:text-white">Price:</span>
                      <span className="text-body-color dark:text-body-color-dark">{property.price}</span>
                    </div>

                    {/* Custom ID */}
                    {property.customId && (
                      <div className="flex justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
                        <span className="font-semibold text-black dark:text-white">Custom ID:</span>
                        <span className="text-body-color dark:text-body-color-dark">{property.customId}</span>
                      </div>
                    )}

                    {/* Available */}
                    {property.available && (
                      <div className="flex justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
                        <span className="font-semibold text-black dark:text-white">Available:</span>
                        <span className="text-body-color dark:text-body-color-dark">{property.available}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Features Section */}
            {property.features && (
              (property.status.toLowerCase() === "for sale" || property.type.toLowerCase() === "for sale") ? (
              <div className="mt-8 rounded-2xl bg-white shadow-lg dark:bg-gray-dark">
                {/* Header */}
                <button
                  onClick={() => setOpenSection(openSection === "features" ? null : "features")}
                  className="flex w-full items-center justify-between p-6 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 md:p-8"
                >
                  <h2 className="text-2xl font-bold text-black dark:text-white">
                    Facts &amp; features
                  </h2>
                  <svg
                    className={`h-6 w-6 text-black transition-transform duration-300 dark:text-white ${
                      openSection === "features" ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {openSection === "features" && (
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    {(() => {
                      const f = property.features!;
                      // Helper: comma-join a string array, or return fallback
                      const arr = (a?: string[]) => a && a.length > 0 ? a.join(", ") : null;
                      const CheckIcon = () => (
                        <svg style={{ flexShrink: 0, marginTop: "3px", width: "13px", height: "13px" }} className="text-primary" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      );
                      // Helper: render a key-value bullet row
                      const Row = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
                        value !== null && value !== undefined && value !== "" && value !== 0
                          ? <li className="flex items-start gap-1.5 text-sm text-body-color dark:text-body-color-dark"><CheckIcon /><span><span className="font-medium text-black dark:text-white">{label}:</span> {value}</span></li>
                          : null
                      );
                      // Helper: render a plain bullet item
                      const Item = ({ value }: { value: string }) => (
                        <li className="flex items-start gap-1.5 text-sm text-body-color dark:text-body-color-dark"><CheckIcon /><span>{value}</span></li>
                      );
                      // Subsection header
                      const Sub = ({ title }: { title: string }) => (
                        <h4 className="mb-2 text-sm font-bold text-black dark:text-white">{title}</h4>
                      );
                      // Category banner
                      const Cat = ({ title }: { title: string }) => (
                        <div className="bg-gray-100 px-6 py-3 dark:bg-gray-800">
                          <h3 className="text-base font-semibold text-black dark:text-white">{title}</h3>
                        </div>
                      );

                      return (
                        <>
                          {/* ══ INTERIOR ══ */}
                          <Cat title="Interior" />
                          <div className="grid grid-cols-1 gap-x-12 px-6 py-6 md:grid-cols-2 md:px-8">
                            {/* Left column */}
                            <div>
                              <div className="mb-6">
                                <Sub title="Bedrooms & bathrooms" />
                                <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
                                  <Row label="Bedrooms" value={property.bedrooms} />
                                  <Row label="Bathrooms" value={property.bathrooms} />
                                  <Row label="Full bathrooms" value={f.fullBathrooms} />
                                </ul>
                              </div>
                              {(f.heating?.length || f.cooling?.length) ? (
                                <>
                                  {f.heating?.length ? (
                                    <div className="mb-6">
                                      <Sub title="Heating" />
                                      <ul className="grid grid-cols-2 gap-x-4 gap-y-2"><Item value={f.heating!.join(", ")} /></ul>
                                    </div>
                                  ) : null}
                                  {f.cooling?.length ? (
                                    <div className="mb-6">
                                      <Sub title="Cooling" />
                                      <ul className="grid grid-cols-2 gap-x-4 gap-y-2"><Item value={f.cooling!.join(", ")} /></ul>
                                    </div>
                                  ) : null}
                                </>
                              ) : null}
                              {(f.appliancesIncluded?.length || f.laundry?.length) ? (
                                <div className="mb-6">
                                  <Sub title="Appliances" />
                                  <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
                                    {f.appliancesIncluded?.length ? <Row label="Included" value={arr(f.appliancesIncluded)} /> : null}
                                    {f.laundry?.length ? <Row label="Laundry" value={arr(f.laundry)} /> : null}
                                  </ul>
                                </div>
                              ) : null}
                            </div>
                            {/* Right column */}
                            <div>
                              <div className="mb-6">
                                <Sub title="Features" />
                                <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
                                  {f.interiorFeatures?.map((item, i) => <Item key={i} value={item} />)}
                                  <Row label="Flooring" value={arr(f.flooring)} />
                                  <Row label="Windows" value={arr(f.windows)} />
                                  <Row label="Basement" value={f.basement} />
                                  <Row label="Number of fireplaces" value={f.fireplaceCount} />
                                  <Row label="Fireplace features" value={arr(f.fireplaceFeatures)} />
                                </ul>
                              </div>
                              {(f.totalStructureArea || f.totalLivableArea) ? (
                                <div className="mb-6">
                                  <Sub title="Interior area" />
                                  <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
                                    <Row label="Total structure area" value={f.totalStructureArea} />
                                    <Row label="Total interior livable area" value={f.totalLivableArea} />
                                  </ul>
                                </div>
                              ) : null}
                            </div>
                          </div>

                          {/* ══ PROPERTY ══ */}
                          <Cat title="Property" />
                          <div className="grid grid-cols-1 gap-x-12 px-6 py-6 md:grid-cols-2 md:px-8">
                            {/* Left column */}
                            <div className="mb-6">
                              <Sub title="Features" />
                              <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
                                <Row label="Levels" value={f.levels} />
                                <Row label="Stories" value={f.stories} />
                                <Row label="Patio & porch" value={arr(f.patioAndPorch)} />
                                <Row label="Exterior features" value={arr(f.exteriorFeatures)} />
                                <Row label="Pool features" value={arr(f.poolFeatures)} />
                                {f.hasSpa !== undefined ? <li className="text-sm text-body-color dark:text-body-color-dark">• Has spa: {f.hasSpa ? "Yes" : "No"}</li> : null}
                                <Row label="Spa features" value={arr(f.spaFeatures)} />
                                <Row label="Fencing" value={arr(f.fencing)} />
                              </ul>
                            </div>
                            {/* Right column */}
                            <div>
                              <div className="mb-6">
                                <Sub title="Lot" />
                                <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
                                  <Row label="Size" value={property.lotSize || property.area} />
                                  <Row label="Features" value={arr(f.lotFeatures)} />
                                </ul>
                              </div>
                              <div className="mb-6">
                                <Sub title="Details" />
                                <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
                                  <Row label="Additional structures" value={f.additionalStructures} />
                                  <Row label="Parcel number" value={f.parcelNumber} />
                                </ul>
                              </div>
                            </div>
                          </div>

                          {/* ══ CONSTRUCTION ══ */}
                          <Cat title="Construction" />
                          <div className="grid grid-cols-1 gap-x-12 px-6 py-6 md:grid-cols-2 md:px-8">
                            {/* Left column */}
                            <div className="mb-6">
                              <Sub title="Type & style" />
                              <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
                                <Row label="Home type" value={f.homeType || property.type} />
                                <Row label="Property subtype" value={f.propertySubtype} />
                              </ul>
                            </div>
                            {/* Right column */}
                            <div>
                              <div className="mb-6">
                                <Sub title="Materials" />
                                <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
                                  {f.constructionMaterials?.map((m, i) => <Item key={i} value={m} />)}
                                  <Row label="Foundation" value={arr(f.foundation)} />
                                  <Row label="Roof" value={arr(f.roof)} />
                                </ul>
                              </div>
                              <div className="mb-6">
                                <Sub title="Condition" />
                                <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
                                  <Row label="Year built" value={f.yearBuilt} />
                                </ul>
                              </div>
                            </div>
                          </div>

                          {/* ══ UTILITIES & GREEN ENERGY ══ */}
                          <Cat title="Utilities & green energy" />
                          <div className="px-6 py-6 md:px-8">
                            <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
                              <Row label="Sewer" value={arr(f.sewer)} />
                              <Row label="Water" value={arr(f.water)} />
                              <Row label="Utilities for property" value={arr(f.utilitiesForProperty)} />
                            </ul>
                          </div>

                          {/* ══ COMMUNITY & HOA ══ */}
                          <Cat title="Community & HOA" />
                          <div className="grid grid-cols-1 gap-x-12 px-6 py-6 md:grid-cols-2 md:px-8">
                            {/* Left column */}
                            <div className="mb-6">
                              <Sub title="Community" />
                              <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
                                <Row label="Features" value={arr(f.communityFeatures)} />
                                <Row label="Security" value={arr(f.security)} />
                                <Row label="Subdivision" value={f.subdivision} />
                              </ul>
                            </div>
                            {/* Right column */}
                            <div>
                              <div className="mb-6">
                                <Sub title="HOA" />
                                <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
                                  {f.hasHOA !== undefined ? <li className="text-sm text-body-color dark:text-body-color-dark">• Has HOA: {f.hasHOA ? "Yes" : "No"}</li> : null}
                                  <Row label="HOA fee" value={f.hoaFee} />
                                </ul>
                              </div>
                              <div className="mb-6">
                                <Sub title="Location" />
                                <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
                                  <Row label="Region" value={f.region} />
                                </ul>
                              </div>
                            </div>
                          </div>

                          {/* ══ FINANCIAL & LISTING DETAILS ══ */}
                          <Cat title="Financial & listing details" />
                          <div className="px-6 py-6 md:px-8">
                            <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
                              <Row label="Price per square foot" value={f.pricePerSqft} />
                              <Row label="Tax assessed value" value={f.taxAssessedValue} />
                              <Row label="Annual tax amount" value={f.annualTaxAmount} />
                              <Row label="Date on market" value={f.dateOnMarket} />
                              <Row label="Cumulative days on market" value={f.daysOnMarket ? `${f.daysOnMarket} days` : null} />
                              <Row label="Listing terms" value={arr(f.listingTerms)} />
                            </ul>
                          </div>

                          {/* Hide button */}
                          <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-700 md:px-8">
                            <button
                              onClick={() => setOpenSection(null)}
                              className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                            >
                              <svg className="h-4 w-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                              Hide
                            </button>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
              ) : (
              /* Original Features Accordion */
              <div className="mt-8 rounded-2xl bg-white shadow-lg dark:bg-gray-dark">
                <button
                  onClick={() => setOpenSection(openSection === "features" ? null : "features")}
                  className="flex w-full items-center justify-between p-6 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 md:p-8"
                >
                  <h2 className="text-2xl font-bold text-black dark:text-white">
                    Features
                  </h2>
                  <svg
                    className={`h-6 w-6 text-black transition-transform duration-300 dark:text-white ${
                      openSection === "features" ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openSection === "features" && (
                  <div className="border-t border-gray-200 px-6 pb-6 dark:border-gray-700 md:px-8 md:pb-8">
                    <div className="space-y-8 pt-6">
                      {/* Helper: renders a section with items in 2-column balanced layout */}
                      {[
                        { label: "Intercom",          items: property.features!.intercom },
                        { label: "Interior Details",  items: property.features!.interiorDetails },
                        { label: "Outdoor Details",   items: property.features!.outdoorDetails },
                        { label: "Utilities",         items: property.features!.utilities },
                        { label: "Other Features",    items: property.features!.otherFeatures },
                      ]
                        .filter(({ items }) => items && items.length > 0)
                        .map(({ label, items }) => (
                          <div key={label}>
                            <h3 className="mb-4 text-lg font-semibold text-black dark:text-white">{label}</h3>
                            <div className="columns-2 gap-x-8 sm:columns-2 lg:columns-3">
                              {items!.map((feature, index) => (
                                <div key={index} className="mb-2.5 flex items-start gap-2 break-inside-avoid">
                                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  <span className="text-sm text-body-color dark:text-body-color-dark">{feature}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>
              )
            )}

            {/* ── Estimated Market Value & Climate Risks ── */}
            {(property.status.toLowerCase() === "for sale" || property.type.toLowerCase() === "for sale") && property.features && (
              <>
              <div className="mt-8 rounded-2xl bg-white shadow-lg dark:bg-gray-dark">
                <div className="p-6 md:p-8">
                  {/* ── Estimated Market Value ── */}
                  <h2 className="mb-5 text-2xl font-bold text-black dark:text-white">
                    Estimated market value
                  </h2>

                  {/* Three value cards */}
                  <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {/* PropEstimate */}
                    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                      <p className="mb-1 text-xs text-body-color underline decoration-dotted dark:text-body-color-dark">
                        PropEstimate<sup>™</sup>
                      </p>
                      <p className="text-lg font-bold text-black dark:text-white">
                        {property.features.zestimate || "Not available"}
                      </p>
                    </div>
                    {/* Estimated sales range */}
                    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                      <p className="mb-1 text-xs text-body-color dark:text-body-color-dark">
                        Estimated sales range
                      </p>
                      <p className="text-lg font-bold text-black dark:text-white">
                        {property.features.estimatedSalesRangeLow && property.features.estimatedSalesRangeHigh
                          ? `${property.features.estimatedSalesRangeLow} – ${property.features.estimatedSalesRangeHigh}`
                          : "Not available"}
                      </p>
                    </div>
                    {/* Rent Estimate */}
                    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                      <p className="mb-1 text-xs text-body-color underline decoration-dotted dark:text-body-color-dark">
                        Rent Estimate<sup>™</sup>
                      </p>
                      <p className="text-lg font-bold text-black dark:text-white">
                        {property.features.rentZestimate || "Not available"}
                      </p>
                    </div>
                  </div>

                  {/* Value History */}
                  <div className="mb-6">
                    <h3 className="mb-0.5 text-lg font-bold text-black dark:text-white">
                      Value History
                    </h3>
                    {property.features.zestimateChangePercent && (
                      <p className="mb-4 text-sm font-semibold text-green-600">
                        {property.features.zestimateChangePercent} in last{" "}
                        {property.features.zestimateChangeYears || "—"} years
                      </p>
                    )}

                    {(() => {
                      const demoHistory = [
                        { date: "Jan '17", price: 259100 },
                        { date: "Feb '17", price: 280500 },
                        { date: "Mar '17", price: 335700 },
                        { date: "Apr '17", price: 327400 },
                        { date: "May '17", price: 342800 },
                        { date: "5/17/17", price: 375000, event: "Sold for $375K" },
                        { date: "Jun '17", price: 330400 },
                        { date: "Jul '17", price: 354000 },
                        { date: "Aug '17", price: 360800 },
                        { date: "Sep '17", price: 362900 },
                        { date: "Oct '17", price: 356900 },
                        { date: "Nov '17", price: 350200 },
                        { date: "Dec '17", price: 349400 },
                        { date: "Jan '18", price: 367400 },
                        { date: "Feb '18", price: 263000 },
                        { date: "Mar '18", price: 243800 },
                        { date: "Apr '18", price: 278900 },
                        { date: "May '18", price: 284700 },
                        { date: "Jun '18", price: 277400 },
                        { date: "Jul '18", price: 269500 },
                        { date: "Aug '18", price: 280200 },
                        { date: "Sep '18", price: 271700 },
                        { date: "Oct '18", price: 287600 },
                        { date: "Nov '18", price: 290800 },
                        { date: "Dec '18", price: 294000 },
                        { date: "Jan '19", price: 315000 },
                        { date: "Feb '19", price: 316000 },
                        { date: "Mar '19", price: 310900 },
                        { date: "Apr '19", price: 326100 },
                        { date: "May '19", price: 320400 },
                        { date: "Jun '19", price: 358200 },
                        { date: "Jul '19", price: 338500 },
                        { date: "Aug '19", price: 341300 },
                        { date: "Sep '19", price: 335500 },
                        { date: "Oct '19", price: 336200 },
                        { date: "Nov '19", price: 337400 },
                        { date: "Dec '19", price: 354700 },
                        { date: "Jan '20", price: 334300 },
                        { date: "Feb '20", price: 458600 },
                        { date: "Mar '20", price: 470200 },
                        { date: "Apr '20", price: 458600 },
                        { date: "May '20", price: 458400 },
                        { date: "Jun '20", price: 469900 },
                        { date: "Jul '20", price: 430400 },
                        { date: "Aug '20", price: 431500 },
                        { date: "Sep '20", price: 432800 },
                        { date: "Oct '20", price: 434100 },
                        { date: "Nov '20", price: 437300 },
                        { date: "Dec '20", price: 438700 },
                        { date: "Jan '21", price: 440600 },
                        { date: "Feb '21", price: 444100 },
                        { date: "Mar '21", price: 445400 },
                        { date: "Apr '21", price: 447100 },
                        { date: "May '21", price: 452800 },
                        { date: "Jun '21", price: 589700 },
                        { date: "Jul '21", price: 600500 },
                        { date: "Aug '21", price: 637300 },
                        { date: "9/1/21", price: 637000, event: "Sold for $637K" },
                        { date: "Sep '21", price: 640200 },
                        { date: "Oct '21", price: 643500 },
                        { date: "Nov '21", price: 645700 },
                        { date: "Dec '21", price: 658700 },
                        { date: "Jan '22", price: 661500 },
                        { date: "Feb '22", price: 664100 },
                        { date: "Mar '22", price: 666500 },
                        { date: "Apr '22", price: 669800 },
                        { date: "May '22", price: 673500 },
                        { date: "Jun '22", price: 693400 },
                        { date: "Jul '22", price: 697200 },
                        { date: "Aug '22", price: 742800 },
                        { date: "Sep '22", price: 747800 },
                        { date: "Oct '22", price: 751600 },
                        { date: "Nov '22", price: 740900 },
                        { date: "Dec '22", price: 744000 },
                        { date: "Jan '23", price: 747200 },
                        { date: "Feb '23", price: 888200 },
                        { date: "Mar '23", price: 870100 },
                        { date: "Apr '23", price: 883700 },
                        { date: "May '23", price: 888200 },
                        { date: "Jun '23", price: 912200 },
                        { date: "Jul '23", price: 898600 },
                        { date: "Aug '23", price: 894900 },
                        { date: "Sep '23", price: 885700 },
                        { date: "Oct '23", price: 890200 },
                        { date: "Nov '23", price: 893100 },
                        { date: "Dec '23", price: 896300 },
                        { date: "Jan '24", price: 772000 },
                        { date: "Feb '24", price: 848100 },
                        { date: "Mar '24", price: 849600 },
                        { date: "Apr '24", price: 847200 },
                        { date: "May '24", price: 770200 },
                        { date: "Nov '24", price: 696200 },
                        { date: "Dec '24", price: 681300 },
                        { date: "Jan '25", price: 678700 },
                        { date: "Feb '25", price: 696600 },
                        { date: "Mar '25", price: 678500 },
                        { date: "Apr '25", price: 680500 },
                        { date: "May '25", price: 692500 },
                        { date: "Jun '25", price: 688600 },
                        { date: "Jul '25", price: 666600 },
                        { date: "Aug '25", price: 690500 },
                        { date: "Sep '25", price: 682000 },
                        { date: "Oct '25", price: 679700 },
                        { date: "Nov '25", price: 675200 },
                        { date: "Dec '25", price: 675000 },
                        { date: "Jan '26", price: 677000 },
                        { date: "Feb '26", price: 596700 },
                      ];
                      const chartData = property.features!.priceHistory?.length
                        ? property.features!.priceHistory
                        : demoHistory;
                      const yearTicks = ["Jan '17","Jan '18","Jan '19","Jan '20","Jan '21","Jan '22","Jan '23","Jan '24","Jan '25","Jan '26"];
                      return (
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis
                                dataKey="date"
                                ticks={yearTicks}
                                tick={{ fontSize: 11, fill: "#6b7280" }}
                                tickLine={false}
                                axisLine={false}
                              />
                              <YAxis
                                tickFormatter={(v: number) =>
                                  v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M`
                                  : v >= 1000 ? `$${(v / 1000).toFixed(0)}K`
                                  : `$${v}`
                                }
                                tick={{ fontSize: 11, fill: "#6b7280" }}
                                tickLine={false}
                                axisLine={false}
                                width={52}
                              />
                              <Tooltip
                                formatter={(value: number, _name: string, props: any) => [
                                  `$${Number(value).toLocaleString()}`,
                                  props.payload?.event || "Estimated value",
                                ]}
                                labelFormatter={(label) => String(label)}
                                contentStyle={{
                                  borderRadius: "8px",
                                  border: "1px solid #e5e7eb",
                                  fontSize: "12px",
                                }}
                              />
                              <Line
                                type="monotone"
                                dataKey="price"
                                stroke="#16a34a"
                                strokeWidth={2.5}
                                dot={(props: any) => {
                                  if (props.payload?.event) {
                                    return <circle key={props.key} cx={props.cx} cy={props.cy} r={5} fill="#dc2626" stroke="#fff" strokeWidth={2} />;
                                  }
                                  return <g key={props.key} />;
                                }}
                                activeDot={{ r: 5, fill: "#16a34a" }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Divider */}
                  <hr className="my-6 border-gray-200 dark:border-gray-700" />

                  {/* ── Climate Risks ── */}
                  <h2 className="mb-3 text-2xl font-bold text-black dark:text-white">
                    Climate risks
                  </h2>
                  <p className="mb-5 text-sm leading-relaxed text-body-color dark:text-body-color-dark">
                    Explore flood, wildfire, and other predictive climate risk information for this property on{" "}
                    {property.features.firstStreetUrl ? (
                      <a
                        href={property.features.firstStreetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary underline hover:opacity-80"
                      >
                        First Street<sup>®</sup>
                      </a>
                    ) : (
                      <span className="font-medium text-primary">First Street<sup>®</sup></span>
                    )}.
                  </p>

                  <div className="space-y-4">
                    {/* Flood zone */}
                    <div>
                      <p className="text-sm font-bold text-black dark:text-white">Flood zone</p>
                      <p className="text-sm text-body-color dark:text-body-color-dark">
                        {property.features.floodZone && property.features.floodZoneDescription
                          ? `${property.features.floodZone} — ${property.features.floodZoneDescription}`
                          : property.features.floodZone || "Flood zone data not available"}
                      </p>
                    </div>
                    {/* Fire risk */}
                    {property.features.fireRisk && (
                      <div>
                        <p className="text-sm font-bold text-black dark:text-white">Fire factor</p>
                        <p className="text-sm text-body-color dark:text-body-color-dark">{property.features.fireRisk}</p>
                      </div>
                    )}
                    {/* Wind risk */}
                    {property.features.windRisk && (
                      <div>
                        <p className="text-sm font-bold text-black dark:text-white">Wind factor</p>
                        <p className="text-sm text-body-color dark:text-body-color-dark">{property.features.windRisk}</p>
                      </div>
                    )}
                    {/* Air quality */}
                    {property.features.airQualityRisk && (
                      <div>
                        <p className="text-sm font-bold text-black dark:text-white">Air factor</p>
                        <p className="text-sm text-body-color dark:text-body-color-dark">{property.features.airQualityRisk}</p>
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* ── Getting Around ── */}
              <div className="mt-8 rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-dark md:p-8">
                <h2 className="mb-6 text-2xl font-bold text-black dark:text-white">
                  Getting around
                </h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Walk Score */}
                  {(() => {
                    const score = property.features?.walkScore ?? 11;
                    const desc = property.features?.walkScoreDescription || "Car-Dependent";
                    return (
                      <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-[#2ecc40]">
                          {/* walking person icon */}
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-7 w-7 fill-white">
                            <circle cx="12" cy="3.5" r="1.5" />
                            <path d="M10 8.5c-.6.9-1 2-1 3.2V18h1.5v-6h3V18H15v-6.3c0-1.2-.4-2.3-1-3.2L13 7h-2l-1 1.5zM9 20h6v1.5H9z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-black dark:text-white">
                            Walk Score<sup>®</sup>
                          </p>
                          <p className="text-sm text-body-color dark:text-body-color-dark">
                            <span className="font-bold text-black dark:text-white">{score}</span>
                            <span className="text-gray-400"> / 100</span>
                          </p>
                          <p className="text-sm text-body-color dark:text-body-color-dark">{desc}</p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Bike Score */}
                  {(() => {
                    const score = property.features?.bikeScore ?? 18;
                    const desc = property.features?.bikeScoreDescription || "Somewhat Bikeable";
                    return (
                      <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-[#2ecc40]">
                          {/* bicycle icon */}
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-7 w-7 fill-white">
                            <path d="M5 18.5A3.5 3.5 0 1 0 5 11.5a3.5 3.5 0 0 0 0 7zm0-1.5A2 2 0 1 1 5 13a2 2 0 0 1 0 4zm14 1.5A3.5 3.5 0 1 0 19 11.5a3.5 3.5 0 0 0 0 7zm0-1.5A2 2 0 1 1 19 13a2 2 0 0 1 0 4zM9 6h3l2.5 5H9.5L8 8.5 6.5 10H5l3-4zm1.2 1L8.7 9h4.6L11.2 7zM9 11l1.5 3H14l-1-2H9z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-black dark:text-white">
                            Bike Score<sup>®</sup>
                          </p>
                          <p className="text-sm text-body-color dark:text-body-color-dark">
                            <span className="font-bold text-black dark:text-white">{score}</span>
                            <span className="text-gray-400"> / 100</span>
                          </p>
                          <p className="text-sm text-body-color dark:text-body-color-dark">{desc}</p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Transit Score — only if data present */}
                  {property.features?.transitScore !== undefined && (() => {
                    const score = property.features!.transitScore!;
                    const desc = property.features!.transitScoreDescription || "";
                    return (
                      <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-[#2ecc40]">
                          {/* bus / transit icon */}
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-7 w-7 fill-white">
                            <path d="M4 6a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v9a2 2 0 0 1-1 1.73V18a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2h-4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-1.27A2 2 0 0 1 4 15V6zm2 0v7h12V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2zm1 10a1 1 0 1 0 2 0 1 1 0 0 0-2 0zm9 0a1 1 0 1 0 2 0 1 1 0 0 0-2 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-black dark:text-white">
                            Transit Score<sup>®</sup>
                          </p>
                          <p className="text-sm text-body-color dark:text-body-color-dark">
                            <span className="font-bold text-black dark:text-white">{score}</span>
                            <span className="text-gray-400"> / 100</span>
                          </p>
                          {desc && <p className="text-sm text-body-color dark:text-body-color-dark">{desc}</p>}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
              </>
            )}

            {/* Map Section */}
            <div className="mt-8 rounded-2xl bg-white shadow-lg dark:bg-gray-dark">
              {/* Map Header */}
              <div className="p-6 md:p-8">
                <h2 className="mb-6 text-2xl font-bold text-black dark:text-white">
                  Location
                </h2>
                <PropertyMap
                  title={property.title}
                  price={property.price}
                  bedrooms={property.bedrooms}
                  bathrooms={property.bathrooms}
                  image={property.images[0]}
                  latitude={property.latitude}
                  longitude={property.longitude}
                  locationName={property.location}
                />
                <p className="mt-4 flex items-start gap-2 text-body-color dark:text-body-color-dark">
                  <svg
                    className="mt-1 h-5 w-5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-base">{property.location}</span>
                </p>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="mt-8 rounded-2xl bg-white shadow-lg dark:bg-gray-dark" ref={reviewFormRef}>
              <div className="p-6 md:p-8">
                <h2 className="mb-6 text-2xl font-bold text-black dark:text-white">
                  Reviews {reviews.length > 0 && <span className="text-lg font-normal text-body-color dark:text-body-color-dark">({reviews.length})</span>}
                </h2>

                {/* Add Review Form - logged in only */}
                {isLoggedIn ? (
                  <form onSubmit={handleSubmitReview} className="mb-8 rounded-xl border border-gray-200 p-5 dark:border-gray-700">
                    <h3 className="mb-4 text-base font-semibold text-black dark:text-white">Write a Review</h3>

                    {/* Star Rating */}
                    <div className="mb-4 flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="transition-transform hover:scale-110"
                        >
                          <svg
                            className={`h-7 w-7 ${star <= reviewRating ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </button>
                      ))}
                      <span className="ml-2 text-sm text-body-color dark:text-body-color-dark">{reviewRating} / 5</span>
                    </div>

                    {/* Comment */}
                    <textarea
                      rows={3}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your experience with this property..."
                      className="mb-4 w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-black placeholder-gray-500 transition focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                      required
                    />

                    {reviewError && (
                      <p className="mb-3 text-sm text-red-500">{reviewError}</p>
                    )}
                    {reviewSuccess && (
                      <p className="mb-3 text-sm text-green-500">Review submitted successfully!</p>
                    )}

                    <button
                      type="submit"
                      disabled={reviewSubmitting || !reviewComment.trim()}
                      className="rounded-lg bg-black px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-black/80 disabled:opacity-50 dark:bg-primary dark:hover:bg-primary/90"
                    >
                      {reviewSubmitting ? "Submitting..." : "Submit Review"}
                    </button>
                  </form>
                ) : (
                  <div className="mb-8 rounded-xl border border-dashed border-gray-300 p-5 text-center dark:border-gray-700">
                    <p className="text-sm text-body-color dark:text-body-color-dark">
                      <Link href={`/signin?redirect=/listings/${id}`} className="font-semibold text-primary hover:underline">Sign in</Link>
                      {" "}to leave a review
                    </p>
                  </div>
                )}

                {/* Reviews List */}
                {reviewsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-4">
                        <div className="h-10 w-10 flex-shrink-0 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-1/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                          <div className="h-3 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                          <div className="h-3 w-4/5 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : reviews.length === 0 ? (
                  <p className="py-6 text-center text-sm text-body-color dark:text-body-color-dark">
                    No reviews yet. Be the first to review this property!
                  </p>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {reviews.map((review) => {
                      const displayName = review.user?.name ||
                        [review.user?.firstName, review.user?.lastName].filter(Boolean).join(" ") ||
                        "Anonymous";
                      const initials = displayName.charAt(0).toUpperCase();
                      const date = new Date(review.createdAt).toLocaleDateString("en-US", {
                        year: "numeric", month: "short", day: "numeric",
                      });
                      return (
                        <div key={review.id} className="flex gap-4 py-5">
                          {review.user?.profilePhoto ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={review.user.profilePhoto}
                              alt={displayName}
                              className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                            />
                          ) : (
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                              {initials}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-semibold text-black dark:text-white">{displayName}</span>
                              <span className="text-xs text-body-color dark:text-body-color-dark">{date}</span>
                            </div>
                            <div className="mt-1 mb-2 flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg
                                  key={star}
                                  className={`h-4 w-4 ${star <= review.rating ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                            <p className="text-sm leading-relaxed text-body-color dark:text-body-color-dark">{review.body ?? review.comment}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contact Form Sidebar - Right Side */}
          <div id="contact" className="lg:col-span-1 lg:h-full">
            <div className="sticky top-24">
              <div className="rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-dark md:p-8">
                {/* Agent Profile */}
                <div className="mb-6 flex flex-col items-center text-center">
                  <div className="mb-4 h-20 w-20 overflow-hidden rounded-full">
                    <Image
                      src={property.managerPhoto || "/images/team/member-1.jpg"}
                      alt={property.managerName || "Investment Analyst"}
                      width={80}
                      height={80}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <h3 className="mb-1 text-xl font-bold text-black dark:text-white">
                    {property.managerName || "Investment Analyst"}
                  </h3>
                  <p className="text-sm text-body-color dark:text-body-color-dark">
                    {property.managerRole || "Property Manager"}
                  </p>
                </div>

                {/* Contact Form */}
                {contactSuccess ? (
                  <div className="flex flex-col items-center justify-center rounded-xl bg-green-50 px-6 py-10 text-center dark:bg-green-900/20">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-800">
                      <svg className="h-7 w-7 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-base font-semibold text-green-700 dark:text-green-400">Message Sent!</p>
                    <p className="mt-1 text-sm text-green-600 dark:text-green-500">We'll get back to you soon.</p>
                    <button
                      onClick={() => { setContactSuccess(false); setContactName(""); setContactEmail(""); setContactPhone(""); setContactMessage(""); }}
                      className="mt-4 text-sm font-medium text-primary underline"
                    >
                      Send another
                    </button>
                  </div>
                ) : (
                  <form
                    className="space-y-4"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setContactError(null);
                      const resolvedMessage = contactMessage.trim() || `I'm interested in ${property.title}`;
                      const parsed = propertyContactSchema.safeParse({
                        contactName: contactName.trim(),
                        contactEmail: contactEmail.trim(),
                        message: resolvedMessage,
                      });
                      if (!parsed.success) {
                        setContactError(parsed.error.issues[0].message);
                        return;
                      }
                      setContactSending(true);
                      try {
                        const res = await fetch(`${API_URL}/api/contact`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            name: contactName.trim(),
                            email: contactEmail.trim(),
                            phone: contactPhone.trim() || undefined,
                            message: resolvedMessage,
                          }),
                        });
                        if (!res.ok) {
                          const data = await res.json().catch(() => ({}));
                          throw new Error(data?.message || "Failed to send message.");
                        }
                        setContactSuccess(true);
                      } catch (err: any) {
                        setContactError(err.message || "Something went wrong. Please try again.");
                      } finally {
                        setContactSending(false);
                      }
                    }}
                  >
                    {contactError && (
                      <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                        {contactError}
                      </p>
                    )}

                    <div>
                      <input
                        type="text"
                        placeholder="Your Name"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        required
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-black placeholder-gray-500 transition focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                      />
                    </div>

                    <div>
                      <input
                        type="email"
                        placeholder="Your Email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        required
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-black placeholder-gray-500 transition focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                      />
                    </div>

                    <div className="phone-input-compact">
                      <PhoneInput
                        defaultCountry="us"
                        value={contactPhone}
                        onChange={(value) => setContactPhone(value)}
                      />
                    </div>

                    <div>
                      <textarea
                        rows={4}
                        placeholder="Your message"
                        value={contactMessage !== "" ? contactMessage : `I'm interested in ${property.title}`}
                        onChange={(e) => setContactMessage(e.target.value)}
                        required
                        className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-black placeholder-gray-500 transition focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={contactSending}
                      className="ease-in-up shadow-btn hover:shadow-btn-hover w-full rounded-lg bg-black px-8 py-4 text-center text-base font-semibold text-white transition duration-300 hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-primary dark:hover:bg-primary/90"
                    >
                      {contactSending ? "Sending…" : "Send Email"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

    </section>

    {/* Lightbox — outside section so it escapes the z-10 stacking context */}
    {lightboxOpen && property.images.length > 0 && (
      <div
        className="fixed inset-0 z-[99999] flex flex-col bg-black"
        onClick={() => setLightboxOpen(false)}
      >
        {/* X close button — always visible top-right */}
        <button
          onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
          className="absolute top-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-black shadow-lg transition-all hover:bg-gray-100 active:scale-95"
          aria-label="Close lightbox"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Counter — top left */}
        <div className="flex-shrink-0 px-4 pt-5 pb-2" onClick={(e) => e.stopPropagation()}>
          <span className="text-sm font-medium text-white/60">
            {lightboxIndex + 1} / {property.images.length}
          </span>
        </div>

        {/* Main image — dark sides are clickable to close */}
        <div className="relative flex flex-1 items-center justify-center">
          {/* Image itself — stopPropagation so clicking it does NOT close */}
          <div
            className="relative h-[70vh] w-[80vw] md:w-[70vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={property.images[lightboxIndex]}
              alt={`${property.title} - Image ${lightboxIndex + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>

          {/* Prev / Next arrows */}
          {property.images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => (prev - 1 + property.images.length) % property.images.length); }}
                className="absolute left-2 z-10 rounded-full bg-white/20 p-3 text-white backdrop-blur-sm transition-all hover:bg-white/40 active:scale-95 md:left-6"
                aria-label="Previous image"
              >
                <svg className="h-5 w-5 md:h-6 md:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => (prev + 1) % property.images.length); }}
                className="absolute right-2 z-10 rounded-full bg-white/20 p-3 text-white backdrop-blur-sm transition-all hover:bg-white/40 active:scale-95 md:right-6"
                aria-label="Next image"
              >
                <svg className="h-5 w-5 md:h-6 md:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Thumbnail strip */}
        {property.images.length > 1 && (
          <div
            className="flex flex-shrink-0 items-center justify-start gap-2 overflow-x-auto px-4 py-4 md:justify-center md:gap-3 md:px-6"
            onClick={(e) => e.stopPropagation()}
          >
            {property.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setLightboxIndex(i)}
                className={`relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-lg transition-all duration-200 md:h-16 md:w-24 ${
                  lightboxIndex === i
                    ? "scale-105 opacity-100 ring-2 ring-primary"
                    : "opacity-40 hover:opacity-80"
                }`}
              >
                <Image src={img} alt={`Thumbnail ${i + 1}`} fill className="object-cover" sizes="96px" />
              </button>
            ))}
          </div>
        )}
      </div>
    )}
    </>
  );
}
