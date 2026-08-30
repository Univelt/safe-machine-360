import Link from "next/link";

type BrandProps = {
  compact?: boolean;
  href?: string;
};

export function Brand({ compact = false, href = "/" }: BrandProps) {
  return (
    <Link className="brand" href={href} aria-label="Portal Univelt — início">
      <span className="brand-mark" aria-hidden="true">
        <span>U</span>
      </span>
      {!compact && (
        <span className="brand-copy">
          <strong>UNIVELT</strong>
          <small>Machine Safety</small>
        </span>
      )}
    </Link>
  );
}
