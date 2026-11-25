import { memo, useId } from "react";
import { SITE_NAME } from "../../lib/i18nLiterals";
import type { PostSummary } from "../../lib/markdown";
import type { ResurfacedEntry } from "../../lib/resurface";
import {
  pageContainerStyles,
  pageMainStyles,
  sectionLabelStyles,
  sectionStackStyles,
} from "../../styles/layout";
import { FileText } from "../atoms/icons";
import { PostRow } from "../atoms/PostRow";
import { EmptyState } from "../common/EmptyState";
import { Pagination } from "../common/Pagination";
import { Resurface } from "../common/Resurface";

/**
 * HomePage の表示文言定数 (Issue #694)。
 *
 * Issue #630 のロードマップに沿って、表示文言を JSX 直書きからファイル内
 * トップレベル定数に外出しする。PR #627 (Anchor 系) と同じ方針で、リテラル
 * 定数には `as const` を付与して literal type を温存する。
 */
const HOMEPAGE_EMPTY_STATE_TITLE = "新しい記事をお楽しみに" as const;
const HOMEPAGE_EMPTY_STATE_DESCRIPTION =
  "まもなく素晴らしい記事が公開される予定です。創造性に満ちたコンテンツをお届けします。" as const;
const HOMEPAGE_LATEST_HEADING = "最新の記事" as const;
const HOMEPAGE_LIST_HEADING = "記事一覧" as const;

/** 「記事一覧」のうち、抜粋つきで出す行の数。これより後ろはタイトルだけの行にする */
const EXCERPT_ROW_COUNT = 6;

/**
 * `/` ルートの Document Metadata 文言 (React 19 ネイティブ metadata)。
 *
 * トップページは `${SITE_NAME}` のみのシンプルな title とする (記事一覧の
 * ハブであり個別の主題を持たないため)。description はサイト全体の説明を
 * `index.html` の静的 `<meta>` と揃える。これらは単一ファイルで完結する
 * 文言なので、ファイル内 `as const` 定数に閉じる (CLAUDE.md i18nLiterals 基準)。
 */
const HOMEPAGE_META_TITLE = SITE_NAME;
const HOMEPAGE_META_DESCRIPTION =
  "Lazy Note - シンプルで読みやすいブログプラットフォーム。日々の思考やアイデアを気軽に記録・共有できます。" as const;

/**
 * `/` ルートの Document Metadata (React 19 ネイティブ metadata)。
 *
 * 設計上の caveat (タスク指示):
 * - **1 ルート 1 タイトル**: 本ページが描画する `<title>` はこの 1 つのみ。
 *   `<Routes>` は同時に 1 ルートしかマウントしないため、React ツリー上は常に
 *   1 ページ分の `<title>` しか存在しない (= 複数 `<title>` が同時に hoist
 *   されない)。本コンポーネントは EmptyState 分岐でも通常分岐でも
 *   この共通フラグメントを最上位に 1 度だけ描画する。
 * - **title はテンプレートリテラル 1 文字列**: React 19 の `<title>` は単一の
 *   テキスト子のみを許容する (配列 / 複数ノードは警告)。本ページは
 *   `HOMEPAGE_META_TITLE` (= `SITE_NAME`) の 1 文字列を直接渡す。
 * - **静的フォールバック**: `index.html` の `<title>Lazy Note</title>` は初期
 *   描画 (JS 評価前 / loading 中) のフォールバックとして残す。React マウント後
 *   は本フラグメントが `<head>` を上書きする。
 *
 * `og:*` はトップページの共有時カードのために最小限 (title / description /
 * type) を添える。`og:site_name` も `SITE_NAME` を参照する。
 */
const HomePageMetadata = () => (
  <>
    <title>{HOMEPAGE_META_TITLE}</title>
    <meta name="description" content={HOMEPAGE_META_DESCRIPTION} />
    <meta property="og:title" content={HOMEPAGE_META_TITLE} />
    <meta property="og:description" content={HOMEPAGE_META_DESCRIPTION} />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content={SITE_NAME} />
  </>
);

interface HomePageProps {
  posts: PostSummary[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /**
   * Resurface (Issue #492 / N-5) の浮上対象エントリ。
   *
   * 算出は呼び出し側 (`pages/index.tsx`) で `selectResurfaced` により行い、
   * 結果を props として受け取ることで HomePage は純粋にレンダリングに専念する。
   * null のとき Resurface セクションは描画されない (スロット非表示)。
   * 既定 null (= 後方互換: 既存テストは影響を受けない)。
   */
  resurfaceEntry?: ResurfacedEntry | null;
  /**
   * Resurface の表示 OFF フラグ (撤退可能性 / Issue #492 AC)。
   *
   * Anchor 企画の「いつでも黙らせられる」要件のため、Resurface を独立に OFF
   * できる。既定 true (= 通常表示)。
   */
  showResurface?: boolean;
}

/**
 * ホームページ。記事を 1 記事 1 行の一覧で並べる。
 *
 * 行の高さは中身で決まるので、記事の件数や文章量が変わっても空白ができない
 * (以前のカードのグリッドは枠の高さが先に決まり、短い記事で枠の中が空いていた)。
 *
 * 構成 (上から):
 * - 最新の記事: 1 ページ目の先頭 1 件。タイトルを大きくし抜粋を 3 行まで出す
 * - 記事一覧: 残りの記事。先頭 6 件は抜粋つき、それ以降はタイトルだけの行
 * - 過去の記事: Resurface (1 ページ目のみ。該当が無ければ出さない)
 *
 * 2 ページ目以降の先頭は「最新」ではないので、「最新の記事」を出さず全件を
 * 記事一覧に並べる。
 *
 * 見出し階層はセクションの見出しが h2、記事タイトルが h3。
 */
export const HomePage = memo(
  ({
    posts,
    currentPage,
    totalPages,
    onPageChange,
    resurfaceEntry = null,
    showResurface = true,
  }: HomePageProps) => {
    // セクション見出しの動的 ID (React 19 useId)。静的 id の重複を避け、
    // section の aria-labelledby と見出しを紐付ける。
    // 早期 return (posts.length === 0) より前で呼び、Rules of Hooks を守る。
    const latestHeadingId = useId();
    const listHeadingId = useId();

    if (posts.length === 0) {
      return (
        <div className={pageContainerStyles}>
          {/* Document Metadata は EmptyState 分岐でも同一文言を 1 度だけ描画する
              (= ルートとして常に 1 つの <title> を保証する)。 */}
          <HomePageMetadata />
          <EmptyState
            icon={FileText}
            title={HOMEPAGE_EMPTY_STATE_TITLE}
            description={HOMEPAGE_EMPTY_STATE_DESCRIPTION}
          />
        </div>
      );
    }

    const lead = currentPage === 1 ? posts[0] : undefined;
    const listPosts = lead ? posts.slice(1) : posts;

    return (
      <div className={`${pageContainerStyles} ${pageMainStyles}`}>
        {/* React 19 ネイティブ Document Metadata。<head> へ hoist される。
            本ページが描画する <title> はこの 1 つだけ (1 ルート 1 タイトル)。 */}
        <HomePageMetadata />
        <div className={sectionStackStyles}>
          {lead && (
            <section aria-labelledby={latestHeadingId}>
              <h2 id={latestHeadingId} className={sectionLabelStyles}>
                {HOMEPAGE_LATEST_HEADING}
              </h2>
              <PostRow post={lead} variant="lead" />
            </section>
          )}

          {listPosts.length > 0 && (
            <section aria-labelledby={listHeadingId}>
              <h2 id={listHeadingId} className={sectionLabelStyles}>
                {HOMEPAGE_LIST_HEADING}
              </h2>
              <ul>
                {listPosts.map((post, index) => (
                  <PostRow
                    key={post.id}
                    post={post}
                    as="li"
                    variant={index < EXCERPT_ROW_COUNT ? "default" : "compact"}
                  />
                ))}
              </ul>
            </section>
          )}

          {/* Resurface: Anchor 顔3「再浮上」(Issue #492 / N-5)。
              新着の下に独立したセクションで置き、過去記事を 1 件浮上させる。
              - currentPage === 1 のときのみ表示する。
              - resurfaceEntry===null または showResurface===false で非表示
                (Resurface コンポーネント側で early return)。 */}
          {currentPage === 1 && (
            <Resurface entry={resurfaceEntry} show={showResurface} />
          )}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>
    );
  },
);

HomePage.displayName = "HomePage";
