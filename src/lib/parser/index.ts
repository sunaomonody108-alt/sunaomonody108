import { extractTextFromDocx } from "./docxParser";
import { extractTextFromPdf } from "./pdfParser";
import { parseJapaneseScreenplay } from "./japaneseScreenplayParser";
import type { ParsedScript } from "./parserTypes";

export type { ParsedScript, ParsedScene, ParsedLine, ParsedCharacter } from "./parserTypes";

export async function parseScriptFile(
  buffer: Buffer,
  filename: string
): Promise<{ rawText: string; parsed: ParsedScript }> {
  const ext = filename.toLowerCase().split(".").pop();

  let rawText: string;
  if (ext === "docx") {
    rawText = await extractTextFromDocx(buffer);
  } else if (ext === "pdf") {
    rawText = await extractTextFromPdf(buffer);
  } else if (ext === "txt") {
    rawText = buffer.toString("utf-8");
  } else {
    throw new Error(`Unsupported file format: .${ext}`);
  }

  const parsed = parseJapaneseScreenplay(rawText);
  return { rawText, parsed };
}

export { parseJapaneseScreenplay };
