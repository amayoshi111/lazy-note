import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { dadsTextStyles } from "../textStyles";

/**
 * 文字の大きさ・太さ・行間・文字間を、デジタル庁デザインシステム (β版 v2.18.3)
 * のテキストスタイルに限定するためのテスト。
 *
 * 出典: https://design.digital.go.jp/dads/foundations/typography/
 *
 * 期待値は同ページの規定を手で書き写したもので、実装から生成していない。
 */

/** 同システムのテキストスタイルに現れる文字の大きさ (CSS px) の全量 */
const ALLOWED_FONT_SIZES_PX = [
  14, 16, 17, 18, 20, 22, 24, 26, 28, 32, 36, 45, 48, 57, 64,
];

/** スタイル名 (例: std-16n-170) を 種別 / 大きさ / 太さ / 行間 に分解する */
const parseStyleName = (name: string) => {
  const matched = name.match(/^(dsp|std|dns|oln|mono)-(\d+)(b|n)-(\d+)$/);
  if (!matched) {
    throw new Error(`テキストスタイル名の形式が規定と異なります: ${name}`);
  }
  return {
    kind: matched[1],
    sizePx: Number(matched[2]),
    weight: matched[3] === "b" ? "700" : "400",
    lineHeight: String(Number(matched[4]) / 100),
  };
};

/** 種別と大きさから、規定の文字間 (em) を返す */
const expectedLetterSpacing = (kind: string, sizePx: number): string => {
  if (kind === "oln") {
    return "0.02em";
  }
  if (kind !== "std") {
    return "0";
  }
  if (sizePx >= 45) {
    return "0";
  }
  return sizePx >= 28 ? "0.01em" : "0.02em";
};

const styleEntries = Object.entries(dadsTextStyles);

describe("dadsTextStyles", () => {
  it.each(styleEntries)("%s の文字の大きさが規定の一覧に含まれる", (name) => {
    expect(ALLOWED_FONT_SIZES_PX).toContain(parseStyleName(name).sizePx);
  });

  it.each(styleEntries)("%s の font-size が名前の大きさと一致する", (name, style) => {
    expect(style.fontSize).toBe(`${parseStyleName(name).sizePx / 16}rem`);
  });

  it.each(styleEntries)("%s の太さが名前の B / N と一致する", (name, style) => {
    expect(style.fontWeight).toBe(parseStyleName(name).weight);
  });

  it.each(styleEntries)("%s の行間が名前の値と一致する", (name, style) => {
    expect(style.lineHeight).toBe(parseStyleName(name).lineHeight);
  });

  it.each(styleEntries)("%s の文字間が種別と大きさの規定どおりになる", (name, style) => {
    const { kind, sizePx } = parseStyleName(name);
    expect(style.letterSpacing).toBe(expectedLetterSpacing(kind, sizePx));
  });

  it("14px のスタイルは Dense 1 種類だけに留める (付随情報専用)", () => {
    const names14 = styleEntries
      .map(([name]) => name)
      .filter((name) => parseStyleName(name).sizePx === 14);
    expect(names14).toEqual(["dns-14n-130"]);
  });
});

describe("src 配下のスタイル記述", () => {
  const srcRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

  /** テスト以外の .ts / .tsx を再帰的に集める */
  const collectSourceFiles = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        return entry.name === "__tests__" ? [] : collectSourceFiles(path);
      }
      return /\.tsx?$/.test(entry.name) ? [path] : [];
    });

  it("fontSize / lineHeight / letterSpacing を個別に指定せず textStyle を使う", () => {
    const offenders = collectSourceFiles(srcRoot)
      // 規定値を定義している本体だけは対象外
      .filter((path) => !path.endsWith(join("lib", "textStyles.ts")))
      .filter((path) =>
        /\b(fontSize|lineHeight|letterSpacing)\s*:/.test(
          readFileSync(path, "utf8"),
        ),
      )
      .map((path) => path.slice(srcRoot.length + 1));
    expect(offenders).toEqual([]);
  });
});
