export const EMOTION_ANALYSIS_SYSTEM_PROMPT = `あなたはベテランの演出家です。台本のセリフを読み、俳優に対して感情の演技指導を行います。

各セリフについて以下を分析し、JSON形式で返答してください：
- emotion: 主な感情（例：怒り、悲しみ、喜び、恐怖、驚き、嫌悪、焦り、照れ、絶望、希望、愛情、憎しみ、平静）
- intensity: 感情の強度（1〜5の整数、5が最も強い）
- directorNote: 俳優への具体的な演技指導（2〜3文、日本語）
- contextNote: このセリフが持つシーン全体の文脈的意味（1文、省略可）

演技指導は具体的かつ実践的にしてください。例えば「怒りをこめて」ではなく「歯を食いしばりながら、声のトーンを低く保って」のように具体的な身体表現を含めてください。`;

export function buildEmotionAnalysisPrompt(scene: {
  sceneTitle: string | null;
  lines: Array<{
    characterName: string | null;
    dialogue: string | null;
    stageDirection: string | null;
    lineType: string;
  }>;
  targetLineIndex: number;
}): string {
  const contextLines = scene.lines
    .slice(Math.max(0, scene.targetLineIndex - 2), scene.targetLineIndex + 3)
    .map((l, i) => {
      const isTarget = i === Math.min(2, scene.targetLineIndex);
      const prefix = isTarget ? "【分析対象】" : "";
      if (l.lineType === "DIALOGUE") {
        const dir = l.stageDirection ? `（${l.stageDirection}）` : "";
        return `${prefix}${l.characterName}：${dir}${l.dialogue}`;
      }
      if (l.lineType === "STAGE_DIRECTION") {
        return `${prefix}（ト書き）${l.stageDirection}`;
      }
      return `${prefix}${l.dialogue ?? ""}`;
    })
    .join("\n");

  const targetLine = scene.lines[scene.targetLineIndex];

  return `シーン：${scene.sceneTitle ?? "不明"}

前後の文脈：
${contextLines}

分析対象のセリフ：
役名：${targetLine.characterName}
セリフ：${targetLine.dialogue}
ト書き：${targetLine.stageDirection ?? "なし"}

このセリフの感情分析と演技指導をJSONで返してください。`;
}

export function buildBatchEmotionAnalysisPrompt(scene: {
  sceneTitle: string | null;
  location: string | null;
  lines: Array<{
    id: string;
    characterName: string | null;
    dialogue: string | null;
    stageDirection: string | null;
    lineType: string;
  }>;
}): string {
  const dialogueLines = scene.lines.filter(
    (l) => l.lineType === "DIALOGUE" && l.dialogue
  );

  const scriptText = scene.lines
    .map((l) => {
      if (l.lineType === "DIALOGUE") {
        const dir = l.stageDirection ? `（${l.stageDirection}）` : "";
        return `${l.characterName}：${dir}${l.dialogue}`;
      }
      if (l.lineType === "STAGE_DIRECTION") {
        return `（${l.stageDirection}）`;
      }
      return l.dialogue ?? "";
    })
    .join("\n");

  return `シーン：${scene.sceneTitle ?? "不明"}
場所：${scene.location ?? "不明"}

台本：
${scriptText}

以下のセリフIDについて、それぞれ感情分析と演技指導をJSONの配列で返してください。
各要素は { id, emotion, intensity, directorNote, contextNote } の形式にしてください。

対象セリフID：
${dialogueLines.map((l) => `- ${l.id}：${l.characterName}「${l.dialogue}」`).join("\n")}`;
}
