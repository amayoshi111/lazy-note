import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as usePostsHook from "../../hooks/usePosts";
import Anchor from "../anchor";

vi.mock("../../hooks/usePosts");

const mockUsePosts = vi.mocked(usePostsHook.usePosts);

describe("Anchorコンポーネント", () => {
  describe("記事の読み込みに失敗した場合の表示", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      mockUsePosts.mockReturnValue({
        posts: [],
        allPosts: [],
        loading: false,
        error: "ネットワークエラー",
        currentPage: 1,
        totalPages: 0,
        totalPosts: 0,
        setCurrentPage: vi.fn(),
      });

      render(
        <MemoryRouter>
          <Anchor />
        </MemoryRouter>,
      );
    });

    it("再読み込みを促すメッセージを表示する", () => {
      expect(
        screen.getByText("記事一覧の読み込みに失敗しました"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("ページを再読み込みしてください。"),
      ).toBeInTheDocument();
    });

    it("記事が無いときの案内メッセージを表示しない", () => {
      expect(
        screen.queryByText("まだ記事がありません。"),
      ).not.toBeInTheDocument();
    });

    it("ヘッダーに記事件数を表示しない", () => {
      expect(screen.queryByText("記事 0 件")).not.toBeInTheDocument();
    });
  });
});
