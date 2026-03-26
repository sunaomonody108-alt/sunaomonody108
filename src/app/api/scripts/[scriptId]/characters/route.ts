import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const UpdateCharacterSchema = z.object({
  voiceId: z.string().optional(),
  voiceSpeed: z.number().min(0.25).max(4.0).optional(),
  voicePitch: z.number().min(-20).max(20).optional(),
  color: z.string().optional(),
  displayName: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { scriptId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const script = await db.script.findFirst({
    where: { id: params.scriptId, userId: session.user.id },
  });
  if (!script) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const characters = await db.character.findMany({
    where: { scriptId: params.scriptId },
    orderBy: { lineCount: "desc" },
  });

  return NextResponse.json(characters);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { scriptId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const script = await db.script.findFirst({
    where: { id: params.scriptId, userId: session.user.id },
  });
  if (!script) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  // Expect array of { id, ...updates }
  const updates = z
    .array(z.object({ id: z.string() }).merge(UpdateCharacterSchema))
    .parse(body);

  const results = await db.$transaction(
    updates.map((u) =>
      db.character.update({
        where: { id: u.id },
        data: {
          voiceId: u.voiceId,
          voiceSpeed: u.voiceSpeed,
          voicePitch: u.voicePitch,
          color: u.color,
          displayName: u.displayName,
        },
      })
    )
  );

  return NextResponse.json(results);
}
