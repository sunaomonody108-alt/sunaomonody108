import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { analyzeSceneEmotions } from "@/lib/claude/emotionAnalyzer";
import { z } from "zod";

const AnalyzeSchema = z.object({
  sceneId: z.string(),
});

export async function POST(
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
  const { sceneId } = AnalyzeSchema.parse(body);

  const scene = await db.scene.findFirst({
    where: { id: sceneId, scriptId: params.scriptId },
    include: {
      lines: {
        orderBy: { orderIndex: "asc" },
        include: { character: true },
      },
    },
  });

  if (!scene) return NextResponse.json({ error: "Scene not found" }, { status: 404 });

  const results = await analyzeSceneEmotions({
    sceneTitle: scene.title,
    location: scene.location,
    lines: scene.lines.map((l) => ({
      id: l.id,
      characterName: l.character?.name ?? null,
      dialogue: l.dialogue,
      stageDirection: l.stageDirection,
      lineType: l.lineType,
    })),
  });

  // Save emotion notes to DB
  await db.$transaction(
    results.map((r) => {
      const line = scene.lines.find((l) => l.id === r.id);
      if (!line?.characterId) return db.$queryRaw`SELECT 1`; // skip if no character

      return db.emotionNote.upsert({
        where: { lineId: r.id },
        create: {
          lineId: r.id,
          characterId: line.characterId!,
          emotion: r.emotion,
          intensity: r.intensity,
          directorNote: r.directorNote,
          contextNote: r.contextNote ?? null,
        },
        update: {
          emotion: r.emotion,
          intensity: r.intensity,
          directorNote: r.directorNote,
          contextNote: r.contextNote ?? null,
        },
      });
    })
  );

  return NextResponse.json({ count: results.length, results });
}
