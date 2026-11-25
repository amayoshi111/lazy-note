import { memo, useCallback } from "react";
import { css } from "../../../styled-system/css";
import { Button } from "../atoms/Button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

// スタイルをコンポーネント外に定数として定義
// 直前のセクションとの間隔はセクションどうしと同じ 64px。
const navStyles = css({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: "3x",
  marginTop: "8x",
});

// 「前へ」「次へ」の幅を揃える (文字数が同じでも書体によって幅が変わるため)。
const buttonMinWidthStyles = css({
  minWidth: "96px",
});

const pageInfoStyles = css({
  textStyle: "std-16n-170",
  color: "fg.secondary",
  fontVariantNumeric: "tabular-nums",
  textAlign: "center",
});

/**
 * ページネーションコンポーネント（CSS定数抽出 + React.memoでメモ化）
 * 前へ/次へボタンと現在のページ情報を表示
 */
export const Pagination = memo(
  ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
    const canGoPrevious = currentPage > 1;
    const canGoNext = currentPage < totalPages;

    const handlePrevious = useCallback(() => {
      if (currentPage > 1) {
        onPageChange(currentPage - 1);
      }
    }, [currentPage, onPageChange]);

    const handleNext = useCallback(() => {
      if (currentPage < totalPages) {
        onPageChange(currentPage + 1);
      }
    }, [currentPage, totalPages, onPageChange]);

    if (totalPages <= 1) {
      return null;
    }

    return (
      <nav className={navStyles} aria-label="ページネーション">
        <Button
          onClick={handlePrevious}
          disabled={!canGoPrevious}
          variant="secondary"
          className={buttonMinWidthStyles}
        >
          前へ
        </Button>

        <span className={pageInfoStyles}>
          {currentPage} / {totalPages} ページ
        </span>

        <Button
          onClick={handleNext}
          disabled={!canGoNext}
          variant="secondary"
          className={buttonMinWidthStyles}
        >
          次へ
        </Button>
      </nav>
    );
  },
);

Pagination.displayName = "Pagination";
