import type { OrderSource, OrderStatus } from "./constants";

export type Item = {
  id: number;
  name: string;
  category: string;
  spec: string;
  unit: string;
  quantity: number;
  location: string;
  safety_stock: number;
  batch: string;
  expiry_date: string;
  created_at: string;
  updated_at: string;
};

export type ItemInput = {
  name: string;
  category: string;
  spec: string;
  unit: string;
  quantity: number;
  location: string;
  safetyStock: number;
  batch: string;
  expiryDate: string;
};

export type Customer = {
  id: number;
  name: string;
  contact: string;
  phone: string;
  address: string;
  created_at: string;
  updated_at: string;
};

export type CustomerInput = {
  name: string;
  contact: string;
  phone: string;
  address: string;
};

export type Movement = {
  id: number;
  item_id: number;
  quantity: number;
  type: "in" | "out";
  note: string;
  created_at: string;
  item_name: string;
  item_unit: string;
};

export type OrderLine = {
  id: number;
  order_id: number;
  item_id: number;
  quantity: number;
  unit: string;
  item_name: string;
};

export type Order = {
  id: number;
  order_no: string;
  customer_id: number;
  ordered_at: string;
  expected_delivery_date: string;
  status: OrderStatus;
  note: string;
  source: OrderSource;
  created_at: string;
  updated_at: string;
  customer_name: string;
  contact: string;
  phone: string;
  address: string;
  lines: OrderLine[];
};
