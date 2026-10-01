"use client";

import { useMemo, useState } from "react";
import { recordMovementAction } from "@/lib/actions";
import { formatQty, parseQuantity } from "@/lib/format";
import { SubmitButton } from "./SubmitButton";

type Option = { id: number; name: string; category: string; unit: string; spec: string; quantity: number; location: string };

export function MovementForm({ items, defaultItemId }: { items: Option[]; defaultItemId?: number }) {
  const initial = items.some((item) => item.id === defaultItemId) ? defaultItemId! : items[0]?.id;
  const [itemId, setItemId] = useState(initial);
  const [type, setType] = useState<"in" | "out">("in");
  const [qty, setQty] = useState("");
  const item = useMemo(() => items.find((row) => row.id === itemId), [items, itemId]);
  const amount = parseQuantity(qty);
  const tooMuch = type === "out" && item != null && amount != null && amount > item.quantity + 1e-9;

  if (!item) return <p className="empty">还没有品项，先去库存里新增。</p>;

  return (
    <form action={recordMovementAction} className="card" autoComplete="off">
      <div className="form-grid">
        <div className="field">
          <span>类型</span>
          <div className="type-toggle">
            <label className={type === "in" ? "type-option on in" : "type-option"}>
              <input type="radio" name="type" value="in" checked={type === "in"} onChange={() => setType("in")} />
              入库
            </label>
            <label className={type === "out" ? "type-option on out" : "type-option"}>
              <input type="radio" name="type" value="out" checked={type === "out"} onChange={() => setType("out")} />
              出库
            </label>
          </div>
        </div>
        <label className="field">
          <span>品项</span>
          <select name="item_id" value={itemId} onChange={(event) => setItemId(Number(event.target.value))}>
            {items.map((row) => (
              <option key={row.id} value={row.id}>
                {row.category} · {row.name}
                {row.spec ? `（${row.spec}）` : ""} · 现存 {formatQty(row.quantity)}
                {row.unit}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>数量（{item.unit}）</span>
          <input name="quantity" required type="number" min="0.001" step="0.001" value={qty} onChange={(event) => setQty(event.target.value)} />
        </label>
        <label className="field">
          <span>备注</span>
          <input name="note" maxLength={200} placeholder="例如：早市到货，或某客户备货出库" />
        </label>
        <p className="stock-now span-2">
          当前库存 <strong className={item.quantity < 0 ? "hot" : undefined}>{formatQty(item.quantity)}</strong> {item.unit}
          {item.location ? ` · 库位 ${item.location}` : ""}
        </p>
        {tooMuch ? <p className="field-error span-2">这个数量会把库存减成负数，提交后也会被拒绝。</p> : null}
      </div>
      <div className="form-actions">
        <SubmitButton pendingLabel="登记中…">{type === "in" ? "登记入库" : "登记出库"}</SubmitButton>
      </div>
    </form>
  );
}
