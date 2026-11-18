import { describe, expect, it } from "vitest";
import { sanitizePostHtml } from "../sanitize";

describe("sanitizePostHtml", () => {
  describe("既定の XSS パターン除去 (DOMPurify 既存防御)", () => {
    it("scriptタグが除去される", () => {
      const dirty = "<script>alert('xss')</script>";
      const result = sanitizePostHtml(dirty);

      expect(result).not.toContain("<script>");
      expect(result).not.toContain("alert");
    });

    it("imgタグのonerrorイベントハンドラが除去される", () => {
      const dirty = "<img src=x onerror=alert(1)>";
      const result = sanitizePostHtml(dirty);

      expect(result).not.toContain("onerror");
      expect(result).not.toContain("alert");
    });

    it("javascript:URIが除去される", () => {
      const dirty = '<a href="javascript:alert(1)">click</a>';
      const result = sanitizePostHtml(dirty);

      expect(result).not.toContain("javascript:");
    });

    it("SVGタグ内のスクリプトが除去される", () => {
      const dirty = '<svg><script>alert("xss")</script></svg>';
      const result = sanitizePostHtml(dirty);

      expect(result).not.toContain("<script>");
      expect(result).not.toContain("alert");
    });

    it("iframeタグが除去される", () => {
      const dirty = '<iframe src="https://evil.com"></iframe>';
      const result = sanitizePostHtml(dirty);

      expect(result).not.toContain("<iframe");
    });

    it("onloadイベントハンドラが除去される", () => {
      const dirty = '<body onload="alert(1)">';
      const result = sanitizePostHtml(dirty);

      expect(result).not.toContain("onload");
      expect(result).not.toContain("alert");
    });
  });

  describe("安全なHTMLの保持", () => {
    it("pタグが保持される", () => {
      const safe = "<p>テキストです。</p>";
      const result = sanitizePostHtml(safe);

      expect(result).toBe(safe);
    });

    it("httpsリンクを含むaタグが保持される", () => {
      const safe = '<a href="https://example.com">リンク</a>';
      const result = sanitizePostHtml(safe);

      expect(result).toContain('href="https://example.com"');
      expect(result).toContain("リンク");
    });

    it("strongタグが保持される", () => {
      const safe = "<strong>太字テキスト</strong>";
      const result = sanitizePostHtml(safe);

      expect(result).toBe(safe);
    });

    it("ulとliタグが保持される", () => {
      const safe = "<ul><li>項目1</li><li>項目2</li></ul>";
      const result = sanitizePostHtml(safe);

      expect(result).toContain("<ul>");
      expect(result).toContain("<li>項目1</li>");
    });

    it("imgタグのsrcとaltが保持される", () => {
      const safe = '<img src="https://example.com/image.png" alt="説明">';
      const result = sanitizePostHtml(safe);

      expect(result).toContain('src="https://example.com/image.png"');
      expect(result).toContain('alt="説明"');
    });
  });

  describe("本番設定 (ADD_TAGS: button) 下の許可挙動", () => {
    it("buttonタグが保持される", () => {
      const safe = '<button type="button">クリック</button>';
      const result = sanitizePostHtml(safe);

      expect(result).toContain("<button");
      expect(result).toContain("クリック</button>");
    });

    it("renderer.code が生成するコードブロックラッパー構造が保持される", () => {
      const safe =
        '<div class="code-block-wrapper"><button type="button" class="copy-btn">コピー</button><pre><code class="language-bash">echo hi</code></pre></div>';
      const result = sanitizePostHtml(safe);

      expect(result).toContain('class="code-block-wrapper"');
      expect(result).toContain('class="copy-btn"');
      expect(result).toContain('<code class="language-bash">echo hi</code>');
    });
  });

  describe("本番設定下の XSS パターン除去 (button 許可下のフルパス検証)", () => {
    it("button タグの onclick 属性が除去される", () => {
      const dirty = '<button onclick="alert(1)">XSS</button>';
      const result = sanitizePostHtml(dirty);

      expect(result).toContain("<button");
      expect(result).not.toContain("onclick");
      expect(result).not.toContain("alert(1)");
    });

    it("button タグの onmouseover 等の他イベントハンドラも除去される", () => {
      const dirty =
        '<button onmouseover="alert(1)" onfocus="alert(2)">XSS</button>';
      const result = sanitizePostHtml(dirty);

      expect(result).toContain("<button");
      expect(result).not.toContain("onmouseover");
      expect(result).not.toContain("onfocus");
      expect(result).not.toContain("alert");
    });

    it("button タグの formaction 属性が除去される", () => {
      const dirty = '<button formaction="javascript:alert(1)">submit</button>';
      const result = sanitizePostHtml(dirty);

      expect(result).toContain("<button");
      expect(result).not.toContain("formaction");
      expect(result).not.toContain("javascript:");
    });

    it("button の属性値に script タグの文字列を仕込んでも script 要素は残らない", () => {
      // 記事に直接書いた <button> + 危険な属性値を再現する
      const dirty =
        '<button title="&quot;><script>alert(1)</script>">click</button>';
      const result = sanitizePostHtml(dirty);

      // DOMPurify を通った後、独立した <script> タグは残らない
      expect(result).not.toContain("<script>");
      expect(result).not.toContain("alert(1)</script>");
    });

    it("button の属性値からの生クォートブレイクアウト試行は属性値として正規化され、実行コンテキストを生まない", () => {
      // 生のHTML文字列で属性値にダブルクォートを含めようとしたケース。
      // ブラウザのHTMLパーサが属性値の境界を再解釈し、後続は別属性/テキストになる。
      const dirty =
        '<button title="\\"><script>alert(1)</script>">click</button>';
      const result = sanitizePostHtml(dirty);

      // <script> はサニタイズ対象なので残らない
      expect(result).not.toContain("<script>");
      expect(result).not.toContain("alert(1)");
    });

    it("button タグ内に script タグを直接埋め込もうとしても script は除去される", () => {
      const dirty = "<button>click<script>alert(1)</script></button>";
      const result = sanitizePostHtml(dirty);

      expect(result).toContain("<button");
      expect(result).not.toContain("<script>");
      expect(result).not.toContain("alert(1)");
    });
  });

  describe("renderer.code 経路を経た本番想定 HTML の挙動 (退行検知)", () => {
    // コピーボタンは code 要素のテキストをコピーするため、コードがそのまま残ることを固定する
    it("`]>` や `-->` を含むコードは code 要素のテキストとして保持される", () => {
      const html =
        '<div class="code-block-wrapper"><button type="button" class="copy-btn">コピー</button><pre><code>const m: Map&lt;string, string[]&gt; = new Map(); &lt;!-- note --&gt;</code></pre></div>';
      const result = sanitizePostHtml(html);

      expect(result).toContain(
        "<code>const m: Map&lt;string, string[]&gt; = new Map(); &lt;!-- note --&gt;</code>",
      );
    });

    it("コード中の script タグの文字列は code 要素のテキストとして保持され、script 要素にならない", () => {
      const html =
        '<div class="code-block-wrapper"><button type="button" class="copy-btn">コピー</button><pre><code>&lt;script&gt;alert(1)&lt;/script&gt;</code></pre></div>';
      const result = sanitizePostHtml(html);

      expect(result).toContain(
        "<code>&lt;script&gt;alert(1)&lt;/script&gt;</code>",
      );
      expect(result).not.toContain("<script>");
    });
  });
});
