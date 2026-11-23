import { Link } from "react-router-dom";
import { css } from "../../../styled-system/css";
import { focusRingStyles } from "../../styles/focusRing";

interface BrandNameProps {
  variant?: "header" | "footer";
}

// 押せる要素として 44px の高さを確保する。
const brandBaseStyles = css({
  display: "inline-flex",
  alignItems: "center",
  minHeight: "target",
  textDecoration: "none",
});

// header はサイト名の見出し相当 (fg.primary)、footer は補助情報相当 (fg.secondary)。
const brandVariantStyles = {
  header: css({ textStyle: "std-20b-150", color: "fg.primary" }),
  footer: css({ textStyle: "std-16b-170", color: "fg.secondary" }),
};

export const BrandName = ({ variant = "header" }: BrandNameProps) => {
  // Header / Footer どちらも bg.canvas 上に置かれるため、visible focus ring は
  // 通常背景向けの `focusRingStyles` (内側 citrus / 外側 ink-900 or cream-50) を使う。
  return (
    <Link
      to="/"
      className={`${brandBaseStyles} ${brandVariantStyles[variant]} ${focusRingStyles}`}
      data-variant={variant}
      data-focus-ring="default"
    >
      Lazy Note
    </Link>
  );
};
