export interface TtsRequest {
  text: string;
  voiceId: string;
  speed?: number; // 0.5 - 2.0, default 1.0
  pitch?: number; // semitones, -20 to 20, default 0
}

export interface TtsResponse {
  audioBase64: string;
  mimeType: string;
}

export interface TtsProvider {
  synthesize(req: TtsRequest): Promise<TtsResponse>;
  listVoices(): Promise<TtsVoice[]>;
}

export interface TtsVoice {
  id: string;
  name: string;
  gender: "MALE" | "FEMALE" | "NEUTRAL";
  languageCode: string;
}

// Available Google Cloud TTS Neural2 Japanese voices
export const GOOGLE_JP_VOICES: TtsVoice[] = [
  { id: "ja-JP-Neural2-B", name: "Neural2-B（男性）", gender: "MALE", languageCode: "ja-JP" },
  { id: "ja-JP-Neural2-C", name: "Neural2-C（女性）", gender: "FEMALE", languageCode: "ja-JP" },
  { id: "ja-JP-Neural2-D", name: "Neural2-D（男性）", gender: "MALE", languageCode: "ja-JP" },
  { id: "ja-JP-Wavenet-A", name: "Wavenet-A（女性）", gender: "FEMALE", languageCode: "ja-JP" },
  { id: "ja-JP-Wavenet-B", name: "Wavenet-B（男性）", gender: "MALE", languageCode: "ja-JP" },
  { id: "ja-JP-Wavenet-C", name: "Wavenet-C（男性）", gender: "MALE", languageCode: "ja-JP" },
  { id: "ja-JP-Wavenet-D", name: "Wavenet-D（女性）", gender: "FEMALE", languageCode: "ja-JP" },
  { id: "ja-JP-Standard-A", name: "Standard-A（女性）", gender: "FEMALE", languageCode: "ja-JP" },
  { id: "ja-JP-Standard-B", name: "Standard-B（女性）", gender: "FEMALE", languageCode: "ja-JP" },
  { id: "ja-JP-Standard-C", name: "Standard-C（男性）", gender: "MALE", languageCode: "ja-JP" },
  { id: "ja-JP-Standard-D", name: "Standard-D（男性）", gender: "MALE", languageCode: "ja-JP" },
];
