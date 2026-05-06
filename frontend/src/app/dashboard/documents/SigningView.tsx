"use client";

import { useEffect, useRef, useState } from "react";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { api } from "@/lib/api";

type Step = "review" | "fill" | "preview" | "success";
type ActiveTool = "sig" | "name" | "date" | null;
type OpenPanel = "sig" | "name" | "date" | "text" | null;

// ─── DocField (admin-defined field zones) ─────────────────────────────────────

interface DocField {
  id: string;
  type: "signature" | "name" | "date" | "text" | "stamp";
  assignedTo: "user" | "admin" | "witness";
  required: boolean;
  xPct: number; yPct: number;
  wPct: number; hPct: number;
  pageNum?: number; // 1-based; optional for backward compat (old docs default to last page)
}

const GUIDED_COLORS: Record<DocField["assignedTo"], { border: string; bg: string }> = {
  user:    { border: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  admin:   { border: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
  witness: { border: "#f97316", bg: "rgba(249,115,22,0.12)" },
};

const GUIDED_ICONS: Record<DocField["type"], string> = {
  signature: "✍", name: "A", date: "📅", text: "T", stamp: "🔏",
};

interface FieldValue {
  fieldId: string;
  value: string;
  sigW?: number;
  sigH?: number;
}

interface SigningDoc {
  id: string;
  title: string;
  description: string;
  userMessage: string;
  documentUrl: string;
  fields?: DocField[];
}

interface Props {
  doc: SigningDoc;
  onBack: () => void;
  onSigned: () => void;
}

// ─── Step progress bar ────────────────────────────────────────────────────────

function StepBar({ current }: { current: Step }) {
  const steps = [
    { id: "review", label: "Review" },
    { id: "fill",   label: "Fill & Place" },
    { id: "preview", label: "Preview" },
  ];
  const idx = steps.findIndex((s) => s.id === current);

  return (
    <div className="mb-8 flex items-start">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                i < idx
                  ? "bg-green-500 text-white"
                  : i === idx
                  ? "bg-primary text-white shadow-lg"
                  : "bg-gray-200 text-gray-400 dark:bg-gray-700"
              }`}
            >
              {i < idx ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <p className={`mt-1.5 text-xs font-medium ${
              i === idx ? "text-primary" : i < idx ? "text-green-500" : "text-body-color"
            }`}>
              {s.label}
            </p>
          </div>
          {i < steps.length - 1 && (
            <div className={`mb-5 h-0.5 w-12 sm:w-24 ${i < idx ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SigningView({ doc, onBack, onSigned }: Props) {
  const [step, setStep] = useState<Step>("review");
  const [reviewed, setReviewed] = useState(false);

  // Signature drawing
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<any>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  // Placed field positions (top-left corner as fraction of page, 0–1)
  const [sigPos, setSigPos]   = useState({ xPct: 0.62, yPct: 0.80 });
  const [namePos, setNamePos] = useState({ xPct: 0.10, yPct: 0.88 });
  const [datePos, setDatePos] = useState({ xPct: 0.10, yPct: 0.93 });

  // Signature display size (canvas pixels)
  const [sigW, setSigW] = useState(180);
  const [sigH, setSigH] = useState(60);

  // Resize state
  const isResizing       = useRef(false);
  const resizeHandle     = useRef<"n"|"ne"|"e"|"se"|"s"|"sw"|"w"|"nw" | null>(null);
  const resizeStartBox   = useRef({ left: 0, top: 0, w: 0, h: 0 });
  const resizeStartMouse = useRef({ x: 0, y: 0 });

  // Name / date / text values
  const [nameText, setNameText] = useState("");
  const [dateText, setDateText] = useState(() => new Date().toISOString().split("T")[0]);
  const [textValue, setTextValue] = useState(""); // for guided "text" type fields

  // Interactive fill step: which tool is armed for next click, and which panel is open
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);
  const [openPanel, setOpenPanel]   = useState<OpenPanel>(null);

  // Drag state
  const isDragging      = useRef(false);
  const dragOffset      = useRef({ x: 0, y: 0 });
  const draggingTarget  = useRef<"sig" | "name" | "date" | null>(null);
  const didDrag         = useRef(false); // distinguish click vs drag

  // PDF canvas refs / state
  const posContainerRef = useRef<HTMLDivElement>(null);
  const pageCanvasRef   = useRef<HTMLCanvasElement>(null);
  const [pageDims, setPageDims] = useState<{ w: number; h: number } | null>(null);
  const [pageRenderError, setPageRenderError] = useState(false);

  // Preview
  const [previewUrl, setPreviewUrl]       = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");

  // ── Guided mode state ────────────────────────────────────────────────────

  const [fieldValues, setFieldValues]               = useState<FieldValue[]>([]);
  const [activeGuidedFieldId, setActiveGuidedFieldId] = useState<string | null>(null);

  // ── Signature input mode (draw vs upload) ────────────────────────────────

  const [sigInputMode, setSigInputMode]             = useState<"draw" | "upload">("draw");
  const [uploadedSigPreview, setUploadedSigPreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver]                 = useState(false);
  const uploadSigInputRef                           = useRef<HTMLInputElement>(null);

  // ── Authenticated PDF blob URL ─────────────────────────────────────────
  // Cloudinary returns 401 when fetched directly from the browser.
  // We fetch once via the backend proxy and use the local blob URL everywhere.

  const [docBlobUrl, setDocBlobUrl]             = useState<string | null>(null);
  const [docBlobFetching, setDocBlobFetching]   = useState(true);
  const docBlobUrlRef                           = useRef<string | null>(null);

  useEffect(() => {
    setDocBlobFetching(true);
    api.downloadDocumentFile(doc.id, false)
      .then((blob) => {
        const url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
        docBlobUrlRef.current = url;
        setDocBlobUrl(url);
      })
      .catch(() => setPageRenderError(true))
      .finally(() => setDocBlobFetching(false));
    return () => {
      if (docBlobUrlRef.current) {
        URL.revokeObjectURL(docBlobUrlRef.current);
        docBlobUrlRef.current = null;
      }
    };
  }, [doc.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived: guided mode ─────────────────────────────────────────────────

  const guidedMode = (doc.fields ?? []).length > 0;
  const guidedUserFields = guidedMode ? (doc.fields ?? []).filter((f) => f.assignedTo === "user") : [];
  const guidedAllRequiredFilled = guidedUserFields
    .filter((f) => f.required)
    .every((f) => fieldValues.some((fv) => fv.fieldId === f.id && fv.value));

  // Blob URL cleanup
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  // ── Signature pad: init when panel opens ──────────────────────────────────

  useEffect(() => {
    if (step !== "fill" || openPanel !== "sig") return;
    if (!canvasRef.current) return;

    let pad: any;
    import("signature_pad").then((mod) => {
      pad = new mod.default(canvasRef.current!, {
        backgroundColor: "rgba(0,0,0,0)",
        penColor: "rgb(0,0,0)",
        minWidth: 1,
        maxWidth: 3,
      });
      padRef.current = pad;
      if (signatureDataUrl) pad.fromDataURL(signatureDataUrl);
    });
    return () => { pad?.off(); };
  }, [step, openPanel]); // eslint-disable-line react-hooks/exhaustive-deps

  // Signature canvas resize
  useEffect(() => {
    if (step !== "fill" || openPanel !== "sig") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const saved = padRef.current?.toData?.();
      canvas.width  = canvas.offsetWidth  * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(ratio, ratio);
      padRef.current?.clear();
      if (saved) padRef.current?.fromData(saved);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [step, openPanel]);

  // ── Render last PDF page to canvas when entering fill step ────────────────
  // Depends on docBlobUrl (the authenticated proxy blob) instead of the raw
  // Cloudinary URL which the browser cannot fetch without auth (401).

  useEffect(() => {
    if (step !== "fill" || !docBlobUrl) return; // wait until blob URL is ready
    setPageRenderError(false);
    setPageDims(null);

    (async () => {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        (pdfjsLib as any).GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

        const pdfDoc = await (pdfjsLib as any).getDocument(docBlobUrl).promise;
        const page   = await pdfDoc.getPage(pdfDoc.numPages);

        const container = posContainerRef.current;
        const canvas    = pageCanvasRef.current;
        if (!container || !canvas) return;

        const cw         = container.clientWidth;
        const baseVp     = page.getViewport({ scale: 1 });
        const viewport   = page.getViewport({ scale: cw / baseVp.width });

        canvas.width  = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);

        await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;

        const dims = { w: canvas.width, h: canvas.height };
        setPageDims(dims);

        const dw = Math.min(200, dims.w * 0.32);
        setSigW(Math.round(dw));
        setSigH(Math.round(dw / 3));
      } catch {
        setPageRenderError(true);
      }
    })();
  }, [step, docBlobUrl]);

  // ── Derived text-box sizes ────────────────────────────────────────────────

  const TEXT_BOX_H = 26;
  const nameBoxW = pageDims ? Math.round(pageDims.w * 0.28) : 170;
  const dateBoxW = pageDims ? Math.round(pageDims.w * 0.20) : 120;

  // ── Drag helpers ──────────────────────────────────────────────────────────

  const getClientXY = (e: React.MouseEvent | React.TouchEvent) => {
    if ("touches" in e) return { cx: e.touches[0].clientX, cy: e.touches[0].clientY };
    return { cx: (e as React.MouseEvent).clientX, cy: (e as React.MouseEvent).clientY };
  };

  const getCanvasRect = () => pageCanvasRef.current!.getBoundingClientRect();

  const makeDragStart = (target: "sig" | "name" | "date") => (e: React.MouseEvent | React.TouchEvent) => {
    if (!pageDims || !pageCanvasRef.current) return;
    draggingTarget.current = target;
    isDragging.current = true;
    didDrag.current = false;
    const rect = getCanvasRect();
    const { cx, cy } = getClientXY(e);
    const pos = target === "sig" ? sigPos : target === "name" ? namePos : datePos;
    dragOffset.current = { x: cx - rect.left - pos.xPct * rect.width, y: cy - rect.top - pos.yPct * rect.height };
    e.stopPropagation();
  };

  const onDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    // ── Resize mode ──────────────────────────────────────────────────────────
    if (isResizing.current && resizeHandle.current && pageDims && pageCanvasRef.current) {
      didDrag.current = true;
      const rect = getCanvasRect();
      const { cx, cy } = getClientXY(e);
      const dx = cx - resizeStartMouse.current.x;
      const dy = cy - resizeStartMouse.current.y;
      const { left: iL, top: iT, w: iW, h: iH } = resizeStartBox.current;
      const h = resizeHandle.current;
      const MIN_W = 40, MIN_H = 16;

      let nL = iL, nT = iT, nW = iW, nH = iH;
      if (h.includes("e")) nW = Math.max(MIN_W, iW + dx);
      if (h.includes("w")) { nW = Math.max(MIN_W, iW - dx); nL = iL + iW - nW; }
      if (h.includes("s")) nH = Math.max(MIN_H, iH + dy);
      if (h.includes("n")) { nH = Math.max(MIN_H, iH - dy); nT = iT + iH - nH; }

      nL = Math.max(0, Math.min(nL, rect.width  - nW));
      nT = Math.max(0, Math.min(nT, rect.height - nH));
      setSigPos({ xPct: nL / rect.width, yPct: nT / rect.height });
      setSigW(Math.round(nW));
      setSigH(Math.round(nH));
      return;
    }

    // ── Drag mode ────────────────────────────────────────────────────────────
    if (!isDragging.current || !pageDims || !draggingTarget.current || !pageCanvasRef.current) return;
    didDrag.current = true;
    const rect = getCanvasRect();
    const { cx, cy } = getClientXY(e);
    const newLeft = cx - rect.left - dragOffset.current.x;
    const newTop  = cy - rect.top  - dragOffset.current.y;
    const target  = draggingTarget.current;
    const boxW = target === "sig" ? sigW : target === "name" ? nameBoxW : dateBoxW;
    const boxH = target === "sig" ? sigH : TEXT_BOX_H;
    const newPos = {
      xPct: Math.max(0, Math.min(newLeft, rect.width  - boxW)) / rect.width,
      yPct: Math.max(0, Math.min(newTop,  rect.height - boxH)) / rect.height,
    };
    if (target === "sig")        setSigPos(newPos);
    else if (target === "name")  setNamePos(newPos);
    else                         setDatePos(newPos);
  };

  const onDragEnd = () => {
    isDragging.current    = false;
    draggingTarget.current = null;
    isResizing.current    = false;
    resizeHandle.current  = null;
  };

  const onResizeStart = (
    handle: "n"|"ne"|"e"|"se"|"s"|"sw"|"w"|"nw",
    e: React.MouseEvent | React.TouchEvent,
  ) => {
    if (!pageDims || !pageCanvasRef.current) return;
    e.stopPropagation();
    didDrag.current = true; // prevent canvas-click firing on mouse-up
    isResizing.current   = true;
    resizeHandle.current = handle;
    const rect = getCanvasRect();
    const { cx, cy } = getClientXY(e);
    resizeStartMouse.current = { x: cx, y: cy };
    resizeStartBox.current   = {
      left: sigPos.xPct * rect.width,
      top:  sigPos.yPct * rect.height,
      w: sigW,
      h: sigH,
    };
  };

  // ── Click-to-place handler on the PDF canvas area ────────────────────────

  const onCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (guidedMode) return; // guided mode handles clicks on individual field zones
    if (didDrag.current) { didDrag.current = false; return; }
    if (!activeTool || !pageDims || !pageCanvasRef.current) return;

    const rect = getCanvasRect();
    const xPct = Math.max(0, Math.min((e.clientX - rect.left) / rect.width,  0.98));
    const yPct = Math.max(0, Math.min((e.clientY - rect.top)  / rect.height, 0.98));

    if (activeTool === "sig")        setSigPos ({ xPct, yPct });
    else if (activeTool === "name")  setNamePos({ xPct, yPct });
    else                             setDatePos ({ xPct, yPct });

    setOpenPanel(activeTool);
    setActiveTool(null);
  };

  // ── Guided: click on a user field zone to fill it ────────────────────────

  const onGuidedFieldClick = (f: DocField) => {
    if (f.assignedTo !== "user") return;
    setActiveGuidedFieldId(f.id);
    // Reset signature upload state each time the panel opens
    if (f.type === "signature") { setSigInputMode("draw"); setUploadedSigPreview(null); setIsDragOver(false); }
    // Pre-populate inputs from existing fieldValues if any
    const existing = fieldValues.find((fv) => fv.fieldId === f.id);
    if (f.type === "name") setNameText(existing?.value ?? "");
    if (f.type === "date") setDateText(existing?.value ?? new Date().toISOString().split("T")[0]);
    if (f.type === "text") setTextValue(existing?.value ?? "");
    const panelType: OpenPanel =
      f.type === "signature" ? "sig" :
      f.type === "name"      ? "name" :
      f.type === "date"      ? "date" : "text";
    setOpenPanel(panelType);
  };

  // ── Generate preview PDF ──────────────────────────────────────────────────

  const goToPreview = async () => {
    if (guidedMode) {
      if (!guidedAllRequiredFilled) {
        setError("Please fill all required fields before previewing.");
        return;
      }
    } else {
      if (!signatureDataUrl) { setError("Please place and draw your signature first."); return; }
    }
    setError("");
    setPreviewLoading(true);
    setStep("preview");

    try {
      // Use the authenticated blob URL — the raw Cloudinary URL returns 401 from the browser
      const pdfResponse = await fetch(docBlobUrl!);
      if (!pdfResponse.ok) throw new Error("Failed to fetch document");
      const pdfBytes = await pdfResponse.arrayBuffer();

      const { PDFDocument, rgb } = await import("pdf-lib");
      const pdfDoc = await PDFDocument.load(pdfBytes);

      const pages    = pdfDoc.getPages();
      const lastPage = pages[pages.length - 1];

      // Legacy mode still uses last-page dimensions for scale ratio
      const { width: pdfW, height: pdfH } = lastPage.getSize();
      const canvasW    = pageDims?.w ?? pdfW;
      const scaleRatio = pdfW / canvasW;

      if (guidedMode) {
        // ── Render fields at admin-defined positions (each on its own page) ─
        const { StandardFonts } = await import("pdf-lib");
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

        for (const f of (doc.fields ?? [])) {
          if (f.assignedTo !== "user") continue;
          const fv = fieldValues.find((v) => v.fieldId === f.id);
          if (!fv?.value) continue;

          // Use the page the admin placed this field on (fall back to last page for old docs)
          const pageIdx  = f.pageNum != null ? f.pageNum - 1 : pages.length - 1;
          const targetPage = pages[Math.max(0, Math.min(pageIdx, pages.length - 1))];
          const { width: pgW, height: pgH } = targetPage.getSize();

          const fx = f.xPct * pgW;
          const fw = f.wPct * pgW;
          const fh = f.hPct * pgH;
          const fy = pgH * (1 - f.yPct) - fh; // bottom-left corner in PDF coords

          if (f.type === "signature") {
            const base64   = fv.value.replace(/^data:image\/\w+;base64,/, "");
            const binary   = atob(base64);
            const sigBytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) sigBytes[i] = binary.charCodeAt(i);
            const sigImage = await pdfDoc.embedPng(sigBytes);
            targetPage.drawImage(sigImage, { x: fx, y: fy, width: fw, height: fh });
          } else if (f.type === "date") {
            const formatted = new Date(fv.value + "T00:00:00").toLocaleDateString("en-US", {
              year: "numeric", month: "short", day: "numeric",
            });
            targetPage.drawText(formatted, { x: fx + 2, y: fy + fh * 0.3, size: 10, font, color: rgb(0, 0, 0) });
          } else {
            targetPage.drawText(fv.value, { x: fx + 2, y: fy + fh * 0.3, size: 10, font, color: rgb(0, 0, 0) });
          }
        }
      } else {
        // ── Legacy mode (free-placement always on last page) ───────────────
        const base64  = signatureDataUrl!.replace("data:image/png;base64,", "");
        const binary  = atob(base64);
        const sigBytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) sigBytes[i] = binary.charCodeAt(i);

        const sigImage  = await pdfDoc.embedPng(sigBytes);
        const sigWidth  = sigW * scaleRatio;
        const sigHeight = sigH * scaleRatio;

        lastPage.drawImage(sigImage, {
          x: Math.max(0, sigPos.xPct * pdfW),
          y: Math.max(0, pdfH * (1 - sigPos.yPct) - sigHeight),
          width: sigWidth,
          height: sigHeight,
        });

        if (nameText.trim() || dateText) {
          const { StandardFonts } = await import("pdf-lib");
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

          // TEXT_BOX_H=26px; baseline sits ~70% down the box → 18 * scaleRatio
          const textYOffset = 18 * scaleRatio;

          if (nameText.trim()) {
            lastPage.drawText(nameText.trim(), {
              x: Math.max(0, namePos.xPct * pdfW),
              y: Math.max(0, pdfH * (1 - namePos.yPct) - textYOffset),
              size: 10, font, color: rgb(0, 0, 0),
            });
          }

          if (dateText) {
            const formatted = new Date(dateText + "T00:00:00").toLocaleDateString("en-US", {
              year: "numeric", month: "short", day: "numeric",
            });
            lastPage.drawText(formatted, {
              x: Math.max(0, datePos.xPct * pdfW),
              y: Math.max(0, pdfH * (1 - datePos.yPct) - textYOffset),
              size: 10, font, color: rgb(0, 0, 0),
            });
          }
        }
      }

      const signedBytes = await pdfDoc.save();
      const blob = new Blob([signedBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error("Preview generation failed:", err);
      setError("Could not generate preview. You can still submit.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      if (guidedMode) {
        await api.signDocument(doc.id, {
          fieldValues: fieldValues.map((fv) => ({
            fieldId: fv.fieldId,
            value: fv.value,
            sigW: fv.sigW,
            sigH: fv.sigH,
            canvasW: pageDims?.w,
          })),
        });
      } else {
        if (!signatureDataUrl) return;
        await api.signDocument(doc.id, {
          signatureDataUrl,
          sigPos,
          sigScale: 1,
          nameText: nameText.trim() || null,
          namePos,
          dateText: dateText || null,
          datePos,
          canvasW:     pageDims?.w ?? 595,
          sigDisplayW: sigW,
          sigDisplayH: sigH,
        });
      }
      setStep("success");
      setTimeout(() => onSigned(), 2500);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to submit. Please try again.");
      setStep("fill");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success ───────────────────────────────────────────────────────────────

  if (step === "success") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="mb-2 text-2xl font-bold text-black dark:text-white">Document Signed!</h2>
        <p className="text-body-color">Your signed document is ready. You can download it from your Documents page.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Back */}
      <button onClick={onBack} className="mb-5 flex items-center gap-2 text-sm text-body-color hover:text-black dark:hover:text-white">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Documents
      </button>

      {/* Doc header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-black dark:text-white">{doc.title}</h2>
        {doc.description && <p className="mt-1 text-body-color">{doc.description}</p>}
        {doc.userMessage && (
          <p className="mt-2 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
            {doc.userMessage}
          </p>
        )}
      </div>

      <StepBar current={step} />

      {/* ── Step 1: Review ─────────────────────────────────────────────────── */}
      {step === "review" && (
        <div>
          <div className="mb-5 overflow-hidden rounded-2xl border border-stroke bg-white shadow dark:border-gray-700 dark:bg-gray-dark">
            <div className="flex items-center justify-between border-b border-stroke px-5 py-3 dark:border-gray-700">
              <p className="font-medium text-black dark:text-white">Document Preview</p>
              {docBlobUrl && (
                <a href={docBlobUrl} download={`${doc.title}.pdf`}
                  className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </a>
              )}
            </div>
            <div style={{ height: "620px" }}>
              {docBlobFetching ? (
                <div className="flex h-full items-center justify-center gap-3 text-body-color">
                  <svg className="h-6 w-6 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span className="text-sm">Loading document…</span>
                </div>
              ) : docBlobUrl ? (
                <Worker workerUrl="/pdf.worker.min.js">
                  <Viewer fileUrl={docBlobUrl} />
                </Worker>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-body-color">
                  Could not load document. Please go back and try again.
                </div>
              )}
            </div>
          </div>

          <label className="mb-5 flex cursor-pointer items-start gap-3 rounded-xl border border-stroke p-4 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
            <input type="checkbox" checked={reviewed} onChange={(e) => setReviewed(e.target.checked)}
              className="mt-0.5 h-5 w-5 flex-shrink-0 cursor-pointer accent-primary" />
            <span className="text-sm text-black dark:text-white">
              I have fully read and understood this document and agree to sign it electronically.
              I understand my electronic signature is legally binding.
            </span>
          </label>

          <button onClick={() => setStep("fill")} disabled={!reviewed || docBlobFetching || !docBlobUrl}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40">
            Fill &amp; Sign
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Step 2: Fill & Place ────────────────────────────────────────────── */}
      {step === "fill" && (
        <div className="rounded-2xl bg-white p-6 shadow dark:bg-gray-dark">
          <h3 className="mb-1 text-lg font-semibold text-black dark:text-white">Fill &amp; Place Fields</h3>
          {guidedMode ? (
            <p className="mb-4 text-sm text-body-color">
              Click on the highlighted zones to fill in each field. Required fields are marked <span className="text-red-500 font-medium">*</span>.
            </p>
          ) : (
            <p className="mb-5 text-sm text-body-color">
              Select a field type below, then tap anywhere on the document to place it.
            </p>
          )}

          {/* ── Guided mode: field completion status pills ──────────────── */}
          {guidedMode && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {(doc.fields ?? []).filter((f) => f.assignedTo === "user").map((f) => {
                const filled = fieldValues.some((fv) => fv.fieldId === f.id && fv.value);
                const color  = filled ? "#22c55e" : f.required ? "#ef4444" : "#94a3b8";
                return (
                  <span
                    key={f.id}
                    style={{ border: `1.5px solid ${color}`, color }}
                    className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                  >
                    {GUIDED_ICONS[f.type]} {f.type}{f.required ? " *" : ""}
                    {filled && " ✓"}
                  </span>
                );
              })}
            </div>
          )}

          {/* ── Legacy mode: tool selector ─────────────────────────────── */}
          {!guidedMode && (
            <div className="mb-4 flex flex-wrap gap-2">
              {(["sig", "name", "date"] as const).map((tool) => {
                const labels = { sig: "✍ Signature", name: "A  Full Name", date: "📅 Date" };
                const colors = {
                  sig:  activeTool === "sig"  ? "bg-primary text-white" : "border-primary text-primary hover:bg-primary/5",
                  name: activeTool === "name" ? "bg-blue-500 text-white" : "border-blue-500 text-blue-600 hover:bg-blue-50",
                  date: activeTool === "date" ? "bg-green-600 text-white" : "border-green-600 text-green-700 hover:bg-green-50",
                };
                return (
                  <button key={tool}
                    onClick={() => setActiveTool(activeTool === tool ? null : tool)}
                    className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition ${colors[tool]}`}>
                    {labels[tool]}
                  </button>
                );
              })}
            </div>
          )}

          {!guidedMode && activeTool && (
            <p className="mb-3 rounded-lg bg-yellow-50 px-3 py-2 text-xs font-medium text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
              {activeTool === "sig"  && "Click on the document where you want your signature"}
              {activeTool === "name" && "Click on the document where you want your name"}
              {activeTool === "date" && "Click on the document where you want the date"}
            </p>
          )}

          {/* PDF canvas + overlays */}
          <div
            ref={posContainerRef}
            className="relative mb-3 overflow-hidden rounded-xl border border-stroke bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
            style={{ userSelect: "none", touchAction: "none", cursor: (!guidedMode && activeTool) ? "crosshair" : "default" }}
            onClick={onCanvasClick}
            onMouseMove={onDragMove}
            onMouseUp={onDragEnd}
            onMouseLeave={onDragEnd}
            onTouchMove={onDragMove}
            onTouchEnd={onDragEnd}
          >
            {/* Rendered PDF page */}
            <canvas ref={pageCanvasRef} style={{ display: pageDims ? "block" : "none" }} />

            {/* Loading */}
            {!pageDims && !pageRenderError && (
              <div className="flex h-72 items-center justify-center gap-3 text-body-color">
                <svg className="h-6 w-6 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span className="text-sm">Loading document…</span>
              </div>
            )}

            {/* Error */}
            {pageRenderError && (
              <div className="flex h-72 items-center justify-center text-sm text-body-color">
                Could not render preview — you can still proceed.
              </div>
            )}

            {/* ── GUIDED MODE: locked field zone overlays ──────────────────── */}
            {guidedMode && pageDims && (doc.fields ?? []).map((f) => {
              const clr        = GUIDED_COLORS[f.assignedTo];
              const isUserField = f.assignedTo === "user";
              const filled     = fieldValues.some((fv) => fv.fieldId === f.id && fv.value);
              const isActive   = activeGuidedFieldId === f.id;
              const fw         = f.wPct * pageDims.w;
              const fh         = f.hPct * pageDims.h;
              // Required unfilled user fields → red border
              const borderColor = isUserField && f.required && !filled ? "#ef4444" : clr.border;

              return (
                <div
                  key={f.id}
                  style={{
                    position: "absolute",
                    left: f.xPct * pageDims.w,
                    top:  f.yPct * pageDims.h,
                    width: fw, height: fh,
                    border: `2px ${isActive ? "solid" : "dashed"} ${borderColor}`,
                    background: isActive ? "rgba(59,130,246,0.20)" : filled ? "rgba(34,197,94,0.10)" : clr.bg,
                    borderRadius: 4,
                    cursor: isUserField ? "pointer" : "not-allowed",
                    touchAction: "none",
                    boxShadow: isActive ? "0 0 0 3px rgba(59,130,246,0.3)" : undefined,
                    transition: "background 0.15s",
                  }}
                  onClick={(e) => { e.stopPropagation(); onGuidedFieldClick(f); }}
                >
                  {filled ? (
                    // Show filled content preview
                    f.type === "signature" ? (
                      <img
                        src={fieldValues.find((fv) => fv.fieldId === f.id)?.value}
                        alt="sig"
                        className="h-full w-full object-contain p-0.5"
                        draggable={false}
                      />
                    ) : (
                      <div className="flex h-full items-center overflow-hidden px-1">
                        <span className="truncate font-medium text-gray-800" style={{ fontSize: Math.max(8, fh * 0.38) }}>
                          {f.type === "date"
                            ? new Date(fieldValues.find((fv) => fv.fieldId === f.id)!.value + "T00:00:00")
                                .toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                            : fieldValues.find((fv) => fv.fieldId === f.id)?.value}
                        </span>
                      </div>
                    )
                  ) : (
                    // Show placeholder label
                    <div className="flex h-full items-center justify-center overflow-hidden px-1">
                      <span style={{ fontSize: Math.max(8, fh * 0.38), color: isUserField ? borderColor : "#9ca3af", fontWeight: 600, whiteSpace: "nowrap" }}>
                        {isUserField
                          ? `${GUIDED_ICONS[f.type]} ${f.type}${f.required ? " *" : ""}`
                          : "🔒 Admin Only"}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* ── LEGACY MODE: draggable + resizable signature ─────────────── */}
            {!guidedMode && signatureDataUrl && pageDims && (() => {
              const HANDLES: Array<{
                id: "n"|"ne"|"e"|"se"|"s"|"sw"|"w"|"nw";
                cursor: string;
                style: React.CSSProperties;
              }> = [
                { id: "nw", cursor: "nw-resize", style: { top: -4,  left:  -4 } },
                { id: "n",  cursor: "n-resize",  style: { top: -4,  left: "50%", marginLeft: -4 } },
                { id: "ne", cursor: "ne-resize", style: { top: -4,  right: -4 } },
                { id: "e",  cursor: "e-resize",  style: { top: "50%", marginTop: -4, right: -4 } },
                { id: "se", cursor: "se-resize", style: { bottom: -4, right: -4 } },
                { id: "s",  cursor: "s-resize",  style: { bottom: -4, left: "50%", marginLeft: -4 } },
                { id: "sw", cursor: "sw-resize", style: { bottom: -4, left: -4 } },
                { id: "w",  cursor: "w-resize",  style: { top: "50%", marginTop: -4, left: -4 } },
              ];
              return (
                <div
                  style={{
                    position: "absolute",
                    left: sigPos.xPct * pageDims.w,
                    top:  sigPos.yPct * pageDims.h,
                    width:  sigW,
                    height: sigH,
                    cursor: "grab",
                    touchAction: "none",
                  }}
                  onMouseDown={makeDragStart("sig")}
                  onTouchStart={makeDragStart("sig")}
                >
                  <div className="h-full w-full rounded border-2 border-primary p-1 shadow-lg">
                    <img src={signatureDataUrl} alt="signature" className="h-full w-full object-contain" draggable={false} />
                  </div>

                  {/* Edit button */}
                  <button
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white shadow"
                    style={{ fontSize: 9 }}
                    onClick={(e) => { e.stopPropagation(); setOpenPanel("sig"); }}
                  >✎</button>

                  {/* Resize handles */}
                  {HANDLES.map((hnd) => (
                    <div
                      key={hnd.id}
                      style={{
                        position: "absolute",
                        width: 8, height: 8,
                        background: "white",
                        border: "1.5px solid #3b82f6",
                        borderRadius: 2,
                        cursor: hnd.cursor,
                        ...hnd.style,
                      }}
                      onMouseDown={(e) => onResizeStart(hnd.id, e)}
                      onTouchStart={(e) => onResizeStart(hnd.id, e)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ))}
                </div>
              );
            })()}

            {/* ── LEGACY MODE: draggable name ──────────────────────────────── */}
            {!guidedMode && nameText && pageDims && (
              <div
                style={{
                  position: "absolute",
                  left: namePos.xPct * pageDims.w,
                  top:  namePos.yPct * pageDims.h,
                  width: nameBoxW, height: TEXT_BOX_H,
                  cursor: "grab", touchAction: "none",
                }}
                onMouseDown={makeDragStart("name")}
                onTouchStart={makeDragStart("name")}
              >
                <div className="flex h-full w-full items-center rounded border-2 border-dashed border-blue-500 bg-white/90 px-2 shadow">
                  <span className="truncate text-xs font-medium text-gray-800">{nameText}</span>
                </div>
                <button
                  className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white shadow"
                  style={{ fontSize: 9 }}
                  onClick={(e) => { e.stopPropagation(); setOpenPanel("name"); }}
                >✎</button>
              </div>
            )}

            {/* ── LEGACY MODE: draggable date ──────────────────────────────── */}
            {!guidedMode && dateText && pageDims && (
              <div
                style={{
                  position: "absolute",
                  left: datePos.xPct * pageDims.w,
                  top:  datePos.yPct * pageDims.h,
                  width: dateBoxW, height: TEXT_BOX_H,
                  cursor: "grab", touchAction: "none",
                }}
                onMouseDown={makeDragStart("date")}
                onTouchStart={makeDragStart("date")}
              >
                <div className="flex h-full w-full items-center rounded border-2 border-dashed border-green-500 bg-white/90 px-2 shadow">
                  <span className="truncate text-xs text-gray-800">
                    {new Date(dateText + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                  </span>
                </div>
                <button
                  className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-white shadow"
                  style={{ fontSize: 9 }}
                  onClick={(e) => { e.stopPropagation(); setOpenPanel("date"); }}
                >✎</button>
              </div>
            )}
          </div>

          {/* Legend */}
          {guidedMode ? (
            <div className="mb-1 flex flex-wrap items-center gap-3 text-xs text-body-color">
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ border: "1.5px solid #3b82f6", background: "rgba(59,130,246,0.12)" }} />
                Your fields (click to fill)
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ border: "1.5px solid #8b5cf6", background: "rgba(139,92,246,0.12)" }} />
                Admin only
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm border border-red-400 bg-red-50" />
                Required unfilled
              </span>
            </div>
          ) : (
            <div className="mb-1 flex items-center gap-3 text-xs text-body-color">
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm border border-primary bg-primary/20" /> Signature
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm border border-blue-500 bg-blue-100" /> Name
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm border border-green-500 bg-green-100" /> Date
              </span>
              <span className="ml-auto text-xs text-body-color">Drag to reposition · ✎ to edit</span>
            </div>
          )}

          {/* ── Inline panels (legacy mode only — guided mode uses the modal below) ── */}

          {/* Signature panel */}
          {!guidedMode && openPanel === "sig" && (
            <div className="mb-4 rounded-xl border border-stroke bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-black dark:text-white">Draw Your Signature</h4>
                <button
                  onClick={() => { setOpenPanel(null); setActiveGuidedFieldId(null); }}
                  className="text-body-color hover:text-black dark:hover:text-white"
                >✕</button>
              </div>
              <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-white">
                <canvas ref={canvasRef} className="block h-40 w-full cursor-crosshair bg-white" style={{ touchAction: "none" }} />
                <p className="pointer-events-none absolute inset-0 flex items-end justify-center pb-2 text-xs text-gray-300 select-none">
                  Draw here
                </p>
              </div>
              {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
              <div className="mt-3 flex gap-2">
                <button onClick={() => padRef.current?.clear()}
                  className="rounded-lg border border-stroke px-4 py-2 text-sm text-black hover:bg-gray-100 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700">
                  Clear
                </button>
                <button
                  onClick={() => {
                    if (!padRef.current || padRef.current.isEmpty()) {
                      setError("Please draw your signature first.");
                      return;
                    }
                    setError("");
                    const dataUrl = padRef.current.toDataURL("image/png");
                    const img = new window.Image();
                    img.onload = () => {
                      const newSigH = Math.max(20, Math.round(sigW * img.height / img.width));
                      setSigH(newSigH);
                      if (guidedMode && activeGuidedFieldId) {
                        // Store value in fieldValues for the active guided field
                        const fid = activeGuidedFieldId;
                        setFieldValues((prev) => [
                          ...prev.filter((fv) => fv.fieldId !== fid),
                          { fieldId: fid, value: dataUrl, sigW, sigH: newSigH },
                        ]);
                        setActiveGuidedFieldId(null);
                      }
                    };
                    img.src = dataUrl;
                    setSignatureDataUrl(dataUrl);
                    setOpenPanel(null);
                  }}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90">
                  Place Signature
                </button>
              </div>
            </div>
          )}

          {/* Name panel */}
          {!guidedMode && openPanel === "name" && (
            <div className="mb-4 rounded-xl border border-stroke bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-black dark:text-white">Full Name</h4>
                <button
                  onClick={() => { setOpenPanel(null); setActiveGuidedFieldId(null); }}
                  className="text-body-color hover:text-black dark:hover:text-white"
                >✕</button>
              </div>
              <input
                type="text"
                value={nameText}
                onChange={(e) => setNameText(e.target.value)}
                placeholder="Type your full name"
                autoFocus
                className="w-full rounded-lg border border-stroke bg-white px-3 py-2.5 text-sm text-black outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
              <button
                onClick={() => {
                  if (guidedMode && activeGuidedFieldId) {
                    if (nameText.trim()) {
                      const fid = activeGuidedFieldId;
                      setFieldValues((prev) => [
                        ...prev.filter((fv) => fv.fieldId !== fid),
                        { fieldId: fid, value: nameText.trim() },
                      ]);
                    }
                    setActiveGuidedFieldId(null);
                  }
                  setOpenPanel(null);
                }}
                className="mt-3 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600">
                Place Name
              </button>
            </div>
          )}

          {/* Date panel */}
          {!guidedMode && openPanel === "date" && (
            <div className="mb-4 rounded-xl border border-stroke bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-black dark:text-white">Date</h4>
                <button
                  onClick={() => { setOpenPanel(null); setActiveGuidedFieldId(null); }}
                  className="text-body-color hover:text-black dark:hover:text-white"
                >✕</button>
              </div>
              <input
                type="date"
                value={dateText}
                onChange={(e) => setDateText(e.target.value)}
                autoFocus
                className="w-full rounded-lg border border-stroke bg-white px-3 py-2.5 text-sm text-black outline-none focus:border-green-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
              <button
                onClick={() => {
                  if (guidedMode && activeGuidedFieldId) {
                    if (dateText) {
                      const fid = activeGuidedFieldId;
                      setFieldValues((prev) => [
                        ...prev.filter((fv) => fv.fieldId !== fid),
                        { fieldId: fid, value: dateText },
                      ]);
                    }
                    setActiveGuidedFieldId(null);
                  }
                  setOpenPanel(null);
                }}
                className="mt-3 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
                Place Date
              </button>
            </div>
          )}

          {/* Text panel — moved to guided modal below */}

          {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

          <div className="flex flex-wrap gap-3">
            <button onClick={() => setStep("review")}
              className="rounded-xl border border-stroke px-5 py-2.5 text-sm font-medium text-black hover:bg-gray-50 dark:border-gray-600 dark:text-white dark:hover:bg-gray-800">
              ← Back to Review
            </button>
            <button
              onClick={goToPreview}
              disabled={guidedMode ? !guidedAllRequiredFilled : !signatureDataUrl}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Preview Signed Document
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Preview ─────────────────────────────────────────────────── */}
      {step === "preview" && (
        <div className="overflow-hidden rounded-2xl bg-white shadow dark:bg-gray-dark">
          <div className="flex items-center justify-between border-b border-stroke bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-body-color">Step 3 — Preview &amp; Confirm</p>
              <h3 className="mt-0.5 font-bold text-black dark:text-white">Review your signed document before submitting</h3>
            </div>
            {previewUrl && (
              <a href={previewUrl} download={`preview-${doc.title}.pdf`}
                className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Preview
              </a>
            )}
          </div>

          <div style={{ height: "650px" }}>
            {previewLoading ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-body-color">
                <svg className="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <p className="text-sm">Generating signed preview…</p>
              </div>
            ) : previewUrl ? (
              <Worker workerUrl="/pdf.worker.min.js">
                <Viewer fileUrl={previewUrl} />
              </Worker>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
                <p className="text-sm text-body-color">Preview unavailable — your signature will still be applied on submission.</p>
                {signatureDataUrl && (
                  <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-4">
                    <p className="mb-2 text-xs text-gray-400">Your signature:</p>
                    <img src={signatureDataUrl} alt="signature" className="h-20 w-60 object-contain" />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-stroke px-6 py-5 dark:border-gray-700">
            <p className="mb-4 text-xs text-body-color">
              The document above shows exactly how your signed copy will look. By clicking
              &quot;Submit &amp; Sign&quot; you confirm this signature is your legal electronic signature.
            </p>
            {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
            <div className="flex flex-wrap gap-3">
              <button onClick={() => setStep("fill")}
                className="rounded-xl border border-stroke px-5 py-2.5 text-sm font-medium text-black hover:bg-gray-50 dark:border-gray-600 dark:text-white dark:hover:bg-gray-800">
                ← Edit Fields
              </button>
              <button onClick={handleSubmit} disabled={submitting || previewLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
                {submitting ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Submitting…
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Submit &amp; Sign Document
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Guided mode field-fill modal ──────────────────────────────────────── */}
      {/* Mobile: bottom-sheet sliding up. Desktop: centred dialog. */}
      {guidedMode && openPanel && (
        <div
          className="fixed inset-0 z-[999] flex flex-col justify-end bg-black/60 sm:items-center sm:justify-center sm:p-4"
          onClick={() => { setOpenPanel(null); setActiveGuidedFieldId(null); }}
        >
          <div
            className="w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl dark:bg-gray-dark sm:max-w-lg sm:rounded-2xl"
            style={{ maxHeight: "92dvh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag pill — visible on mobile only */}
            <div className="flex justify-center pb-1 pt-3 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-stroke px-5 py-4 sm:px-6 dark:border-gray-700">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-body-color">
                  {openPanel === "sig" ? "Signature" : openPanel === "name" ? "Full Name" : openPanel === "date" ? "Date" : "Text Field"}
                </p>
                <h3 className="mt-0.5 text-base font-bold text-black dark:text-white sm:text-lg">
                  {openPanel === "sig"  && "✍ Draw Your Signature"}
                  {openPanel === "name" && "Enter Your Full Name"}
                  {openPanel === "date" && "📅 Select a Date"}
                  {openPanel === "text" && "Enter Text"}
                </h3>
              </div>
              <button
                onClick={() => { setOpenPanel(null); setActiveGuidedFieldId(null); }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                style={{ fontSize: 16 }}
              >✕</button>
            </div>

            <div className="px-5 pb-8 pt-5 sm:px-6 sm:pb-6">

              {/* ── Signature ── */}
              {openPanel === "sig" && (
                <>
                  {/* Draw / Upload tab switcher */}
                  <div className="mb-4 flex overflow-hidden rounded-xl border border-stroke dark:border-gray-700">
                    <button
                      onClick={() => setSigInputMode("draw")}
                      className={`flex-1 py-2.5 text-sm font-medium transition ${
                        sigInputMode === "draw"
                          ? "bg-primary text-white"
                          : "text-body-color hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      ✏ Draw
                    </button>
                    <button
                      onClick={() => setSigInputMode("upload")}
                      className={`flex-1 border-l border-stroke py-2.5 text-sm font-medium transition dark:border-gray-700 ${
                        sigInputMode === "upload"
                          ? "bg-primary text-white"
                          : "text-body-color hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      📷 Upload Image
                    </button>
                  </div>

                  {/* Draw pad */}
                  {sigInputMode === "draw" && (
                    <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-white">
                      <canvas
                        ref={canvasRef}
                        className="block w-full cursor-crosshair bg-white"
                        style={{ touchAction: "none", height: "clamp(160px, 38vw, 220px)" }}
                      />
                      <p className="pointer-events-none absolute inset-0 flex items-end justify-center pb-3 text-sm text-gray-300 select-none">
                        Sign here with your finger or mouse
                      </p>
                    </div>
                  )}

                  {/* Upload zone */}
                  {sigInputMode === "upload" && (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragOver(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file && file.type.startsWith("image/")) {
                          const reader = new FileReader();
                          reader.onload = (ev) => setUploadedSigPreview((ev.target?.result as string) ?? null);
                          reader.readAsDataURL(file);
                        }
                      }}
                      onClick={() => uploadSigInputRef.current?.click()}
                      className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition ${
                        isDragOver
                          ? "border-primary bg-primary/5"
                          : "border-gray-300 bg-gray-50 hover:border-primary/50 dark:bg-gray-800"
                      }`}
                      style={{ minHeight: "clamp(160px, 38vw, 220px)" }}
                    >
                      {uploadedSigPreview ? (
                        <>
                          <img
                            src={uploadedSigPreview}
                            alt="Signature preview"
                            className="max-h-36 max-w-full object-contain px-4"
                            draggable={false}
                          />
                          <p className="text-xs text-body-color">Tap to change image</p>
                        </>
                      ) : (
                        <>
                          <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <div className="px-4 text-center">
                            <p className="text-sm font-medium text-body-color">Drag &amp; drop your signature here</p>
                            <p className="mt-1 text-xs text-gray-400">or tap to browse your device</p>
                            <p className="mt-0.5 text-xs text-gray-400">PNG, JPG, GIF, WebP accepted</p>
                          </div>
                        </>
                      )}
                      <input
                        ref={uploadSigInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => setUploadedSigPreview((ev.target?.result as string) ?? null);
                            reader.readAsDataURL(file);
                          }
                          // reset so selecting same file again fires onChange
                          e.target.value = "";
                        }}
                      />
                    </div>
                  )}

                  {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

                  <div className="mt-5 flex gap-3">
                    {/* Left action: clear (draw) or remove (upload) */}
                    {sigInputMode === "draw" ? (
                      <button
                        onClick={() => padRef.current?.clear()}
                        className="flex h-12 items-center justify-center rounded-xl border border-stroke px-5 text-sm font-medium text-black hover:bg-gray-50 dark:border-gray-600 dark:text-white dark:hover:bg-gray-800"
                      >
                        Clear
                      </button>
                    ) : uploadedSigPreview ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); setUploadedSigPreview(null); }}
                        className="flex h-12 items-center justify-center rounded-xl border border-stroke px-5 text-sm font-medium text-black hover:bg-gray-50 dark:border-gray-600 dark:text-white dark:hover:bg-gray-800"
                      >
                        Remove
                      </button>
                    ) : null}

                    {/* Confirm */}
                    <button
                      onClick={() => {
                        const confirm = (dataUrl: string) => {
                          setError("");
                          const img = new window.Image();
                          img.onload = () => {
                            // Always normalise to PNG so pdf-lib embedPng always works
                            const tmpCanvas = document.createElement("canvas");
                            tmpCanvas.width  = img.naturalWidth  || img.width;
                            tmpCanvas.height = img.naturalHeight || img.height;
                            const ctx = tmpCanvas.getContext("2d");
                            if (ctx) ctx.drawImage(img, 0, 0);
                            const pngDataUrl = tmpCanvas.toDataURL("image/png");

                            const newSigH = Math.max(20, Math.round(sigW * img.height / img.width));
                            setSigH(newSigH);
                            if (activeGuidedFieldId) {
                              const fid = activeGuidedFieldId;
                              setFieldValues((prev) => [
                                ...prev.filter((fv) => fv.fieldId !== fid),
                                { fieldId: fid, value: pngDataUrl, sigW, sigH: newSigH },
                              ]);
                              setActiveGuidedFieldId(null);
                            }
                            setSignatureDataUrl(pngDataUrl);
                            setOpenPanel(null);
                          };
                          img.src = dataUrl;
                        };

                        if (sigInputMode === "upload") {
                          if (!uploadedSigPreview) { setError("Please upload a signature image."); return; }
                          confirm(uploadedSigPreview);
                        } else {
                          if (!padRef.current || padRef.current.isEmpty()) { setError("Please draw your signature first."); return; }
                          confirm(padRef.current.toDataURL("image/png"));
                        }
                      }}
                      className="flex h-12 flex-1 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white hover:bg-primary/90"
                    >
                      {sigInputMode === "draw" ? "Save Signature" : "Use This Image"}
                    </button>
                  </div>
                </>
              )}

              {/* ── Full Name ── */}
              {openPanel === "name" && (
                <>
                  <input
                    type="text"
                    value={nameText}
                    onChange={(e) => setNameText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && nameText.trim() && activeGuidedFieldId) {
                        const fid = activeGuidedFieldId;
                        setFieldValues((prev) => [...prev.filter((fv) => fv.fieldId !== fid), { fieldId: fid, value: nameText.trim() }]);
                        setActiveGuidedFieldId(null);
                        setOpenPanel(null);
                      }
                    }}
                    placeholder="e.g. John Doe"
                    autoFocus
                    className="h-12 w-full rounded-xl border border-stroke bg-white px-4 text-base text-black outline-none focus:border-primary dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                  />
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => { setOpenPanel(null); setActiveGuidedFieldId(null); }}
                      className="flex h-12 flex-1 items-center justify-center rounded-xl border border-stroke text-sm font-medium text-black dark:border-gray-700 dark:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (activeGuidedFieldId && nameText.trim()) {
                          const fid = activeGuidedFieldId;
                          setFieldValues((prev) => [...prev.filter((fv) => fv.fieldId !== fid), { fieldId: fid, value: nameText.trim() }]);
                          setActiveGuidedFieldId(null);
                        }
                        setOpenPanel(null);
                      }}
                      className="flex h-12 flex-1 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white hover:bg-primary/90"
                    >
                      Confirm Name
                    </button>
                  </div>
                </>
              )}

              {/* ── Date ── */}
              {openPanel === "date" && (
                <>
                  <input
                    type="date"
                    value={dateText}
                    onChange={(e) => setDateText(e.target.value)}
                    autoFocus
                    className="h-12 w-full rounded-xl border border-stroke bg-white px-4 text-base text-black outline-none focus:border-primary dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                  />
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => { setOpenPanel(null); setActiveGuidedFieldId(null); }}
                      className="flex h-12 flex-1 items-center justify-center rounded-xl border border-stroke text-sm font-medium text-black dark:border-gray-700 dark:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (activeGuidedFieldId && dateText) {
                          const fid = activeGuidedFieldId;
                          setFieldValues((prev) => [...prev.filter((fv) => fv.fieldId !== fid), { fieldId: fid, value: dateText }]);
                          setActiveGuidedFieldId(null);
                        }
                        setOpenPanel(null);
                      }}
                      className="flex h-12 flex-1 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white hover:bg-primary/90"
                    >
                      Confirm Date
                    </button>
                  </div>
                </>
              )}

              {/* ── Text ── */}
              {openPanel === "text" && (
                <>
                  <textarea
                    value={textValue}
                    onChange={(e) => setTextValue(e.target.value)}
                    placeholder="Enter your text…"
                    rows={4}
                    autoFocus
                    className="w-full rounded-xl border border-stroke bg-white px-4 py-3 text-base text-black outline-none focus:border-primary dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                  />
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => { setOpenPanel(null); setActiveGuidedFieldId(null); }}
                      className="flex h-12 flex-1 items-center justify-center rounded-xl border border-stroke text-sm font-medium text-black dark:border-gray-700 dark:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (activeGuidedFieldId && textValue.trim()) {
                          const fid = activeGuidedFieldId;
                          setFieldValues((prev) => [...prev.filter((fv) => fv.fieldId !== fid), { fieldId: fid, value: textValue.trim() }]);
                          setActiveGuidedFieldId(null);
                        }
                        setOpenPanel(null);
                      }}
                      className="flex h-12 flex-1 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white hover:bg-primary/90"
                    >
                      Confirm
                    </button>
                  </div>
                </>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
