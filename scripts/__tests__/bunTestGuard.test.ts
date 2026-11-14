import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";

/**
 * `bun test` の誤用ガード (scripts/bunTestGuard.ts) の動作テスト。
 *
 * `bun test` は Bun 組み込みのテストランナーを起動するコマンドで、Vitest
 * (`bun run test`) とは別物である。ガードは bunfig.toml の `[test] preload` から
 * 読み込まれるため、import して単体で検証することはできない
 * (import すると Vitest のワーカー自体が終了してしまう)。
 * そのため `bun test` をサブプロセスとして起動し、終了コードと出力で検証する。
 *
 * サブプロセスに読み込ませるテストファイルを 1 つに絞る理由:
 *   - ガードが効かなくなった場合に、終了コードでも検出できるようにするため。
 *     引数なしの `bun test` は、ガードが効かなくなると Vitest 向けのテストが大量に
 *     失敗し、ガードが効いているときと同じ終了コード 1 で終わってしまう。
 *     Bun 組み込みのランナーでもそのまま成功するファイルを 1 つ指定すれば、
 *     ガードが効かなくなったときの終了コードは 0 になる。
 *   - 入れ子の起動を防ぐため。引数なしの `bun test` は、ガードが効かなくなると
 *     本ファイル自身も読み込み、そこから再び `bun test` を起動してしまう。
 *     ファイルを指定すれば、サブプロセスが読み込むのはそのファイルだけになる。
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(HERE, "..", "..");

/**
 * サブプロセスの `bun test` に読み込ませるテストファイル (プロジェクトルートからの相対パス)。
 * Bun 組み込みのランナーでもそのまま成功し、自分では `bun test` を起動しないファイルを選ぶ。
 */
const TARGET_TEST_FILE = "scripts/__tests__/calculateContrast.test.ts";

/**
 * サブプロセスの待ち時間の上限 (ミリ秒)。ガードが働いていれば 1 秒未満で終了する。
 * 上限を超えた場合は `status` が `null` になり、終了コードのアサーションで失敗する。
 */
const SPAWN_TIMEOUT_MS = 30_000;

describe("bun test の誤用ガード (scripts/bunTestGuard.ts)", () => {
  let status: number | null;
  let stdout: string;
  let stderr: string;

  beforeAll(() => {
    const result = spawnSync("bun", ["test", TARGET_TEST_FILE], {
      cwd: PROJECT_ROOT,
      encoding: "utf8",
      timeout: SPAWN_TIMEOUT_MS,
    });
    status = result.status;
    stdout = result.stdout;
    stderr = result.stderr;
  }, SPAWN_TIMEOUT_MS + 5_000);

  it("bun test を実行すると終了コード 1 で失敗する", () => {
    expect(status).toBe(1);
  });

  it("bun test を実行すると Vitest の起動コマンドが標準エラーに案内される", () => {
    expect(stderr).toContain("bun run test");
  });

  it("bun test を実行してもテストが 1 件も実行されない", () => {
    // Bun 組み込みのテストランナーは、テストを実行すると最後に
    // 「Ran <件数> tests across <ファイル数> files.」という集計行を出力する。
    // ガードが先に終了させていれば、この集計行はどこにも出力されない。
    expect(`${stdout}\n${stderr}`).not.toMatch(/Ran \d+ tests? across/);
  });
});
