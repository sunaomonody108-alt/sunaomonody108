export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const { extractText } = await import("unpdf");
  const { text } = await extractText(new Uint8Array(buffer), { mergePages: true });
  // text is string[] when mergePages is false, string when true
  return Array.isArray(text) ? text.join("\n") : text;
}
