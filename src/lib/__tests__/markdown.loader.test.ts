import { describe, expect, it } from "vitest";
import { loadPost, loadPostSummaries } from "../markdown";

/**
 * 記事フォーマットに沿った合成 Markdown を組み立てる。
 * テストは datasources/*.md を入力に取らないため、ローダーにはこれを返させる。
 */
const buildPostSource = (title: string): string =>
  [
    `# ${title}`,
    "",
    "## 投稿日時",
    "",
    "- 2024/01/01 00:00",
    "",
    "## 筆者名",
    "",
    "- テスト筆者",
    "",
    "## 本文",
    "",
    `${title}の本文です。`,
  ].join("\n");

describe("loadPostSummaries", () => {
  it("一覧を id (ファイル名) の降順で返す", async () => {
    const summaries = await loadPostSummaries({
      "/datasources/20240101000000.md": async () => buildPostSource("古い記事"),
      "/datasources/20240301000000.md": async () =>
        buildPostSource("新しい記事"),
      "/datasources/20240201000000.md": async () =>
        buildPostSource("中間の記事"),
    });

    expect(summaries.map(({ id, title }) => [id, title])).toEqual([
      ["20240301000000", "新しい記事"],
      ["20240201000000", "中間の記事"],
      ["20240101000000", "古い記事"],
    ]);
  });
});

describe("loadPost", () => {
  it("id に対応するファイルの記事を返す", async () => {
    const post = await loadPost(
      {
        "/datasources/20240101000000.md": async () =>
          buildPostSource("1つ目の記事"),
        "/datasources/20240102000000.md": async () =>
          buildPostSource("2つ目の記事"),
      },
      "20240102000000",
    );

    expect(post?.id).toBe("20240102000000");
    expect(post?.title).toBe("2つ目の記事");
  });

  it("id に対応するファイルが無い場合は null を返す", async () => {
    const post = await loadPost(
      {
        "/datasources/20240101000000.md": async () =>
          buildPostSource("1つ目の記事"),
      },
      "20240102000000",
    );

    expect(post).toBeNull();
  });
});
