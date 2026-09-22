import Link from "next/link";
import { Flash } from "@/components/Flash";
import { PageHeader } from "@/components/PageHeader";
import { CATEGORIES } from "@/lib/constants";
import { listItems } from "@/lib/db";
import { expiryHint, formatQty, todayStamp } from "@/lib/format";

export const metadata = { title: "库存" };

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; low?: string; ok?: string; error?: string }>;
}) {
  const params = await searchParams;
  const category = CATEGORIES.find((item) => item === params.category) ?? "";
  const lowOnly = params.low === "1";
  const items = listItems({ q: params.q, category, lowOnly });
  const today = todayStamp();

  return (
    <>
      <PageHeader
        eyebrow="库存"
        title="食材品项"
        lede="老板，低于安全库存的行已经标红。临期的保质期也会标出来。"
        action={
          <Link className="btn primary" href="/inventory/new">
            新增品项
          </Link>
        }
      />
      <Flash ok={params.ok} error={params.error} />
      <form className="filters" method="get">
        <input type="search" name="q" placeholder="搜索品项名称" defaultValue={params.q ?? ""} />
        <select name="category" defaultValue={category}>
          <option value="">全部类别</option>
          {CATEGORIES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <label className="check">
          <input type="checkbox" name="low" value="1" defaultChecked={lowOnly} />
          只看库存不足
        </label>
        <button className="btn ghost" type="submit">
          筛选
        </button>
        <Link href="/inventory">清除</Link>
      </form>
      <div className="card">
        {items.length === 0 ? (
          <p className="empty">没有符合条件的品项。</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>品项</th>
                  <th>类别</th>
                  <th className="num">库存</th>
                  <th className="num">安全库存</th>
                  <th>库位</th>
                  <th>批次 / 保质期</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const low = item.quantity < item.safety_stock;
                  const hint = expiryHint(item.expiry_date, today);
                  return (
                    <tr key={item.id} className={low ? "low" : undefined}>
                      <td>
                        <span className="item-name">{item.name}</span>
                        <span className="sub">{item.spec ? `${item.spec} · ${item.unit}` : item.unit}</span>
                      </td>
                      <td>{item.category}</td>
                      <td className="num">
                        <strong className={low ? "hot" : undefined}>{formatQty(item.quantity)}</strong>
                        <span className="unit">{item.unit}</span>
                        {low ? <span className="tag low">库存不足</span> : null}
                      </td>
                      <td className="num">{formatQty(item.safety_stock)}</td>
                      <td>{item.location || "—"}</td>
                      <td>
                        {item.batch || "—"}
                        <span className="sub">
                          {item.expiry_date || "未填保质期"}
                          {hint ? <span className={hint === "已过期" ? "tag expired" : "tag soon"}>{hint}</span> : null}
                        </span>
                      </td>
                      <td className="links">
                        <Link href={`/inventory/${item.id}/edit`}>编辑</Link>
                        <Link href={`/movements?item=${item.id}`}>出入库</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
