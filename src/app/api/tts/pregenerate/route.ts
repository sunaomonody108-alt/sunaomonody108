import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTtsProvider } from "@/lib/tts";
import { saveAudio, getCachedAudioUrl } from "@/lib/audio/audioCache";
import { z } from "zod";

const PregenerateSchema = z.object({
  sceneId: z.string(),
  voiceMap: z.record(z.string(), z.string()), // characterId → voiceId
  speedMap: z.record(z.string(), z.number()).optional(),
  pitchMap: z.record(z.string(), z.number()).optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const data = PregenerateSchema.parse(body);

  const pref = await db.ttsPreference.findUnique({
    where: { userId: session.user.id },
  });
  const provider = getTtsProvider(pref?.provider ?? "GOOGLE");

  const lines = await db.line.findMany({
    where: {
      sceneId: data.sceneId,
      lineType: "DIALOGUE",
      dialogue: { not: null },
    },
    include: { character: true },
    orderBy: { orderIndex: "asc" },
  });

  // Server-Sent Events stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };

      let done = 0;
      const total = lines.filter(
        (l) => l.characterId && data.voiceMap[l.characterId]
      ).length;

      send({ type: "start", total });

      for (const line of lines) {
        if (!line.characterId || !line.dialogue) continue;
        const voiceId = data.voiceMap[line.characterId];
        if (!voiceId) continue;

        // Check cache
        const cached = getCachedAudioUrl(line.id, line.audioUrl);
        if (cached) {
          done++;
          send({ type: "progress", done, total, lineId: line.id });
          continue;
        }

        try {
          const speed = data.speedMap?.[line.characterId] ?? line.character?.voiceSpeed ?? 1.0;
          const pitch = data.pitchMap?.[line.characterId] ?? line.character?.voicePitch ?? 0;

          const result = await provider.synthesize({
            text: line.dialogue,
            voiceId,
            speed,
            pitch,
          });

          const audioUrl = await saveAudio(line.id, result.audioBase64);

          await db.line.update({
            where: { id: line.id },
            data: { audioUrl },
          });

          done++;
          send({ type: "progress", done, total, lineId: line.id, url: audioUrl });
        } catch (err) {
          send({ type: "error", lineId: line.id, message: String(err) });
        }
      }

      send({ type: "done", done, total });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
