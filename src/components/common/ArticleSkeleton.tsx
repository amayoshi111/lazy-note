import { memo } from "react";
import { css } from "../../../styled-system/css";
import {
  bodyColumnStyles,
  gridStyles,
  leftColumnStyles,
  pageContainerStyles,
  pageMainStyles,
} from "../../styles/layout";

/**
 * 記事詳細の読み込み中に出す骨組み。
 *
 * 記事詳細 (PostDetailPage) と同じ列の位置 (左 2 カラムに戻るリンク、3 カラム目から
 * タイトルと本文) に帯を置き、読み込み後に配置がずれないようにする。
 */

const gridRowGapStyles = css({
  rowGap: "3x",
});

// 帯。bg.muted は bg.canvas との差が小さい面の色 (読み込み中であることは
// aria-busy と点滅で伝える)。
const skeletonBase = css({
  background: "bg.muted",
  borderRadius: "sm",
  animation: "skeleton-pulse 1.5s ease-in-out infinite",
});

// 戻るリンクの位置。
const backLinkStyles = css({
  height: "27px",
  width: "112px",
});

// タイトル (36px の文字の 1 行分) とメタ情報。
const titleStyles = css({
  height: "50px",
  width: "70%",
});

const metaStyles = css({
  height: "27px",
  width: "240px",
  marginTop: "2x",
});

// 本文。段落の間は 40px、行の間は 8px。
const paragraphStyles = css({
  display: "flex",
  flexDirection: "column",
  gap: "1x",
  marginTop: "5x",
});

const lineStyles = css({
  height: "19px",
});

const lineWidthStyles = {
  full: css({ width: "100%" }),
  partial: css({ width: "85%" }),
  short: css({ width: "60%" }),
};

/** 段落ごとの行 (id は key 用、width は帯の幅)。同じ並びを繰り返さないよう段落で変える */
const PARAGRAPHS = [
  {
    id: "p1",
    lines: [
      { id: "l1", width: "full" },
      { id: "l2", width: "partial" },
      { id: "l3", width: "short" },
    ],
  },
  {
    id: "p2",
    lines: [
      { id: "l1", width: "full" },
      { id: "l2", width: "full" },
      { id: "l3", width: "partial" },
      { id: "l4", width: "short" },
    ],
  },
  {
    id: "p3",
    lines: [
      { id: "l1", width: "full" },
      { id: "l2", width: "partial" },
      { id: "l3", width: "full" },
      { id: "l4", width: "short" },
    ],
  },
] as const;

export const ArticleSkeleton = memo(() => {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="記事を読み込み中"
      className={`${pageContainerStyles} ${pageMainStyles}`}
    >
      <div className={`${gridStyles} ${gridRowGapStyles}`}>
        <nav className={leftColumnStyles}>
          <div className={`${skeletonBase} ${backLinkStyles}`} />
        </nav>
        <article className={bodyColumnStyles}>
          <header>
            <div className={`${skeletonBase} ${titleStyles}`} />
            <div className={`${skeletonBase} ${metaStyles}`} />
          </header>
          {PARAGRAPHS.map((paragraph) => (
            <div key={paragraph.id} className={paragraphStyles}>
              {paragraph.lines.map((line) => (
                <div
                  key={line.id}
                  className={`${skeletonBase} ${lineStyles} ${lineWidthStyles[line.width]}`}
                />
              ))}
            </div>
          ))}
        </article>
      </div>
    </div>
  );
});

ArticleSkeleton.displayName = "ArticleSkeleton";
