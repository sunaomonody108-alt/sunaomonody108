import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

async function getAuthorizedScript(scriptId: string, userId: string) {
  const script = await db.script.findFirst({
    where: { id: scriptId, userId },
  });
  return script;
}

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
    include: {
      characters: { orderBy: { lineCount: "desc" } },
      scenes: {
        orderBy: { orderIndex: "asc" },
        include: {
          lines: {
            orderBy: { orderIndex: "asc" },
            include: {
              character: true,
              emotionNote: true,
            },
          },
        },
      },
    },
  });

  if (!script) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(script);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { scriptId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const script = await getAuthorizedScript(params.scriptId, session.user.id);
  if (!script) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.script.delete({ where: { id: params.scriptId } });
  return NextResponse.json({ ok: true });
}
