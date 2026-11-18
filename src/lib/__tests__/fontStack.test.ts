import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Editorial Citrus 本文タイポグラフィ (Issue #387) のフォント実適用テスト。
 *
 * 受け入れ基準:
 *   (i)  @font-face で Newsreader VF を読み込み、font-display: swap
 *   (ii) <link rel="preload" as="font" type="font/woff2" crossorigin> を index.html に追加
 *   (iii) フォントスタックが Newsreader → Noto Serif JP → Hiragino Mincho ProN
 *        → Yu Mincho → YuMincho → serif の順
 *   (v)  CLS < 0.1 を担保するため size-adjust または fallback metric override を適用
 *
 * 実際の値は src/index.css と index.html にある。woff2 が無い環境でも受け入れ基準を
 * 検証できるよう、両ファイルを文字列として読み、下の期待値と照合する。
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "../../..");

const readProjectFile = (relativePath: string): string => {
  return readFileSync(resolve(projectRoot, relativePath), "utf8");
};

/**
 * src/index.css の :root font-family に期待する本文フォントスタック (順序通り)。
 *
 * - "Noto Serif JP" は self-host しない (合計 KB 削減のため)。Android / Linux など
 *   OS にある環境でだけ効く。Hiragino より上に置くのは、macOS では和文が
 *   unicode-range と OS のフォールバックで Hiragino に流れて実害が無く、
 *   Android / Linux の可読性だけを上げられるため
 * - "Hiragino Mincho ProN" は macOS / iOS、"Yu Mincho" / "YuMincho" は
 *   Windows / 旧 macOS の既定明朝
 * - 末尾の generic family の serif だけはクォートしない
 */
const expectedBodyFontStack = [
  '"Newsreader"',
  '"Noto Serif JP"',
  '"Hiragino Mincho ProN"',
  '"Yu Mincho"',
  '"YuMincho"',
  "serif",
];

/** index.html が preload し、src/index.css の @font-face が読む Newsreader VF (Latin) */
const newsreaderLatinPath = "/fonts/Newsreader-VF-Latin.woff2";

describe("index.html (preload リンク)", () => {
  const indexHtml = readProjectFile("index.html");

  it("Newsreader VF Latin を preload する link を含む", () => {
    expect(indexHtml).toContain(`href="${newsreaderLatinPath}"`);
    expect(indexHtml).toContain('rel="preload"');
  });

  it('preload link が as="font" を指定している', () => {
    expect(indexHtml).toMatch(/rel="preload"[\s\S]*?as="font"/);
  });

  it('preload link が type="font/woff2" を指定している', () => {
    expect(indexHtml).toMatch(/rel="preload"[\s\S]*?type="font\/woff2"/);
  });

  it("preload link が crossorigin 属性を持つ", () => {
    expect(indexHtml).toMatch(/rel="preload"[\s\S]*?crossorigin/);
  });

  it("preload で読み込むフォントは 1 個のみ (フォント合計 KB 削減方針)", () => {
    // index.html 内の <link rel="preload" ... as="font"> 出現数をカウントする。
    // 設計方針: 一次フォント Newsreader Latin Roman の 1 本のみを preload する。
    const preloadFontMatches = indexHtml.match(
      /<link[^>]*rel="preload"[^>]*as="font"[^>]*>/g,
    );
    expect(preloadFontMatches).not.toBeNull();
    expect(preloadFontMatches?.length).toBe(1);
  });
});

describe("src/index.css (@font-face と :root font-family)", () => {
  const indexCss = readProjectFile("src/index.css");

  it("Newsreader VF を @font-face で self-host 宣言する", () => {
    expect(indexCss).toMatch(/@font-face\s*{[^}]*font-family:\s*"Newsreader"/);
    expect(indexCss).toContain(newsreaderLatinPath);
  });

  it("@font-face に font-display: swap を指定する (FOUT 許容)", () => {
    expect(indexCss).toMatch(/font-display:\s*swap/);
  });

  it("@font-face で size-adjust または ascent-override を指定し CLS を吸収する", () => {
    // どちらか (または両方) があれば fallback メトリクスとの差分を吸収できる
    const hasSizeAdjust = /size-adjust:\s*\d+(?:\.\d+)?%/.test(indexCss);
    const hasAscentOverride = /ascent-override:\s*\d+(?:\.\d+)?%/.test(
      indexCss,
    );
    expect(hasSizeAdjust || hasAscentOverride).toBe(true);
  });

  it("@font-face で可変フォントの weight 範囲 (200..800) を宣言する", () => {
    expect(indexCss).toMatch(/font-weight:\s*200\s+800/);
  });

  it(":root の font-family が Newsreader → Noto Serif JP → Hiragino Mincho ProN → Yu Mincho → YuMincho → serif の順で並ぶ", () => {
    const fontFamily =
      indexCss.match(/:root\s*{[^}]*?font-family:\s*([^;]*);/)?.[1] ?? "";
    const families = fontFamily.split(",").map((family) => family.trim());
    expect(families).toEqual(expectedBodyFontStack);
  });

  it(":root の font-family が Newsreader を一次指定にしている", () => {
    expect(indexCss).toMatch(
      /:root\s*{[^}]*font-family:\s*"Newsreader"[^;]*serif/,
    );
  });

  it(":root の font-family に Hiragino Mincho ProN と Yu Mincho を含む", () => {
    const rootBlockMatch = indexCss.match(/:root\s*{([^}]*)}/);
    expect(rootBlockMatch).not.toBeNull();
    const rootBlock = rootBlockMatch?.[1] ?? "";
    expect(rootBlock).toContain("Hiragino Mincho ProN");
    expect(rootBlock).toContain("Yu Mincho");
  });
});

describe("panda.config.ts (R-1 では fonts トークン未登録)", () => {
  const pandaConfig = readProjectFile("panda.config.ts");

  it("R-1 では theme.tokens.fonts を追加していない (R-2 / R-3 で textStyles と一緒に整備)", () => {
    // 既存の `fontSizes:` / `lineHeights:` トークンと衝突しないよう、
    // `fonts: {` ブロック (フォントファミリトークン) のみ存在しないことを確認する。
    expect(pandaConfig).not.toMatch(/\bfonts:\s*{/);
  });
});
