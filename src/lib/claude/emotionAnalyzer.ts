import Anthropic from "@anthropic-ai/sdk";
import {
  EMOTION_ANALYSIS_SYSTEM_PROMPT,
  buildBatchEmotionAnalysisPrompt,
} from "./prompts";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface EmotionAnalysisResult {
  id: string;
  emotion: string;
  intensity: number;
  directorNote: string;
  contextNote?: string;
}

export async function analyzeSceneEmotions(scene: {
  sceneTitle: string | null;
  location: string | null;
  lines: Array<{
    id: string;
    characterName: string | null;
    dialogue: string | null;
    stageDirection: string | null;
    lineType: string;
  }>;
}): Promise<EmotionAnalysisResult[]> {
  const dialogueLines = scene.lines.filter(
    (l) => l.lineType === "DIALOGUE" && l.dialogue
  );

  if (dialogueLines.length === 0) return [];

  const prompt = buildBatchEmotionAnalysisPrompt(scene);

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: EMOTION_ANALYSIS_SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  // Extract JSON from response
  const text = content.text;
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Could not extract JSON from Claude response");
  }

  const results = JSON.parse(jsonMatch[0]) as EmotionAnalysisResult[];

  // Validate and clamp intensity
  return results.map((r) => ({
    ...r,
    intensity: Math.max(1, Math.min(5, Math.round(r.intensity))),
  }));
}
