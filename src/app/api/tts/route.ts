export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTtsProvider } from "@/lib/tts";
import { saveAudio, getCachedAudioUrl } from "@/lib/audio/audioCache";
import { z } from "zod";

const TtsRequestSchema = z.object({
  lineId: z.string(),
  text: z.string().min(1),
  voiceId: z.string(),
  speed: z.number().min(0.25).max(4.0).optional(),
  pitch: z.number().min(-20).max(20).optional(),
  provider: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const data = TtsRequestSchema.parse(body);

  // Check cache first
  const line = await db.line.findUnique({ where: { id: data.lineId } });
  if (line) {
    const cached = getCachedAudioUrl(data.lineId, line.audioUrl);
    if (cached) {
      return NextResponse.json({ url: cached, durationMs: line.audioDurationMs });
    }
  }

  // Get user TTS preference
  const pref = await db.ttsPreference.findUnique({
    where: { userId: session.user.id },
  });

  const provider = getTtsProvider(data.provider ?? pref?.provider ?? "GOOGLE");

  const result = await provider.synthesize({
    text: data.text,
    voiceId: data.voiceId,
    speed: data.speed,
    pitch: data.pitch,
  });

  const audioUrl = await saveAudio(data.lineId, result.audioBase64);

  // Update line with audio URL
  if (line) {
    await db.line.update({
      where: { id: data.lineId },
      data: { audioUrl },
    });
  }

  return NextResponse.json({ url: audioUrl });
}

// List available voices
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const providerName = searchParams.get("provider") ?? "GOOGLE";
  const provider = getTtsProvider(providerName);
  const voices = await provider.listVoices();

  return NextResponse.json(voices);
}
