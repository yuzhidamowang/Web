import { Flash } from "@/components/Flash";
import { MovementForm } from "@/components/MovementForm";
import { PageHeader } from "@/components/PageHeader";
import { listItems, listMovements } from "@/lib/db";
import { formatQty, formatWhen } from "@/lib/format";

export const metadata = { title: "出入库" };

export default async function MovementsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string; item?: string }>;
}) {
  const params = await searchParams;
  const items = listItems({});
  const movements = listMovements();
  const requested = Number(params.item);

  return (
    <>
      <PageHeader eyebrow="出入库" title="收货与发货" lede="入库、出库都会改当前库存，并留下流水。出库数量不能超过现存量，库存不会变成负数。" />
      <Flash ok={params.ok} error={params.error} />
      <MovementForm items={items} defaultItemId={Number.isInteger(requested) ? requested : undefined} />
      <section className="card" style={{ marginTop: 14 }}>
        <h2>最近流水</h2>
        {movements.length === 0 ? (
          <p className="empty">还没有出入库记录。</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>时间</th>
                  <th>品项</th>
                  <th>类型</th>
                  <th className="num">数量</th>
                  <th>备注</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((row) => (
                  <tr key={row.id}>
                    <td>{formatWhen(row.created_at)}</td>
                    <td>{row.item_name}</td>
                    <td>
                      <span className={row.type === "in" ? "tag in" : "tag out"}>{row.type === "in" ? "入库" : "出库"}</span>
                    </td>
                    <td className="num">
                      {row.type === "in" ? "+" : "−"}
                      {formatQty(row.quantity)}
                      <span className="unit">{row.item_unit}</span>
                    </td>
                    <td>{row.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
