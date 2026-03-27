export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { GOOGLE_JP_VOICES } from "@/lib/tts";

const CreateScriptSchema = z.object({
  title: z.string().min(1),
  rawText: z.string().min(1),
  originalFile: z.string().optional(),
  characters: z.array(
    z.object({
      name: z.string(),
      lineCount: z.number(),
      color: z.string(),
    })
  ),
  scenes: z.array(
    z.object({
      sceneNumber: z.number(),
      title: z.string().nullable(),
      location: z.string().nullable(),
      lines: z.array(
        z.object({
          orderIndex: z.number(),
          lineType: z.string(),
          characterName: z.string().nullable(),
          rawText: z.string(),
          dialogue: z.string().nullable(),
          stageDirection: z.string().nullable(),
        })
      ),
    })
  ),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scripts = await db.script.findMany({
    where: { userId: session.user.id },
    include: {
      characters: { orderBy: { lineCount: "desc" } },
      _count: { select: { scenes: true, practiceLog: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(scripts);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const data = CreateScriptSchema.parse(body);

  // Create script with all nested data using batch inserts for speed
  const script = await db.$transaction(async (tx) => {
    const s = await tx.script.create({
      data: {
        userId: session.user.id,
        title: data.title,
        rawText: data.rawText,
        originalFile: data.originalFile ?? null,
      },
    });

    // Batch create characters with default voices, then fetch to get IDs
    await tx.character.createMany({
      data: data.characters.map((char, idx) => ({
        scriptId: s.id,
        name: char.name,
        lineCount: char.lineCount,
        color: char.color,
        voiceId: GOOGLE_JP_VOICES[idx % GOOGLE_JP_VOICES.length].id,
      })),
    });
    const createdChars = await tx.character.findMany({
      where: { scriptId: s.id },
      select: { id: true, name: true },
    });
    const characterMap = new Map(createdChars.map((c) => [c.name, c.id]));

    // Batch create scenes, then fetch IDs by sceneNumber
    await tx.scene.createMany({
      data: data.scenes.map((scene, si) => ({
        scriptId: s.id,
        sceneNumber: scene.sceneNumber,
        title: scene.title,
        location: scene.location,
        orderIndex: si,
      })),
    });
    const createdScenes = await tx.scene.findMany({
      where: { scriptId: s.id },
      select: { id: true, sceneNumber: true },
    });
    const sceneIdByNumber = new Map(createdScenes.map((sc) => [sc.sceneNumber, sc.id]));

    // Batch create all lines at once
    const allLines = data.scenes.flatMap((scene) => {
      const sceneId = sceneIdByNumber.get(scene.sceneNumber)!;
      return scene.lines.map((line) => ({
        scriptId: s.id,
        sceneId,
        characterId: line.characterName ? (characterMap.get(line.characterName) ?? null) : null,
        orderIndex: line.orderIndex,
        lineType: line.lineType,
        rawText: line.rawText,
        dialogue: line.dialogue,
        stageDirection: line.stageDirection,
      }));
    });
    await tx.line.createMany({ data: allLines });

    return s;
  }, { timeout: 25000 });

  return NextResponse.json({ id: script.id }, { status: 201 });
}
