import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { VoiceSetup } from "@/components/voice/VoiceSetup";

export default async function SetupPage({
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
    },
  });

  if (!script) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <p className="text-sm text-gray-500 mb-1">
          <Link href={`/scripts/${script.id}`} className="hover:underline">
            {script.title}
          </Link>
          {" / "} ボイス設定
        </p>
        <h1 className="text-2xl font-bold text-gray-900">キャラクター設定</h1>
        <p className="text-sm text-gray-500 mt-1">
          各キャラクターに音声を割り当て、速度・ピッチを調整できます
        </p>
      </div>
      <VoiceSetup scriptId={script.id} initialCharacters={script.characters} />
    </div>
  );
}
