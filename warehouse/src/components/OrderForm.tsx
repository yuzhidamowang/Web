"use client";

import { useState } from "react";
import { createOrderAction } from "@/lib/actions";
import { CATEGORIES } from "@/lib/constants";
import { SubmitButton } from "./SubmitButton";

type ItemOption = { id: number; name: string; category: string; unit: string; spec: string };
type CustomerOption = { id: number; name: string };

export function OrderForm({
  items,
  customers,
  defaultOrderedAt,
  defaultDelivery,
}: {
  items: ItemOption[];
  customers: CustomerOption[];
  defaultOrderedAt: string;
  defaultDelivery: string;
}) {
  const [rows, setRows] = useState<number[]>([0, 1]);
  const [units, setUnits] = useState<Record<number, string>>({});

  return (
    <form action={createOrderAction} className="card" autoComplete="off">
      <div className="form-grid">
        <label className="field">
          <span>客户</span>
          <select name="customer_id" required defaultValue="">
            <option value="" disabled>
              选择客户
            </option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>来源</span>
          <input value="手工录入" readOnly />
          <p className="hint">以后客户自己下单，来源会记成「客户下单」。现在只做库房手工登记，不会扣库存。</p>
        </label>
        <label className="field">
          <span>下单日期</span>
          <input name="ordered_at" type="date" required defaultValue={defaultOrderedAt} />
        </label>
        <label className="field">
          <span>期望配送日期</span>
          <input name="expected_delivery_date" type="date" required defaultValue={defaultDelivery} />
        </label>
        <label className="field span-2">
          <span>备注</span>
          <input name="note" maxLength={200} placeholder="例如：后门卸货，不要辣" />
        </label>
      </div>

      <h2 className="lines-title">明细</h2>
      {rows.map((row, index) => (
        <div className="line-row" key={row}>
          <select
            name={`item_${index}`}
            defaultValue=""
            onChange={(event) => {
              const item = items.find((entry) => entry.id === Number(event.target.value));
              setUnits((prev) => ({ ...prev, [row]: item?.unit ?? "" }));
            }}
          >
            <option value="">选择品项</option>
            {CATEGORIES.map((category) => (
              <optgroup key={category} label={category}>
                {items
                  .filter((item) => item.category === category)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                      {item.spec ? ` · ${item.spec}` : ""}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
          <input name={`qty_${index}`} type="number" min="0.001" step="0.001" placeholder="数量" />
          <span className="unit">{units[row] || "单位"}</span>
          {rows.length > 1 ? (
            <button
              type="button"
              className="btn ghost small"
              onClick={() => setRows((prev) => prev.filter((value) => value !== row))}
            >
              移除
            </button>
          ) : (
            <span />
          )}
        </div>
      ))}
      <button type="button" className="btn ghost small" onClick={() => setRows((prev) => [...prev, (prev.at(-1) ?? 0) + 1])}>
        再加一行
      </button>
      <div className="form-actions">
        <SubmitButton pendingLabel="登记中…">登记订单</SubmitButton>
        <a className="btn ghost" href="/orders">
          返回订单
        </a>
      </div>
    </form>
  );
}
