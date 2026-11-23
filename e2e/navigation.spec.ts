import { expect, test } from "@playwright/test";

/**
 * ナビゲーション E2E: Footer の入口リンク (Issue #839)
 *
 * `/` の Footer に追加した「サイトの読み方」リンク (`/anchor` への内部遷移) を
 * 起点に、ホームから個人史タイムライン (`/anchor`) へ到達できることを検査する。
 *
 * jsdom 単体テスト (Footer.test.tsx / AnchorPage.test.tsx) が「リンクが存在する」
 * 「heavy を抑制する」といったコンポーネント内部の振る舞いを担保するのに対し、
 * 本 E2E は実ブラウザでの **クリック → ルート遷移 → 到達ページの見出し** という
 * 導線そのもの (= ナビ統合の主目的) が機能することを保証する層を担う。
 */
test.describe("ナビゲーション: Footer の入口リンク (Issue #839)", () => {
  test("ホームから Footer の『サイトの読み方』リンクで /anchor に到達できる", async ({
    page,
  }) => {
    await page.goto("/");

    // Footer (contentinfo landmark) 内の入口リンクを狙い撃ちで取得する。
    const footer = page.getByRole("contentinfo");
    const entryLink = footer.getByRole("link", { name: "サイトの読み方" });
    await expect(entryLink).toBeVisible();
    await expect(entryLink).toHaveAttribute("href", "/anchor");

    await entryLink.click();

    // /anchor へ遷移し、AnchorPage の固定 h1 "Anchor" が描画される。
    await expect(page).toHaveURL(/\/anchor$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Anchor" }),
    ).toBeVisible();
  });

  // 画面の右下に固定した「ページトップへ戻る」ボタンは、ページの最下部では
  // フッターの上に重なる。リンクを右端に置く画面幅 (768px 以上) でも、リンクの
  // 押せる範囲がボタンに奪われないことを、実ブラウザの位置で確かめる。
  test("ページの最下部でも『サイトの読み方』リンクが『ページトップへ戻る』ボタンに覆われない", async ({
    page,
  }) => {
    await page.goto("/");
    // 記事の一覧が出てからでないと、ページの高さが確定しない。
    await expect(
      page.getByRole("heading", { level: 2, name: "記事一覧" }),
    ).toBeVisible();

    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight),
    );

    const entryLink = page
      .getByRole("contentinfo")
      .getByRole("link", { name: "サイトの読み方" });
    const backToTop = page.getByRole("button", { name: "ページトップへ戻る" });
    await expect(entryLink).toBeInViewport();
    // ボタンが現れるときのアニメーション (透明度と上下の移動) が終わってから測る。
    await expect(backToTop).toHaveCSS("opacity", "1");

    const linkBox = await entryLink.boundingBox();
    const buttonBox = await backToTop.boundingBox();
    if (!linkBox || !buttonBox) {
      throw new Error("リンクかボタンの位置を取得できませんでした");
    }
    const isOverlapping =
      linkBox.x < buttonBox.x + buttonBox.width &&
      buttonBox.x < linkBox.x + linkBox.width &&
      linkBox.y < buttonBox.y + buttonBox.height &&
      buttonBox.y < linkBox.y + linkBox.height;
    expect(
      isOverlapping,
      `リンク ${JSON.stringify(linkBox)} とボタン ${JSON.stringify(buttonBox)} が重なっている`,
    ).toBe(false);
  });
});
