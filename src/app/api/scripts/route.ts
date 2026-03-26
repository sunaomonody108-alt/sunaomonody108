import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

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

  // Create script with all nested data in a transaction
  const script = await db.$transaction(async (tx) => {
    const s = await tx.script.create({
      data: {
        userId: session.user.id,
        title: data.title,
        rawText: data.rawText,
        originalFile: data.originalFile ?? null,
      },
    });

    // Create characters
    const characterMap = new Map<string, string>(); // name → id
    for (const char of data.characters) {
      const c = await tx.character.create({
        data: {
          scriptId: s.id,
          name: char.name,
          lineCount: char.lineCount,
          color: char.color,
        },
      });
      characterMap.set(char.name, c.id);
    }

    // Create scenes and lines
    for (let si = 0; si < data.scenes.length; si++) {
      const scene = data.scenes[si];
      const sc = await tx.scene.create({
        data: {
          scriptId: s.id,
          sceneNumber: scene.sceneNumber,
          title: scene.title,
          location: scene.location,
          orderIndex: si,
        },
      });

      for (const line of scene.lines) {
        const characterId = line.characterName
          ? (characterMap.get(line.characterName) ?? null)
          : null;

        await tx.line.create({
          data: {
            scriptId: s.id,
            sceneId: sc.id,
            characterId,
            orderIndex: line.orderIndex,
            lineType: line.lineType,
            rawText: line.rawText,
            dialogue: line.dialogue,
            stageDirection: line.stageDirection,
          },
        });
      }
    }

    return s;
  });

  return NextResponse.json({ id: script.id }, { status: 201 });
}
