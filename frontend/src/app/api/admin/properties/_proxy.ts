import { NextRequest, NextResponse } from "next/server";

/**
 * Forward a Next.js route-handler request to a backend URL.
 *
 * Uses req.arrayBuffer() to read the full body into memory before
 * forwarding — this avoids the `duplex: 'half'` streaming requirement
 * that varies across Node.js / Next.js runtime versions, and works
 * correctly for multipart/form-data up to the middlewareClientMaxBodySize
 * limit set in next.config.js (50 MB).
 */
export async function stream(req: NextRequest, backendUrl: string): Promise<NextResponse> {
  // Forward only the headers the backend needs
  const headers = new Headers();
  for (const key of ["authorization", "content-type", "cookie"]) {
    const val = req.headers.get(key);
    if (val) headers.set(key, val);
  }

  const hasBody = req.method !== "GET" && req.method !== "HEAD";

  try {
    // Read the full request body into an ArrayBuffer.
    // Passing a ReadableStream with duplex:'half' is fragile; ArrayBuffer is universally supported.
    const body = hasBody ? await req.arrayBuffer() : undefined;

    const res = await fetch(backendUrl, {
      method: req.method,
      headers,
      body,
    });

    const data = await res.json().catch(() => ({
      success: false,
      message: "Backend returned non-JSON response",
    }));

    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    console.error(`[properties proxy] ${req.method} ${backendUrl} →`, err?.message, err?.code);
    return NextResponse.json(
      { success: false, message: "Proxy error: " + (err?.message ?? "unknown") },
      { status: 502 }
    );
  }
}
