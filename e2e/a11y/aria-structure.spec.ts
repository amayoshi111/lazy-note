import { expect, test } from "@playwright/test";

/**
 * a11y: ARIA 構造回帰検査 (landmark + 見出し階層)
 *
 * `expect(locator).toMatchAriaSnapshot()` で、各ルートの **安定した骨格**
 * (landmark role と見出し階層) が崩れていないことを検査する。jsdom 単体テストの
 * data-* Tripwire (コンポーネント内部構造) と相補的に、**実ブラウザの accessibility
 * tree** 上で landmark / heading の階層が保たれていることを保証する層を担う。
 *
 * 対象 3 ルート (既存 e2e と同じ代表 URL):
 * - `/`              ホーム (HomePage)
 * - `/posts/:ts`     記事詳細 (実在する代表記事 1 件を固定)
 * - `/anchor`        個人史タイムライン (AnchorPage)
 *
 * flaky 回避の設計方針:
 * - **動的内容を template に含めない**。記事タイトル / 公開日 / 著者 / 読了時間 /
 *   記事件数 (「記事 16 件」) / Coordinate の経過日数 (「193 日目」= 実行日で変動) /
 *   Markdown 本文 (見出し・段落・リンク) / 節目の日付・ラベルはすべて除外する。
 * - `toMatchAriaSnapshot` は template を **部分一致 (subset)** で照合する
 *   (template に書いた node が tree に存在すれば pass、tree 側の余剰 node は許容)。
 *   この性質を使い、template には「変わらない landmark の枠」と「固定文言の見出し」
 *   だけを列挙する。動的な listitem 群は意図的に省略する。
 * - テーマ切替 switch のアクセシブル名は現在テーマ (ライト/ダーク) で変わるため、
 *   名前を pin せず `switch` role の存在のみを検査する。
 *
 * このテストが捕捉する regression (= 部分一致でも teeth がある):
 * - landmark role の欠落・誤り (banner / main / contentinfo / navigation / region)
 * - 見出しレベルの逆転・変更 (h1 → h2 等)
 * - 固定見出し文言 ("最新の記事" / "記事一覧" / "Anchor" / "節目一覧" / "各記事の座標") の消失
 * - ナビゲーションリンク ("TOPに戻る") の消失
 */

/**
 * 各ルートの代表 URL。
 *
 * 記事詳細の代表は **実在する任意の記事 1 件** を固定する。記事を追加しても
 * この URL を更新する必要はない (「最新記事に揃える」「violations.spec.ts と
 * 同一 timestamp に揃える」といった同期義務を課す規約は撤廃した)。記事追加の
 * たびに e2e の代表 URL 更新を強いる構造は、テストが実データに従属する
 * アンチパターンだったため (CLAUDE.md「実データ（記事）とテスト所有 fixture の
 * 分離」参照)。
 *
 * 差し替えが必要になるのは、ここで指定した記事が **削除された** ときだけ。
 */
const HOME_PATH = "/";
const POST_PATH = "/posts/20260624143000";
const ANCHOR_PATH = "/anchor";

test.describe("ARIA 構造: ホーム (/)", () => {
  test("banner / main / contentinfo の landmark 骨格を保持できる", async ({
    page,
  }) => {
    await page.goto(HOME_PATH);
    // biome-ignore lint/suspicious/noPlaywrightNetworkidle: ARIA 構造スナップショットはフォント/画像の遅延ロードと React のハイドレーション完了後の最終 DOM を対象にする必要がある。特定要素待ちでは構造が安定する前に評価され得るため、ページ全体が静定する networkidle を意図的に使う (web-first assertion では代替不可)
    await page.waitForLoadState("networkidle");

    // banner: ブランドリンク (/ 遷移) とテーマ切替 switch。
    // switch のアクセシブル名はテーマで変わるため role のみ検査する。
    await expect(page.getByRole("banner")).toMatchAriaSnapshot(`
      - banner:
        - link "Lazy Note":
          - /url: /
        - switch
    `);

    // contentinfo: フッターのブランドリンクと著作権表記 (固定文言)。
    await expect(page.getByRole("contentinfo")).toMatchAriaSnapshot(`
      - contentinfo:
        - link "Lazy Note":
          - /url: /
        - text: © 2025 Lazy Note. All rights reserved.
    `);
  });

  test("セクション見出し (h2) と記事タイトル (h3) の見出し階層を保持できる", async ({
    page,
  }) => {
    await page.goto(HOME_PATH);
    // biome-ignore lint/suspicious/noPlaywrightNetworkidle: ARIA 構造スナップショットはフォント/画像の遅延ロードと React のハイドレーション完了後の最終 DOM を対象にする必要がある。特定要素待ちでは構造が安定する前に評価され得るため、ページ全体が静定する networkidle を意図的に使う (web-first assertion では代替不可)
    await page.waitForLoadState("networkidle");

    // 最新の記事: 固定見出し "最新の記事" を h2 として持つ region。その中の article が
    // 最新記事のタイトルを、リンクを内側に持つ h3 として持つ。タイトル文言・遷移先 URL
    // は動的なので pin せず、level と「見出しの中にリンクがある」構造のみ検査する。
    await expect(
      page.getByRole("region", { name: "最新の記事" }),
    ).toMatchAriaSnapshot(`
      - region "最新の記事":
        - heading "最新の記事" [level=2]
        - article:
          - heading [level=3]:
            - link
    `);

    // 記事一覧: 固定見出し "記事一覧" を h2 として持つ region。行 (listitem) は動的なので
    // 省略し、region + 固定見出し + list の存在のみ検査する。
    // セクション見出しが h2、記事タイトルが h3 であることで、見出し階層の逆転が
    // 起きていないことを担保する。
    await expect(
      page.getByRole("region", { name: "記事一覧" }),
    ).toMatchAriaSnapshot(`
      - region "記事一覧":
        - heading "記事一覧" [level=2]
        - list
    `);
  });
});

test.describe("ARIA 構造: 記事詳細 (/posts/:timestamp)", () => {
  test("ページナビゲーションと記事見出し (h1) の骨格を保持できる", async ({
    page,
  }) => {
    await page.goto(POST_PATH);
    // biome-ignore lint/suspicious/noPlaywrightNetworkidle: ARIA 構造スナップショットはフォント/画像の遅延ロードと React のハイドレーション完了後の最終 DOM を対象にする必要がある。特定要素待ちでは構造が安定する前に評価され得るため、ページ全体が静定する networkidle を意図的に使う (web-first assertion では代替不可)
    await page.waitForLoadState("networkidle");

    // 記事詳細の安定骨格:
    // - 「ページナビゲーション」nav 内の "TOPに戻る" リンク (固定文言 / / 遷移)。
    //   矢印「←」は aria-hidden な装飾 span に分離済み (Issue #708) のため
    //   accessibility tree から除外され、アクセシブル名は "TOPに戻る" になる。
    // - article 直下の記事タイトル h1 (文言は動的なので level のみ検査)
    // Markdown 本文の h2/h3 や段落・リンクは記事ごとに変わるため含めない。
    await expect(page.getByRole("main")).toMatchAriaSnapshot(`
      - main:
        - navigation "ページナビゲーション":
          - link "TOPに戻る":
            - /url: /
        - article:
          - heading [level=1]
    `);
  });

  test("banner / contentinfo の landmark 骨格を保持できる", async ({
    page,
  }) => {
    await page.goto(POST_PATH);
    // biome-ignore lint/suspicious/noPlaywrightNetworkidle: ARIA 構造スナップショットはフォント/画像の遅延ロードと React のハイドレーション完了後の最終 DOM を対象にする必要がある。特定要素待ちでは構造が安定する前に評価され得るため、ページ全体が静定する networkidle を意図的に使う (web-first assertion では代替不可)
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("banner")).toMatchAriaSnapshot(`
      - banner:
        - link "Lazy Note":
          - /url: /
        - switch
    `);

    await expect(page.getByRole("contentinfo")).toMatchAriaSnapshot(`
      - contentinfo:
        - link "Lazy Note":
          - /url: /
        - text: © 2025 Lazy Note. All rights reserved.
    `);
  });
});

test.describe("ARIA 構造: 個人史タイムライン (/anchor)", () => {
  test("h1 と 2 つの region (h2) の見出し階層を保持できる", async ({
    page,
  }) => {
    await page.goto(ANCHOR_PATH);
    // biome-ignore lint/suspicious/noPlaywrightNetworkidle: ARIA 構造スナップショットはフォント/画像の遅延ロードと React のハイドレーション完了後の最終 DOM を対象にする必要がある。特定要素待ちでは構造が安定する前に評価され得るため、ページ全体が静定する networkidle を意図的に使う (web-first assertion では代替不可)
    await page.waitForLoadState("networkidle");

    // AnchorPage の安定骨格:
    // - ページ見出し h1 "Anchor" (固定文言)
    // - region "節目一覧" + 見出し h2 "節目一覧" (固定文言)
    // - region "各記事の座標" + 見出し h2 "各記事の座標" (固定文言)
    // 各 region 内の listitem (節目 / 各記事の座標) は内容が動的なので省略する。
    await expect(page.getByRole("main")).toMatchAriaSnapshot(`
      - main:
        - heading "Anchor" [level=1]
        - region "節目一覧":
          - heading "節目一覧" [level=2]
        - region "各記事の座標":
          - heading "各記事の座標" [level=2]
    `);
  });

  test("banner / contentinfo の landmark 骨格を保持できる", async ({
    page,
  }) => {
    await page.goto(ANCHOR_PATH);
    // biome-ignore lint/suspicious/noPlaywrightNetworkidle: ARIA 構造スナップショットはフォント/画像の遅延ロードと React のハイドレーション完了後の最終 DOM を対象にする必要がある。特定要素待ちでは構造が安定する前に評価され得るため、ページ全体が静定する networkidle を意図的に使う (web-first assertion では代替不可)
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("banner")).toMatchAriaSnapshot(`
      - banner:
        - link "Lazy Note":
          - /url: /
        - switch
    `);

    await expect(page.getByRole("contentinfo")).toMatchAriaSnapshot(`
      - contentinfo:
        - link "Lazy Note":
          - /url: /
        - text: © 2025 Lazy Note. All rights reserved.
    `);
  });
});
