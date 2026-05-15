import Link from "next/link";
import MerchantProfileMenuChevron from "@/components/merchant/MerchantProfileMenuChevron";
import MerchantProfileMenuGlyph, {
  type MerchantProfileMenuFeature
} from "@/components/merchant/MerchantProfileMenuGlyph";

export default function MerchantProfileMenuRow({
  desc,
  feature,
  glyphColor,
  href,
  title
}: {
  desc?: string;
  feature: MerchantProfileMenuFeature;
  glyphColor: string;
  href: string;
  title: string;
}) {
  return (
    <Link className="merchant-profile-menu-row" href={href as `/${string}`}>
      <span className="merchant-profile-menu-row-icon">
        <MerchantProfileMenuGlyph color={glyphColor} feature={feature} />
      </span>
      <span className="merchant-profile-menu-row-body">
        <span className="block truncate">{title}</span>
        {desc ? <span className="merchant-profile-menu-row-desc block truncate">{desc}</span> : null}
      </span>
      <span className="shrink-0 opacity-45" style={{ color: "var(--muted)" }}>
        <MerchantProfileMenuChevron />
      </span>
    </Link>
  );
}
