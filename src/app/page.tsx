export const dynamic = "force-dynamic";

import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { BookOpen, Mic, Brain, Play } from "lucide-react";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="flex flex-col items-center gap-12 py-16">
      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-blue-100 p-4">
            <BookOpen className="h-12 w-12 text-blue-600" />
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          台本練習ツール
        </h1>
        <p className="max-w-xl text-lg text-gray-500">
          AI音声で台本を読み上げ、プロレベルの発声練習を。
          感情分析・フリガナ・録音機能で効率よくセリフを覚えましょう。
        </p>
        {session ? (
          <Button asChild size="lg">
            <Link href="/scripts">台本一覧を開く</Link>
          </Button>
        ) : (
          <Button asChild size="lg">
            <Link href="/api/auth/signin">始める（ログイン）</Link>
          </Button>
        )}
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 w-full">
        {[
          {
            icon: <Play className="h-6 w-6 text-blue-600" />,
            bg: "bg-blue-50",
            title: "AI音声読み上げ",
            description:
              "Google TTS Neural2でキャラ別の自然な音声を生成。自分の役だけ間を空けて発声練習。",
          },
          {
            icon: <Brain className="h-6 w-6 text-purple-600" />,
            bg: "bg-purple-50",
            title: "感情分析・演技指導",
            description:
              "Claudeがベテラン演出家として各セリフの感情と具体的な演技指導を日本語で解説。",
          },
          {
            icon: <Mic className="h-6 w-6 text-red-600" />,
            bg: "bg-red-50",
            title: "自分の声を録音",
            description:
              "練習中に自分のセリフを録音して後から聞き返し。自己フィードバックで上達。",
          },
          {
            icon: <BookOpen className="h-6 w-6 text-green-600" />,
            bg: "bg-green-50",
            title: "フリガナ・シーン別練習",
            description:
              "難しい漢字に自動でフリガナ付与。頭から通しでも、シーンごとにも練習できる。",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-lg border border-gray-200 bg-white p-6 space-y-3"
          >
            <div className={`rounded-md ${f.bg} w-10 h-10 flex items-center justify-center`}>
              {f.icon}
            </div>
            <h3 className="font-semibold text-gray-900">{f.title}</h3>
            <p className="text-sm text-gray-500">{f.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
