import Link from "next/link";
import { Flash } from "@/components/Flash";
import { PageHeader } from "@/components/PageHeader";
import { listCustomers } from "@/lib/db";

export const metadata = { title: "客户" };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const params = await searchParams;
  const customers = listCustomers();
  return (
    <>
      <PageHeader
        eyebrow="客户"
        title="常来的客户"
        lede="先把食堂、餐厅记上，录订单时直接选。"
        action={
          <Link className="btn primary" href="/customers/new">
            新增客户
          </Link>
        }
      />
      <Flash ok={params.ok} error={params.error} />
      <div className="card">
        {customers.length === 0 ? (
          <p className="empty">还没有客户。</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>名称</th>
                  <th>联系人</th>
                  <th>电话</th>
                  <th>地址</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="item-name">{customer.name}</td>
                    <td>{customer.contact || "—"}</td>
                    <td>{customer.phone || "—"}</td>
                    <td>{customer.address || "—"}</td>
                    <td className="links">
                      <Link href={`/customers/${customer.id}/edit`}>编辑</Link>
                    </td>
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
