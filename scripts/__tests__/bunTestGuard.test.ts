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
 * 再帰の防止:
 *   ガードが効かなくなった場合、サブプロセスの `bun test` は組み込みのランナーで
 *   本ファイル自身も読み込む (組み込みのランナーは "vitest" からの import を解釈できる)。
 *   そこで再び `bun test` を起動すると入れ子の起動が止まらなくなるため、サブプロセスには
 *   環境変数で目印を渡し、目印があるとき (= サブプロセスの中で読み込まれたとき) は
 *   検証そのものを行わない。これにより、ガードが効かなくなった場合も、
 *   終了コードと出力のアサーションの失敗として検出できる。
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(HERE, "..", "..");

/** サブプロセスの `bun test` に渡す、入れ子の起動を防ぐための目印 */
const GUARD_CHILD_ENV = "LAZY_NOTE_BUN_TEST_GUARD_CHILD";
const isGuardChild = process.env[GUARD_CHILD_ENV] === "1";

/**
 * サブプロセスの待ち時間の上限 (ミリ秒)。ガードが働いていれば 1 秒未満で終了する。
 * 上限を超えた場合は `status` が `null` になり、終了コードのアサーションで失敗する。
 */
const SPAWN_TIMEOUT_MS = 30_000;

describe.skipIf(isGuardChild)(
  "bun test の誤用ガード (scripts/bunTestGuard.ts)",
  () => {
    let status: number | null;
    let stdout: string;
    let stderr: string;

    beforeAll(() => {
      const result = spawnSync("bun", ["test"], {
        cwd: PROJECT_ROOT,
        encoding: "utf8",
        timeout: SPAWN_TIMEOUT_MS,
        env: { ...process.env, [GUARD_CHILD_ENV]: "1" },
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
  },
);
