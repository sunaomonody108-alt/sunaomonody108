export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // pdfjs-distはunpdfの依存として既にインストール済み
  // Y座標を使って改行を正確に再現する
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.js");

  // Node.js環境ではワーカーなし
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (pdfjs as any).GlobalWorkerOptions = (pdfjs as any).GlobalWorkerOptions ?? {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (pdfjs as any).GlobalWorkerOptions.workerSrc = "";

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
  });
  const pdf = await loadingTask.promise;

  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Y座標でテキストアイテムをグループ化して行を再現
    const lineMap = new Map<number, string[]>();
    for (const item of textContent.items) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!("str" in item)) continue;
      const y = Math.round((item as any).transform[5]);
      if (!lineMap.has(y)) lineMap.set(y, []);
      lineMap.get(y)!.push((item as any).str);
    }

    // Y座標を降順に並べ（PDFは上が大きい）行テキストを結合
    const sortedYs = Array.from(lineMap.keys()).sort((a, b) => b - a);
    const lines = sortedYs.map((y) => lineMap.get(y)!.join(""));
    pageTexts.push(lines.join("\n"));
  }

  return pageTexts.join("\n\n");
}
