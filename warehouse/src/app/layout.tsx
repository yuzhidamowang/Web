import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { countLowStock } from "@/lib/db";
import "./globals.css";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: { default: "食材库房", template: "%s · 食材库房" },
  description: "食材供应商内部库房：库存、出入库、客户与订单台账",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const lowCount = countLowStock();
  return (
    <html lang="zh-CN">
      <body>
        <div className="app">
          <Nav lowCount={lowCount} />
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
