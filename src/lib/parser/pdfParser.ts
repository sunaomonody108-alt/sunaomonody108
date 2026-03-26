export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const pdfModule = await import("pdf-parse");
  // pdf-parse exports differently depending on the bundler
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfParse = (pdfModule as any).default ?? pdfModule;
  const data = await pdfParse(buffer);
  return data.text;
}
