import { GoogleTtsProvider } from "./googleTts";
import { OpenAiTtsProvider } from "./openaiTts";
import type { TtsProvider } from "./types";

export { GOOGLE_JP_VOICES } from "./types";
export type { TtsVoice, TtsRequest, TtsResponse } from "./types";

export function getTtsProvider(provider: string = "GOOGLE"): TtsProvider {
  switch (provider.toUpperCase()) {
    case "OPENAI":
      return new OpenAiTtsProvider();
    case "GOOGLE":
    default:
      return new GoogleTtsProvider();
  }
}
