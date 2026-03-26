"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Upload,
  FileText,
  Check,
  ChevronRight,
  Loader2,
  Users,
  Layers,
} from "lucide-react";
import type { ParsedScript } from "@/lib/parser/parserTypes";

type Step = "upload" | "preview" | "saving";

export function ScriptImportWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState<ParsedScript | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(async (f: File) => {
    setFile(f);
    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", f);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "アップロードに失敗しました");
      }

      const data = await res.json();
      setRawText(data.rawText);
      setParsed(data.parsed);
      setTitle(data.parsed.title ?? f.name.replace(/\.[^.]+$/, ""));
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setUploading(false);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  };

  const handleSave = async () => {
    if (!parsed || !rawText) return;
    setStep("saving");

    try {
      const res = await fetch("/api/scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          rawText,
          originalFile: file?.name,
          characters: parsed.characters,
          scenes: parsed.scenes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "保存に失敗しました");
      }

      const data = await res.json();
      router.push(`/scripts/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存エラーが発生しました");
      setStep("preview");
    }
  };

  return (
    <div className="space-y-6">
      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {(["upload", "preview", "saving"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                step === s
                  ? "bg-blue-600 text-white"
                  : i < ["upload", "preview", "saving"].indexOf(step)
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {i < ["upload", "preview", "saving"].indexOf(step) ? (
                <Check className="h-4 w-4" />
              ) : (
                i + 1
              )}
            </div>
            <span className="text-sm text-gray-600">
              {s === "upload" ? "ファイル選択" : s === "preview" ? "内容確認" : "保存中"}
            </span>
            {i < 2 && <ChevronRight className="h-4 w-4 text-gray-400" />}
          </div>
        ))}
      </div>

      {/* Step content */}
      {step === "upload" && (
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
              <p className="text-gray-500">台本を解析中...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <Upload className="h-10 w-10 text-gray-400" />
              <div>
                <p className="text-gray-700 font-medium">
                  ファイルをドラッグ＆ドロップ
                </p>
                <p className="text-sm text-gray-500">または</p>
              </div>
              <Label htmlFor="file-upload" className="cursor-pointer">
                <Button variant="outline" asChild>
                  <span>
                    <FileText className="mr-2 h-4 w-4" />
                    ファイルを選択
                  </span>
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  accept=".docx,.pdf,.txt"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </Label>
              <p className="text-xs text-gray-400">docx・pdf・txt 対応</p>
            </div>
          )}
        </div>
      )}

      {step === "preview" && parsed && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">タイトル</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="台本のタイトル"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6 flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{parsed.characters.length}</p>
                  <p className="text-sm text-gray-500">登場人物</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-center gap-3">
                <Layers className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{parsed.scenes.length}</p>
                  <p className="text-sm text-gray-500">シーン数</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-4 space-y-2">
              <p className="text-sm font-medium text-gray-700">検出された登場人物</p>
              <div className="flex flex-wrap gap-2">
                {parsed.characters.map((c) => (
                  <span
                    key={c.name}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium text-white"
                    style={{ backgroundColor: c.color }}
                  >
                    {c.name}
                    <span className="text-xs opacity-80">({c.lineCount})</span>
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 space-y-2">
              <p className="text-sm font-medium text-gray-700">シーン一覧（先頭5件）</p>
              <ul className="space-y-1">
                {parsed.scenes.slice(0, 5).map((s) => (
                  <li key={s.sceneNumber} className="text-sm text-gray-600">
                    シーン{s.sceneNumber}
                    {s.location && ` — ${s.location}`}
                    <span className="text-gray-400 ml-2">({s.lines.length}行)</span>
                  </li>
                ))}
                {parsed.scenes.length > 5 && (
                  <li className="text-sm text-gray-400">
                    ...他{parsed.scenes.length - 5}シーン
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep("upload")}>
              戻る
            </Button>
            <Button onClick={handleSave} disabled={!title}>
              台本を保存する
            </Button>
          </div>
        </div>
      )}

      {step === "saving" && (
        <div className="flex flex-col items-center gap-4 py-12">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          <p className="text-gray-600">台本を保存中...</p>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
