"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

const VALID_TABS = ["password", "notifications", "privacy", "sessions", "danger"];

interface TabWrapperProps {
  onTabChange: (tab: string) => void;
}

export function TabWrapper({ onTabChange }: TabWrapperProps) {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "";
  const initialTab = VALID_TABS.includes(tab) ? tab : "password";
  const onTabChangeRef = useRef(onTabChange);

  // Keep ref updated
  useEffect(() => {
    onTabChangeRef.current = onTabChange;
  }, [onTabChange]);

  useEffect(() => {
    onTabChangeRef.current(initialTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTab]);

  return null;
}
