import { CustomerForm } from "@/components/CustomerForm";
import { Flash } from "@/components/Flash";
import { PageHeader } from "@/components/PageHeader";
import { createCustomerAction } from "@/lib/actions";

export const metadata = { title: "新增客户" };

export default async function NewCustomerPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return (
    <>
      <PageHeader eyebrow="客户" title="新增客户" lede="名称必填。联系人、电话和地址方便对单、送货。" />
      <Flash error={params.error} />
      <CustomerForm action={createCustomerAction} />
    </>
  );
}
