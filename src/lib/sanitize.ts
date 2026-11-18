import DOMPurify from "dompurify";

/**
 * 投稿本文 (Markdown を marked で HTML 化したもの) を DOMPurify でサニタイズする
 * ラッパー関数。
 *
 * 本プロジェクトでは、コードブロックに「コピー」ボタン (`<button class="copy-btn">`)
 * を埋め込むため、DOMPurify の既定許可タグに加えて以下を許可している。
 *
 * - `ADD_TAGS: ["button"]` … コピー UI に使用する button タグを保持する
 *
 * この追加許可は `PostDetailPage` で必要となる最小限の拡張であり、
 * `onclick` などのイベントハンドラ属性は DOMPurify が既定で除去するため、
 * button が許可された状態でも XSS 経路は開かない。
 *
 * コピー対象のコードは属性に持たせず、`useCodeBlockCopy.ts` が同じ
 * `.code-block-wrapper` 内の `<code>` の textContent を読む。
 *
 * 設定の drift を防ぐため、本番コードでの DOMPurify 呼び出しは必ずこの関数を
 * 経由すること (インラインで `DOMPurify.sanitize(..., { ADD_TAGS })` を書かない)。
 *
 * @param html サニタイズ対象の HTML 文字列 (通常 marked が生成した文字列)
 * @returns 安全な HTML 文字列
 */
export const sanitizePostHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ["button"],
  });
};
