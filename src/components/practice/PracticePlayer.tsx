"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Brain,
} from "lucide-react";
import { useAudioQueue } from "@/hooks/useAudioQueue";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { EmotionPanel } from "@/components/emotion/EmotionPanel";

interface Character {
  id: string;
  name: string;
  color: string | null;
  voiceId: string | null;
  voiceSpeed: number;
  voicePitch: number;
}

interface EmotionNote {
  emotion: string;
  intensity: number;
  directorNote: string;
  contextNote: string | null;
}

interface Line {
  id: string;
  sceneId: string;
  characterId: string | null;
  orderIndex: number;
  lineType: string;
  rawText: string;
  dialogue: string | null;
  stageDirection: string | null;
  furigana: string | null;
  audioUrl: string | null;
  audioDurationMs: number | null;
  character: Character | null;
  emotionNote: EmotionNote | null;
}

interface Scene {
  id: string;
  sceneNumber: number;
  title: string | null;
  location: string | null;
  lines: Line[];
}

interface Script {
  id: string;
  title: string;
  characters: Character[];
}

interface PracticePlayerProps {
  script: Script;
  scene: Scene;
  allScenes: { id: string; sceneNumber: number; title: string | null }[];
}

export function PracticePlayer({ script, scene, allScenes }: PracticePlayerProps) {
  const router = useRouter();
  const [userCharacterId, setUserCharacterId] = useState<string | null>(null);
  const [silenceDurationMs, setSilenceDurationMs] = useState(5000);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isSetup, setIsSetup] = useState(true);
  const [showEmotionPanel, setShowEmotionPanel] = useState(false);
  const [selectedLineForEmotion, setSelectedLineForEmotion] = useState<Line | null>(null);
  const [analyzingEmotion, setAnalyzingEmotion] = useState(false);

  const recorder = useVoiceRecorder();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const queue = useAudioQueue(scene.lines as any, {
    userCharacterId,
    silenceDurationMs,
    playbackSpeed,
    onLineStart: (i) => {
      const line = scene.lines[i];
      // Auto-start recording for user's lines
      if (line?.characterId === userCharacterId && recorder.state === "idle") {
        recorder.start();
      }
    },
    onLineEnd: (i) => {
      const line = scene.lines[i];
      if (line?.characterId === userCharacterId && recorder.state === "recording") {
        recorder.stop();
      }
    },
  });

  const sceneIndex = allScenes.findIndex((s) => s.id === scene.id);
  const prevScene = allScenes[sceneIndex - 1];
  const nextScene = allScenes[sceneIndex + 1];

  const handleAnalyzeEmotions = async () => {
    setAnalyzingEmotion(true);
    try {
      await fetch(`/api/scripts/${script.id}/emotion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sceneId: scene.id }),
      });
      router.refresh();
    } finally {
      setAnalyzingEmotion(false);
    }
  };

  if (isSetup) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <p className="text-sm text-gray-500 mb-1">
            <Link href={`/scripts/${script.id}`} className="hover:underline">
              {script.title}
            </Link>
            {" / 練習 / "}
            シーン{scene.sceneNumber}
          </p>
          <h1 className="text-2xl font-bold text-gray-900">練習設定</h1>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-6">
            {/* Role selection */}
            <div className="space-y-2">
              <Label>あなたが演じる役</Label>
              <Select
                value={userCharacterId ?? "_none"}
                onValueChange={(v) => setUserCharacterId(v === "_none" ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="役を選択（省略すると全読み上げ）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">なし（全セリフ読み上げ）</SelectItem>
                  {script.characters.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block w-3 h-3 rounded-full"
                          style={{ backgroundColor: c.color ?? "#6B7280" }}
                        />
                        {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Silence duration */}
            {userCharacterId && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>間の長さ（自分のセリフ）</Label>
                  <span className="text-sm text-gray-500">
                    {(silenceDurationMs / 1000).toFixed(0)}秒
                  </span>
                </div>
                <Slider
                  min={2000}
                  max={15000}
                  step={1000}
                  value={[silenceDurationMs]}
                  onValueChange={([v]) => setSilenceDurationMs(v)}
                />
              </div>
            )}

            {/* Playback speed */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>再生速度</Label>
                <span className="text-sm text-gray-500">{playbackSpeed.toFixed(1)}x</span>
              </div>
              <Slider
                min={0.5}
                max={2.0}
                step={0.25}
                value={[playbackSpeed]}
                onValueChange={([v]) => setPlaybackSpeed(v)}
              />
            </div>
          </CardContent>
        </Card>

        <Button
          className="w-full"
          size="lg"
          onClick={() => setIsSetup(false)}
        >
          <Play className="mr-2 h-5 w-5" />
          練習を開始
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { queue.stop(); setIsSetup(true); }}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            設定
          </Button>
          <span className="text-sm text-gray-500">
            {script.title} / シーン{scene.sceneNumber}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAnalyzeEmotions}
          disabled={analyzingEmotion}
        >
          <Brain className="h-4 w-4 mr-1" />
          {analyzingEmotion ? "分析中..." : "感情分析"}
        </Button>
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <Progress
          value={(queue.currentIndex / Math.max(scene.lines.length - 1, 1)) * 100}
        />
        <p className="text-xs text-gray-400 text-right">
          {queue.currentIndex + 1} / {scene.lines.length}
        </p>
      </div>

      {/* Lines display */}
      <div className="space-y-2 max-h-[50vh] overflow-y-auto">
        {scene.lines.map((line, i) => (
          <LineRow
            key={line.id}
            line={line as Line}
            isCurrent={i === queue.currentIndex}
            isUserLine={line.characterId === userCharacterId}
            silenceRemaining={
              i === queue.currentIndex && queue.state === "user_silence"
                ? queue.silenceRemaining
                : null
            }
            silenceDuration={silenceDurationMs}
            onClickEmotion={() => {
              setSelectedLineForEmotion(line as Line);
              setShowEmotionPanel(true);
            }}
            onClick={() => { queue.stop(); queue.jumpTo(i); }}
          />
        ))}
      </div>

      {/* Playback controls */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => queue.jumpTo(Math.max(0, queue.currentIndex - 1))}
              disabled={queue.currentIndex === 0}
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            {queue.state === "idle" || queue.state === "finished" ? (
              <Button size="lg" className="w-24" onClick={queue.play}>
                <Play className="mr-2 h-5 w-5" />
                再生
              </Button>
            ) : queue.state === "paused" ? (
              <Button size="lg" className="w-24" onClick={queue.resume}>
                <Play className="mr-2 h-5 w-5" />
                再開
              </Button>
            ) : (
              <Button size="lg" className="w-24" variant="secondary" onClick={queue.pause}>
                <Pause className="mr-2 h-5 w-5" />
                一時停止
              </Button>
            )}

            <Button
              variant="outline"
              size="icon"
              onClick={() => queue.jumpTo(Math.min(scene.lines.length - 1, queue.currentIndex + 1))}
              disabled={queue.currentIndex >= scene.lines.length - 1}
            >
              <SkipForward className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={queue.stop}
              disabled={queue.state === "idle"}
            >
              <Square className="h-4 w-4" />
            </Button>
          </div>

          {/* Recording playback */}
          {recorder.audioUrl && (
            <div className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2">
              <span className="text-xs text-gray-500">録音:</span>
              <audio src={recorder.audioUrl} controls className="h-8 flex-1" />
              <Button variant="ghost" size="sm" onClick={recorder.reset}>
                削除
              </Button>
            </div>
          )}

          {/* Speed display */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>速度: {playbackSpeed}x</span>
            {userCharacterId && (
              <span className="flex items-center gap-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor:
                      script.characters.find((c) => c.id === userCharacterId)?.color ?? "#6B7280",
                  }}
                />
                {script.characters.find((c) => c.id === userCharacterId)?.name} の役でセリフ練習中
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Scene navigation */}
      <div className="flex justify-between">
        {prevScene ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              router.push(`/scripts/${script.id}/practice/${prevScene.id}`)
            }
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            シーン{prevScene.sceneNumber}
          </Button>
        ) : (
          <div />
        )}
        {nextScene ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              router.push(`/scripts/${script.id}/practice/${nextScene.id}`)
            }
          >
            シーン{nextScene.sceneNumber}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <div />
        )}
      </div>

      {/* Emotion panel */}
      {showEmotionPanel && selectedLineForEmotion && (
        <EmotionPanel
          line={selectedLineForEmotion}
          onClose={() => setShowEmotionPanel(false)}
        />
      )}
    </div>
  );
}

function LineRow({
  line,
  isCurrent,
  isUserLine,
  silenceRemaining,
  silenceDuration,
  onClickEmotion,
  onClick,
}: {
  line: Line;
  isCurrent: boolean;
  isUserLine: boolean;
  silenceRemaining: number | null;
  silenceDuration: number;
  onClickEmotion: () => void;
  onClick: () => void;
}) {
  if (line.lineType === "SCENE_HEADING") {
    return (
      <div
        className={`rounded px-3 py-2 text-sm font-semibold text-gray-600 bg-gray-100 ${
          isCurrent ? "ring-2 ring-blue-400" : ""
        }`}
        onClick={onClick}
      >
        {line.rawText}
      </div>
    );
  }

  if (line.lineType === "STAGE_DIRECTION") {
    return (
      <div
        className={`rounded px-3 py-2 text-sm text-gray-500 italic ${
          isCurrent ? "ring-2 ring-blue-400 bg-blue-50" : ""
        }`}
        onClick={onClick}
      >
        {line.stageDirection ?? line.rawText}
      </div>
    );
  }

  const progress = silenceRemaining !== null
    ? ((silenceDuration - silenceRemaining) / silenceDuration) * 100
    : null;

  return (
    <div
      className={`rounded-lg border px-4 py-3 cursor-pointer transition-all ${
        isCurrent
          ? isUserLine
            ? "border-orange-400 bg-orange-50 ring-2 ring-orange-300"
            : "border-blue-400 bg-blue-50 ring-2 ring-blue-300"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <span
            className="shrink-0 mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white"
            style={{ backgroundColor: line.character?.color ?? "#6B7280" }}
          >
            {line.character?.name}
          </span>
          <div className="min-w-0">
            {line.stageDirection && (
              <span className="text-xs text-gray-400 italic">
                （{line.stageDirection}）
              </span>
            )}
            <p className={`text-sm ${isUserLine ? "font-medium" : ""}`}>
              {line.dialogue}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {line.emotionNote && (
            <button
              className="rounded-full border px-2 py-0.5 text-xs font-medium hover:bg-gray-50"
              style={{
                borderColor: emotionColor(line.emotionNote.intensity),
                color: emotionColor(line.emotionNote.intensity),
              }}
              onClick={(e) => { e.stopPropagation(); onClickEmotion(); }}
            >
              {line.emotionNote.emotion} {line.emotionNote.intensity}
            </button>
          )}
        </div>
      </div>

      {/* Silence countdown */}
      {silenceRemaining !== null && progress !== null && (
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-orange-200">
              <div
                className="h-full rounded-full bg-orange-400 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-orange-600 font-medium">
              {Math.ceil(silenceRemaining / 1000)}秒
            </span>
          </div>
          <p className="text-xs text-orange-500">セリフを言ってください</p>
        </div>
      )}
    </div>
  );
}

function emotionColor(intensity: number): string {
  const colors = ["#6B7280", "#3B82F6", "#10B981", "#F59E0B", "#EF4444"];
  return colors[Math.min(intensity - 1, 4)] ?? "#6B7280";
}
