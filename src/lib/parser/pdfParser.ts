export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // pdf-parse/index.js runs test files on import; use lib directly to avoid that
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
  const pdfParse = require("pdf-parse/lib/pdf-parse.js") as any;
  const data = await pdfParse(buffer);
  return data.text;
}
