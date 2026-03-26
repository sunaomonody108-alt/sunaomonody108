import type { TtsProvider, TtsRequest, TtsResponse, TtsVoice } from "./types";
import { GOOGLE_JP_VOICES } from "./types";

export class GoogleTtsProvider implements TtsProvider {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GOOGLE_TTS_API_KEY ?? "";
  }

  async synthesize(req: TtsRequest): Promise<TtsResponse> {
    const speed = req.speed ?? 1.0;
    const pitch = req.pitch ?? 0;

    // Build SSML with prosody for speed and pitch control
    const ssml = `<speak><prosody rate="${speedToRate(speed)}" pitch="${pitch >= 0 ? "+" : ""}${pitch}st">${escapeXml(req.text)}</prosody></speak>`;

    const body = {
      input: { ssml },
      voice: {
        languageCode: "ja-JP",
        name: req.voiceId,
      },
      audioConfig: {
        audioEncoding: "MP3",
        sampleRateHertz: 24000,
      },
    };

    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Google TTS error ${res.status}: ${err}`);
    }

    const json = await res.json();
    return {
      audioBase64: json.audioContent as string,
      mimeType: "audio/mpeg",
    };
  }

  async listVoices(): Promise<TtsVoice[]> {
    return GOOGLE_JP_VOICES;
  }
}

function speedToRate(speed: number): string {
  // Google SSML rate: "x-slow" | "slow" | "medium" | "fast" | "x-fast" | percentage
  return `${Math.round(speed * 100)}%`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
