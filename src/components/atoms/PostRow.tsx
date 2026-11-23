import { type CSSProperties, memo } from "react";
import { css } from "../../../styled-system/css";
import {
  AUTHOR_FALLBACK,
  buildReadingTimeLabel,
  DATE_FALLBACK,
  UNTITLED_POST,
} from "../../lib/i18nLiterals";
import type { PostSummary } from "../../lib/markdown";
import { extractPostDate } from "../../lib/postDate";
import { buildPostHeroTransitionName } from "../../lib/viewTransition";
import { Link } from "./Link";

type PostRowVariant = "lead" | "default" | "compact";

interface PostRowProps {
  post: PostSummary;
  /**
   * 行の種類。
   * - "lead": 最新の記事。タイトルを大きくし、抜粋を 3 行まで出す
   * - "default": 抜粋 (2 行まで) つきの行
   * - "compact": タイトルだけの行
   */
  variant?: PostRowVariant;
  /** 外側の要素。リスト (`ul`) の中では "li" を指定する */
  as?: "article" | "li";
  /**
   * 日付の代わりに左の列へ置く文脈ラベル (例: 「もう一度」)。
   * 指定すると、右の列の著者・読了時間も出さない (「過去の記事」用)。
   */
  label?: string;
}

/**
 * 記事の一覧の 1 行。
 *
 * 行の高さは中身で決まる (グリッドの枠に中身を合わせない)。そのため記事の件数や
 * 文章量が変わっても、行の中に空白は生まれない。
 *
 * - 768px 以上: 12 カラムのうち、左 2 カラムに日付、中央 7 カラムにタイトルと抜粋、
 *   右 3 カラムに著者と読了時間を置く。3 つの先頭行はベースラインで揃える
 * - 768px 未満: 1 行目に日付と著者・読了時間、2 行目にタイトルと抜粋
 * - リンクはタイトルだけを包み、`::after` で行全体へ広げる (アクセシブル名は
 *   タイトルのみ。行のどこを押しても記事へ移動できる)
 * - 上端の区切り線は border 専用 token。"lead" だけは最新の記事の目印として
 *   accent.featured の 2px の線にする
 */

// 行の共通部分。position: relative は行全体に広げたリンク (::after) の基準。
const rowBaseStyles = css({
  position: "relative",
  display: "grid",
  gridTemplateColumns: {
    base: "auto minmax(0, 1fr)",
    md: "repeat(12, minmax(0, 1fr))",
  },
  columnGap: { base: "2x", md: "gutter" },
  rowGap: "1x",
  alignItems: "baseline",
  borderTopStyle: "solid",
});

// 種類ごとの上下の余白と区切り線。
const rowVariantStyles: Record<PostRowVariant, string> = {
  lead: css({
    paddingY: "3x",
    borderTopWidth: "2px",
    borderTopColor: "accent.featured",
  }),
  default: css({
    paddingY: "3x",
    borderTopWidth: "1px",
    borderTopColor: "border.subtle",
  }),
  compact: css({
    paddingY: "2x",
    borderTopWidth: "1px",
    borderTopColor: "border.subtle",
  }),
};

// 区切り線が参照する token (Tripwire テスト用の意味属性の値)。
const rowBorderTokens: Record<PostRowVariant, string> = {
  lead: "accent.featured",
  default: "border.subtle",
  compact: "border.subtle",
};

// 左の列 (日付)。fg.secondary は bg.canvas 上で AAA (light 9.59:1 / dark 14.84:1)。
const dateStyles = css({
  gridColumn: { base: "1", md: "1 / span 2" },
  gridRow: "1",
  textStyle: "std-16n-170",
  color: "fg.secondary",
  fontVariantNumeric: "tabular-nums",
});

// 左の列に文脈ラベルを置くとき。
const labelStyles = css({
  gridColumn: { base: "1 / -1", md: "1 / span 2" },
  gridRow: "1",
  textStyle: "std-16b-170",
  color: "fg.primary",
});

// 中央の列 (タイトルと抜粋)。
const bodyStyles = css({
  gridColumn: { base: "1 / -1", md: "3 / span 7" },
  gridRow: { base: "2", md: "1" },
  minWidth: 0,
});

// 右の列 (著者と読了時間)。
const metaStyles = css({
  gridColumn: { base: "2", md: "10 / span 3" },
  gridRow: "1",
  textStyle: "std-16n-170",
  color: "fg.secondary",
  fontVariantNumeric: "tabular-nums",
});

const titleVariantStyles: Record<PostRowVariant, string> = {
  lead: css({
    textStyle: { base: "std-24b-150", md: "std-32b-150" },
    color: "fg.primary",
  }),
  default: css({ textStyle: "std-20b-150", color: "fg.primary" }),
  compact: css({ textStyle: "std-16b-170", color: "fg.primary" }),
};

// タイトルのリンクを `::after` で行全体へ広げる。hover で下線を出し、
// focus-visible のリングは行全体に乗せる (内側 focus.ring / 外側は背景と対になる色)。
const stretchedLinkStyles = css({
  position: "static",
  "&::after": {
    content: '""',
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  "&:hover": {
    textDecoration: "underline",
    textDecorationThickness: "1px",
    textUnderlineOffset: "0.2em",
  },
  "&:focus-visible::after": {
    borderRadius: "sm",
    boxShadow: {
      _light:
        "0 0 0 2px var(--colors-focus-ring), 0 0 0 4px var(--colors-ink-900)",
      _dark:
        "0 0 0 2px var(--colors-focus-ring), 0 0 0 4px var(--colors-cream-50)",
    },
  },
});

// 抜粋。行数の上限は下の inline style で指定する。
const excerptStyles = css({
  textStyle: "std-16n-170",
  color: "fg.secondary",
  marginTop: "1x",
  overflow: "hidden",
});

// 抜粋を出す種類と、その行数の上限。Panda の style prop は -webkit-box-orient を
// 受け付けないため、行数の上限に必要な 3 プロパティだけ inline style で渡す。
const excerptClampStyles: Partial<Record<PostRowVariant, CSSProperties>> = {
  lead: {
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: 3,
  },
  default: {
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: 2,
  },
};

export const PostRow = memo(
  ({ post, variant = "default", as: Tag = "article", label }: PostRowProps) => {
    // Hero morph (Issue #397): タイトルに `view-transition-name: post-{id}` を付け、
    // 記事詳細 (PostDetailPage) の H1 と morph させる。
    const heroNameStyle: CSSProperties = {
      viewTransitionName: buildPostHeroTransitionName(String(post.id)),
    };
    const excerptClampStyle = excerptClampStyles[variant];

    return (
      <Tag
        className={`${rowBaseStyles} ${rowVariantStyles[variant]}`}
        data-variant={variant}
        data-token-border={rowBorderTokens[variant]}
      >
        {label === undefined ? (
          <p className={dateStyles}>
            {extractPostDate(post.createdAt) || DATE_FALLBACK}
          </p>
        ) : (
          <p className={labelStyles}>{label}</p>
        )}
        <div className={bodyStyles}>
          <h3 className={titleVariantStyles[variant]} style={heroNameStyle}>
            <Link
              to={`/posts/${post.id}`}
              variant="card"
              className={stretchedLinkStyles}
              viewTransition
            >
              {post.title || UNTITLED_POST}
            </Link>
          </h3>
          {excerptClampStyle && post.excerpt && (
            <p className={excerptStyles} style={excerptClampStyle}>
              {post.excerpt}
            </p>
          )}
        </div>
        {label === undefined && (
          <p className={metaStyles}>
            <span>{post.author || AUTHOR_FALLBACK}</span>
            <span aria-hidden="true">・</span>
            <span>{buildReadingTimeLabel(post.readingTimeMinutes)}</span>
          </p>
        )}
      </Tag>
    );
  },
);

PostRow.displayName = "PostRow";
