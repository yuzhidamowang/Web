export const CATEGORIES = ["蔬菜", "肉类", "干货", "调料"] as const;
export const UNITS = ["斤", "公斤", "箱", "袋", "瓶"] as const;

export const ORDER_STATUSES = [
  { value: "recorded", label: "已记录" },
  { value: "prepared", label: "已备货" },
  { value: "delivered", label: "已送达" },
  { value: "cancelled", label: "已取消" },
] as const;

export const ORDER_SOURCES = [
  { value: "manual", label: "手工录入" },
  { value: "customer_order", label: "客户下单" },
] as const;

export type Category = (typeof CATEGORIES)[number];
export type Unit = (typeof UNITS)[number];
export type OrderStatus = (typeof ORDER_STATUSES)[number]["value"];
export type OrderSource = (typeof ORDER_SOURCES)[number]["value"];

export function labelOf(list: readonly { value: string; label: string }[], value: string) {
  return list.find((item) => item.value === value)?.label ?? value;
}
