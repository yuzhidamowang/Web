import Link from "next/link";
import { notFound } from "next/navigation";
import { Flash } from "@/components/Flash";
import { SubmitButton } from "@/components/SubmitButton";
import { ORDER_SOURCES, ORDER_STATUSES, labelOf } from "@/lib/constants";
import { updateOrderStatusAction } from "@/lib/actions";
import { getOrder } from "@/lib/db";
import { formatQty, formatWhen } from "@/lib/format";

export const metadata = { title: "订单详情" };

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const orderId = Number(id);
  if (!Number.isInteger(orderId)) notFound();
  const order = getOrder(orderId);
  if (!order) notFound();

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">订单</p>
          <h1>{order.order_no}</h1>
          <p className="lede">{order.customer_name}</p>
        </div>
        <Link className="btn ghost" href="/orders">
          返回订单
        </Link>
      </div>
      <Flash ok={query.ok} error={query.error} />
      <section className="meta">
        <div>
          <span>下单日期</span>
          <strong>{order.ordered_at}</strong>
        </div>
        <div>
          <span>期望配送</span>
          <strong>{order.expected_delivery_date || "—"}</strong>
        </div>
        <div>
          <span>来源</span>
          <strong>{labelOf(ORDER_SOURCES, order.source)}</strong>
        </div>
        <div>
          <span>更新时间</span>
          <strong>{formatWhen(order.updated_at)}</strong>
        </div>
      </section>
      <section className="card">
        <h2>状态</h2>
        <form action={updateOrderStatusAction} className="status-form">
          <input type="hidden" name="id" value={order.id} />
          <select name="status" defaultValue={order.status}>
            {ORDER_STATUSES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <SubmitButton pendingLabel="更新中…">更新状态</SubmitButton>
          <span className={`tag ${order.status}`}>{labelOf(ORDER_STATUSES, order.status)}</span>
        </form>
        <p className="hint notice">改状态不会扣库存。货出库时，请到出入库单独登记。</p>
        <p>
          {order.contact || "未填联系人"}
          {order.phone ? ` · ${order.phone}` : ""}
          {order.address ? ` · ${order.address}` : ""}
        </p>
        <p>{order.note ? `备注：${order.note}` : "没有备注。"}</p>
      </section>
      <section className="card gap-top">
        <h2>明细</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>品项</th>
                <th className="num">数量</th>
                <th>单位</th>
              </tr>
            </thead>
            <tbody>
              {order.lines.map((line) => (
                <tr key={line.id}>
                  <td>{line.item_name}</td>
                  <td className="num">{formatQty(line.quantity)}</td>
                  <td>{line.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
