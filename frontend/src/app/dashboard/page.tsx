"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to overview page
    router.push("/dashboard/overview");
  }, [router]);

  return null;
}
