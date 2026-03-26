"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface EmotionNote {
  emotion: string;
  intensity: number;
  directorNote: string;
  contextNote: string | null;
}

interface Line {
  character: { name: string; color: string | null } | null;
  dialogue: string | null;
  emotionNote: EmotionNote | null;
}

const INTENSITY_LABELS = ["", "弱い", "やや弱い", "普通", "やや強い", "非常に強い"];
const INTENSITY_COLORS = ["", "#6B7280", "#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

export function EmotionPanel({
  line,
  onClose,
}: {
  line: Line;
  onClose: () => void;
}) {
  if (!line.emotionNote) return null;
  const { emotion, intensity, directorNote, contextNote } = line.emotionNote;
  const color = INTENSITY_COLORS[intensity] ?? "#6B7280";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">演技指導</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Character and line */}
        <div className="rounded-lg bg-gray-50 px-4 py-3 space-y-1">
          {line.character && (
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: line.character.color ?? "#6B7280" }}
            >
              {line.character.name}
            </span>
          )}
          <p className="text-sm text-gray-700">{line.dialogue}</p>
        </div>

        {/* Emotion badge */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-1.5 rounded-full border px-3 py-1"
            style={{ borderColor: color, color }}
          >
            <span className="text-lg font-bold">{emotion}</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i <= intensity ? "opacity-100" : "opacity-20"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <span className="text-sm text-gray-500">{INTENSITY_LABELS[intensity]}</span>
        </div>

        {/* Director note */}
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-700">演出家からのアドバイス</p>
          <p className="text-sm text-gray-600 leading-relaxed">{directorNote}</p>
        </div>

        {contextNote && (
          <div className="rounded-md bg-blue-50 border border-blue-200 px-3 py-2">
            <p className="text-xs text-blue-700">{contextNote}</p>
          </div>
        )}

        <Button onClick={onClose} className="w-full">
          閉じる
        </Button>
      </div>
    </div>
  );
}
