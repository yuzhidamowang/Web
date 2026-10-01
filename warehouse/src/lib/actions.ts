"use server";

import { redirect } from "next/navigation";
import { CATEGORIES, ORDER_STATUSES, UNITS, type OrderStatus } from "./constants";
import { createCustomer, createItem, createOrder, getItem, recordMovement, updateCustomer, updateItem, updateOrderStatus } from "./db";
import { InputError } from "./errors";
import { parseQuantity, round3 } from "./format";
import type { CustomerInput, ItemInput } from "./types";

function fail(path: string, error: unknown): never {
  const message = error instanceof InputError ? error.message : "保存失败，请稍后再试";
  if (!(error instanceof InputError)) console.error(error);
  const joiner = path.includes("?") ? "&" : "?";
  redirect(`${path}${joiner}error=${encodeURIComponent(message)}`);
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function requireText(formData: FormData, key: string, label: string, max: number) {
  const value = text(formData, key);
  if (!value) throw new InputError(`请填写${label}`);
  if (value.length > max) throw new InputError(`${label}请控制在 ${max} 个字以内`);
  return value;
}

function optionalText(formData: FormData, key: string, label: string, max: number) {
  const value = text(formData, key);
  if (value.length > max) throw new InputError(`${label}请控制在 ${max} 个字以内`);
  return value;
}

function readDate(formData: FormData, key: string, label: string) {
  const value = text(formData, key);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new InputError(`请填写${label}`);
  return value;
}

function readItemInput(formData: FormData): ItemInput {
  const category = text(formData, "category");
  const unit = text(formData, "unit");
  if (!(CATEGORIES as readonly string[]).includes(category)) throw new InputError("请选择类别");
  if (!(UNITS as readonly string[]).includes(unit)) throw new InputError("请选择单位");
  const quantity = parseQuantity(text(formData, "quantity"), { allowZero: true });
  const safetyStock = parseQuantity(text(formData, "safety_stock"), { allowZero: true });
  if (quantity == null) throw new InputError("当前数量要大于或等于 0");
  if (safetyStock == null) throw new InputError("安全库存要大于或等于 0");
  const expiryDate = text(formData, "expiry_date");
  if (expiryDate && !/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) throw new InputError("保质期请选择日期");
  return {
    name: requireText(formData, "name", "名称", 40),
    category,
    spec: optionalText(formData, "spec", "规格", 40),
    unit,
    quantity,
    location: optionalText(formData, "location", "库位", 40),
    safetyStock,
    batch: optionalText(formData, "batch", "批次", 40),
    expiryDate,
  };
}

function readCustomerInput(formData: FormData): CustomerInput {
  return {
    name: requireText(formData, "name", "客户名称", 40),
    contact: optionalText(formData, "contact", "联系人", 40),
    phone: optionalText(formData, "phone", "电话", 30),
    address: optionalText(formData, "address", "地址", 120),
  };
}

function readId(formData: FormData) {
  const id = Number(text(formData, "id"));
  if (!Number.isInteger(id) || id <= 0) throw new InputError("记录不存在");
  return id;
}

export async function createItemAction(formData: FormData) {
  try {
    createItem(readItemInput(formData));
  } catch (error) {
    fail("/inventory/new", error);
  }
  redirect("/inventory?ok=item");
}

export async function updateItemAction(formData: FormData) {
  let back = "/inventory";
  try {
    const id = readId(formData);
    back = `/inventory/${id}/edit`;
    updateItem(id, readItemInput(formData));
  } catch (error) {
    fail(back, error);
  }
  redirect("/inventory?ok=item-updated");
}

export async function recordMovementAction(formData: FormData) {
  let ok: "in" | "out" = "in";
  try {
    const itemId = Number(text(formData, "item_id"));
    const type = text(formData, "type");
    if (!Number.isInteger(itemId) || itemId <= 0) throw new InputError("请选择品项");
    if (type !== "in" && type !== "out") throw new InputError("请选择入库或出库");
    const quantity = parseQuantity(text(formData, "quantity"));
    if (quantity == null) throw new InputError("数量要大于 0");
    recordMovement({
      itemId,
      type,
      quantity,
      note: optionalText(formData, "note", "备注", 200),
    });
    ok = type;
  } catch (error) {
    fail("/movements", error);
  }
  redirect(`/movements?ok=${ok}`);
}

export async function createCustomerAction(formData: FormData) {
  try {
    createCustomer(readCustomerInput(formData));
  } catch (error) {
    fail("/customers/new", error);
  }
  redirect("/customers?ok=customer");
}

export async function updateCustomerAction(formData: FormData) {
  let back = "/customers";
  try {
    const id = readId(formData);
    back = `/customers/${id}/edit`;
    updateCustomer(id, readCustomerInput(formData));
  } catch (error) {
    fail(back, error);
  }
  redirect("/customers?ok=customer-updated");
}

export async function createOrderAction(formData: FormData) {
  let orderId = 0;
  try {
    const customerId = Number(text(formData, "customer_id"));
    if (!Number.isInteger(customerId) || customerId <= 0) throw new InputError("请选择客户");
    const merged = new Map<number, { itemId: number; quantity: number; unit: string }>();
    for (let index = 0; index < 40; index += 1) {
      const itemRaw = text(formData, `item_${index}`);
      const qtyRaw = text(formData, `qty_${index}`);
      if (!itemRaw && !qtyRaw) continue;
      if (!itemRaw || !qtyRaw) throw new InputError("每一行都要同时填写品项和数量");
      const itemId = Number(itemRaw);
      const item = Number.isInteger(itemId) ? getItem(itemId) : undefined;
      if (!item) throw new InputError("明细里有不存在的品项");
      const quantity = parseQuantity(qtyRaw);
      if (quantity == null) throw new InputError("明细数量要大于 0");
      const prev = merged.get(item.id);
      if (prev) prev.quantity = round3(prev.quantity + quantity);
      else merged.set(item.id, { itemId: item.id, quantity, unit: item.unit });
    }
    if (merged.size === 0) throw new InputError("请至少填写一行明细");
    orderId = createOrder({
      customerId,
      orderedAt: readDate(formData, "ordered_at", "下单日期"),
      expectedDeliveryDate: readDate(formData, "expected_delivery_date", "期望配送日期"),
      note: optionalText(formData, "note", "备注", 200),
      lines: [...merged.values()],
    });
  } catch (error) {
    fail("/orders/new", error);
  }
  redirect(`/orders/${orderId}?ok=order`);
}

export async function updateOrderStatusAction(formData: FormData) {
  let back = "/orders";
  try {
    const id = readId(formData);
    back = `/orders/${id}`;
    const status = text(formData, "status");
    if (!ORDER_STATUSES.some((item) => item.value === status)) throw new InputError("请选择订单状态");
    updateOrderStatus(id, status as OrderStatus);
  } catch (error) {
    fail(back, error);
  }
  redirect(`${back}?ok=status`);
}
