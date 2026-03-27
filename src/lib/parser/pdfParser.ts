export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // eval('require') prevents webpack from bundling/analyzing pdf-parse at build time
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod = eval("require")("pdf-parse") as any;
  const pdfParse = typeof mod === "function" ? mod : (mod.default ?? mod);
  const data = await pdfParse(buffer);
  return data.text;
}
