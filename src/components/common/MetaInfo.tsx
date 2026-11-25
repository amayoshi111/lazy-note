import { memo } from "react";
import { css } from "../../../styled-system/css";
import {
  AUTHOR_FALLBACK,
  buildReadingTimeLabel,
  DATE_FALLBACK,
} from "../../lib/i18nLiterals";
import { isUpdatedAfterCreated } from "../../lib/postDate";

interface MetaInfoProps {
  createdAt?: string;
  author?: string;
  readingTimeMinutes?: number;
  /**
   * 加筆日時の表示文字列 (`YYYY/MM/DD HH:MM` 等)。
   *
   * Issue #809: `createdAt` より厳密に新しい場合のみ「更新: <日時>」行を
   * 追加する。新旧判定は #808 の `isUpdatedAfterCreated` に委譲する。
   */
  updatedAt?: string;
}

// 表示文言。単一ファイルで完結する文言のため、ファイル内ローカル定数に留める
// (Issue #534 / #630 方針)。
const CREATED_AT_LABEL = "投稿" as const;
const AUTHOR_LABEL = "筆者" as const;
const UPDATED_AT_LABEL_TEMPLATE = (value: string): string => `更新: ${value}`;

// 項目を横に並べ、幅が足りなければ折り返す。項目どうしは 16px。
const containerStyles = css({
  display: "flex",
  flexWrap: "wrap",
  columnGap: "2x",
  textStyle: "std-16n-170",
  color: "fg.primary",
  fontVariantNumeric: "tabular-nums",
});

// ラベルと値は 8px (ひとまとまりの中の間隔)。
const itemStyles = css({
  display: "flex",
  columnGap: "1x",
});

// ラベルは fg.secondary (bg.canvas 上で AAA: light 9.59:1 / dark 14.84:1)。
const labelStyles = css({
  color: "fg.secondary",
});

/**
 * 記事詳細のタイトルの下に置くメタ情報 (投稿日時 / 筆者 / 読了時間 / 更新日時)。
 *
 * - 日時と筆者には文字のラベル (「投稿」「筆者」) を付ける。アイコンだけで意味を
 *   示すのをやめ、読み上げでも見た目でも同じ内容が伝わるようにする
 * - 一覧の行 (PostRow) は日付と著者・読了時間を自前で配置するので、本コンポーネントは
 *   記事詳細だけで使う
 */
export const MetaInfo = memo(
  ({ createdAt, author, readingTimeMinutes, updatedAt }: MetaInfoProps) => {
    return (
      <div className={containerStyles}>
        <p className={itemStyles}>
          <span className={labelStyles}>{CREATED_AT_LABEL}</span>
          <span>{createdAt || DATE_FALLBACK}</span>
        </p>
        <p className={itemStyles}>
          <span className={labelStyles}>{AUTHOR_LABEL}</span>
          <span>{author || AUTHOR_FALLBACK}</span>
        </p>
        {readingTimeMinutes !== undefined && (
          <p className={itemStyles}>
            {buildReadingTimeLabel(readingTimeMinutes)}
          </p>
        )}
        {/*
          Issue #809: updatedAt が createdAt より厳密に新しいときだけ加筆日時行を
          追加する。新旧判定は #808 の `isUpdatedAfterCreated` に委譲する。
          空文字 (`updatedAt=""`) のとき React が空テキストノードを残さないよう
          `!!updatedAt` で真偽値化してから条件評価する。
          行の種別は構造属性 `data-meta-field="updated"` で示す。
        */}
        {!!updatedAt && isUpdatedAfterCreated(createdAt ?? "", updatedAt) && (
          <p className={itemStyles} data-meta-field="updated">
            {UPDATED_AT_LABEL_TEMPLATE(updatedAt)}
          </p>
        )}
      </div>
    );
  },
);

MetaInfo.displayName = "MetaInfo";
