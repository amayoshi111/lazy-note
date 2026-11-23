import { css } from "../../../styled-system/css";
import { visuallyHidden } from "../../../styled-system/patterns";
import { pageContainerStyles } from "../../styles/layout";
import { BrandName } from "../common/BrandName";
import { ThemeToggle } from "../common/ThemeToggle";

interface HeaderProps {
  postCount?: number;
}

// 下端の区切り線は border 専用 token (bg.canvas 上で WCAG 1.4.11 の 3:1 を満たす)。
const headerStyles = css({
  background: "bg.canvas",
  color: "fg.primary",
  borderBottom: "1px solid",
  borderBottomColor: "border.subtle",
});

const headerInnerStyles = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "2x",
  paddingY: "2x",
});

const toolsStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "2x",
});

const postCountStyles = css({
  textStyle: "std-16n-170",
  color: "fg.secondary",
});

export const Header = ({ postCount }: HeaderProps) => {
  return (
    <header className={headerStyles} data-token-border="border.subtle">
      <div className={`${pageContainerStyles} ${headerInnerStyles}`}>
        <BrandName variant="header" />

        <div className={toolsStyles}>
          {postCount !== undefined && (
            // 視覚は短く「全 N 件」、SR は意味明確に「記事 N 件」と読み上げる。
            // - 視覚テキスト: aria-hidden で SR から隠す
            // - 補助テキスト: visuallyHidden パターンで視覚から隠し SR にだけ届ける
            // 要素に直接 aria-label を付けると Biome a11y
            // (useAriaPropsSupportedByRole) を踏むため、テキスト二重化方式を採用。
            <p className={postCountStyles}>
              <span aria-hidden="true">全 {postCount} 件</span>
              <span className={visuallyHidden()}>記事 {postCount} 件</span>
            </p>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
