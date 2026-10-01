import { Flash } from "@/components/Flash";
import { OrderForm } from "@/components/OrderForm";
import { PageHeader } from "@/components/PageHeader";
import { listCustomers, listItems } from "@/lib/db";
import { addDays, todayStamp } from "@/lib/format";

export const metadata = { title: "登记订单" };

export default async function NewOrderPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const items = listItems({});
  const customers = listCustomers();
  const today = todayStamp();
  return (
    <>
      <PageHeader eyebrow="订单" title="手工登记订单" lede="来源固定为手工录入。保存后状态是「已记录」，库存保持不变。" />
      <Flash error={params.error} />
      {customers.length === 0 || items.length === 0 ? (
        <div className="card">
          <p>老板，登记订单前需要至少一位客户和一项食材。</p>
          <div className="quick">
            <a className="btn ghost" href="/customers/new">
              新增客户
            </a>
            <a className="btn ghost" href="/inventory/new">
              新增品项
            </a>
          </div>
        </div>
      ) : (
        <OrderForm
          items={items.map((item) => ({ id: item.id, name: item.name, category: item.category, unit: item.unit, spec: item.spec }))}
          customers={customers.map((customer) => ({ id: customer.id, name: customer.name }))}
          defaultOrderedAt={today}
          defaultDelivery={addDays(today, 1)}
        />
      )}
    </>
  );
}
