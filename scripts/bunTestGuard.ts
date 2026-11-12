/**
 * `bun test` の誤用ガード。
 *
 * `bun test` は Bun 組み込みのテストランナーを起動するコマンドで、このプロジェクトの
 * テストランナーである Vitest は実行されない。組み込みのランナーは、Vitest 向けに
 * 書かれたテスト (jsdom 環境や `vi.mocked` などを前提にしている) と Playwright の
 * E2E テストまで拾って実行し、大量の失敗を出力する。
 *
 * 本ファイルは bunfig.toml の `[test] preload` に登録されており、`bun test` の
 * 起動時にだけ読み込まれる。読み込まれた時点で案内を出して終了するため、
 * テストは 1 件も実行されない。`bun run test` (Vitest) や他のスクリプトの実行には
 * 影響しない。
 *
 * 注意: 読み込むだけでプロセスを終了させるため、他のファイルから import しないこと。
 */

const guidance = [
  "このプロジェクトのテストランナーは Vitest です。",
  "`bun test` は Bun 組み込みのテストランナーを起動するため、使えません。",
  "",
  "  bun run test       ウォッチモードで実行",
  "  bun run test:run   1 回だけ実行",
  "",
].join("\n");

console.error(guidance);
process.exit(1);
