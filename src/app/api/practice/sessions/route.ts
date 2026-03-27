export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const CreateSessionSchema = z.object({
  scriptId: z.string(),
  sceneId: z.string().optional(),
  userCharacterId: z.string().optional(),
  mode: z.enum(["FULL_PLAYBACK", "USER_ROLE", "SELF_RECORD"]).default("USER_ROLE"),
  totalLines: z.number().default(0),
});

const UpdateSessionSchema = z.object({
  id: z.string(),
  completedLines: z.number().optional(),
  durationSeconds: z.number().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const data = CreateSessionSchema.parse(body);

  const practiceSession = await db.practiceSession.create({
    data: {
      userId: session.user.id,
      scriptId: data.scriptId,
      sceneId: data.sceneId ?? null,
      userCharacterId: data.userCharacterId ?? null,
      mode: data.mode,
      totalLines: data.totalLines,
    },
  });

  return NextResponse.json(practiceSession, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const data = UpdateSessionSchema.parse(body);

  const updated = await db.practiceSession.updateMany({
    where: { id: data.id, userId: session.user.id },
    data: {
      completedLines: data.completedLines,
      durationSeconds: data.durationSeconds,
    },
  });

  return NextResponse.json({ updated: updated.count });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const scriptId = searchParams.get("scriptId");

  const sessions = await db.practiceSession.findMany({
    where: {
      userId: session.user.id,
      ...(scriptId ? { scriptId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      scene: { select: { title: true, sceneNumber: true } },
    },
  });

  return NextResponse.json(sessions);
}
