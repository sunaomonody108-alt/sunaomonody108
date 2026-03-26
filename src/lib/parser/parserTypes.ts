export type LineType = "DIALOGUE" | "STAGE_DIRECTION" | "SCENE_HEADING";

export interface ParsedCharacter {
  name: string;
  lineCount: number;
  color: string;
}

export interface ParsedLine {
  orderIndex: number;
  lineType: LineType;
  characterName: string | null;
  rawText: string;
  dialogue: string | null;
  stageDirection: string | null;
}

export interface ParsedScene {
  sceneNumber: number;
  title: string | null;
  location: string | null;
  lines: ParsedLine[];
}

export interface ParsedScript {
  title: string | null;
  characters: ParsedCharacter[];
  scenes: ParsedScene[];
}
