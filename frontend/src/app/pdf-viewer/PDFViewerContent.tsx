"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function PDFViewerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const docId = searchParams.get("docId");
  const docTitle = searchParams.get("title") || "document";
  const tokenParam = searchParams.get("token");

  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  const getServeUrl = useCallback(() => {
    if (!docId || !tokenParam) return null;
    const safeTitle = encodeURIComponent(docTitle.replace(/[/\\?%*:|"<>]/g, "-"));
    return `${API_URL}/api/pdf/serve/${docId}/${safeTitle}.pdf?token=${encodeURIComponent(tokenParam)}`;
  }, [docId, tokenParam, docTitle]);

  // Fetch PDF with auth token → blob URL
  useEffect(() => {
    const url = getServeUrl();
    if (!url) return;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch PDF");
        return res.blob();
      })
      .then((blob) => setPdfBlobUrl(URL.createObjectURL(blob)))
      .catch(() => setLoadError("Failed to load document. Please try again."));

    return () => {
      setPdfBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [getServeUrl]);

  const handleDownload = async () => {
    const url = getServeUrl();
    if (!url) return;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${docTitle}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch {
      alert("Failed to download PDF. Please try again.");
    }
  };

  const handleClose = () => router.push("/");

  if (!docId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-dark">
        <div className="rounded-xl bg-white p-8 shadow-xl dark:bg-gray-dark">
          <p className="text-lg text-red-600 dark:text-red-400">No document specified</p>
        </div>
      </div>
    );
  }

  if (!tokenParam) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-dark">
        <div className="rounded-xl bg-white p-8 shadow-xl dark:bg-gray-dark">
          <p className="text-lg text-red-600 dark:text-red-400">Access denied: No access token provided</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-100 dark:bg-gray-dark">
      {/* Action Bar */}
      <div className="sticky top-0 z-40 bg-white shadow-md dark:bg-gray-800">
        <div className="mx-auto flex max-w-full items-center justify-between px-3 py-2 sm:px-4 sm:py-3">
          <h1 className="max-w-[50%] truncate text-sm font-semibold text-black dark:text-white sm:text-base">
            {docTitle}
          </h1>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => window.print()}
              className="rounded-md bg-primary px-2 py-1.5 text-xs font-medium text-white transition hover:bg-primary/80 sm:px-3 sm:py-2 sm:text-sm"
            >
              Print
            </button>
            <button
              onClick={handleDownload}
              className="rounded-md bg-green-600 px-2 py-1.5 text-xs font-medium text-white transition hover:bg-green-700 sm:px-3 sm:py-2 sm:text-sm"
            >
              Download
            </button>
            <button
              onClick={handleClose}
              className="rounded-md bg-black px-2 py-1.5 text-xs font-medium text-white transition hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/90 sm:px-3 sm:py-2 sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1" style={{ height: "calc(100vh - 56px)" }}>
        {loadError ? (
          <div className="flex h-full items-center justify-center">
            <div className="rounded-xl bg-white p-8 text-center shadow dark:bg-gray-dark">
              <p className="mb-4 text-red-500">{loadError}</p>
              <button
                onClick={handleDownload}
                className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/80"
              >
                Download Instead
              </button>
            </div>
          </div>
        ) : !pdfBlobUrl ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-body-color dark:text-white">Loading document…</p>
            </div>
          </div>
        ) : (
          <Worker workerUrl="/pdf.worker.min.js">
            <Viewer
              fileUrl={pdfBlobUrl}
              plugins={[defaultLayoutPluginInstance]}
            />
          </Worker>
        )}
      </div>
    </div>
  );
}
