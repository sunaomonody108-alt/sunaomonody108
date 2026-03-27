export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PracticePlayer } from "@/components/practice/PracticePlayer";

export default async function PracticeSessionPage({
  params,
}: {
  params: { scriptId: string; sceneId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/api/auth/signin");

  const script = await db.script.findFirst({
    where: { id: params.scriptId, userId: session.user.id },
    include: {
      characters: true,
      scenes: { orderBy: { orderIndex: "asc" } },
    },
  });

  if (!script) notFound();

  const scene = await db.scene.findFirst({
    where: { id: params.sceneId, scriptId: params.scriptId },
    include: {
      lines: {
        orderBy: { orderIndex: "asc" },
        include: {
          character: true,
          emotionNote: true,
        },
      },
    },
  });

  if (!scene) notFound();

  return (
    <PracticePlayer
      script={script}
      scene={scene}
      allScenes={script.scenes}
    />
  );
}
