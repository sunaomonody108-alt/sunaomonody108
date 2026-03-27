export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // Dynamic import lets webpack bundle pdf-parse and include it in the deployment
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod = await import("pdf-parse") as any;
  const pdfParse = typeof mod.default === "function" ? mod.default : mod;
  const data = await pdfParse(buffer);
  return data.text;
}
