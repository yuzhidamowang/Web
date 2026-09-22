import Link from "next/link";
import { ORDER_STATUSES, labelOf } from "@/lib/constants";
import { getDashboard } from "@/lib/db";
import { formatQty, greeting } from "@/lib/format";

export default function HomePage() {
  const data = getDashboard();
  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">库房概况</p>
          <h1>{greeting()}</h1>
          <p className="lede">库存、出入库、客户和订单都在这本台账里。订单只是登记，备货出库还是要到出入库里记一笔。</p>
        </div>
      </div>
      <div className="quick">
        <Link className="btn primary" href="/inventory">
          看库存
        </Link>
        <Link className="btn ghost" href="/movements">
          登记出入库
        </Link>
        <Link className="btn ghost" href="/orders/new">
          记一笔订单
        </Link>
      </div>
      <section className="stats">
        <div className="stat">
          <b>{data.itemCount}</b>
          <span>在库品项</span>
        </div>
        <div className={data.lowCount > 0 ? "stat warn" : "stat"}>
          <b>{data.lowCount}</b>
          <span>低于安全库存</span>
        </div>
        <div className="stat">
          <b>{data.recentMovements}</b>
          <span>近 7 日流水</span>
        </div>
        <div className="stat">
          <b>{data.openOrders}</b>
          <span>待完成订单</span>
        </div>
      </section>
      <div className="split">
        <section className="card">
          <div className="card-head">
            <h2>该补货了</h2>
            <Link href="/inventory?low=1">全部预警</Link>
          </div>
          {data.lowItems.length === 0 ? (
            <p className="empty">目前没有低于安全库存的品项。</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>品项</th>
                    <th className="num">现存</th>
                    <th className="num">安全库存</th>
                    <th>库位</th>
                  </tr>
                </thead>
                <tbody>
                  {data.lowItems.map((item) => (
                    <tr key={item.id} className="low">
                      <td>
                        <span className="item-name">{item.name}</span>
                        <span className="sub">{item.category}</span>
                      </td>
                      <td className="num">
                        <strong className="hot">{formatQty(item.quantity)}</strong>
                        <span className="unit">{item.unit}</span>
                      </td>
                      <td className="num">{formatQty(item.safety_stock)}</td>
                      <td>{item.location || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <section className="card">
          <div className="card-head">
            <h2>还没送完的订单</h2>
            <Link href="/orders">全部订单</Link>
          </div>
          {data.openOrdersList.length === 0 ? (
            <p className="empty">没有待完成的订单。</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>订单</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {data.openOrdersList.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <Link href={`/orders/${order.id}`}>{order.order_no}</Link>
                        <span className="sub">
                          {order.customer_name} · 期望 {order.expected_delivery_date}
                        </span>
                      </td>
                      <td>
                        <span className={`tag ${order.status}`}>{labelOf(ORDER_STATUSES, order.status)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
