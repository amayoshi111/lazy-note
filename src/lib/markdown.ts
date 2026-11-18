import { Marked, type RendererObject } from "marked";
import {
  calculateReadingTime,
  extractBodyContent,
  extractExcerpt,
  extractSectionContent,
  extractSummaryFromContent,
  extractTitle,
  type PostSummary,
  splitLines,
} from "./markdownParser";

// PostSummary型を再エクスポート
export type { PostSummary };

/**
 * 目次の各項目を表すインターフェース
 */
export interface TocItem {
  id: string;
  text: string;
  level: number; // 2 or 3
}

/**
 * 画像パスをアプリケーションのベースパスに変換する
 * @param src 画像のソースパス
 * @returns 変換後のパス
 */
const resolveImagePath = (src: string): string => {
  // images/ で始まる相対パスを /datasources/images/ に変換
  if (src.startsWith("images/")) {
    // パストラバーサルを防止
    if (src.includes("..")) {
      return "";
    }
    const base = import.meta.env.DEV ? "" : "/lazy-note";
    return `${base}/datasources/${src}`;
  }
  // それ以外はそのまま返す（外部URLなど）
  return src;
};

/**
 * HTML属性に埋め込む文字列をエスケープする
 * @param str エスケープ対象の文字列
 * @returns エスケープ済み文字列
 */
export const escapeHtmlAttr = (str: string): string => {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

/**
 * HTML のテキストコンテンツに埋め込む文字列をエスケープする
 *
 * 属性値ではないテキストノード（pre/code の表示内容など）向けに、
 * `& < >` の 3 文字のみをエスケープする。`"` / `'` は属性区切り文字を
 * 兼ねないテキストコンテキストでは無害なため意図的に対象外とする
 * （属性値に埋め込む場合は escapeHtmlAttr を使うこと）。
 * @param str エスケープ対象の文字列
 * @returns エスケープ済み文字列
 */
export const escapeHtmlText = (str: string): string => {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
};

/**
 * parseMarkdown 呼び出しごとに専用の Marked インスタンスを生成する。
 *
 * tocItems は parseMarkdown のローカル配列をクロージャ経由で renderer に共有させる。
 * モジュールスコープの可変状態を持たないため、並行呼び出しや将来的な async モード化、
 * SSR / Worker 環境でも状態が交錯しない。
 */
const createMarkedInstance = (tocItems: TocItem[]): Marked => {
  const renderer: RendererObject = {
    image({ href, title, text }) {
      const resolvedHref = resolveImagePath(href);
      const escapedHref = escapeHtmlAttr(resolvedHref);
      const escapedText = escapeHtmlAttr(text);
      const titleAttr = title ? ` title="${escapeHtmlAttr(title)}"` : "";
      return `<img src="${escapedHref}" alt="${escapedText}"${titleAttr} loading="lazy" decoding="async">`;
    },
    heading({ text, depth, tokens }) {
      const rendered = this.parser.parseInline(tokens);
      if (depth === 2 || depth === 3) {
        const id = `heading-${tocItems.length}`;
        tocItems.push({ id, text, level: depth });
        return `<h${depth} id="${id}">${rendered}</h${depth}>`;
      }
      return `<h${depth}>${rendered}</h${depth}>`;
    },
    code({ text, lang }) {
      const safeLang = lang ? lang.replace(/[^a-zA-Z0-9-]/g, "") : "";
      const langClass = safeLang ? ` class="language-${safeLang}"` : "";
      const escapedForAttr = escapeHtmlAttr(text);
      const escapedForDisplay = escapeHtmlText(text);
      return `<div class="code-block-wrapper"><button type="button" class="copy-btn" data-code="${escapedForAttr}">コピー</button><pre><code${langClass}>${escapedForDisplay}</code></pre></div>`;
    },
  };

  return new Marked({
    breaks: true, // 改行を<br>タグに変換
    gfm: true, // GitHub Flavored Markdownを有効化
    renderer,
  });
};

/**
 * 投稿の完全なデータ（詳細ページで使用）
 * PostSummaryを継承して型の一貫性を保証
 */
export interface Post extends PostSummary {
  content: string;
  rawContent: string;
  toc: TocItem[];
  /**
   * 任意の加筆日時。`## 更新日時` セクションから抽出する。
   * 一覧用の PostSummary には流さず、記事詳細ページ専用とする
   * (二重経路 drift を防ぐため一覧経路には露出しない)。
   */
  updatedAt?: string;
}

export const parseMarkdown = (content: string, timestamp: string): Post => {
  const lines = splitLines(content);

  const title = extractTitle(lines);
  const createdAt = extractSectionContent(lines, "投稿日時");
  const updatedAt = extractSectionContent(lines, "更新日時");
  const author = extractSectionContent(lines, "筆者名");
  const bodyContent = extractBodyContent(lines);

  // tocItems は関数ローカルに閉じ込め、renderer のクロージャ経由で共有する。
  // 呼び出しごとに専用の Marked インスタンスを生成するため、モジュール state を介さない。
  const tocItems: TocItem[] = [];
  const markedInstance = createMarkedInstance(tocItems);
  const parsedContent = markedInstance.parse(bodyContent, {
    async: false,
  });

  return {
    id: timestamp,
    title,
    createdAt,
    updatedAt,
    content: parsedContent,
    author,
    rawContent: content,
    excerpt: extractExcerpt(bodyContent),
    readingTimeMinutes: calculateReadingTime(bodyContent),
    toc: tocItems,
  };
};

/**
 * 記事ファイルのパス (`/datasources/<id>.md`) から、その Markdown を読み込む関数への対応。
 * `import.meta.glob` の戻り値をそのまま渡す。
 */
type PostLoaders = Readonly<Record<string, () => Promise<string>>>;

// 開発時も本番も同じ経路で読み込む (本番ビルドでは記事ごとの JS チャンクになる)
const postLoaders = import.meta.glob<string>("/datasources/*.md", {
  query: "?raw",
  import: "default",
});

/**
 * 記事ファイルのパスから記事 ID (拡張子を除いたファイル名) を取り出す
 */
const toPostId = (filePath: string): string =>
  filePath.replace(/^.*\//, "").replace(/\.md$/, "");

/**
 * 全投稿のメタデータを id の降順で取得する
 * @param loaders 記事ファイルのパスから Markdown を読み込む関数への対応
 */
export const loadPostSummaries = async (
  loaders: PostLoaders,
): Promise<PostSummary[]> => {
  try {
    const summaries: PostSummary[] = [];
    for (const [filePath, load] of Object.entries(loaders)) {
      summaries.push(
        extractSummaryFromContent(await load(), toPostId(filePath)),
      );
    }
    return summaries.sort((a, b) => b.id.localeCompare(a.id));
  } catch (error) {
    console.error("Error loading posts:", error);
    return [];
  }
};

/**
 * 指定した id の記事を取得する。対応するファイルが無ければ null を返す
 * @param loaders 記事ファイルのパスから Markdown を読み込む関数への対応
 * @param timestamp 記事 ID
 */
export const loadPost = async (
  loaders: PostLoaders,
  timestamp: string,
): Promise<Post | null> => {
  const load = loaders[`/datasources/${timestamp}.md`];
  if (!load) {
    return null;
  }
  try {
    return parseMarkdown(await load(), timestamp);
  } catch (error) {
    console.error(`Error loading post ${timestamp}:`, error);
    return null;
  }
};

/**
 * 全投稿のメタデータを取得（一覧表示用、高速化のためcontentを含まない）
 */
export const getAllPostSummaries = (): Promise<PostSummary[]> =>
  loadPostSummaries(postLoaders);

export const getPost = (timestamp: string): Promise<Post | null> =>
  loadPost(postLoaders, timestamp);
