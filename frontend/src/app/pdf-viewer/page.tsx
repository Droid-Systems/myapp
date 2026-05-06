"use client";

import dynamic from "next/dynamic";

const PDFViewerContent = dynamic(() => import("./PDFViewerContent"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-dark">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-lg text-black dark:text-white">Loading…</p>
      </div>
    </div>
  ),
});

export default function PDFViewer() {
  return <PDFViewerContent />;
}
