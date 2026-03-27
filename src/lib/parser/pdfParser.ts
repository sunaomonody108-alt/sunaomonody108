export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const { extractText } = await import("unpdf");
  // mergePages: false で各ページを別々に取得し改行を保持
  const { text } = await extractText(new Uint8Array(buffer));
  const pages = Array.isArray(text) ? text : [text];
  return pages.join("\n\n");
}
