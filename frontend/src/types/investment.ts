export interface InvestmentProperty {
  id: string;
  title: string;
  description: string;
  images: string[];
  location: string;

  // Investment specifics
  investmentType: "individual" | "pooled";
  category: "arbitrage" | "mortgage" | "airbnb" | "airbnb_arbitrage" | "airbnb_mortgage" | "for_sale";

  // Pricing
  price: number;
  minInvestment: number;
  maxInvestment: number;

  // Pooled investment tracking
  targetAmount: number;
  currentFunded: number;
  investorCount: number;

  // For-sale bid tracking (optional — populated when bidding is active)
  bidCount?: number;
  recentBidAmount?: number;

  // Returns
  expectedROI: number; // Annual percentage
  monthlyReturn: number; // Monthly percentage
  duration: number; // Investment duration in months

  // Property details
  bedrooms: number;
  bathrooms: number;
  parking: number;
  area: string; // e.g., "1200 sqft"

  // Status
  status: "available" | "fully-funded" | "coming-soon" | "closed";

  // Additional info
  features: string[];
  riskLevel: "low" | "medium" | "high";
  createdAt: string;
}

export interface Investment {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyImage: string;
  amount: number;
  investmentDate: string;
  status: "active" | "completed" | "pending";
  investmentType: "individual" | "pooled";
  expectedReturn: number;
  monthlyReturn: number;
  expectedTotal: number;
}

export interface InvestmentRequest {
  propertyId: string;
  amount: number;
  paymentMethod: "wallet" | "deposit";
}
