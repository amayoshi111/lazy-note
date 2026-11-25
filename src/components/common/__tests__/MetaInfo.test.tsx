import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MetaInfo } from "../MetaInfo";

describe("MetaInfo", () => {
  it("投稿日時と筆者をラベルつきで表示できる", () => {
    render(<MetaInfo createdAt="2024/01/15 09:30" author="山田太郎" />);

    expect(screen.getByText("投稿")).toBeInTheDocument();
    expect(screen.getByText("2024/01/15 09:30")).toBeInTheDocument();
    expect(screen.getByText("筆者")).toBeInTheDocument();
    expect(screen.getByText("山田太郎")).toBeInTheDocument();
  });

  it("投稿日時が未設定の場合は「日付未設定」を表示する", () => {
    render(<MetaInfo author="山田太郎" />);

    expect(screen.getByText("日付未設定")).toBeInTheDocument();
  });

  it("筆者が未設定の場合は「匿名」を表示する", () => {
    render(<MetaInfo createdAt="2024/01/15 09:30" />);

    expect(screen.getByText("匿名")).toBeInTheDocument();
  });

  it("空文字列を渡した場合は未設定と同じ文言を表示する", () => {
    render(<MetaInfo createdAt="" author="" />);

    expect(screen.getByText("日付未設定")).toBeInTheDocument();
    expect(screen.getByText("匿名")).toBeInTheDocument();
  });

  it("読了時間を渡すと表示できる", () => {
    render(
      <MetaInfo
        createdAt="2024/01/15 09:30"
        author="山田太郎"
        readingTimeMinutes={3}
      />,
    );

    expect(screen.getByText("3分で読了")).toBeInTheDocument();
  });

  it("読了時間を渡さない場合は読了時間を表示しない", () => {
    render(<MetaInfo createdAt="2024/01/15 09:30" author="山田太郎" />);

    expect(screen.queryByText(/分で読了/)).not.toBeInTheDocument();
  });

  it("長い筆者名を省略せずに表示できる", () => {
    const longAuthor = "とても長い名前の筆者".repeat(5);
    render(<MetaInfo createdAt="2024/01/15 09:30" author={longAuthor} />);

    expect(screen.getByText(longAuthor)).toBeInTheDocument();
  });

  // 加筆日時 (Issue #809): updatedAt が createdAt より厳密に新しいときだけ
  // 「更新: <日時>」の行を出す。行の種別は構造属性 data-meta-field="updated" で示す。
  describe("更新日時", () => {
    it("updatedAt が createdAt より新しいとき更新日時行を data-meta-field 付きで表示できる", () => {
      const { container } = render(
        <MetaInfo
          createdAt="2024/03/10 09:00"
          updatedAt="2024/03/11 10:00"
          author="山田太郎"
        />,
      );

      const updatedRow = container.querySelector('[data-meta-field="updated"]');
      expect(updatedRow).not.toBeNull();
      expect(updatedRow).toHaveTextContent("更新: 2024/03/11 10:00");
    });

    it("updatedAt 未指定のとき更新日時行が描画されない", () => {
      const { container } = render(
        <MetaInfo createdAt="2024/03/10 09:00" author="山田太郎" />,
      );

      expect(container.querySelector('[data-meta-field="updated"]')).toBeNull();
    });

    it("updatedAt が空文字のとき更新日時行が描画されない", () => {
      const { container } = render(
        <MetaInfo
          createdAt="2024/03/10 09:00"
          updatedAt=""
          author="山田太郎"
        />,
      );

      expect(container.querySelector('[data-meta-field="updated"]')).toBeNull();
    });

    it("updatedAt が createdAt と同一のとき更新日時行が描画されない", () => {
      const { container } = render(
        <MetaInfo
          createdAt="2024/03/10 09:00"
          updatedAt="2024/03/10 09:00"
          author="山田太郎"
        />,
      );

      expect(container.querySelector('[data-meta-field="updated"]')).toBeNull();
    });

    it("updatedAt が createdAt より前のとき更新日時行が描画されない", () => {
      const { container } = render(
        <MetaInfo
          createdAt="2024/03/10 09:00"
          updatedAt="2024/03/09 23:59"
          author="山田太郎"
        />,
      );

      expect(container.querySelector('[data-meta-field="updated"]')).toBeNull();
    });

    // data-meta-field の付与範囲は更新行のみ (Issue #814 / YAGNI)。他の項目へ
    // 広げたら本テストで検知する。
    it("data-meta-field は更新行のみに付与され他の項目には付与されない", () => {
      const { container } = render(
        <MetaInfo
          createdAt="2024/03/10 09:00"
          updatedAt="2024/03/11 10:00"
          author="山田太郎"
          readingTimeMinutes={3}
        />,
      );

      const marked = container.querySelectorAll("[data-meta-field]");
      expect(marked).toHaveLength(1);
      expect(marked[0]).toHaveAttribute("data-meta-field", "updated");
    });
  });
});
