import { memo } from "react";
import { css } from "../../../styled-system/css";
import type { PostSummary } from "../../lib/markdown";
import { Link } from "../atoms/Link";

// Issue #708: 前後ナビのラベルから矢印「←」「→」を分離し、JSX 側で
// `<span aria-hidden="true">{矢印}</span>` の装飾要素として描画する。
// 旧実装はラベルを JSX 直書きで `← 前の記事` / `次の記事 →` と連結していたが、
// 再評価トリガー3 (同種の「矢印 + テキスト」ラベルが 3 箇所以上発生) の充足に
// 伴い BackToTop / PostDetailPage と方針統一する。矢印を aria-hidden にする
// ことで SR のアクセシブル名から外れ、構造的な i18n / RTL 対応の土台になる
// (実際の `[dir=rtl]` 反転 CSS は RTL 要件発生時まで先送り = YAGNI)。
// 矢印は純粋な glyph のため BackToTop に倣い `ICON` ではなく `ARROW` と命名する。
const PREV_POST_ARROW = "←" as const;
const PREV_POST_LABEL = "前の記事" as const;
const NEXT_POST_ARROW = "→" as const;
const NEXT_POST_LABEL = "次の記事" as const;

interface PostNavigationProps {
  olderPost: PostSummary | null;
  newerPost: PostSummary | null;
}

// 本文の列の末尾に置く前後ナビ。本文との間は 64px (セクションどうしの間隔)。
// 768px 以上は左右 2 列、未満は縦に積む。
//
// 上端の区切り線は border 専用 token (border.subtle)。bg.canvas 上で WCAG 1.4.11
// (Non-text Contrast) の 3:1 を満たす (light 3.49:1 / dark 6.18:1)。
const navStyles = css({
  display: "grid",
  gridTemplateColumns: {
    base: "minmax(0, 1fr)",
    md: "repeat(2, minmax(0, 1fr))",
  },
  columnGap: "gutter",
  rowGap: "3x",
  marginTop: "8x",
  paddingTop: "3x",
  borderTop: "1px solid",
  borderTopColor: "border.subtle",
});

const linkContainerStyles = css({
  minWidth: "0",
});

const linkContainerRightStyles = css({
  md: { textAlign: "right" },
});

const labelStyles = css({
  display: "block",
  textStyle: "std-16n-170",
  // 「前/次の記事」ラベルは記事間の重要な誘導 UI のため fg.secondary を採用 (R-2b 修正)。
  // 当初 fg.muted (補助情報用) を当てていたが、devils-advocate レビュー (Q1) で
  // 「重要な誘導 UI に muted は弱すぎる」と指摘されたため fg.secondary に格上げ。
  // light: cream-50 上 9.59:1 AAA / dark: sumi-950 上 14.84:1 AAA を確保。
  color: "fg.secondary",
});

// 記事タイトル。リンクであることを色と下線の両方で示す (長いタイトルは折り返す)。
const titleStyles = css({
  display: "block",
  textStyle: "std-16b-170",
  color: "accent.link",
  textDecoration: "underline",
  textDecorationThickness: "1px",
  textUnderlineOffset: "0.2em",
});

export const PostNavigation = memo(
  ({ olderPost, newerPost }: PostNavigationProps) => {
    if (!olderPost && !newerPost) {
      return null;
    }

    return (
      <nav
        className={navStyles}
        aria-label="前後の記事"
        data-token-border="border.subtle"
      >
        <div className={linkContainerStyles}>
          {olderPost && (
            // viewTransition=true で記事 → 記事の遷移時にも Hero morph
            // (前/次記事タイトル → 詳細 H1) が動作する (Issue #397 / 推奨 6)。
            <Link
              to={`/posts/${olderPost.id}`}
              variant="card"
              viewTransition={true}
            >
              <span className={labelStyles}>
                {/* Issue #708: 矢印は aria-hidden な装飾要素として分離。
                    labelStyles は display:block で gap が無いため、矢印と
                    テキストの間隔は明示の半角スペース {" "} で従来の見た目を保つ。 */}
                <span aria-hidden="true">{PREV_POST_ARROW}</span>{" "}
                {PREV_POST_LABEL}
              </span>
              <span className={titleStyles}>{olderPost.title}</span>
            </Link>
          )}
        </div>
        <div className={`${linkContainerStyles} ${linkContainerRightStyles}`}>
          {newerPost && (
            <Link
              to={`/posts/${newerPost.id}`}
              variant="card"
              viewTransition={true}
            >
              <span className={labelStyles}>
                {/* Issue #708: 「次の記事」は末尾に矢印「→」を置く。
                    aria-hidden で SR から隠し、明示の半角スペース {" "} で
                    テキストと矢印の間隔を保つ。 */}
                {NEXT_POST_LABEL}{" "}
                <span aria-hidden="true">{NEXT_POST_ARROW}</span>
              </span>
              <span className={titleStyles}>{newerPost.title}</span>
            </Link>
          )}
        </div>
      </nav>
    );
  },
);

PostNavigation.displayName = "PostNavigation";
