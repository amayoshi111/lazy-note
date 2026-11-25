import { type CSSProperties, useRef } from "react";
import { css } from "../../../styled-system/css";
import { useCodeBlockCopy } from "../../hooks/useCodeBlockCopy";
import { useImageLightbox } from "../../hooks/useImageLightbox";
import { inferPublishedAt, type Milestone } from "../../lib/anchors";
import { SITE_NAME, UNTITLED_POST } from "../../lib/i18nLiterals";
import type { Post, PostSummary } from "../../lib/markdown";
import { sanitizePostHtml } from "../../lib/sanitize";
import { buildPostHeroTransitionName } from "../../lib/viewTransition";
import {
  gridStyles,
  leftColumnStyles,
  pageContainerStyles,
  pageMainStyles,
} from "../../styles/layout";
import { Link } from "../atoms/Link";
import { Coordinate } from "../common/Coordinate";
import { ImageLightbox } from "../common/ImageLightbox";
import { MetaInfo } from "../common/MetaInfo";
import { PostNavigation } from "../common/PostNavigation";
import { TableOfContents } from "../common/TableOfContents";

// Issue #695: 表示文言テンプレートを定数として外出し。将来の i18n 化や
// 文言調整の影響範囲をファイル内 1 箇所に局所化する。
// (i18n フレームワークは導入しない方針 — 単純な template リテラルに留める)
//
// Issue #708: 矢印「←」をテキストから分離し、JSX 側で
// `<span aria-hidden="true">{矢印}</span>` の装飾要素として描画する。
// - 矢印を aria-hidden にすることで SR のアクセシブル名から外れる。
// - 矢印を構造的に分離することが将来の i18n / RTL 対応の土台になる
//   (実際の `[dir=rtl]` 反転 CSS は RTL 要件発生時まで先送り = YAGNI)。
// 矢印は SVG / アイコンフォントではなく純粋な glyph のため BackToTop に倣い
// `ICON` ではなく `ARROW` と命名する。
//
// 「統一」したのは処理パターン (矢印を aria-hidden 分離する扱い) であって、
// コードの共通化 (共有コンポーネント化 / 定数集約) はしない。矢印
// `←`/`→`/`↑` は aria-hidden の装飾文字であり、装飾文字は i18nLiterals.ts へ
// 集約せずファイル内の局所定数にする方針 (参照実装 BackToTop も同じ)。
const POST_DETAIL_NAV_ARIA_LABEL = "ページナビゲーション" as const;
const POST_DETAIL_BACK_TO_TOP_ARROW = "←" as const;
const POST_DETAIL_BACK_TO_TOP_TEXT = "TOPに戻る" as const;

/**
 * `/posts/:timestamp` ルートの `<title>` を組み立てる純粋関数
 * (React 19 ネイティブ metadata)。
 *
 * 設計上の caveat (タスク指示):
 * - **title はテンプレートリテラル 1 文字列**: `${記事タイトル} | ${SITE_NAME}`
 *   を 1 本のテンプレートリテラルとして返す。React 19 の `<title>` は単一の
 *   テキスト子しか許容しないため、`{post.title}` と区切り文字を別ノードに
 *   分けず 1 文字列に連結する。
 * - **未設定タイトルのフォールバック**: `post.title` が空文字のときは
 *   `UNTITLED_POST` (= 本文表示の H1 と同じフォールバック) を採用し、
 *   `<title>` も `無題の記事 | Lazy Note` と揃える。
 *
 * ※ ロード前 / 記事未検出時の `<title>` は本コンポーネントではなく呼び出し側
 *   (`src/pages/posts/Post.tsx`) が担う (PostDetailPage は post が解決した後に
 *   のみマウントされるため)。
 */
const buildPostDetailTitle = (title: string): string =>
  `${title || UNTITLED_POST} | ${SITE_NAME}`;

/**
 * `/posts/:timestamp` ルートの Document Metadata (React 19 ネイティブ metadata)。
 *
 * - title: `${記事タイトル} | Lazy Note` (`buildPostDetailTitle`)。
 * - description: 記事の `excerpt` (抜粋) を使う。空のときは `<meta>` 自体を
 *   出さない (空 description はクローラに無意味なため)。
 * - og:type は記事ページなので `article`。og:title / og:description は
 *   `<title>` / description と揃える。og:site_name は `SITE_NAME`。
 *
 * **1 ルート 1 タイトル**: 本ページが描画する `<title>` はこの 1 つのみ。
 * `<Routes>` は同時に 1 ルートしかマウントしないため、React ツリー上は
 * 常に 1 ページ分の `<title>` しか存在しない。
 */
const PostDetailMetadata = ({ post }: { post: Post }) => {
  const title = buildPostDetailTitle(post.title);
  const description = post.excerpt;
  return (
    <>
      <title>{title}</title>
      {description ? <meta name="description" content={description} /> : null}
      <meta property="og:title" content={title} />
      {description ? (
        <meta property="og:description" content={description} />
      ) : null}
      <meta property="og:type" content="article" />
      <meta property="og:site_name" content={SITE_NAME} />
    </>
  );
};

/*
 * レイアウト (デジタル庁デザインシステムのレイアウト規定に沿う 12 カラム):
 *
 *   1024px 以上
 *   | 戻るリンク (2) | タイトル・メタ情報 (10)          |
 *   |               | 本文 (7 = 640px)     | 目次 (3) |
 *
 *   1024px 未満は 1 カラムで、戻るリンク → タイトル・メタ情報 → 目次 → 本文 の順。
 *   (768〜1023px では 3 列に分けるとカラムが細すぎるため。src/styles/layout.ts 参照)
 *
 * - 本文は 7 カラム (640px)。16px の文字で全角約 39 字になり、同システムの目安
 *   (全角 40 字程度) に収まる。1 カラムに積んだときも 640px までに抑える
 * - 戻るリンクとタイトルは 1 行目のベースラインで揃える
 * - article は外側の 12 カラムのうち 3〜12 カラム目を使い、内側は subgrid で同じ
 *   カラム線に乗せる (subgrid 非対応の環境では 1 カラムに積まれるだけで崩れない)
 */

// 外側のグリッド。戻るリンクと article を並べる。
const pageGridStyles = css({
  rowGap: "3x",
  alignItems: "baseline",
});

// article (3〜12 カラム目)。内側のタイトル / 目次 / 本文を同じカラム線に乗せる。
const articleStyles = css({
  minWidth: 0,
  display: "grid",
  gridTemplateColumns: { base: "minmax(0, 1fr)", lg: "subgrid" },
  rowGap: { base: "3x", lg: "5x" },
  lg: { gridColumn: "3 / span 10" },
});

const headerStyles = css({
  minWidth: 0,
  lg: { gridColumn: "1 / -1" },
});

const titleStyles = css({
  textStyle: { base: "std-28b-150", md: "std-36b-140" },
  color: "fg.primary",
  marginBottom: "2x",
});

// 目次。1024px 以上では本文の右 (3 カラム) に置き、スクロールに追従させる。
// 1 カラムに積んだときは本文と同じ幅 (640px まで) に揃える。
const tocColumnStyles = css({
  minWidth: 0,
  maxWidth: "measure",
  lg: {
    gridColumn: "8 / span 3",
    gridRow: "2",
    alignSelf: "start",
    position: "sticky",
    top: "3x",
  },
});

// 本文の列 (7 カラム)。前後の記事へのリンクもこの列に置く。
const bodyColumnStyles = css({
  minWidth: 0,
  maxWidth: "measure",
  lg: { gridColumn: "1 / span 7", gridRow: "2" },
});

/*
 * 本文 (Markdown から生成した HTML) のスタイル。
 *
 * 余白は基準単位 8px の 5 段階だけを使う:
 * - ブロックどうし (段落・リスト・引用・表・コードなど) は 40px。同システムの
 *   「段落の間はフォントサイズの 2.25 倍以上」(16px なら 36px 以上) を満たす
 * - 見出しの上は 64px、見出しの下は階層が深いほど狭く (h2: 24px / h3: 16px / h4: 8px)
 * - リストの項目どうしは 8px
 *
 * 出典: https://design.digital.go.jp/dads/foundations/typography/accessibility/
 *       https://design.digital.go.jp/dads/foundations/spacing/
 *
 * 生成された HTML は内側の div の直下に並ぶので、ブロックの間隔は
 * 「& > div > 隣接する要素」に付ける (リストの中のリストなどには波及させない)。
 */
const proseStyles = css({
  textStyle: "std-16n-170",
  color: "fg.primary",

  "& > div > * + *": { marginTop: "5x" },
  "& > div > h1, & > div > h2, & > div > h3": { marginTop: "8x" },
  "& > div > h1 + *, & > div > h2 + *": { marginTop: "3x" },
  "& > div > h3 + *": { marginTop: "2x" },
  "& > div > h4 + *": { marginTop: "1x" },
  // 見出しが続くとき (h2 の直後の h3 など) は、上の見出しの下の余白を優先する。
  "& > div > h2 + h3": { marginTop: "3x" },
  "& > div > h3 + h4": { marginTop: "2x" },

  "& h1, & h2": { textStyle: "std-24b-150", color: "fg.primary" },
  "& h3": { textStyle: "std-20b-150", color: "fg.primary" },
  "& h4": { textStyle: "std-16b-170", color: "fg.primary" },

  "& strong": { fontWeight: "700" },

  // リスト。Panda の reset が消したマーカーと字下げを本文の中だけ戻す。
  "& ul, & ol": { paddingLeft: "3x" },
  "& ul": { listStyleType: "disc" },
  "& ol": { listStyleType: "decimal" },
  "& li + li, & li > ul, & li > ol": { marginTop: "1x" },

  // 引用。左の線は border 専用 token。
  "& blockquote": {
    paddingLeft: "3x",
    borderLeft: "2px solid",
    borderLeftColor: "border.subtle",
    color: "fg.secondary",
  },
  "& blockquote > * + *": { marginTop: "2x" },

  // 定義リスト (GFM)。
  "& dt": { fontWeight: "700" },
  "& dd": { marginLeft: "3x" },
  "& dd + dt": { marginTop: "2x" },

  "& figcaption": {
    color: "fg.secondary",
    textAlign: "center",
    marginTop: "1x",
  },

  // 区切り線 (GFM <hr>)。bg.canvas 上で WCAG 1.4.11 の 3:1 を満たす。
  "& hr": {
    border: "none",
    borderTop: "1px solid",
    borderTopColor: "border.subtle",
  },

  // 表 (GFM)。内容が広い場合は表の中だけ横スクロールさせる。
  // display: block にすることで幅の上限が効く。
  "& table": {
    display: "block",
    maxWidth: "100%",
    overflowX: "auto",
    borderCollapse: "collapse",
  },
  "& th, & td": {
    border: "1px solid",
    borderColor: "border.subtle",
    paddingY: "1x",
    paddingX: "2x",
    textAlign: "left",
  },
  "& th": {
    background: "bg.muted",
    fontWeight: "700",
  },

  // リンク: 本文のリンクは常に下線を付ける (WCAG 1.4.1。色だけに依存しない)。
  // hover では下線を太くする。
  "& a": {
    color: "accent.link",
    textDecoration: "underline",
    textDecorationThickness: "1px",
    textUnderlineOffset: "0.2em",
    "&:hover": {
      textDecorationThickness: "2px",
    },
  },

  // コード。配色は従来のコードブロック用 token を使う。
  "& code": {
    textStyle: "mono-16n-150",
    background: "bg.codeInline",
    color: "fg.code",
    paddingX: "1x",
    borderRadius: "sm",
  },
  "& pre": {
    textStyle: "mono-16n-150",
    background: "bg.code",
    color: "fg.code",
    padding: "3x",
    borderRadius: "md",
    overflow: "auto",
  },
  // コードブロックの中の code には、インラインコード用の背景と余白を付けない。
  "& pre code": {
    background: "transparent",
    padding: "0",
  },

  "& img": {
    maxWidth: "100%",
    height: "auto",
    borderRadius: "sm",
    display: "block",
    cursor: "zoom-in",
  },
});

interface PostDetailPageProps {
  post: Post;
  olderPost: PostSummary | null;
  newerPost: PostSummary | null;
  /**
   * Coordinate (Issue #491 / Anchor の3つの顔のひとつ「座標」) 用節目データ。
   *
   * 親 (`pages/posts/Post.tsx`) で `datasources/milestones.json` を JSON
   * import して渡す。本コンポーネントは `inferPublishedAt(post.id)` で
   * publishedAt を逆算し、Coordinate に渡す純粋な中継を行う。
   *
   * Issue #533 で required 化。「Post.tsx 以外の経路で PostDetailPage を呼んだ際、
   * `milestones` を渡し忘れると無音で Coordinate が消える」という UX バグを
   * 型エラーで検知するため optional から required に変更した。空配列を渡す
   * ことで Coordinate を非表示にできる (Coordinate 内部で early return)。
   */
  milestones: readonly Milestone[];
  /**
   * Coordinate の表示 OFF フラグ (撤退可能性 / epic #487)。
   *
   * Anchor 企画は「いつでも黙らせられる」設計要件。Resurface と同じ命名
   * (`show*` 親側変数 + 子側 `show` prop) で揃える。
   *
   * Issue #533: 本フラグは「明示的に OFF にしたいとき専用」のスイッチで、
   * 既定 true (= 通常時は何も指定せず Coordinate を描画する) として扱う。
   */
  showCoordinate?: boolean;
}

export const PostDetailPage = ({
  post,
  olderPost,
  newerPost,
  milestones,
  showCoordinate = true,
}: PostDetailPageProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  useCodeBlockCopy(contentRef);
  const { isOpen, imageSrc, imageAlt, close } = useImageLightbox(contentRef);

  // Hero morph (Issue #397): 記事詳細の H1 に `view-transition-name: post-{id}`
  // を付与する。一覧の行 (PostRow) のタイトルと同じ name にすることで、SPA 遷移時に
  // ブラウザが H1 へ morph する。VT 未対応 / reduced motion 時はこの style が
  // あってもアニメーションは発火しない (CSS 側のメディアクエリで disable される)。
  const heroNameStyle: CSSProperties = {
    viewTransitionName: buildPostHeroTransitionName(String(post.id)),
  };

  // Coordinate (Issue #491): post.id (= ファイル名 YYYYMMDDhhmmss) から
  // publishedAt を ISO 8601 (JST +09:00) として逆算する。タイムスタンプ形式に
  // 適合しない id (例: テスト用 "test-post") の場合は undefined となり、Coordinate
  // は何も描画しない (= 撤退可能性の一形態として無害な早期 return が成立する)。
  const publishedAt = inferPublishedAt(post.id);

  return (
    <div className={`${pageContainerStyles} ${pageMainStyles}`}>
      {/* React 19 ネイティブ Document Metadata。<head> へ hoist される。
          本ページが描画する <title> はこの 1 つだけ (1 ルート 1 タイトル)。 */}
      <PostDetailMetadata post={post} />

      <div className={`${gridStyles} ${pageGridStyles}`}>
        <nav
          aria-label={POST_DETAIL_NAV_ARIA_LABEL}
          className={leftColumnStyles}
        >
          <Link to="/" variant="navigation">
            {/* Issue #708: 矢印は aria-hidden な装飾要素として分離し、
                アクセシブル名はテキスト「TOPに戻る」のみにする。 */}
            <span aria-hidden="true">{POST_DETAIL_BACK_TO_TOP_ARROW}</span>
            {POST_DETAIL_BACK_TO_TOP_TEXT}
          </Link>
        </nav>

        <article className={articleStyles}>
          <header className={headerStyles}>
            <h1 className={titleStyles} style={heroNameStyle}>
              {post.title || UNTITLED_POST}
            </h1>

            <MetaInfo
              createdAt={post.createdAt}
              updatedAt={post.updatedAt}
              author={post.author}
              readingTimeMinutes={post.readingTimeMinutes}
            />
            {/*
             * Coordinate (Issue #491 / Anchor の3つの顔のひとつ「座標」):
             * メタ情報の直下に「{label} から N 日目」を静かに一行で添える。
             * publishedAt 推定不可・座標 0 件・milestones 空・showCoordinate=false の
             * いずれかで何も描画しない (Coordinate 内部で early return)。
             */}
            {publishedAt !== undefined && (
              <Coordinate
                publishedAt={publishedAt}
                milestones={milestones}
                show={showCoordinate}
              />
            )}
          </header>

          {/*
           * 目次は本文のスタイル (下の data-prose-scope の中の "& ul" など) の影響を
           * 受けないよう、本文コンテナの外に置く (Issue #391)。
           * 項目が無い記事では置き場所ごと描画しない (空の行を作らない)。
           */}
          {post.toc.length > 0 && (
            <div className={tocColumnStyles}>
              <TableOfContents toc={post.toc} />
            </div>
          )}

          <div className={bodyColumnStyles}>
            {/*
             * 本文コンテナ。本文用のスタイルを当てる範囲であることを
             * `data-prose-scope` 意味属性で宣言し、テストはこの属性で検証する
             * (Issue #480: class 名の文字列に依存しない)。
             */}
            <div
              ref={contentRef}
              data-prose-scope="article-content"
              className={proseStyles}
            >
              <div
                // biome-ignore lint/security/noDangerouslySetInnerHtml: MarkdownをHTMLとして表示するために必要。sanitizePostHtml (DOMPurify) でサニタイズ済み
                dangerouslySetInnerHTML={{
                  __html: sanitizePostHtml(post.content),
                }}
              />
            </div>
            <PostNavigation olderPost={olderPost} newerPost={newerPost} />
          </div>
        </article>
      </div>

      <ImageLightbox
        isOpen={isOpen}
        imageSrc={imageSrc}
        imageAlt={imageAlt}
        onClose={close}
      />
    </div>
  );
};
