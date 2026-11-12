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
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(HERE, "..", "..");

describe("bun test の誤用ガード (scripts/bunTestGuard.ts)", () => {
  let status: number | null;
  let stdout: string;
  let stderr: string;

  beforeAll(() => {
    const result = spawnSync("bun", ["test"], {
      cwd: PROJECT_ROOT,
      encoding: "utf8",
    });
    status = result.status;
    stdout = result.stdout;
    stderr = result.stderr;
  });

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
