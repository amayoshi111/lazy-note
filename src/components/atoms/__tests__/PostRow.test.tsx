import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { PostSummary } from "../../../lib/markdown";
import { PostRow } from "../PostRow";

const buildPost = (overrides: Partial<PostSummary> = {}): PostSummary => ({
  id: "row-1",
  title: "行のタイトル",
  createdAt: "2024/01/01 12:34",
  author: "山田花子",
  excerpt: "行の抜粋",
  readingTimeMinutes: 5,
  ...overrides,
});

describe("PostRow", () => {
  it("タイトルを H3 として表示できる", () => {
    render(
      <MemoryRouter>
        <PostRow post={buildPost()} />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "行のタイトル", level: 3 }),
    ).toBeInTheDocument();
  });

  it("タイトルが記事詳細ページへのリンクとして機能する", () => {
    render(
      <MemoryRouter>
        <PostRow post={buildPost({ id: "row-42" })} />
      </MemoryRouter>,
    );

    const link = screen.getByRole("link", { name: "行のタイトル" });
    expect(link).toHaveAttribute("href", "/posts/row-42");
  });

  it("投稿日時から時刻を除いた日付を表示できる", () => {
    render(
      <MemoryRouter>
        <PostRow post={buildPost({ createdAt: "2024/01/01 12:34" })} />
      </MemoryRouter>,
    );

    expect(screen.getByText("2024/01/01")).toBeInTheDocument();
    expect(screen.queryByText(/12:34/)).not.toBeInTheDocument();
  });

  it("著者と読了時間を表示できる", () => {
    render(
      <MemoryRouter>
        <PostRow
          post={buildPost({ author: "山田花子", readingTimeMinutes: 5 })}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("山田花子")).toBeInTheDocument();
    expect(screen.getByText("5分で読了")).toBeInTheDocument();
  });

  it("著者と読了時間の間の中点を装飾要素として描画する", () => {
    render(
      <MemoryRouter>
        <PostRow post={buildPost()} />
      </MemoryRouter>,
    );

    expect(screen.getByText("・")).toHaveAttribute("aria-hidden", "true");
  });

  it("タイトルが空の場合は「無題の記事」を表示する", () => {
    render(
      <MemoryRouter>
        <PostRow post={buildPost({ title: "" })} />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("link", { name: "無題の記事" }),
    ).toBeInTheDocument();
  });

  it("著者が空の場合は「匿名」を表示する", () => {
    render(
      <MemoryRouter>
        <PostRow post={buildPost({ author: "" })} />
      </MemoryRouter>,
    );

    expect(screen.getByText("匿名")).toBeInTheDocument();
  });

  it("日付が空の場合は「日付未設定」を表示する", () => {
    render(
      <MemoryRouter>
        <PostRow post={buildPost({ createdAt: "" })} />
      </MemoryRouter>,
    );

    expect(screen.getByText("日付未設定")).toBeInTheDocument();
  });

  describe("variant", () => {
    it("variant を省略すると default になり excerpt を表示できる", () => {
      render(
        <MemoryRouter>
          <PostRow post={buildPost({ excerpt: "抜粋のテキスト" })} />
        </MemoryRouter>,
      );

      expect(screen.getByRole("article")).toHaveAttribute(
        "data-variant",
        "default",
      );
      expect(screen.getByText("抜粋のテキスト")).toBeInTheDocument();
    });

    it("lead でも excerpt を表示できる", () => {
      render(
        <MemoryRouter>
          <PostRow
            post={buildPost({ excerpt: "抜粋のテキスト" })}
            variant="lead"
          />
        </MemoryRouter>,
      );

      expect(screen.getByText("抜粋のテキスト")).toBeInTheDocument();
    });

    it("compact では excerpt を表示しない", () => {
      render(
        <MemoryRouter>
          <PostRow
            post={buildPost({ excerpt: "抜粋のテキスト" })}
            variant="compact"
          />
        </MemoryRouter>,
      );

      expect(screen.queryByText("抜粋のテキスト")).not.toBeInTheDocument();
    });

    it("excerpt が空の場合は抜粋の段落を描画しない", () => {
      const { container } = render(
        <MemoryRouter>
          <PostRow post={buildPost({ excerpt: "" })} />
        </MemoryRouter>,
      );

      // 残る段落は「日付」と「著者・読了時間」の 2 つだけ。
      expect(container.querySelectorAll("p")).toHaveLength(2);
    });
  });

  describe("外側の要素", () => {
    it("as を省略すると article 要素として描画される", () => {
      render(
        <MemoryRouter>
          <PostRow post={buildPost()} />
        </MemoryRouter>,
      );

      expect(screen.getByRole("article")).toBeInTheDocument();
    });

    it("as=li を指定すると listitem 要素として描画される", () => {
      render(
        <MemoryRouter>
          <ul>
            <PostRow post={buildPost()} as="li" />
          </ul>
        </MemoryRouter>,
      );

      expect(screen.getByRole("listitem")).toBeInTheDocument();
      expect(screen.queryByRole("article")).not.toBeInTheDocument();
    });
  });

  describe("label (日付の代わりに置く文脈ラベル)", () => {
    it("label を渡すと日付の代わりに表示できる", () => {
      render(
        <MemoryRouter>
          <PostRow
            post={buildPost({ createdAt: "2024/01/01 12:34" })}
            label="もう一度"
          />
        </MemoryRouter>,
      );

      expect(screen.getByText("もう一度")).toBeInTheDocument();
      expect(screen.queryByText("2024/01/01")).not.toBeInTheDocument();
    });

    it("label を渡すと著者と読了時間を表示しない", () => {
      render(
        <MemoryRouter>
          <PostRow
            post={buildPost({ author: "山田花子", readingTimeMinutes: 5 })}
            label="もう一度"
          />
        </MemoryRouter>,
      );

      expect(screen.queryByText("山田花子")).not.toBeInTheDocument();
      expect(screen.queryByText("5分で読了")).not.toBeInTheDocument();
    });
  });

  // 一覧の行のタイトルに `view-transition-name: post-{id}` のインラインスタイルを
  // 付け、PostDetailPage の H1 と同じ name で morph が成立することを検証する。
  describe("View Transitions Hero morph", () => {
    it("タイトル H3 に view-transition-name: post-{id} を付与する", () => {
      render(
        <MemoryRouter>
          <PostRow post={buildPost({ id: "row-vt" })} />
        </MemoryRouter>,
      );

      const heading = screen.getByRole("heading", {
        name: "行のタイトル",
        level: 3,
      });
      expect(heading.style.viewTransitionName).toBe("post-row-vt");
    });
  });

  // 行の上端の区切り線が参照する token を `data-token-border` 意味属性で検証する
  // (class 名の文字列に依存しない)。
  describe("デザイントークン (Tripwire)", () => {
    it("default は border.subtle 専用 token を border として宣言する", () => {
      render(
        <MemoryRouter>
          <PostRow post={buildPost()} />
        </MemoryRouter>,
      );

      expect(screen.getByRole("article")).toHaveAttribute(
        "data-token-border",
        "border.subtle",
      );
    });

    it("compact も border.subtle 専用 token を border として宣言する", () => {
      render(
        <MemoryRouter>
          <PostRow post={buildPost()} variant="compact" />
        </MemoryRouter>,
      );

      expect(screen.getByRole("article")).toHaveAttribute(
        "data-token-border",
        "border.subtle",
      );
    });

    it("lead は accent.featured を border として宣言する (最新の記事の目印)", () => {
      render(
        <MemoryRouter>
          <PostRow post={buildPost()} variant="lead" />
        </MemoryRouter>,
      );

      expect(screen.getByRole("article")).toHaveAttribute(
        "data-token-border",
        "accent.featured",
      );
    });
  });
});
