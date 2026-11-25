import { Transition } from "@headlessui/react";
import { css } from "../../../styled-system/css";
import { useScrollPosition } from "../../hooks/useScrollPosition";
import { focusRingStyles } from "../../styles/focusRing";

/**
 * BackToTop の表示文言定数 (Issue #707)。
 *
 * Issue #630 のロードマップに沿って、表示文言を JSX 直書きからファイル内
 * トップレベル定数に外出しする。PR #627 (Anchor 系) と同じ方針で、リテラル
 * 定数には `as const` を付与して literal type を温存する。
 *
 * `BACK_TO_TOP_ARROW` は button 内の装飾矢印 (Unicode 文字 `↑`) を表す。
 * SVG / アイコンフォントではなく純粋な glyph のため `ICON` ではなく
 * `ARROW` と命名する。button には `aria-label={BACK_TO_TOP_ARIA_LABEL}`
 * で SR 向けラベルを付与しており、矢印自体は視覚装飾扱い。JSX 側では
 * `<span aria-hidden="true">` で wrap し、accessible name 計算で
 * textContent が二重発話されないようにする (Issue #707 本文要件)。
 */
const BACK_TO_TOP_ARIA_LABEL = "ページトップへ戻る" as const;
const BACK_TO_TOP_ARROW = "↑" as const;

const SHOW_THRESHOLD = 300;

// 画面の右下に固定するボタン。画面の端から 24px、大きさは押せる要素の最小 (44px)。
// - 本文の上に重なるので背景は不透明な bg.canvas にし、形は枠線で示す (影は使わない)
// - 枠線は border 専用 token (border.subtle)。bg.canvas 上で WCAG 1.4.11 の 3:1 を
//   満たす (light 3.49:1 / dark 6.18:1)
// - hover 背景は bg.muted。bg.elevated だと dark で枠線との比が 2.25:1 (3:1 未達) に
//   なるため使わない (bg.muted × border.subtle = light 3.39:1 / dark 4.94:1)
// - 文字色は本文色 fg.primary。bg.canvas / bg.muted 上で AAA を担保
// R-5 (Issue #393) で transition は prefers-reduced-motion: reduce 時に無効化。
const buttonStyles = css({
  position: "fixed",
  bottom: "3x",
  right: "3x",
  width: "target",
  height: "target",
  borderRadius: "full",
  background: "bg.canvas",
  color: "fg.primary",
  border: "1px solid",
  borderColor: "border.subtle",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textStyle: "std-20b-150",
  zIndex: 50,
  transition: "all 0.2s ease",
  _motionReduce: {
    transition: "none",
  },
  "&:hover": {
    background: "bg.muted",
  },
});

const enterStyles = css({ transition: "all 0.2s ease" });
const enterFromStyles = css({ opacity: 0, transform: "translateY(10px)" });
const enterToStyles = css({ opacity: 1, transform: "translateY(0)" });
const leaveStyles = css({ transition: "all 0.15s ease" });
const leaveFromStyles = css({ opacity: 1, transform: "translateY(0)" });
const leaveToStyles = css({ opacity: 0, transform: "translateY(10px)" });

const handleClick = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

export const BackToTop = () => {
  const scrollY = useScrollPosition();
  const isVisible = scrollY > SHOW_THRESHOLD;

  return (
    <Transition
      show={isVisible}
      enter={enterStyles}
      enterFrom={enterFromStyles}
      enterTo={enterToStyles}
      leave={leaveStyles}
      leaveFrom={leaveFromStyles}
      leaveTo={leaveToStyles}
    >
      <button
        type="button"
        className={`${buttonStyles} ${focusRingStyles}`}
        onClick={handleClick}
        aria-label={BACK_TO_TOP_ARIA_LABEL}
        data-token-bg="bg.canvas"
        data-token-border="border.subtle"
        data-token-hover-bg="bg.muted"
        data-focus-ring="default"
      >
        <span aria-hidden="true">{BACK_TO_TOP_ARROW}</span>
      </button>
    </Transition>
  );
};
