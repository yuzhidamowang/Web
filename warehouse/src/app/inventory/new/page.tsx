import { ItemForm } from "@/components/ItemForm";
import { Flash } from "@/components/Flash";
import { PageHeader } from "@/components/PageHeader";
import { createItemAction } from "@/lib/actions";

export const metadata = { title: "新增品项" };

export default async function NewItemPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return (
    <>
      <PageHeader eyebrow="库存" title="新增品项" lede="把新品项建档。数量可以先写成到货数，之后的增减走出入库。" />
      <Flash error={params.error} />
      <ItemForm action={createItemAction} />
    </>
  );
}
