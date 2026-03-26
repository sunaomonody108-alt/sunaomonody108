import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { scriptId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const script = await db.script.findFirst({
    where: { id: params.scriptId, userId: session.user.id },
  });
  if (!script) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const scenes = await db.scene.findMany({
    where: { scriptId: params.scriptId },
    orderBy: { orderIndex: "asc" },
    include: {
      lines: {
        orderBy: { orderIndex: "asc" },
        include: {
          character: true,
          emotionNote: true,
        },
      },
      _count: { select: { lines: true } },
    },
  });

  return NextResponse.json(scenes);
}
