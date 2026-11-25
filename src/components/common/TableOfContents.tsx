import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import React from "react";
import { css } from "../../../styled-system/css";
import type { TocItem } from "../../lib/markdown";

interface TableOfContentsProps {
  toc: TocItem[];
}

// 目次。枠で囲まず、上端の区切り線と見出しだけで示す (1024px 未満では本文との
// 境目として下端にも線を引く)。
//
// 区切り線は border 専用 token (border.subtle)。bg.canvas 上で WCAG 1.4.11
// (Non-text Contrast) の 3:1 を満たす (light 3.49:1 / dark 6.18:1)。
const containerStyle = css({
  borderTop: "1px solid",
  borderTopColor: "border.subtle",
  borderBottom: { base: "1px solid", lg: "none" },
  borderBottomColor: "border.subtle",
});

// 開閉ボタン。押せる要素として 44px の高さを確保する。
// 右端の山形は開閉の状態を示す装飾 (開いているとき上向き)。
const buttonStyle = css({
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  minHeight: "target",
  background: "transparent",
  color: "fg.primary",
  textStyle: "std-16b-170",
  cursor: "pointer",
  borderRadius: "sm",
  "&::after": {
    content: '""',
    width: "8px",
    height: "8px",
    marginRight: "1x",
    borderRight: "2px solid",
    borderBottom: "2px solid",
    transform: "rotate(45deg)",
  },
  "&[data-open]::after": {
    transform: "rotate(-135deg)",
  },
});

const panelStyle = css({
  paddingBottom: "2x",
});

const listStyle = css({
  listStyle: "none",
  padding: "0",
  margin: "0",
});

const listItemStyle = css({
  margin: "0",
});

// 項目のリンク。上下 8px の余白で、指でも押しやすい高さ (約 43px) にする。
// fg.secondary は bg.canvas 上で AAA (light 9.59:1 / dark 14.84:1)。
const linkBaseStyle = css({
  display: "block",
  paddingY: "1x",
  color: "fg.secondary",
  textStyle: "std-16n-170",
  textDecoration: "underline",
  textDecorationThickness: "1px",
  textUnderlineOffset: "0.2em",
  borderRadius: "sm",
  "&:hover": {
    color: "accent.link",
    textDecorationThickness: "2px",
  },
});

// 最も浅い見出しより深い階層の項目 (h2 の下の h3 など) は 16px 字下げする。
const indentedLinkStyle = css({
  paddingLeft: "2x",
});

/**
 * スムーズスクロールで見出しへ移動するハンドラ
 */
const handleSmoothScroll = (
  event: React.MouseEvent<HTMLAnchorElement>,
): void => {
  event.preventDefault();
  const href = event.currentTarget.getAttribute("href");
  if (!href) {
    return;
  }

  const targetId = href.slice(1);
  const targetElement = document.getElementById(targetId);
  if (targetElement) {
    targetElement.scrollIntoView({ behavior: "smooth" });
  }
};

export const TableOfContents = React.memo(({ toc }: TableOfContentsProps) => {
  if (toc.length === 0) {
    return null;
  }

  // 目次の中で最も浅い見出しの階層。これより深い項目だけを字下げする
  // (h3 だけの記事で、親の無い字下げにならないようにする)。
  const topLevel = Math.min(...toc.map((item) => item.level));

  return (
    <Disclosure defaultOpen>
      <div className={containerStyle} data-token-border="border.subtle">
        <DisclosureButton className={buttonStyle}>目次</DisclosureButton>
        <DisclosurePanel className={panelStyle}>
          <ul className={listStyle}>
            {toc.map((item) => (
              <li key={item.id} className={listItemStyle}>
                <a
                  href={`#${item.id}`}
                  onClick={handleSmoothScroll}
                  className={`${linkBaseStyle} ${item.level > topLevel ? indentedLinkStyle : ""}`}
                >
                  {item.text}
                </a>
              </li>
            ))}
          </ul>
        </DisclosurePanel>
      </div>
    </Disclosure>
  );
});

TableOfContents.displayName = "TableOfContents";
