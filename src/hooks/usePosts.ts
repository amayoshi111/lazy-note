import { useEffect, useState } from "react";
import { getAllPostSummaries, type PostSummary } from "../lib/markdown";

/**
 * 1 ページあたりの記事件数。
 *
 * ホームの 1 ページ目の構成 (最新の記事 1 + 抜粋つきの行 6 + タイトルだけの行 9) に
 * 合わせて 16 に設定している (Issue #395 で決めた件数を引き継ぐ)。記事が 16 件を
 * 超えた 17 件目以降は自動でページネーション (2 ページ目以降) される。
 * 2 ページ目以降は「最新の記事」を出さず、全件を記事一覧に並べる (HomePage 参照)。
 *
 * TODO: 記事が 16 件を大きく超えてきた場合、lazy-load / 仮想スクロール導入を別 Issue
 * で検討する。現時点 (運用記事数 < 30 程度) では 1 ページ完結 + Pagination 自動表示で
 * 十分機能するため、本 PR ではこの値で固定する。
 */
const POSTS_PER_PAGE = 16;

interface UsePostsReturn {
  posts: PostSummary[];
  /**
   * 全期間の記事一覧 (ページング前)。
   *
   * Issue #492 (N-5 Resurface) 対応: Resurface の浮上選定は「ページング後の
   * 16 件」ではなく「全期間の全記事」に対して行う必要があるため、
   * paginate される前の配列を別途 expose する。
   * 1 ページに収まる運用では posts と同一だが、将来 16 件超で Pagination が
   * 動いたときに HomePage 側で全件を参照できるようにしておく。
   */
  allPosts: PostSummary[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalPosts: number;
  setCurrentPage: (page: number) => void;
}

/**
 * 記事一覧を取得するカスタムフック（ページング機能付き）
 * 高速化のためメタデータのみを取得（本文は含まない）
 *
 * useEffect の deps は空配列のため再 fetch は走らず race condition は発生しないが、
 * unmount 後に Promise が解決した際の setState を防止するため cancellation flag を
 * 併用する。
 *
 * @returns 記事一覧、ローディング状態、エラー状態、ページング情報
 */
export const usePosts = (): UsePostsReturn => {
  const [allPosts, setAllPosts] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    getAllPostSummaries()
      .then((posts) => {
        if (cancelled) {
          return;
        }
        setAllPosts(posts);
      })
      .catch((err) => {
        console.error("Failed to load posts:", err);
        if (cancelled) {
          return;
        }
        setError(
          err instanceof Error ? err.message : "記事の読み込みに失敗しました",
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const totalPosts = allPosts.length;
  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE;
  const posts = allPosts.slice(startIndex, endIndex);

  return {
    posts,
    allPosts,
    loading,
    error,
    currentPage,
    totalPages,
    totalPosts,
    setCurrentPage,
  };
};
