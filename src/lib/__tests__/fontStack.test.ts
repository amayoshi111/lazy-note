import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * 書体と既定の文字サイズのテスト。
 *
 * 書体はデジタル庁デザインシステム (β版 v2.18.3) の指定に従う:
 * 本文は Noto Sans JP、無ければ OS のゴシック体 (sans-serif)。Web フォントは配信しない
 * (同システムは OS 標準の書体の使用を制限していない)。
 * 出典: https://design.digital.go.jp/dads/foundations/typography/
 *
 * 実際の値は src/index.css と index.html にあるので、両ファイルを文字列として読み、
 * 下の期待値と照合する。
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "../../..");

const readProjectFile = (relativePath: string): string => {
  return readFileSync(resolve(projectRoot, relativePath), "utf8");
};

/** CSS のコメントを取り除く (コメント中の説明文を値と取り違えないため) */
const stripCssComments = (css: string): string =>
  css.replace(/\/\*[\s\S]*?\*\//g, "");

/** 指定セレクタの宣言ブロックの中身を返す (見つからなければ空文字) */
const readBlock = (css: string, selector: string): string =>
  css.match(new RegExp(`${selector}\\s*{([^}]*)}`))?.[1] ?? "";

describe("index.html", () => {
  const indexHtml = readProjectFile("index.html");

  it("フォントを preload しない (Web フォントを配信しないため)", () => {
    expect(indexHtml).not.toMatch(/<link[^>]*as="font"/);
  });
});

describe("src/index.css", () => {
  const indexCss = stripCssComments(readProjectFile("src/index.css"));

  it(":root の font-family が Noto Sans JP → sans-serif の順で並ぶ", () => {
    const fontFamily =
      readBlock(indexCss, ":root").match(/font-family:\s*([^;]*);/)?.[1] ?? "";
    const families = fontFamily.split(",").map((family) => family.trim());
    expect(families).toEqual(['"Noto Sans JP"', "sans-serif"]);
  });

  it("@font-face で Web フォントを読み込まない", () => {
    expect(indexCss).not.toContain("@font-face");
  });

  it(":root の文字サイズを変更しない (1rem = 16px を保つ)", () => {
    expect(readBlock(indexCss, ":root")).not.toMatch(/font-size\s*:/);
  });

  it("body の既定の文字を 16px / 行間 170% / 文字間 0.02em にする", () => {
    const bodyBlock = readBlock(indexCss, "body");
    expect(bodyBlock).toMatch(/font-size:\s*1rem;/);
    expect(bodyBlock).toMatch(/line-height:\s*1\.7;/);
    expect(bodyBlock).toMatch(/letter-spacing:\s*0\.02em;/);
  });
});
