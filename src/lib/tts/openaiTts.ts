import OpenAI from "openai";
import type { TtsProvider, TtsRequest, TtsResponse, TtsVoice } from "./types";

// OpenAI voices mapped to Japanese-suitable names
const OPENAI_VOICES: TtsVoice[] = [
  { id: "alloy", name: "Alloy（中性）", gender: "NEUTRAL", languageCode: "ja-JP" },
  { id: "echo", name: "Echo（男性）", gender: "MALE", languageCode: "ja-JP" },
  { id: "fable", name: "Fable（中性）", gender: "NEUTRAL", languageCode: "ja-JP" },
  { id: "onyx", name: "Onyx（男性）", gender: "MALE", languageCode: "ja-JP" },
  { id: "nova", name: "Nova（女性）", gender: "FEMALE", languageCode: "ja-JP" },
  { id: "shimmer", name: "Shimmer（女性）", gender: "FEMALE", languageCode: "ja-JP" },
];

export class OpenAiTtsProvider implements TtsProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async synthesize(req: TtsRequest): Promise<TtsResponse> {
    const voice = (req.voiceId ?? "alloy") as
      | "alloy"
      | "echo"
      | "fable"
      | "onyx"
      | "nova"
      | "shimmer";

    const speed = Math.max(0.25, Math.min(4.0, req.speed ?? 1.0));

    const mp3 = await this.client.audio.speech.create({
      model: "tts-1",
      voice,
      input: req.text,
      speed,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    return {
      audioBase64: buffer.toString("base64"),
      mimeType: "audio/mpeg",
    };
  }

  async listVoices(): Promise<TtsVoice[]> {
    return OPENAI_VOICES;
  }
}
