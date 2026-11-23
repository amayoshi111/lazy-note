import { css } from "../../styled-system/css";

/**
 * ページ共通のレイアウト。デジタル庁デザインシステムのレイアウト規定に沿う。
 *
 * - 768px 以上: 12 カラム。カラム 64px (本文 16px の 4 倍)、段間 32px (本文の 2 倍)、
 *   左右マージン 40px
 * - 768px 未満: 1 カラム、左右マージン 16px
 *
 * どのページも「左 2 カラム (日付・戻るリンク) / 中央 7 カラム (本文) / 右 3 カラム
 * (補助情報・目次)」の 3 列で組む。中央の 7 カラムは 640px で、16px の本文が全角約 39 字
 * になる (同システムの目安は全角 40 字程度)。
 *
 * 出典: https://design.digital.go.jp/dads/foundations/layout/
 *       https://design.digital.go.jp/dads/foundations/typography/accessibility/
 */

/** ページ幅のコンテナ (最大 1200px = 12 カラム 1120px + 左右マージン 40px × 2) */
export const pageContainerStyles = css({
  width: "100%",
  maxWidth: "container",
  marginX: "auto",
  paddingX: { base: "2x", md: "5x" },
});

/** main 直下の上下の余白 */
export const pageMainStyles = css({
  paddingTop: { base: "5x", md: "8x" },
  paddingBottom: "8x",
});

/** 12 カラムのグリッド (768px 未満は 1 カラム) */
export const gridStyles = css({
  display: "grid",
  gridTemplateColumns: {
    base: "minmax(0, 1fr)",
    md: "repeat(12, minmax(0, 1fr))",
  },
  columnGap: "gutter",
});

/** 左の列 (1〜2 カラム目) */
export const leftColumnStyles = css({
  md: { gridColumn: "1 / span 2" },
});

/** 中央の列 (3〜9 カラム目) */
export const bodyColumnStyles = css({
  minWidth: 0,
  md: { gridColumn: "3 / span 7" },
});

/** 右の列 (10〜12 カラム目) */
export const asideColumnStyles = css({
  md: { gridColumn: "10 / span 3" },
});

/** セクションの見出し (「最新の記事」「記事一覧」など)。直後の区切り線まで 16px */
export const sectionLabelStyles = css({
  textStyle: "std-18b-160",
  color: "fg.secondary",
  marginBottom: "2x",
});

/** セクションどうしの間隔 (64px) */
export const sectionStackStyles = css({
  display: "flex",
  flexDirection: "column",
  gap: "8x",
});
