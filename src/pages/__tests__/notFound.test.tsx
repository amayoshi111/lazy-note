import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import NotFound from "../notFound";

// main.tsx と同じく、どのルートにも当たらないパスで描画する
const renderAtUnknownPath = () =>
  render(
    <MemoryRouter initialEntries={["/no-such-page"]}>
      <Routes>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </MemoryRouter>,
  );

describe("NotFound", () => {
  it("見出しに「ページが見つかりません」を表示できる", () => {
    renderAtUnknownPath();

    expect(
      screen.getByRole("heading", { name: "ページが見つかりません" }),
    ).toBeInTheDocument();
  });

  it("URL の誤りやページの移動の可能性を説明文として表示できる", () => {
    renderAtUnknownPath();

    expect(
      screen.getByText(
        "URL が間違っているか、ページが移動した可能性があります。",
      ),
    ).toBeInTheDocument();
  });

  it("トップページ (/) に戻るリンクとして機能する", () => {
    renderAtUnknownPath();

    // 矢印は aria-hidden の装飾なので、アクセシブル名はテキストだけになる
    const backLink = screen.getByRole("link", { name: "トップページに戻る" });
    expect(backLink).toHaveAttribute("href", "/");
    expect(
      screen.queryByRole("link", { name: "← トップページに戻る" }),
    ).not.toBeInTheDocument();
  });

  it("戻りリンクの矢印が aria-hidden の装飾要素になる", () => {
    renderAtUnknownPath();

    const backLink = screen.getByRole("link", { name: "トップページに戻る" });
    expect(within(backLink).getByText("←")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("document.title を「ページが見つかりません | Lazy Note」にできる", () => {
    renderAtUnknownPath();

    expect(document.title).toBe("ページが見つかりません | Lazy Note");
  });
});
