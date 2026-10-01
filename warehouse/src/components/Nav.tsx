"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "首页" },
  { href: "/inventory", label: "库存" },
  { href: "/movements", label: "出入库" },
  { href: "/customers", label: "客户" },
  { href: "/orders", label: "订单" },
];

export function Nav({ lowCount }: { lowCount: number }) {
  const pathname = usePathname();
  return (
    <aside className="sidebar">
      <div className="sidebar-inner">
        <div className="brand">
          <span className="mark" aria-hidden="true">仓</span>
          <span>
            <strong>食材库房</strong>
            <small>内部台账</small>
          </span>
        </div>
        <nav className="nav">
          {LINKS.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link key={link.href} href={link.href} className={active ? "active" : undefined}>
                <span>{link.label}</span>
                {link.href === "/inventory" && lowCount > 0 ? <span className="badge">{lowCount}</span> : null}
              </Link>
            );
          })}
        </nav>
        <p className="side-foot">内部演示，未设登录。客户自助下单以后再接。</p>
      </div>
    </aside>
  );
}
