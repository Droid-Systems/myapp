/**
 * Next.js API route: /api/admin/properties/[...slug]
 *
 * Handles all sub-paths:
 *   PATCH  /:id             → update (text fields + optional file uploads)
 *   DELETE /:id             → soft delete
 *   DELETE /:id/permanent   → hard delete
 *   DELETE /:id/images      → remove single image
 *   GET    /:id             → single property
 *
 * Uses `duplex: 'half'` so the multipart/form-data request body is streamed
 * directly from the browser → Next.js server → backend without buffering.
 * The rewrite proxy in next.config.js drops multipart bodies; this route doesn't.
 */

import { NextRequest, NextResponse } from "next/server";
import { stream } from "../_proxy";

const BACKEND = process.env.BACKEND_URL || "http://localhost:4000";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string[] }> | { slug: string[] } };

async function proxy(req: NextRequest, ctx: Ctx): Promise<NextResponse> {
  const resolved = await Promise.resolve(ctx.params);
  const path = resolved.slug.join("/");
  const url = `${BACKEND}/api/admin/properties/${path}${req.nextUrl.search}`;
  return stream(req, url);
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
