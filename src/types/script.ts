export interface ScriptWithRelations {
  id: string;
  title: string;
  originalFile: string | null;
  language: string;
  createdAt: Date;
  updatedAt: Date;
  characters: Character[];
  scenes: Scene[];
  _count?: { practiceLog: number };
}

export interface Character {
  id: string;
  scriptId: string;
  name: string;
  displayName: string | null;
  voiceId: string | null;
  voiceSpeed: number;
  voicePitch: number;
  color: string | null;
  lineCount: number;
}

export interface Scene {
  id: string;
  scriptId: string;
  sceneNumber: number;
  title: string | null;
  location: string | null;
  description: string | null;
  orderIndex: number;
  lines?: Line[];
}

export interface Line {
  id: string;
  sceneId: string;
  characterId: string | null;
  orderIndex: number;
  lineType: "DIALOGUE" | "STAGE_DIRECTION" | "SCENE_HEADING";
  rawText: string;
  dialogue: string | null;
  stageDirection: string | null;
  furigana: string | null;
  audioUrl: string | null;
  audioDurationMs: number | null;
  character?: Character | null;
  emotionNote?: EmotionNote | null;
}

export interface EmotionNote {
  id: string;
  lineId: string;
  characterId: string;
  emotion: string;
  intensity: number;
  directorNote: string;
  contextNote: string | null;
  analyzedAt: Date;
}
