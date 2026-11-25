import { memo } from "react";
import { css } from "../../../styled-system/css";
import {
  bodyColumnStyles,
  gridStyles,
  leftColumnStyles,
  pageContainerStyles,
  pageMainStyles,
} from "../../styles/layout";

interface CardSkeletonProps {
  count?: number;
}

/**
 * 記事一覧の読み込み中に出す骨組み。
 *
 * 一覧の行 (PostRow) と同じ 3 列の位置に帯を置き、読み込み後に配置がずれないように
 * する。帯の高さは実際の行送り (本文 27.2px / タイトル 30px) に合わせる。
 */

// 行。上端の区切り線と上下の余白は PostRow の default と同じ。
const rowStyles = css({
  paddingY: "3x",
  rowGap: "1x",
  borderTop: "1px solid",
  borderTopColor: "border.subtle",
});

// 帯。bg.muted は bg.canvas との差が小さい面の色 (読み込み中であることは
// aria-busy と点滅で伝える)。
const skeletonBase = css({
  background: "bg.muted",
  borderRadius: "sm",
  animation: "skeleton-pulse 1.5s ease-in-out infinite",
});

const dateLineStyles = css({
  height: "27px",
  width: "96px",
});

const titleLineStyles = css({
  height: "30px",
  width: "75%",
});

const excerptLineStyles = css({
  height: "27px",
  width: "100%",
  marginTop: "1x",
});

export const CardSkeleton = memo(({ count = 4 }: CardSkeletonProps) => {
  const skeletonItems = Array.from(
    { length: count },
    (_, i) => `skeleton-${i}`,
  );

  return (
    <div
      className={`${pageContainerStyles} ${pageMainStyles}`}
      role="status"
      aria-busy="true"
      aria-label="記事を読み込み中"
    >
      <div>
        {skeletonItems.map((key) => (
          <div
            key={key}
            className={`${gridStyles} ${rowStyles}`}
            data-token-border="border.subtle"
          >
            <div className={leftColumnStyles}>
              <div className={`${skeletonBase} ${dateLineStyles}`} />
            </div>
            <div className={bodyColumnStyles}>
              <div className={`${skeletonBase} ${titleLineStyles}`} />
              <div className={`${skeletonBase} ${excerptLineStyles}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

CardSkeleton.displayName = "CardSkeleton";
