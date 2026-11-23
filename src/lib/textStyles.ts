/**
 * デジタル庁デザインシステム (β版 v2.18.3) のテキストスタイルのうち、本サイトで使うもの。
 *
 * 出典: https://design.digital.go.jp/dads/foundations/typography/
 *
 * 名前は同システムのトークン名を小文字にしたもの。
 * 例: `std-16n-170` = Standard / 16px / Normal (400) / 行間 170%。
 *
 * 文字の大きさ・太さ・行間・文字間は、必ずこのスタイル経由 (`textStyle`) で指定する。
 * panda.config.ts が textStyles として読み込み、textStyles.test.ts が規定値と照合する。
 * 1rem = 16px (src/index.css で :root の文字サイズを変えていない) を前提にしている。
 */

interface TextStyleValue {
  readonly fontSize: string;
  readonly fontWeight: "400" | "700";
  readonly lineHeight: string;
  readonly letterSpacing: string;
  readonly fontFamily?: string;
}

/** 等幅書体。同システムの指定は Noto Sans Mono (無ければ OS の等幅書体) */
const MONO_FONT_FAMILY = '"Noto Sans Mono", monospace';

export const dadsTextStyles = {
  /** 記事タイトル・ページ見出し (768px 以上) */
  "std-36b-140": {
    fontSize: "2.25rem",
    fontWeight: "700",
    lineHeight: "1.4",
    letterSpacing: "0.01em",
  },
  /** 最新記事のタイトル (768px 以上) */
  "std-32b-150": {
    fontSize: "2rem",
    fontWeight: "700",
    lineHeight: "1.5",
    letterSpacing: "0.01em",
  },
  /** 記事タイトル・ページ見出し (768px 未満) */
  "std-28b-150": {
    fontSize: "1.75rem",
    fontWeight: "700",
    lineHeight: "1.5",
    letterSpacing: "0.01em",
  },
  /** 本文の見出し h2、最新記事のタイトル (768px 未満) */
  "std-24b-150": {
    fontSize: "1.5rem",
    fontWeight: "700",
    lineHeight: "1.5",
    letterSpacing: "0.02em",
  },
  /** 一覧のタイトル、本文の見出し h3、サイト名 */
  "std-20b-150": {
    fontSize: "1.25rem",
    fontWeight: "700",
    lineHeight: "1.5",
    letterSpacing: "0.02em",
  },
  /** セクションの見出し */
  "std-18b-160": {
    fontSize: "1.125rem",
    fontWeight: "700",
    lineHeight: "1.6",
    letterSpacing: "0.02em",
  },
  /** 抜粋なしの行のタイトル、強調 */
  "std-16b-170": {
    fontSize: "1rem",
    fontWeight: "700",
    lineHeight: "1.7",
    letterSpacing: "0.02em",
  },
  /** 本文、抜粋、日付などの補助情報 */
  "std-16n-170": {
    fontSize: "1rem",
    fontWeight: "400",
    lineHeight: "1.7",
    letterSpacing: "0.02em",
  },
  /** ボタンなど 1 行で完結する UI */
  "oln-16b-100": {
    fontSize: "1rem",
    fontWeight: "700",
    lineHeight: "1",
    letterSpacing: "0.02em",
  },
  /** コード */
  "mono-16n-150": {
    fontFamily: MONO_FONT_FAMILY,
    fontSize: "1rem",
    fontWeight: "400",
    lineHeight: "1.5",
    letterSpacing: "0",
  },
  /** フッターの著作権表記のみ (14px は付随情報に限る) */
  "dns-14n-130": {
    fontSize: "0.875rem",
    fontWeight: "400",
    lineHeight: "1.3",
    letterSpacing: "0",
  },
} as const satisfies Record<string, TextStyleValue>;
