# Lazy Note

React 19 + TypeScript + Panda CSSを使用したシンプルなブログアプリケーションです。

## 機能

- **記事一覧表示**: Markdownファイルから記事を読み込み、一覧表示
- **記事詳細表示**: 個別記事の詳細ページ
- **ルーティング**: React Router DOM（`src/main.tsx` の `<Routes>` に手動登録、`src/pages/` 配下にページコンポーネントを置く慣行。`vite-plugin-pages` 等の自動ルート生成方式は導入していない。判断根拠は [`CLAUDE.md`](./CLAUDE.md) の「自動ルート生成方式（vite-plugin-pages 等）の導入検討結果」を参照）
- **レスポンシブデザイン**: Panda CSSによる型安全なスタイリング

## 技術スタック

### フロントエンド

- **React 19** - UIライブラリ
- **TypeScript** - 型安全な開発
- **Vite 8** - 高速なビルドツール
- **Panda CSS** - 型安全なCSS-in-JS
- **React Router DOM** - クライアントサイドルーティング
- **Headless UI** - アクセシブルなUIコンポーネント
- **marked** - Markdownパーサー
- **DOMPurify** - HTMLサニタイズライブラリ

### テスト

- **Vitest 4** - 高速なテストランナー
- **React Testing Library** - Reactコンポーネントのテスト
- **jsdom** - ブラウザ環境のシミュレーション
- **@playwright/test** - E2E / アクセシビリティ（a11y）テスト
- **@axe-core/playwright / jest-axe** - axe-core ベースのアクセシビリティ自動検査

### コード品質

- **Biome** - 高速なリンター・フォーマッター
- **GitHub Actions** - CI/CDパイプライン

### ランタイム・パッケージ管理

- **Bun** - JavaScript ランタイム兼パッケージマネージャ（依存のインストールと、スクリプト・各 CLI の実行に使用）

## セットアップ

### 前提条件

- [Bun](https://bun.com/) 1.4.4（`package.json` の `packageManager` に準拠）

Node.js と pnpm は不要です。`bun run` で起動する CLI（Vite / Vitest / Panda CSS / tsc / Biome / Playwright）は、`bunfig.toml` の `run.bun` により、Node.js が入っている環境でも Bun 上で実行されます。

### インストール

```bash
# 依存関係のインストール
bun install

# git ネイティブ hooks を有効化 (初回 clone 時に一度だけ実行)
git config core.hooksPath .githooks

# 開発サーバー起動
bun run dev
```

`bun install` の最後に `Blocked 1 postinstall` と表示されますが、これは意図した動作です。`@parcel/watcher`（Panda CSS の依存）のソースビルド用スクリプトを実行せず、同梱済みのビルド済みバイナリを使っています。依存パッケージのスクリプトは `package.json` の `trustedDependencies` に載せたものだけが実行されます。

### Bun 上で実行するうえでの注意

- **スクリプトは必ず `bun run <名前>` で実行する**: `bun test` と `bun build` は Bun 組み込みのテストランナーとバンドラを起動するコマンドで、`package.json` の `test` / `build` は実行されません。`bun test` は取り違え防止のため、案内を出して失敗するようにしてあります（`bunfig.toml` の `test.preload`）
- **Bun のバージョンは `package.json` の `packageManager` で固定している**: CI（`oven-sh/setup-bun`）もこの値を読みます。Dependabot はこの値を更新しないため、Bun を上げるときは手動で書き換えます
- **Bun を上げるときはテスト・E2E・ビルドを通して確認する**: Vite / Vitest / Playwright / Panda CSS は公式には Node.js を動作対象としており、Bun 上での実行は Bun の Node.js 互換機能に依存しています

### git hooks の有効化 (必須)

本リポジトリは `.githooks/` に git ネイティブ hook を同梱しており、これらは clone しただけでは有効になりません。初回 setup 時に以下を実行して有効化してください:

```bash
git config core.hooksPath .githooks
```

提供している hook:

- `.githooks/pre-commit` — `main` ブランチへの直接 commit を拒否します
- `.githooks/commit-msg` — コミットメッセージ本文に **AI bot 由来の** `Co-Authored-By` 行 (既知 AI bot のメールドメイン `@anthropic.com` / `@openai.com` / `@cursor.{sh,com}` を含む、または GitHub Apps の `[bot]` suffix と vendor 識別子の組み合わせ) が含まれていたら commit を拒否します。**判定は構造的 fixture-based** (メールドメイン / `[bot]` suffix) なので、人名 substring 衝突 (例: `Claudette Colvin` / `Codexa Smith`) や本文中の単なる言及は誤検知しません。人間 pair programming や dependabot 等の正当な共著情報は許容されます (Issue #648 + DA Must 対応)

これらは [`CLAUDE.md`](./CLAUDE.md) のグローバルルール (「main への直接 commit 禁止」「コミットメッセージに Co-Authored-By を含めない」) を **git の動作上 bypass 不可能な層** で保証するためのものです (Issue #568 / Issue #592 / Issue #648)。

`postinstall` での自動セットアップは採用していません。理由は以下:

- `git config core.hooksPath` はリポジトリローカルの設定を書き換える副作用を持ち、ユーザーが意図的に別の hooks path (例: husky / lefthook) を併用している場合に上書きしてしまう
- CI 環境 (GitHub Actions 等) では hooks は不要なため、`bun install --frozen-lockfile` 時に毎回実行される副作用は避けたい
- 一度実行すれば永続するため、README に書く方が運用上シンプル

### 利用可能なコマンド

```bash
# --- 開発・ビルド ---
# 開発サーバー起動（Panda CSS ウォッチモード付き）
bun run dev

# プロダクションビルド（リント・テスト・型チェック・ビルドを順次実行）
bun run build

# ビルドプレビュー
bun run preview

# Panda CSSコード生成
bun run prepare

# --- テスト ---
# テスト実行（ウォッチモード）
bun run test

# テスト実行（1回のみ）
bun run test:run

# テストUI起動
bun run test:ui

# アクセシビリティ E2E テスト（Playwright + axe-core）
bun run test:a11y

# E2E テスト（Playwright）
bun run e2e

# --- リント・フォーマット ---
# リント実行
bun run lint

# フォーマット実行
bun run fmt

# デザイントークン lint（生 CSS 値の混入検知）
bun run lint:tokens

# --- 型チェック ---
# src の型チェック
bun run type-check

# API（src/api）の型チェック
bun run type-check:api

# テストコードの型チェック
bun run type-check:test

# scripts の型チェック
bun run type-check:scripts

# --- コントラスト検証 ---
# コントラスト比チェック（WCAG）
bun run contrast:check

# コントラスト比マトリクスを CSV 出力
bun run contrast:matrix

# --- フォント ---
# self-host フォントの再取得
bun run fonts:download

# フォントの SHA-256 検証
bun run fonts:verify

# --- 記事 ---
# 新しい記事を作成
bun run new-post
```

## プロジェクト構造

```
src/
├── api/              # API ミドルウェア
│   ├── __tests__/    # API のテスト
│   ├── index.ts      # ミドルウェア登録
│   ├── posts.ts      # 記事取得 API
│   └── images.ts     # 画像取得 API
├── components/       # コンポーネント
│   ├── atoms/        # 基本的な UI コンポーネント
│   │   ├── Button.tsx
│   │   ├── Link.tsx
│   │   ├── Typography.tsx
│   │   ├── BentoCard.tsx
│   │   ├── FeaturedCard.tsx
│   │   ├── IndexRow.tsx
│   │   └── icons/    # アイコンコンポーネント群
│   ├── common/       # 汎用コンポーネント
│   │   ├── BrandName.tsx
│   │   ├── EmptyState.tsx
│   │   ├── MetaInfo.tsx
│   │   ├── Coordinate.tsx
│   │   ├── Pagination.tsx
│   │   ├── PostNavigation.tsx
│   │   ├── TableOfContents.tsx
│   │   ├── ImageLightbox.tsx
│   │   ├── ReadingProgressBar.tsx
│   │   ├── BackToTop.tsx
│   │   ├── ScrollToTop.tsx
│   │   ├── ThemeToggle.tsx
│   │   ├── Resurface.tsx
│   │   ├── ArticleSkeleton.tsx / CardSkeleton.tsx
│   │   └── __tests__/    # common コンポーネントのテスト
│   ├── layouts/      # レイアウトコンポーネント
│   │   ├── Footer.tsx
│   │   ├── Header.tsx
│   │   └── Layout.tsx
│   └── pages/        # ページ用コンポーネント
│       ├── HomePage.tsx
│       ├── PostDetailPage.tsx
│       └── AnchorPage.tsx
├── hooks/            # カスタムフック
│   ├── __tests__/    # hooks のテスト
│   ├── usePost.ts / usePosts.ts
│   ├── useAdjacentPosts.ts
│   ├── useCodeBlockCopy.ts
│   ├── useImageLightbox.ts
│   ├── useReadingProgress.ts
│   ├── useScrollPosition.ts
│   ├── useTheme.ts
│   └── useViewTransitionNavigate.ts
├── lib/              # ユーティリティ関数
│   ├── __tests__/    # lib のテスト
│   ├── markdown.ts / markdownParser.ts  # Markdown 解析
│   ├── sanitize.ts   # HTML サニタイズ
│   ├── anchors.ts / milestonesSchema.ts # アンカー / 節目
│   ├── colorTokens.ts / fontStack.ts    # デザイントークン
│   ├── i18nLiterals.ts / resurface.ts / viewTransition.ts
├── pages/            # ページコンポーネント配置（src/main.tsx の Routes に手動登録）
│   ├── __tests__/    # pages のテスト
│   ├── index.tsx     # トップページ（記事一覧）
│   ├── anchor.tsx    # アンカー（節目一覧）ページ
│   └── posts/
│       └── Post.tsx  # 記事詳細ページ
├── styles/           # 共通スタイル定義（focusRing / transitions 等）
├── test/             # テスト共通設定
└── main.tsx          # アプリケーションエントリーポイント

datasources/         # データソース
├── *.md             # Markdown ファイル（記事データ）
├── milestones.json  # 節目（アンカー）データ
└── images/          # 記事画像
scripts/             # ユーティリティスクリプト
├── newPost.ts          # 新規記事作成スクリプト
├── calculateContrast.ts # コントラスト比計算
├── lintTokens.ts        # デザイントークン lint
└── download-fonts.sh    # self-host フォント取得
public/fonts/        # self-host する欧文フォント（詳細は public/fonts/README.md）
styled-system/       # Panda CSS 自動生成ファイル（.gitignore 済み、ビルド時に自動生成）
```

## 記事の追加

`datasources/`ディレクトリに以下の形式でMarkdownファイルを追加してください：

**ファイル名**: `YYYYMMDDHHMMSS.md`（例: `20240101120000.md`）

**内容**:

```markdown
# 記事タイトル

## 投稿日時

- 2024/01/01 12:00

## 筆者名
- 筆者名

## 本文
記事の内容をここに書きます。

**太字**や*斜体*などのMarkdown記法が使用できます。
```

## テスト

ユニット / コンポーネントテスト（Vitest）は各ディレクトリの`__tests__`フォルダに配置されています：

- `src/lib/__tests__/` - ユーティリティ関数のテスト
- `src/hooks/__tests__/` - カスタムフックのテスト
- `src/pages/__tests__/` - ページコンポーネントのテスト
- `src/components/**/__tests__/` - 各コンポーネント（atoms / common / layouts / pages）のテスト
- `src/api/__tests__/` - API のテスト
- `scripts/__tests__/` - スクリプトのテスト

E2E / アクセシビリティテスト（Playwright）は `e2e/` 配下に配置されています（`bun run e2e` / `bun run test:a11y` で実行）。

全てのテストケース名は日本語で記述されており、TDD（テスト駆動開発）の原則に従って開発されています。

## スタイリング

このプロジェクトではPanda CSSを使用しています：

- 型安全なスタイリング
- デザイントークンベースの一貫したデザイン
- `css()`関数とパターン関数による柔軟なスタイル定義

## CI/CD

GitHub Actionsを使用して以下の処理を自動化：

- リント・フォーマットチェック
- テスト実行
- 型チェック
- ビルド確認

## 設計ドキュメント

UI/UX フルリニューアル「Editorial Citrus」の設計ドキュメントは [`docs/rfc/editorial-citrus/`](./docs/rfc/editorial-citrus/README.md) に集約されています。

- [README (エントリポイント)](./docs/rfc/editorial-citrus/README.md)
- [Phase1 計画 (v2) ── 唯一の単一ソース](./docs/rfc/editorial-citrus/10-renewal-phase1-plan.md)
