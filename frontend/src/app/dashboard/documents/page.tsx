"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";

// ssr: false keeps pdfjs-dist (which references Node's 'canvas') out of the SSR bundle
const SigningView = dynamic(() => import("./SigningView"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-20 text-body-color">
      Loading document viewer…
    </div>
  ),
});

const PdfViewerModal = dynamic(() => import("./PdfViewerModal"), { ssr: false });

interface DocField {
  id: string;
  type: "signature" | "name" | "date" | "text" | "stamp";
  assignedTo: "user" | "admin" | "witness";
  required: boolean;
  xPct: number; yPct: number;
  wPct: number; hPct: number;
}

interface SigningDoc {
  id: string;
  title: string;
  description: string;
  userMessage: string;
  documentUrl: string;
  signedDocumentUrl: string | null;
  status: string;
  signedAt: string | null;
  createdAt: string;
  fields?: DocField[];
}

function fmt(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<SigningDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "signed">("pending");
  const [signingDoc, setSigningDoc] = useState<SigningDoc | null>(null);
  const [viewingDoc, setViewingDoc] = useState<SigningDoc | null>(null);
  const [viewingUrl, setViewingUrl] = useState<string | null>(null);
  const [viewLoading, setViewLoading] = useState<string | null>(null); // doc id being loaded for view
  const [viewError, setViewError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null); // doc id being downloaded

  /** Fetch a PDF through the backend proxy and return a local blob URL */
  const fetchPdfBlobViaApi = async (id: string, signed: boolean): Promise<string> => {
    const blob = await api.downloadDocumentFile(id, signed);
    return URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
  };

  const openForViewing = async (doc: SigningDoc) => {
    setViewError(null);
    setViewLoading(doc.id);
    try {
      const blobUrl = await fetchPdfBlobViaApi(doc.id, !!doc.signedDocumentUrl);
      setViewingDoc(doc);
      setViewingUrl(blobUrl);
    } catch (err) {
      console.error("Failed to load PDF:", err);
      setViewError("Could not load the PDF. Please try again.");
    } finally {
      setViewLoading(null);
    }
  };

  const closeViewer = () => {
    if (viewingUrl) URL.revokeObjectURL(viewingUrl);
    setViewingDoc(null);
    setViewingUrl(null);
  };

  const downloadSigned = async (doc: SigningDoc) => {
    if (!doc.signedDocumentUrl) return;
    setDownloading(doc.id);
    try {
      const blobUrl = await fetchPdfBlobViaApi(doc.id, true);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${doc.title.replace(/[^a-z0-9]/gi, "_")}-signed.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setDownloading(null);
    }
  };

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getUserDocuments();
      const data = (res as any).data ?? res;
      setDocs(Array.isArray(data) ? data : []);
    } catch {
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const pending = docs.filter((d) => d.status === "pending");
  const signed = docs.filter((d) => d.status === "signed");
  const displayed = tab === "pending" ? pending : signed;

  if (signingDoc) {
    return (
      <SigningView
        doc={signingDoc}
        onBack={() => setSigningDoc(null)}
        onSigned={() => {
          setSigningDoc(null);
          fetchDocs();
        }}
      />
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-black dark:text-white">My Documents</h1>

      {viewError && (
        <div className="mb-4 flex items-center justify-between rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
          <span>{viewError}</span>
          <button onClick={() => setViewError(null)} className="ml-4 text-red-500 hover:text-red-700">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-4 flex gap-2">
        {(["pending", "signed"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium transition ${
              tab === t
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
            <span
              className={`rounded-full px-1.5 py-0.5 text-xs ${
                tab === t ? "bg-white/20" : "bg-gray-200 dark:bg-gray-600"
              }`}
            >
              {t === "pending" ? pending.length : signed.length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-body-color">Loading…</div>
      ) : displayed.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow dark:bg-gray-dark">
          <svg
            className="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-body-color">
            {tab === "pending"
              ? "No documents awaiting your signature."
              : "No signed documents yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayed.map((doc) => (
            <div key={doc.id} className="rounded-2xl bg-white p-5 shadow dark:bg-gray-dark">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-black dark:text-white">{doc.title}</h3>
                    {doc.status === "pending" && (
                      <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                        Awaiting Signature
                      </span>
                    )}
                    {doc.status === "signed" && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                        Signed
                      </span>
                    )}
                  </div>
                  {doc.description && (
                    <p className="mb-1 text-sm text-body-color">{doc.description}</p>
                  )}
                  {doc.userMessage && (
                    <p className="mb-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                      {doc.userMessage}
                    </p>
                  )}
                  <p className="text-xs text-body-color">
                    Received: {fmt(doc.createdAt)}
                    {doc.signedAt && ` · Signed: ${fmt(doc.signedAt)}`}
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:flex-shrink-0">
                  <button
                    onClick={() => openForViewing(doc)}
                    disabled={viewLoading === doc.id}
                    className="w-full rounded-xl border border-stroke px-4 py-2 text-center text-sm font-medium text-black hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:text-white dark:hover:bg-gray-800 sm:w-auto"
                  >
                    {viewLoading === doc.id ? "Loading…" : "View PDF"}
                  </button>
                  {doc.status === "pending" && (
                    <button
                      onClick={() => setSigningDoc(doc)}
                      className="w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 sm:w-auto"
                    >
                      Sign Document
                    </button>
                  )}
                  {doc.signedDocumentUrl && (
                    <button
                      onClick={() => downloadSigned(doc)}
                      disabled={downloading === doc.id}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-60 sm:w-auto"
                    >
                      {downloading === doc.id ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          Downloading…
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download Signed
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full-screen PDF viewer modal */}
      {viewingDoc && viewingUrl && (
        <PdfViewerModal
          url={viewingUrl}
          title={viewingDoc.title}
          onClose={closeViewer}
        />
      )}
    </div>
  );
}
