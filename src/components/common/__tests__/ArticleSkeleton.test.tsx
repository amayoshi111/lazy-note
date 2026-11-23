import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ArticleSkeleton } from "../ArticleSkeleton";

describe("ArticleSkeleton", () => {
  it("記事スケルトンがレンダリングされる", () => {
    const { container } = render(<ArticleSkeleton />);

    expect(container.firstChild).toBeInTheDocument();
  });

  it("aria-busy属性がtrueに設定されている", () => {
    render(<ArticleSkeleton />);

    const skeleton = screen.getByLabelText("記事を読み込み中");
    expect(skeleton).toHaveAttribute("aria-busy", "true");
  });

  it("aria-label属性が設定されている", () => {
    render(<ArticleSkeleton />);

    const skeleton = screen.getByLabelText("記事を読み込み中");
    expect(skeleton).toBeInTheDocument();
  });

  it("ヘッダーセクションを含んでいる", () => {
    const { container } = render(<ArticleSkeleton />);

    const header = container.querySelector("header");
    expect(header).toBeInTheDocument();
  });

  it("記事セクションを含んでいる", () => {
    const { container } = render(<ArticleSkeleton />);

    const article = container.querySelector("article");
    expect(article).toBeInTheDocument();
  });

  it("ナビゲーションセクションを含んでいる", () => {
    const { container } = render(<ArticleSkeleton />);

    const nav = container.querySelector("nav");
    expect(nav).toBeInTheDocument();
  });

  // 骨組みは記事詳細と同じ列に並ぶ: 戻るリンク (nav) の次に記事 (article) が来る。
  it("戻るリンクの位置 (nav) の次に記事 (article) を並べる", () => {
    const { container } = render(<ArticleSkeleton />);

    const nav = container.querySelector("nav");
    expect(nav?.nextElementSibling).toBe(container.querySelector("article"));
  });
});
