export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, BookOpen, Users, Layers } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

export default async function ScriptsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/api/auth/signin");

  const scripts = await db.script.findMany({
    where: { userId: session.user.id },
    include: {
      characters: { orderBy: { lineCount: "desc" }, take: 5 },
      _count: { select: { scenes: true, practiceLog: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">台本一覧</h1>
          <p className="text-sm text-gray-500 mt-1">{scripts.length}件の台本</p>
        </div>
        <Button asChild>
          <Link href="/scripts/new">
            <Plus className="mr-2 h-4 w-4" />
            台本をインポート
          </Link>
        </Button>
      </div>

      {scripts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
          <BookOpen className="h-16 w-16 text-gray-300" />
          <p className="text-gray-500">まだ台本がありません</p>
          <Button asChild>
            <Link href="/scripts/new">最初の台本をインポート</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {scripts.map((script) => (
            <Link key={script.id} href={`/scripts/${script.id}`}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-base">{script.title}</CardTitle>
                  <CardDescription>
                    {formatDistanceToNow(new Date(script.updatedAt), {
                      addSuffix: true,
                      locale: ja,
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {script.characters.length}キャラ
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="h-4 w-4" />
                      {script._count.scenes}シーン
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {script.characters.slice(0, 4).map((char) => (
                      <span
                        key={char.id}
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white"
                        style={{ backgroundColor: char.color ?? "#6B7280" }}
                      >
                        {char.name}
                      </span>
                    ))}
                    {script.characters.length > 4 && (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500">
                        +{script.characters.length - 4}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
