"use client";

import { create } from "zustand";
import type { Line } from "@/types/script";

export type PracticeMode = "FULL_PLAYBACK" | "USER_ROLE" | "SELF_RECORD";

interface PracticeState {
  // Config
  userCharacterId: string | null;
  silenceDurationMs: number;
  playbackSpeed: number;
  mode: PracticeMode;

  // Playback state
  currentLineIndex: number;
  isPlaying: boolean;
  isPaused: boolean;
  queue: Line[];

  // Progress
  practiceSessionId: string | null;

  // Actions
  setUserCharacter: (id: string | null) => void;
  setSilenceDuration: (ms: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  setMode: (mode: PracticeMode) => void;
  setQueue: (lines: Line[]) => void;
  setCurrentLineIndex: (index: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsPaused: (paused: boolean) => void;
  setPracticeSessionId: (id: string | null) => void;
  reset: () => void;
}

const defaultState = {
  userCharacterId: null,
  silenceDurationMs: 5000,
  playbackSpeed: 1.0,
  mode: "USER_ROLE" as PracticeMode,
  currentLineIndex: 0,
  isPlaying: false,
  isPaused: false,
  queue: [] as Line[],
  practiceSessionId: null,
};

export const usePracticeStore = create<PracticeState>((set) => ({
  ...defaultState,

  setUserCharacter: (id) => set({ userCharacterId: id }),
  setSilenceDuration: (ms) => set({ silenceDurationMs: ms }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  setMode: (mode) => set({ mode }),
  setQueue: (lines) => set({ queue: lines, currentLineIndex: 0 }),
  setCurrentLineIndex: (index) => set({ currentLineIndex: index }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setIsPaused: (paused) => set({ isPaused: paused }),
  setPracticeSessionId: (id) => set({ practiceSessionId: id }),
  reset: () => set(defaultState),
}));
