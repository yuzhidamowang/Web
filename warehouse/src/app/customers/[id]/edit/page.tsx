import { notFound } from "next/navigation";
import { CustomerForm } from "@/components/CustomerForm";
import { Flash } from "@/components/Flash";
import { PageHeader } from "@/components/PageHeader";
import { updateCustomerAction } from "@/lib/actions";
import { getCustomer } from "@/lib/db";

export const metadata = { title: "编辑客户" };

export default async function EditCustomerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const customerId = Number(id);
  if (!Number.isInteger(customerId)) notFound();
  const customer = getCustomer(customerId);
  if (!customer) notFound();
  return (
    <>
      <PageHeader eyebrow="客户" title={`编辑 ${customer.name}`} />
      <Flash error={query.error} />
      <CustomerForm action={updateCustomerAction} customer={customer} />
    </>
  );
}
