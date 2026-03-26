import type { ParsedScript, ParsedScene, ParsedCharacter } from "./parserTypes";

// Character colors - cycling palette
const CHARACTER_COLORS = [
  "#3B82F6", // blue
  "#EF4444", // red
  "#10B981", // green
  "#F59E0B", // amber
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#F97316", // orange
  "#6366F1", // indigo
  "#14B8A6", // teal
];

// Regex patterns for Japanese screenplay format
const SCENE_HEADING_PATTERN =
  /^(シーン|場面|第[０-９\d]+[幕場]|Scene\s*\d|INT\.|EXT\.|〔|【|\[)/i;

// Character name: up to 10 non-space, non-parenthesis characters followed by whitespace and dialogue
const DIALOGUE_PATTERN =
  /^([^\s　（(「『【〔\[]{1,10})(?:\s*[　\s]+|\s*[　\s]*)(?:[（(（]([^）)）]*)[）)）])?\s*(.+)$/;

// Stage direction: line entirely wrapped in parentheses or brackets
const STAGE_DIRECTION_PATTERN = /^[（(（〔【\[].*[）)）〕】\]]$/;

function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Normalize full-width spaces and characters
    .replace(/　/g, "　") // keep full-width space as-is for now
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) =>
      String.fromCharCode(c.charCodeAt(0) - 0xfee0)
    );
}

function extractInlineStageDirection(text: string): {
  dialogue: string;
  stageDirection: string | null;
} {
  // Extract leading stage direction like （怒りながら）
  const match = text.match(/^[（(（]([^）)）]+)[）)）]\s*/);
  if (match) {
    return {
      dialogue: text.slice(match[0].length).trim(),
      stageDirection: match[1].trim(),
    };
  }
  return { dialogue: text, stageDirection: null };
}

export function parseJapaneseScreenplay(rawText: string): ParsedScript {
  const normalized = normalizeText(rawText);
  const rawLines = normalized.split("\n").map((l) => l.trim());

  // Pass 1: Classify each line and collect character candidates
  type ClassifiedLine =
    | { type: "SCENE_HEADING"; raw: string }
    | { type: "BLANK"; raw: string }
    | {
        type: "DIALOGUE_CANDIDATE";
        raw: string;
        candidateName: string;
        rest: string;
        inlineDirection: string | null;
      }
    | { type: "STAGE_DIRECTION"; raw: string };

  const classified: ClassifiedLine[] = [];
  const nameCounts = new Map<string, number>();

  for (const line of rawLines) {
    if (!line) {
      classified.push({ type: "BLANK", raw: line });
      continue;
    }

    if (SCENE_HEADING_PATTERN.test(line)) {
      classified.push({ type: "SCENE_HEADING", raw: line });
      continue;
    }

    if (STAGE_DIRECTION_PATTERN.test(line)) {
      classified.push({ type: "STAGE_DIRECTION", raw: line });
      continue;
    }

    const dialogueMatch = line.match(DIALOGUE_PATTERN);
    if (dialogueMatch) {
      const candidateName = dialogueMatch[1];
      const inlineDirection = dialogueMatch[2] ?? null;
      const rest = dialogueMatch[3];

      // Skip if candidateName looks like a scene/location marker
      if (SCENE_HEADING_PATTERN.test(candidateName)) {
        classified.push({ type: "STAGE_DIRECTION", raw: line });
        continue;
      }

      nameCounts.set(candidateName, (nameCounts.get(candidateName) ?? 0) + 1);
      classified.push({
        type: "DIALOGUE_CANDIDATE",
        raw: line,
        candidateName,
        rest: rest.trim(),
        inlineDirection: inlineDirection?.trim() ?? null,
      });
      continue;
    }

    classified.push({ type: "STAGE_DIRECTION", raw: line });
  }

  // Pass 2: Confirm character names (appear >= 2 times)
  const confirmedCharacters = new Set<string>();
  for (const [name, count] of nameCounts) {
    if (count >= 2) confirmedCharacters.add(name);
  }

  // Pass 3: Build scenes and lines
  const scenes: ParsedScene[] = [];
  let currentScene: ParsedScene | null = null;
  let sceneNumber = 0;
  let orderIndex = 0;

  const characterColorMap = new Map<string, string>();
  let colorIdx = 0;
  for (const name of confirmedCharacters) {
    characterColorMap.set(name, CHARACTER_COLORS[colorIdx % CHARACTER_COLORS.length]);
    colorIdx++;
  }

  function ensureScene() {
    if (!currentScene) {
      sceneNumber++;
      currentScene = {
        sceneNumber,
        title: null,
        location: null,
        lines: [],
      };
      scenes.push(currentScene);
    }
  }

  for (const cl of classified) {
    if (cl.type === "BLANK") continue;

    if (cl.type === "SCENE_HEADING") {
      // Extract location from scene heading
      const locationMatch = cl.raw.match(
        /^(?:シーン|場面|Scene\s*)\d*\s*[　\s]*(.*)/i
      );
      sceneNumber++;
      currentScene = {
        sceneNumber,
        title: cl.raw,
        location: locationMatch?.[1]?.trim() ?? cl.raw,
        lines: [],
      };
      scenes.push(currentScene);
      // Add as SCENE_HEADING line
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
      // Strip outer parentheses
      const inner = cl.raw.replace(/^[（(（〔【\[]/, "").replace(/[）)）〕】\]]$/, "").trim();
      currentScene!.lines.push({
        orderIndex: orderIndex++,
        lineType: "STAGE_DIRECTION",
        characterName: null,
        rawText: cl.raw,
        dialogue: null,
        stageDirection: inner,
      });
      continue;
    }

    if (cl.type === "DIALOGUE_CANDIDATE") {
      if (!confirmedCharacters.has(cl.candidateName)) {
        // Demote to stage direction
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

      let dialogue = cl.rest;
      let stageDirection = cl.inlineDirection;

      // If no inline direction captured but dialogue starts with parenthesis
      if (!stageDirection) {
        const extracted = extractInlineStageDirection(dialogue);
        dialogue = extracted.dialogue;
        stageDirection = extracted.stageDirection;
      }

      currentScene!.lines.push({
        orderIndex: orderIndex++,
        lineType: "DIALOGUE",
        characterName: cl.candidateName,
        rawText: cl.raw,
        dialogue: dialogue || cl.rest,
        stageDirection,
      });
    }
  }

  // Build character list with line counts
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

  const characters: ParsedCharacter[] = Array.from(confirmedCharacters).map(
    (name) => ({
      name,
      lineCount: characterLineCounts.get(name) ?? 0,
      color: characterColorMap.get(name) ?? "#6B7280",
    })
  );

  // Infer title from first non-blank line if no title found
  const firstLine = rawLines.find((l) => l.length > 0);
  const title =
    firstLine && firstLine.length < 50 && !DIALOGUE_PATTERN.test(firstLine)
      ? firstLine
      : null;

  return { title, characters, scenes };
}
