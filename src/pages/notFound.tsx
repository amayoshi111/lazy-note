import { FileQuestion } from "../components/atoms/icons";
import { EmptyState } from "../components/common/EmptyState";
import { SITE_NAME } from "../lib/i18nLiterals";

const NOT_FOUND_TITLE = "ページが見つかりません" as const;
const NOT_FOUND_DESCRIPTION =
  "URL が間違っているか、ページが移動した可能性があります。" as const;

// 矢印は装飾なので aria-hidden にし、リンクのアクセシブル名をテキストだけにする
const NOT_FOUND_ACTION_ARROW = "←" as const;
const NOT_FOUND_ACTION_TEXT = "トップページに戻る" as const;

const NOT_FOUND_DOCUMENT_TITLE = `${NOT_FOUND_TITLE} | ${SITE_NAME}` as const;

/**
 * どのルートにも当たらないパスで表示するページ。
 *
 * これが無いと、存在しないパスを直接開いたときに何も描画されない空白の画面になる。
 * 記事が見つからないときの画面（`posts/Post.tsx`）と同じ作りにする。
 */
const NotFound = () => {
  return (
    <>
      <title>{NOT_FOUND_DOCUMENT_TITLE}</title>
      <EmptyState
        icon={FileQuestion}
        title={NOT_FOUND_TITLE}
        description={NOT_FOUND_DESCRIPTION}
        action={{
          label: (
            <>
              <span aria-hidden="true">{NOT_FOUND_ACTION_ARROW}</span>
              {NOT_FOUND_ACTION_TEXT}
            </>
          ),
          href: "/",
        }}
      />
    </>
  );
};

export default NotFound;
