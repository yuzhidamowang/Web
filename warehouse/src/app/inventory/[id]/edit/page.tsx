import { notFound } from "next/navigation";
import { Flash } from "@/components/Flash";
import { ItemForm } from "@/components/ItemForm";
import { PageHeader } from "@/components/PageHeader";
import { updateItemAction } from "@/lib/actions";
import { getItem } from "@/lib/db";

export const metadata = { title: "编辑品项" };

export default async function EditItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const itemId = Number(id);
  if (!Number.isInteger(itemId)) notFound();
  const item = getItem(itemId);
  if (!item) notFound();
  return (
    <>
      <PageHeader eyebrow="库存" title={`编辑 ${item.name}`} lede="改规格、库位、安全库存或盘点数量。日常收发货仍请走出入库。" />
      <Flash error={query.error} />
      <ItemForm action={updateItemAction} item={item} />
    </>
  );
}
