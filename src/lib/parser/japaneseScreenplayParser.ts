import type { ParsedScript, ParsedScene, ParsedCharacter } from "./parserTypes";

const CHARACTER_COLORS = [
  "#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6",
  "#EC4899", "#06B6D4", "#F97316", "#6366F1", "#14B8A6",
];

// S3）音羽川堤（朝）形式、および従来形式のシーン見出し
const SCENE_HEADING_PATTERN =
  /^(S\s*[０-９0-9]+[）)）\s]|シーン|場面|第[０-９0-9]+[幕場]|Scene\s*[0-9]|INT\.|EXT\.)/i;

// キャラ「セリフ」形式（鍵括弧）
const KAGIKAKKO_PATTERN = /^([^\s　「『【〔（(\[]{1,10})「(.*)」?\s*$/;

// キャラ　セリフ形式（スペース区切り、フォールバック）
const SPACE_DIALOGUE_PATTERN =
  /^([^\s　（(「『【〔\[]{1,10})[　\s]+(?:[（(（]([^）)）]*)[）)）])?\s*(.+)$/;

function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) =>
      String.fromCharCode(c.charCodeAt(0) - 0xfee0)
    );
}

function extractSceneInfo(heading: string): { title: string; location: string | null } {
  // S3）音羽川堤（朝） 形式
  const sMatch = heading.match(/^S\s*[0-9]+[）)）\s]+(.+)/);
  if (sMatch) {
    const rest = sMatch[1].trim();
    // 末尾の（時間帯）を除いた場所名
    const location = rest.replace(/[（(（][^）)）]*[）)）]\s*$/, "").trim() || rest;
    return { title: heading, location };
  }
  return { title: heading, location: heading };
}

export function parseJapaneseScreenplay(rawText: string): ParsedScript {
  const normalized = normalizeText(rawText);
  // 元の行を保持してインデント情報を利用する
  const rawLines = normalized.split("\n");

  type ClassifiedLine =
    | { type: "SCENE_HEADING"; raw: string }
    | { type: "BLANK"; raw: string }
    | { type: "DIALOGUE_CANDIDATE"; raw: string; candidateName: string; dialogue: string }
    | { type: "STAGE_DIRECTION"; raw: string };

  const classified: ClassifiedLine[] = [];
  const nameCounts = new Map<string, number>();

  for (const rawLine of rawLines) {
    const isIndented = /^[\s　\t]/.test(rawLine) && rawLine.trim().length > 0;
    const line = rawLine.trim();

    if (!line) {
      classified.push({ type: "BLANK", raw: line });
      continue;
    }

    // インデントされた行はト書き
    if (isIndented) {
      classified.push({ type: "STAGE_DIRECTION", raw: line });
      continue;
    }

    // ・で始まる行はト書き
    if (line.startsWith("・") || line.startsWith("•")) {
      classified.push({ type: "STAGE_DIRECTION", raw: line });
      continue;
    }

    // シーン見出し
    if (SCENE_HEADING_PATTERN.test(line)) {
      classified.push({ type: "SCENE_HEADING", raw: line });
      continue;
    }

    // 鍵括弧形式「キャラ「セリフ」」
    const kagikakkoMatch = line.match(KAGIKAKKO_PATTERN);
    if (kagikakkoMatch) {
      const candidateName = kagikakkoMatch[1];
      const dialogue = kagikakkoMatch[2].replace(/」\s*$/, "").trim();
      nameCounts.set(candidateName, (nameCounts.get(candidateName) ?? 0) + 1);
      classified.push({ type: "DIALOGUE_CANDIDATE", raw: line, candidateName, dialogue });
      continue;
    }

    // スペース区切り形式（フォールバック）
    const spaceMatch = line.match(SPACE_DIALOGUE_PATTERN);
    if (spaceMatch) {
      const candidateName = spaceMatch[1];
      const dialogue = (spaceMatch[3] ?? "").trim();
      nameCounts.set(candidateName, (nameCounts.get(candidateName) ?? 0) + 1);
      classified.push({ type: "DIALOGUE_CANDIDATE", raw: line, candidateName, dialogue });
      continue;
    }

    classified.push({ type: "STAGE_DIRECTION", raw: line });
  }

  // 2回以上登場する名前を登場人物として確定
  const confirmedCharacters = new Set<string>();
  for (const [name, count] of nameCounts) {
    if (count >= 2) confirmedCharacters.add(name);
  }

  // カラーマップ
  const characterColorMap = new Map<string, string>();
  let colorIdx = 0;
  for (const name of confirmedCharacters) {
    characterColorMap.set(name, CHARACTER_COLORS[colorIdx % CHARACTER_COLORS.length]);
    colorIdx++;
  }

  // シーンと行を構築
  const scenes: ParsedScene[] = [];
  let currentScene: ParsedScene | null = null;
  let sceneNumber = 0;
  let orderIndex = 0;

  function ensureScene() {
    if (!currentScene) {
      sceneNumber++;
      currentScene = { sceneNumber, title: null, location: null, lines: [] };
      scenes.push(currentScene);
    }
  }

  for (const cl of classified) {
    if (cl.type === "BLANK") continue;

    if (cl.type === "SCENE_HEADING") {
      const { title, location } = extractSceneInfo(cl.raw);
      sceneNumber++;
      currentScene = { sceneNumber, title, location, lines: [] };
      scenes.push(currentScene);
      currentScene.lines.push({
        orderIndex: orderIndex++,
        lineType: "SCENE_HEADING",
        characterName: null,
        rawText: cl.raw,
        dialogue: null,
        stageDirection: null,
      });
      continue;
    }

    ensureScene();

    if (cl.type === "STAGE_DIRECTION") {
      currentScene!.lines.push({
        orderIndex: orderIndex++,
        lineType: "STAGE_DIRECTION",
        characterName: null,
        rawText: cl.raw,
        dialogue: null,
        stageDirection: cl.raw.replace(/^・/, "").trim(),
      });
      continue;
    }

    if (cl.type === "DIALOGUE_CANDIDATE") {
      if (!confirmedCharacters.has(cl.candidateName)) {
        // 登場人物でなければト書きに降格
        currentScene!.lines.push({
          orderIndex: orderIndex++,
          lineType: "STAGE_DIRECTION",
          characterName: null,
          rawText: cl.raw,
          dialogue: null,
          stageDirection: cl.raw,
        });
        continue;
      }

      currentScene!.lines.push({
        orderIndex: orderIndex++,
        lineType: "DIALOGUE",
        characterName: cl.candidateName,
        rawText: cl.raw,
        dialogue: cl.dialogue,
        stageDirection: null,
      });
    }
  }

  // 登場人物リスト（セリフ数付き）
  const characterLineCounts = new Map<string, number>();
  for (const scene of scenes) {
    for (const line of scene.lines) {
      if (line.characterName) {
        characterLineCounts.set(
          line.characterName,
          (characterLineCounts.get(line.characterName) ?? 0) + 1
        );
      }
    }
  }

  const characters: ParsedCharacter[] = Array.from(confirmedCharacters).map((name) => ({
    name,
    lineCount: characterLineCounts.get(name) ?? 0,
    color: characterColorMap.get(name) ?? "#6B7280",
  }));

  // タイトルを最初の短い行から推定
  const firstMeaningfulLine = rawLines.find((l) => l.trim().length > 0 && l.trim().length < 50);
  const title = firstMeaningfulLine?.trim() ?? null;

  return { title, characters, scenes };
}
