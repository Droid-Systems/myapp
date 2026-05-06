"use client";

import { useEffect } from "react";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";

interface Props {
  url: string;
  title: string;
  onClose: () => void;
}

export default function PdfViewerModal({ url, title, onClose }: Props) {
  const layoutPlugin = defaultLayoutPlugin();

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-shrink-0 items-center gap-2 bg-gray-900 px-3 py-2 sm:px-5 sm:py-3">

        {/* Title — truncates on narrow screens */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <svg
            className="h-4 w-4 flex-shrink-0 text-gray-400 sm:h-5 sm:w-5"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="truncate text-xs font-medium text-white sm:text-sm">{title}</span>
        </div>

        {/* Actions */}
        <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2">

          {/* Download — square icon-only on mobile, label+icon on sm+ */}
          <a
            href={url}
            download
            aria-label="Download PDF"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600
                       sm:h-auto sm:w-auto sm:gap-1.5 sm:px-3 sm:py-1.5"
          >
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="hidden text-sm sm:inline">Download</span>
          </a>

          {/* Close — square icon-only on mobile, label+icon on sm+ */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600
                       sm:h-auto sm:w-auto sm:gap-1.5 sm:px-3 sm:py-1.5"
          >
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="hidden text-sm sm:inline">Close</span>
          </button>
        </div>
      </div>

      {/* ── PDF Viewer ──────────────────────────────────────────────────────── */}
      <div className="min-h-0 flex-1">
        <Worker workerUrl="/pdf.worker.min.js">
          <Viewer fileUrl={url} plugins={[layoutPlugin]} />
        </Worker>
      </div>
    </div>
  );
}
