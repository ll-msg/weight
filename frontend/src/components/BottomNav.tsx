"use client";

// 底部导航栏：在已选定赛季的页面间切换（记录 / 对抗 / 战报 / 我的）。

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";

// 用 TravelBookLite 像素图标作为导航图标
const ITEMS = [
  { href: "/dashboard", icon: "/ui/IconHeart.png", label: "记录" },
  { href: "/competition", icon: "/ui/IconEnergy.png", label: "对抗" },
  { href: "/report", icon: "/ui/IconStar.png", label: "战报" },
  { href: "/seasons", icon: "/ui/IconHome.png", label: "赛季" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const params = useSearchParams();
  const seasonId = params.get("season");
  // 记录/对抗/战报需要携带赛季 id；赛季页不需要
  const query = seasonId ? `?season=${seasonId}` : "";

  return (
    <nav className="bottom-nav">
      {ITEMS.map((it) => {
        const href = it.href === "/seasons" ? it.href : `${it.href}${query}`;
        const active = pathname === it.href;
        return (
          <Link key={it.href} href={href} className={active ? "active" : ""}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="nav-icon" src={it.icon} alt={it.label} />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
