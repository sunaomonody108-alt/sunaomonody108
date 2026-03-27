import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { saveToOneDriveJournal } from "@/lib/onedrive";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { theme, date, content } = body as {
    theme: string;
    date: string;
    content: string;
  };

  if (!theme || !date || !content) {
    return NextResponse.json(
      { error: "theme, date, content are required" },
      { status: 400 }
    );
  }

  // Sanitize filename: remove characters not safe for filenames
  const safeTheme = theme.replace(/[\/\\:*?"<>|]/g, "_");
  const filename = `${date}_${safeTheme}.md`;

  const fileContent = `# ${theme}\n\n日付: ${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}\n\n${content}\n`;

  await saveToOneDriveJournal(filename, fileContent);

  return NextResponse.json({ ok: true, filename });
}
