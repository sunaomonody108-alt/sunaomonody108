export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseScriptFile } from "@/lib/parser";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const allowedTypes = [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/pdf",
    "text/plain",
  ];

  if (!allowedTypes.includes(file.type) && !file.name.match(/\.(docx|pdf|txt)$/i)) {
    return NextResponse.json(
      { error: "サポートされていないファイル形式です。docx、pdf、txtのみ対応しています。" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const { rawText, parsed } = await parseScriptFile(buffer, file.name);
    return NextResponse.json({
      rawText,
      parsed,
      filename: file.name,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Parse error";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
