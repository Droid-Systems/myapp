"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

interface TabWrapperProps {
  onTabChange: (tab: "tickets" | "new") => void;
}

export function TabWrapper({ onTabChange }: TabWrapperProps) {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const initialTab = tab === "new" ? "new" : "tickets";

  useEffect(() => {
    onTabChange(initialTab);
  }, [initialTab, onTabChange]);

  return null;
}
