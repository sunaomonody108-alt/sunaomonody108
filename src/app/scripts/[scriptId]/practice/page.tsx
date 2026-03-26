import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Play, BookOpen } from "lucide-react";

export default async function PracticeSelectorPage({
  params,
}: {
  params: { scriptId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/api/auth/signin");

  const script = await db.script.findFirst({
    where: { id: params.scriptId, userId: session.user.id },
    include: {
      scenes: { orderBy: { orderIndex: "asc" } },
    },
  });

  if (!script) notFound();

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <p className="text-sm text-gray-500 mb-1">
          <Link href={`/scripts/${script.id}`} className="hover:underline">
            {script.title}
          </Link>
          {" / "} 練習
        </p>
        <h1 className="text-2xl font-bold text-gray-900">練習シーンを選択</h1>
      </div>

      <div className="space-y-2">
        <Button asChild className="w-full justify-start h-auto py-4" variant="outline">
          <Link href={`/scripts/${script.id}/practice/${script.scenes[0]?.id ?? ""}`}>
            <BookOpen className="mr-3 h-5 w-5 text-blue-600" />
            <div className="text-left">
              <p className="font-medium">全シーン通し練習</p>
              <p className="text-sm text-gray-500">シーン1から最後まで通して練習</p>
            </div>
          </Link>
        </Button>

        <div className="pt-2">
          <p className="text-sm font-medium text-gray-700 mb-2">シーン別練習</p>
          <div className="space-y-2">
            {script.scenes.map((scene) => (
              <Link
                key={scene.id}
                href={`/scripts/${script.id}/practice/${scene.id}`}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 hover:border-blue-300 hover:bg-blue-50 transition-colors"
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
                <Play className="h-4 w-4 text-blue-500" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
