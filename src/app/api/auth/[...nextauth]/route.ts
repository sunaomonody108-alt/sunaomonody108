export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export async function GET(req: NextRequest, ctx: { params: Record<string, string> }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (handler as any)(req, ctx);
}

export async function POST(req: NextRequest, ctx: { params: Record<string, string> }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (handler as any)(req, ctx);
}
