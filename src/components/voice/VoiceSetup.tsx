"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Loader2, Check } from "lucide-react";
import { GOOGLE_JP_VOICES } from "@/lib/tts/types";

interface Character {
  id: string;
  name: string;
  lineCount: number;
  color: string | null;
  voiceId: string | null;
  voiceSpeed: number;
  voicePitch: number;
}

interface VoiceSetupProps {
  scriptId: string;
  initialCharacters: Character[];
}

export function VoiceSetup({ scriptId, initialCharacters }: VoiceSetupProps) {
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>(initialCharacters);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  const updateCharacter = (id: string, updates: Partial<Character>) => {
    setCharacters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    setSaved(false);
  };

  const handlePreview = async (char: Character) => {
    if (!char.voiceId) return;
    setPreviewingId(char.id);

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineId: `preview-${char.id}`,
          text: `${char.name}のサンプル音声です。`,
          voiceId: char.voiceId,
          speed: char.voiceSpeed,
          pitch: char.voicePitch,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const audio = new Audio(data.url);
        audio.play();
      }
    } finally {
      setPreviewingId(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/scripts/${scriptId}/characters`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          characters.map((c) => ({
            id: c.id,
            voiceId: c.voiceId,
            voiceSpeed: c.voiceSpeed,
            voicePitch: c.voicePitch,
          }))
        ),
      });
      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {characters.map((char) => (
        <Card key={char.id}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: char.color ?? "#6B7280" }}
              />
              {char.name}
              <span className="text-sm font-normal text-gray-400">
                ({char.lineCount}行)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Voice selection */}
            <div className="space-y-2">
              <Label>音声</Label>
              <div className="flex gap-2">
                <Select
                  value={char.voiceId ?? ""}
                  onValueChange={(v) => updateCharacter(char.id, { voiceId: v })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="音声を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {GOOGLE_JP_VOICES.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={!char.voiceId || previewingId === char.id}
                  onClick={() => handlePreview(char)}
                  title="サンプル再生"
                >
                  {previewingId === char.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Speed */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>速度</Label>
                <span className="text-sm text-gray-500">{char.voiceSpeed.toFixed(1)}x</span>
              </div>
              <Slider
                min={0.5}
                max={2.0}
                step={0.1}
                value={[char.voiceSpeed]}
                onValueChange={([v]) => updateCharacter(char.id, { voiceSpeed: v })}
              />
            </div>

            {/* Pitch */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>ピッチ</Label>
                <span className="text-sm text-gray-500">
                  {char.voicePitch > 0 ? "+" : ""}{char.voicePitch.toFixed(0)}
                </span>
              </div>
              <Slider
                min={-10}
                max={10}
                step={1}
                value={[char.voicePitch]}
                onValueChange={([v]) => updateCharacter(char.id, { voicePitch: v })}
              />
            </div>
          </CardContent>
        </Card>
      ))}

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : saved ? (
          <Check className="mr-2 h-4 w-4" />
        ) : null}
        {saved ? "保存済み" : "設定を保存"}
      </Button>
    </div>
  );
}
