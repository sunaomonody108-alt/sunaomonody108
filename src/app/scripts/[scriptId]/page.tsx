import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Settings, Layers, Users, BookOpen } from "lucide-react";

export default async function ScriptDetailPage({
  params,
}: {
  params: { scriptId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/api/auth/signin");

  const script = await db.script.findFirst({
    where: { id: params.scriptId, userId: session.user.id },
    include: {
      characters: { orderBy: { lineCount: "desc" } },
      scenes: {
        orderBy: { orderIndex: "asc" },
        include: { _count: { select: { lines: true } } },
      },
      _count: { select: { practiceLog: true } },
    },
  });

  if (!script) notFound();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">
            <Link href="/scripts" className="hover:underline">台本一覧</Link>
            {" / "}
          </p>
          <h1 className="text-2xl font-bold text-gray-900">{script.title}</h1>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/scripts/${script.id}/setup`}>
              <Settings className="mr-2 h-4 w-4" />
              ボイス設定
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/scripts/${script.id}/practice`}>
              <Play className="mr-2 h-4 w-4" />
              練習開始
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{script.characters.length}</p>
              <p className="text-sm text-gray-500">登場人物</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <Layers className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{script.scenes.length}</p>
              <p className="text-sm text-gray-500">シーン数</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">{script._count.practiceLog}</p>
              <p className="text-sm text-gray-500">練習回数</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Characters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">登場人物</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {script.characters.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2 rounded-full border px-3 py-1.5"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: c.color ?? "#6B7280" }}
                />
                <span className="text-sm font-medium">{c.name}</span>
                {c.voiceId && (
                  <span className="text-xs text-gray-400">{c.voiceId.replace("ja-JP-", "")}</span>
                )}
                <span className="text-xs text-gray-400">({c.lineCount}行)</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Scenes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">シーン一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {script.scenes.map((scene) => (
              <div
                key={scene.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="font-medium text-sm">
                    シーン{scene.sceneNumber}
                    {scene.title && ` — ${scene.title}`}
                  </p>
                  {scene.location && (
                    <p className="text-xs text-gray-500">{scene.location}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">
                    {scene._count.lines}行
                  </span>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/scripts/${script.id}/practice/${scene.id}`}>
                      <Play className="h-3 w-3 mr-1" />
                      練習
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
