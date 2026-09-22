import Link from "next/link";
import { Flash } from "@/components/Flash";
import { PageHeader } from "@/components/PageHeader";
import { ORDER_SOURCES, ORDER_STATUSES, labelOf } from "@/lib/constants";
import { listOrders } from "@/lib/db";
import { formatQty } from "@/lib/format";

export const metadata = { title: "订单" };

function summary(lines: { item_name: string; quantity: number; unit: string }[]) {
  const text = lines.map((line) => `${line.item_name} ${formatQty(line.quantity)}${line.unit}`).join("、");
  return text.length > 36 ? `${text.slice(0, 36)}…` : text;
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; ok?: string; error?: string }>;
}) {
  const params = await searchParams;
  const status = ORDER_STATUSES.find((item) => item.value === params.status)?.value;
  const orders = listOrders(status);

  return (
    <>
      <PageHeader
        eyebrow="订单"
        title="订单记录"
        lede="这里是库房手工录入。登记订单不会扣库存；改成已备货、已送达也不会。货真的离开仓库时，去出入库登记出库。"
        action={
          <Link className="btn primary" href="/orders/new">
            登记订单
          </Link>
        }
      />
      <Flash ok={params.ok} error={params.error} />
      <div className="chips">
        <Link href="/orders" className={!status ? "on" : undefined}>
          全部
        </Link>
        {ORDER_STATUSES.map((item) => (
          <Link key={item.value} href={`/orders?status=${item.value}`} className={status === item.value ? "on" : undefined}>
            {item.label}
          </Link>
        ))}
      </div>
      <div className="card">
        {orders.length === 0 ? (
          <p className="empty">没有符合条件的订单。</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>订单号</th>
                  <th>客户</th>
                  <th>下单</th>
                  <th>期望配送</th>
                  <th>状态</th>
                  <th>来源</th>
                  <th>明细</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className={order.status === "cancelled" ? "cancelled" : undefined}>
                    <td>
                      <Link href={`/orders/${order.id}`}>{order.order_no}</Link>
                    </td>
                    <td>{order.customer_name}</td>
                    <td>{order.ordered_at}</td>
                    <td>{order.expected_delivery_date || "—"}</td>
                    <td>
                      <span className={`tag ${order.status}`}>{labelOf(ORDER_STATUSES, order.status)}</span>
                    </td>
                    <td>{labelOf(ORDER_SOURCES, order.source)}</td>
                    <td>{summary(order.lines) || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
