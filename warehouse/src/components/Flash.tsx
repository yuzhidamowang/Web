const OK: Record<string, string> = {
  item: "品项已记下。",
  "item-updated": "品项已更新。",
  customer: "客户已记下。",
  "customer-updated": "客户已更新。",
  in: "入库已登记，库存已增加。",
  out: "出库已登记，库存已减少。",
  order: "订单已登记，没有扣库存。",
  status: "订单状态已更新，库存没有变动。",
};

export function Flash({ ok, error }: { ok?: string; error?: string }) {
  if (error) {
    return (
      <div className="flash error" role="alert">
        {error.slice(0, 200)}
      </div>
    );
  }
  if (ok && OK[ok]) {
    return (
      <div className="flash ok" role="status">
        {OK[ok]}
      </div>
    );
  }
  return null;
}
