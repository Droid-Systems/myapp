/**
 * Next.js API route: /api/admin/properties
 *
 * Acts as a transparent server-to-server proxy to the backend.
 * This is necessary because Next.js rewrites (next.config.js) do NOT correctly
 * stream multipart/form-data request bodies in the dev server — the body is
 * silently dropped, causing multer on the backend to receive ECONNRESET.
 * A proper route.ts with `duplex: 'half'` streams the body without any limit.
 */

import { NextRequest, NextResponse } from "next/server";
import { stream } from "./_proxy";

const BACKEND = process.env.BACKEND_URL || "http://localhost:4000";

export const dynamic = "force-dynamic";

async function proxy(req: NextRequest): Promise<NextResponse> {
  const url = `${BACKEND}/api/admin/properties${req.nextUrl.search}`;
  return stream(req, url);
}

export const GET = proxy;
export const POST = proxy;
