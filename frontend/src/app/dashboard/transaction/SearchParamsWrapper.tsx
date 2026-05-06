"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

const VALID_TYPES = ["all", "deposit", "withdrawal", "investment", "transfer", "referral", "profit"];
const VALID_STATUSES = ["all", "completed", "pending", "failed", "processing"];

interface SearchParamsWrapperProps {
  onParamsChange: (type: string, status: string, query: string) => void;
}

export function SearchParamsWrapper({ onParamsChange }: SearchParamsWrapperProps) {
  const searchParams = useSearchParams();

  const type = VALID_TYPES.includes(searchParams.get("type") || "")
    ? searchParams.get("type")!
    : "all";
  const status = VALID_STATUSES.includes(searchParams.get("status") || "")
    ? searchParams.get("status")!
    : "all";
  const query = searchParams.get("q") || "";

  useEffect(() => {
    onParamsChange(type, status, query);
  }, [type, status, query, onParamsChange]);

  return null;
}
