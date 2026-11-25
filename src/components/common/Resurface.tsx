import { memo, useId } from "react";
import type { ResurfacedEntry, ResurfaceReason } from "../../lib/resurface";
import { sectionLabelStyles } from "../../styles/layout";
import { PostRow } from "../atoms/PostRow";

interface ResurfaceProps {
  /**
   * 浮上対象の記事と理由。null のとき何も描画しない (スロット非表示)。
   *
   * 算出は `selectResurfaced` (`src/lib/resurface.ts`) を使う。HomePage 側で
   * 算出して prop として渡すことで、コンポーネントを純粋に保つ。
   */
  entry: ResurfacedEntry | null;
  /**
   * 表示 OFF フラグ (撤退可能性 / Issue #492 AC)。
   *
   * Anchor 企画は「いつでも黙らせられる」ことを設計要件とする。Resurface を
   * 独立に OFF にできるよう、entry が非 null でも show=false なら描画しない。
   * 既定 true。
   */
  show?: boolean;
}

/**
 * Resurface — Anchor の3つの顔のひとつ「再浮上」(Issue #492 / epic #487)。
 *
 * HomePage の新着 (最新の記事 / 記事一覧) の **下** に独立したセクションを設け、
 * 過去記事を 1 件浮上させる。優先順位は (1) 沈黙トリガー (2) 暦の節目
 * (3) 座標上の意味 (節目記念日) の順で `selectResurfaced` が選定する。
 *
 * 設計の核 (epic #487 / Issue #492):
 * - **投稿頻度・投稿間隔の数値は一切表示しない** (Pulse を切った思想を厳守)。
 *   そのため一覧の行 (PostRow) の日付・読了時間は出さず、代わりに文脈ラベル
 *   ("1 年前のあなたの声" / "もう一度" / "1 年前の今日" /
 *   "{label}から 1 年経った日") を左の列へ置く
 * - 該当記事が無いとき (entry===null) はセクションごと非表示にして空欄を作らない
 * - 新着とは見出しと aria-label="過去の記事" で意味的に分離する
 * - 行の見た目は記事一覧と同じ PostRow を使う (Hero morph も同じ)
 *
 * 撤退可能性:
 * - `show=false` で個別に OFF にできる
 * - entry===null (= 該当記事なし) なら自動で非表示
 * - milestones.json を空にすれば座標が消えて節目記念日も発火しなくなる
 *
 * View Transition の名前 (`post-{id}`) は同じページ内で重複できない。呼び出し側
 * (`pages/index.tsx`) が `selectResurfaced(..., { excludeIds })` で、現在ページに
 * 表示中の記事を候補から外すことで衝突を避けている。
 */

// Issue #534: 表示文言テンプレート / 固定文言を定数として外出し。将来の i18n
// 化や文言調整の影響範囲をファイル内 1 箇所に局所化する。
const RESURFACE_SECTION_HEADING = "過去の記事" as const;
const RESURFACE_SECTION_ARIA_LABEL = "過去の記事" as const;
const RESURFACE_REASON_LABEL_SILENCE_YEAR_AGO = "1 年前のあなたの声" as const;
const RESURFACE_REASON_LABEL_SILENCE_OLDEST = "もう一度" as const;
const RESURFACE_REASON_LABEL_CALENDAR_TEMPLATE = (yearsAgo: number): string =>
  `${yearsAgo} 年前の今日`;
const RESURFACE_REASON_LABEL_MILESTONE_ANNIVERSARY_TEMPLATE = (
  label: string,
  yearsSinceMilestone: number,
): string => `${label}から ${yearsSinceMilestone} 年経った日`;

/**
 * reason に応じた文脈ラベル文字列を返す純粋関数。
 *
 * - Issue #492: 投稿頻度・間隔の数値は出さない。年単位のラベルのみ。
 * - silence/yearAgo は「1 年前のあなたの声」(過去の自分の声を差し出す表現)
 * - silence/oldest は「もう一度」(沈黙からの復帰時に最古記事を浮上)
 * - calendar は「N 年前の今日」(暦の偶然)
 * - milestoneAnniversary は「{label}から N 年経った日」(座標記念日)
 */
const buildReasonLabel = (reason: ResurfaceReason): string => {
  switch (reason.kind) {
    case "silence":
      return reason.sub === "yearAgo"
        ? RESURFACE_REASON_LABEL_SILENCE_YEAR_AGO
        : RESURFACE_REASON_LABEL_SILENCE_OLDEST;
    case "calendar":
      return RESURFACE_REASON_LABEL_CALENDAR_TEMPLATE(reason.yearsAgo);
    case "milestoneAnniversary":
      return RESURFACE_REASON_LABEL_MILESTONE_ANNIVERSARY_TEMPLATE(
        reason.label,
        reason.yearsSinceMilestone,
      );
  }
};

/**
 * Resurface コンポーネント本体。
 *
 * entry===null または show===false で何も描画しない (early return)。
 */
export const Resurface = memo(({ entry, show = true }: ResurfaceProps) => {
  // 見出しの動的 ID (React 19 useId)。静的 id の重複を避け、section の
  // aria-labelledby と見出しを紐付ける。
  // 早期 return (!show || entry === null) より前で呼び、Rules of Hooks を守る。
  const headingId = useId();

  if (!show || entry === null) {
    return null;
  }

  return (
    <section
      aria-labelledby={headingId}
      aria-label={RESURFACE_SECTION_ARIA_LABEL}
    >
      <h2 id={headingId} className={sectionLabelStyles}>
        {RESURFACE_SECTION_HEADING}
      </h2>
      <PostRow post={entry.post} label={buildReasonLabel(entry.reason)} />
    </section>
  );
});

Resurface.displayName = "Resurface";
