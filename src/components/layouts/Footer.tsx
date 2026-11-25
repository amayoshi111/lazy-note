import { css } from "../../../styled-system/css";
import { pageContainerStyles } from "../../styles/layout";
import { Link } from "../atoms/Link";
import { BrandName } from "../common/BrandName";

/**
 * `/anchor` (個人史座標ページ) への入口リンク文言 / 遷移先 (Issue #839)。
 *
 * 「サイトの読み方」= 読者を個人史タイムライン (`/anchor`) へ静かに誘導する
 * Calm な導線。ナビ統合により `/anchor` は「運営者向けの補助ページ」から
 * 「読者導線」へ性質が変わる (詳細は docs/ANCHOR.md #545 節)。
 *
 * - アクセシブル名 (= リンクテキスト) は Pulse 思想の禁則語彙
 *   (`src/test/forbiddenVocab.ts`) に該当してはならず、`Footer.test.tsx` で
 *   非該当を担保する。
 * - `Link` atom の `variant="navigation"` (下線なし・`accent.link`) を使う。
 *   `accent.link` は Footer の `bg.canvas` 上で WCAG 1.4.3 AAA を満たす
 *   (light 7.82:1 / dark 8.79:1。検証は scripts/calculateContrast.ts)。
 */
const ANCHOR_NAV_LABEL = "サイトの読み方";
const ANCHOR_PATH = "/anchor";

// 上端の区切り線は border 専用 token (bg.canvas 上で WCAG 1.4.11 の 3:1 を満たす)。
const footerStyles = css({
  background: "bg.canvas",
  color: "fg.secondary",
  borderTop: "1px solid",
  borderTopColor: "border.subtle",
});

const footerInnerStyles = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: "2x",
  paddingTop: "5x",
  // 画面右下に固定した「ページトップへ戻る」ボタン (下端から 24〜68px) より、
  // 右端のリンクを上に出すため、下だけ 64px 取る (768px 以上でリンクが右端に来る)。
  paddingBottom: "8x",
});

// 著作権表記は付随情報のため 14px (Dns-14N-130) と fg.muted を使う。
// bg.canvas 上で WCAG 1.4.3 AA (4.5:1) を満たす (実測 light 6.54:1 / dark 14.84:1。
// light は AAA 7:1 未達のため補助情報専用で本文転用は不可)。
const copyrightStyles = css({
  textStyle: "dns-14n-130",
  color: "fg.muted",
  marginTop: "1x",
});

export const Footer = () => {
  return (
    <footer className={footerStyles} data-token-border="border.subtle">
      <div className={`${pageContainerStyles} ${footerInnerStyles}`}>
        <div>
          <BrandName variant="footer" />
          {/* 段落 (p) にすると読み上げ構造が「text」から「paragraph」に変わり、
              e2e/a11y/aria-structure.spec.ts の骨格検査と食い違うため div にする。 */}
          <div className={copyrightStyles}>
            © 2025 Lazy Note. All rights reserved.
          </div>
        </div>
        {/* /anchor への入口リンク (Issue #839)。主導線ではない補助ナビとして置く。 */}
        <Link to={ANCHOR_PATH} variant="navigation">
          {ANCHOR_NAV_LABEL}
        </Link>
      </div>
    </footer>
  );
};
