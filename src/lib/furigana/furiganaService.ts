import kuromoji from "kuromoji";

interface FuriganaToken {
  surface: string;
  reading?: string;
}

let tokenizer: kuromoji.Tokenizer<kuromoji.IpadicFeatures> | null = null;

async function getTokenizer(): Promise<kuromoji.Tokenizer<kuromoji.IpadicFeatures>> {
  if (tokenizer) return tokenizer;

  return new Promise((resolve, reject) => {
    kuromoji
      .builder({ dicPath: "node_modules/kuromoji/dict" })
      .build((err, built) => {
        if (err) {
          reject(err);
          return;
        }
        tokenizer = built;
        resolve(built);
      });
  });
}

export async function addFurigana(text: string): Promise<FuriganaToken[]> {
  const t = await getTokenizer();
  const tokens = t.tokenize(text);

  return tokens.map((token) => {
    const reading = token.reading;
    const surface = token.surface_form;

    // Only add furigana if surface contains kanji and reading differs
    const hasKanji = /[\u4e00-\u9faf\u3400-\u4dbf]/.test(surface);
    const needsFurigana =
      hasKanji &&
      reading &&
      reading !== surface &&
      reading !== convertToHiragana(surface);

    return {
      surface,
      reading: needsFurigana ? katakanaToHiragana(reading!) : undefined,
    };
  });
}

export function tokensToHtml(tokens: FuriganaToken[]): string {
  return tokens
    .map((t) => {
      if (t.reading) {
        return `<ruby>${t.surface}<rt>${t.reading}</rt></ruby>`;
      }
      return t.surface;
    })
    .join("");
}

function katakanaToHiragana(str: string): string {
  return str.replace(/[\u30a1-\u30f6]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0x60)
  );
}

function convertToHiragana(str: string): string {
  return katakanaToHiragana(str);
}
