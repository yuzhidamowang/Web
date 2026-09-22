import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import type { OrderStatus } from "./constants";
import { InputError } from "./errors";
import { addDays, formatQty, nowStamp, round3, todayStamp } from "./format";
import type { Customer, CustomerInput, Item, ItemInput, Movement, Order, OrderLine } from "./types";

const globalForDb = globalThis as unknown as { __warehouseDb?: Database.Database };

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      spec TEXT NOT NULL DEFAULT '',
      unit TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 0 CHECK (quantity >= 0),
      location TEXT NOT NULL DEFAULT '',
      safety_stock REAL NOT NULL DEFAULT 0 CHECK (safety_stock >= 0),
      batch TEXT NOT NULL DEFAULT '',
      expiry_date TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL REFERENCES items(id),
      quantity REAL NOT NULL CHECK (quantity > 0),
      type TEXT NOT NULL CHECK (type IN ('in', 'out')),
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT NOT NULL UNIQUE,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      ordered_at TEXT NOT NULL,
      expected_delivery_date TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL CHECK (status IN ('recorded', 'prepared', 'delivered', 'cancelled')),
      note TEXT NOT NULL DEFAULT '',
      source TEXT NOT NULL CHECK (source IN ('manual', 'customer_order')) DEFAULT 'manual',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      item_id INTEGER NOT NULL REFERENCES items(id),
      quantity REAL NOT NULL CHECK (quantity > 0),
      unit TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);
    CREATE INDEX IF NOT EXISTS idx_movements_item ON stock_movements(item_id);
    CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
    CREATE INDEX IF NOT EXISTS idx_lines_order ON order_lines(order_id);
  `);

  const seeded = db.prepare(`SELECT value FROM meta WHERE key = 'seeded'`).get() as { value: string } | undefined;
  if (!seeded) {
    const tx = db.transaction(() => {
      seed(db);
      db.prepare(`INSERT INTO meta (key, value) VALUES ('seeded', '1')`).run();
    });
    tx();
  }
}

export function getDb() {
  if (!globalForDb.__warehouseDb) {
    const dir = path.join(process.cwd(), "data");
    fs.mkdirSync(dir, { recursive: true });
    const db = new Database(path.join(dir, "warehouse.db"));
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    db.pragma("busy_timeout = 5000");
    try {
      migrate(db);
    } catch (error) {
      db.close();
      throw error;
    }
    globalForDb.__warehouseDb = db;
  }
  return globalForDb.__warehouseDb;
}

type SeedItem = {
  name: string;
  category: string;
  spec: string;
  unit: string;
  location: string;
  safety: number;
  batch: string;
  expiry: string;
  createdAt: string;
};

type SeedMove = {
  name: string;
  type: "in" | "out";
  qty: number;
  at: string;
  note: string;
};

function seed(db: Database.Database) {
  const items: SeedItem[] = [
    { name: "土豆", category: "蔬菜", spec: "中号", unit: "斤", location: "A-01", safety: 80, batch: "CG20260915-01", expiry: "2026-10-20", createdAt: "2026-09-15T05:20:00" },
    { name: "西红柿", category: "蔬菜", spec: "粉果", unit: "斤", location: "A-02", safety: 50, batch: "CG20260918-02", expiry: "2026-09-26", createdAt: "2026-09-18T05:40:00" },
    { name: "大白菜", category: "蔬菜", spec: "整棵", unit: "斤", location: "A-03", safety: 100, batch: "CG20260919-01", expiry: "2026-09-30", createdAt: "2026-09-19T05:30:00" },
    { name: "青椒", category: "蔬菜", spec: "螺丝椒", unit: "斤", location: "A-04", safety: 30, batch: "CG20260918-04", expiry: "2026-09-25", createdAt: "2026-09-18T05:48:00" },
    { name: "猪五花", category: "肉类", spec: "带皮", unit: "公斤", location: "B-01", safety: 20, batch: "RP20260920-01", expiry: "2026-09-24", createdAt: "2026-09-20T06:10:00" },
    { name: "鸡腿", category: "肉类", spec: "冷冻", unit: "公斤", location: "B-02", safety: 15, batch: "RP20260917-02", expiry: "2026-10-20", createdAt: "2026-09-17T06:50:00" },
    { name: "牛腩", category: "肉类", spec: "鲜切", unit: "公斤", location: "B-03", safety: 10, batch: "RP20260920-03", expiry: "2026-09-23", createdAt: "2026-09-20T06:20:00" },
    { name: "干香菇", category: "干货", spec: "剪根", unit: "袋", location: "C-01", safety: 20, batch: "GH20260910-01", expiry: "2027-03-01", createdAt: "2026-09-10T09:10:00" },
    { name: "黑木耳", category: "干货", spec: "小朵", unit: "袋", location: "C-02", safety: 12, batch: "GH20260910-02", expiry: "2027-03-01", createdAt: "2026-09-10T09:12:00" },
    { name: "红薯粉丝", category: "干货", spec: "500克", unit: "袋", location: "C-03", safety: 24, batch: "GH20260912-03", expiry: "2027-06-01", createdAt: "2026-09-12T10:05:00" },
    { name: "生抽", category: "调料", spec: "1.8升", unit: "瓶", location: "D-01", safety: 12, batch: "TL20260908-01", expiry: "2027-06-01", createdAt: "2026-09-08T07:40:00" },
    { name: "食盐", category: "调料", spec: "400克", unit: "袋", location: "D-02", safety: 10, batch: "TL20260908-02", expiry: "2028-01-01", createdAt: "2026-09-08T07:42:00" },
    { name: "白胡椒粉", category: "调料", spec: "500克", unit: "袋", location: "D-03", safety: 8, batch: "TL20260908-03", expiry: "2027-08-01", createdAt: "2026-09-08T07:44:00" },
  ];

  const insertItem = db.prepare(`
    INSERT INTO items (name, category, spec, unit, quantity, location, safety_stock, batch, expiry_date, created_at, updated_at)
    VALUES (@name, @category, @spec, @unit, 0, @location, @safety, @batch, @expiry, @createdAt, @createdAt)
  `);
  for (const item of items) insertItem.run(item);

  const moves: SeedMove[] = [
    { name: "生抽", type: "in", qty: 38, at: "2026-09-08T07:40:00", note: "调料月度到货" },
    { name: "食盐", type: "in", qty: 24, at: "2026-09-08T07:42:00", note: "调料月度到货" },
    { name: "白胡椒粉", type: "in", qty: 18, at: "2026-09-08T07:44:00", note: "调料月度到货" },
    { name: "干香菇", type: "in", qty: 50, at: "2026-09-10T09:10:00", note: "干货仓到货" },
    { name: "黑木耳", type: "in", qty: 20, at: "2026-09-10T09:12:00", note: "干货仓到货" },
    { name: "红薯粉丝", type: "in", qty: 80, at: "2026-09-12T10:05:00", note: "干货仓到货" },
    { name: "土豆", type: "in", qty: 220, at: "2026-09-15T05:20:00", note: "早市到货，城西菜场" },
    { name: "黑木耳", type: "out", qty: 14, at: "2026-09-16T15:20:00", note: "卤味档口领用" },
    { name: "鸡腿", type: "in", qty: 20, at: "2026-09-17T06:50:00", note: "冻品到货" },
    { name: "西红柿", type: "in", qty: 80, at: "2026-09-18T05:40:00", note: "早市到货" },
    { name: "青椒", type: "in", qty: 40, at: "2026-09-18T05:48:00", note: "早市到货" },
    { name: "大白菜", type: "in", qty: 260, at: "2026-09-19T05:30:00", note: "早市到货" },
    { name: "食盐", type: "out", qty: 20, at: "2026-09-19T11:10:00", note: "食堂补货领出" },
    { name: "猪五花", type: "in", qty: 34, at: "2026-09-20T06:10:00", note: "屠宰场晨配" },
    { name: "牛腩", type: "in", qty: 18, at: "2026-09-20T06:20:00", note: "屠宰场晨配" },
    { name: "鸡腿", type: "out", qty: 12, at: "2026-09-20T11:30:00", note: "职工餐领用" },
    { name: "土豆", type: "out", qty: 40, at: "2026-09-21T07:10:00", note: "订单 SO-20260920-001 送达出库" },
    { name: "猪五花", type: "out", qty: 6, at: "2026-09-21T07:12:00", note: "订单 SO-20260920-001 送达出库" },
    { name: "生抽", type: "out", qty: 2, at: "2026-09-21T07:14:00", note: "订单 SO-20260920-001 送达出库" },
    { name: "西红柿", type: "out", qty: 38, at: "2026-09-21T15:05:00", note: "门店零取" },
    { name: "青椒", type: "out", qty: 25, at: "2026-09-21T15:20:00", note: "后厨试菜" },
  ];

  const findItem = db.prepare(`SELECT id FROM items WHERE name = ?`);
  const updateQty = db.prepare(`
    UPDATE items
    SET quantity = round(quantity + ?, 3), updated_at = ?
    WHERE id = ? AND round(quantity + ?, 3) >= 0
  `);
  const insertMove = db.prepare(`
    INSERT INTO stock_movements (item_id, quantity, type, note, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const move of moves) {
    const row = findItem.get(move.name) as { id: number } | undefined;
    if (!row) throw new Error(`种子数据缺少品项 ${move.name}`);
    const delta = move.type === "in" ? move.qty : -move.qty;
    const result = updateQty.run(delta, move.at, row.id, delta);
    if (result.changes !== 1) throw new Error(`种子出入库失败 ${move.name}`);
    insertMove.run(row.id, move.qty, move.type, move.note, move.at);
  }

  const customers = [
    ["城南小食堂", "李阿姨", "13812340001", "城南路 18 号后门", "2026-09-01T09:00:00"],
    ["江边渔家", "王师傅", "13912340002", "沿江大道 66 号", "2026-09-03T09:00:00"],
    ["青禾幼儿园食堂", "周老师", "13712340003", "青禾路 3 号", "2026-09-05T09:00:00"],
    ["老街面馆", "陈国强", "13612340004", "老街 12 号", "2026-09-06T09:00:00"],
  ] as const;
  const insertCustomer = db.prepare(`
    INSERT INTO customers (name, contact, phone, address, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const [name, contact, phone, address, createdAt] of customers) {
    insertCustomer.run(name, contact, phone, address, createdAt, createdAt);
  }

  const customerId = (name: string) => (db.prepare(`SELECT id FROM customers WHERE name = ?`).get(name) as { id: number }).id;
  const itemId = (name: string) => (db.prepare(`SELECT id, unit FROM items WHERE name = ?`).get(name) as { id: number; unit: string });

  const orders: {
    no: string;
    customer: string;
    orderedAt: string;
    delivery: string;
    status: OrderStatus;
    note: string;
    createdAt: string;
    updatedAt: string;
    lines: [string, number][];
  }[] = [
    {
      no: "SO-20260920-001",
      customer: "城南小食堂",
      orderedAt: "2026-09-20",
      delivery: "2026-09-21",
      status: "delivered",
      note: "后门卸货，土豆要完整的。",
      createdAt: "2026-09-20T09:12:00",
      updatedAt: "2026-09-21T08:00:00",
      lines: [
        ["土豆", 40],
        ["猪五花", 6],
        ["生抽", 2],
      ],
    },
    {
      no: "SO-20260921-001",
      customer: "江边渔家",
      orderedAt: "2026-09-21",
      delivery: "2026-09-22",
      status: "prepared",
      note: "牛腩单独装，别和青椒串味。货还在库里，出库单未记。",
      createdAt: "2026-09-21T10:24:00",
      updatedAt: "2026-09-21T16:40:00",
      lines: [
        ["牛腩", 5],
        ["干香菇", 4],
        ["青椒", 8],
      ],
    },
    {
      no: "SO-20260922-001",
      customer: "青禾幼儿园食堂",
      orderedAt: "2026-09-22",
      delivery: "2026-09-23",
      status: "recorded",
      note: "不要辣，鸡腿只要冷冻的。",
      createdAt: "2026-09-22T07:20:00",
      updatedAt: "2026-09-22T07:20:00",
      lines: [
        ["大白菜", 30],
        ["鸡腿", 4],
        ["食盐", 2],
      ],
    },
    {
      no: "SO-20260918-001",
      customer: "老街面馆",
      orderedAt: "2026-09-18",
      delivery: "2026-09-19",
      status: "cancelled",
      note: "面馆临时停业，整单取消。",
      createdAt: "2026-09-18T13:00:00",
      updatedAt: "2026-09-18T18:00:00",
      lines: [["红薯粉丝", 10]],
    },
  ];

  const insertOrder = db.prepare(`
    INSERT INTO orders (order_no, customer_id, ordered_at, expected_delivery_date, status, note, source, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'manual', ?, ?)
  `);
  const insertLine = db.prepare(`
    INSERT INTO order_lines (order_id, item_id, quantity, unit) VALUES (?, ?, ?, ?)
  `);
  for (const order of orders) {
    const info = insertOrder.run(order.no, customerId(order.customer), order.orderedAt, order.delivery, order.status, order.note, order.createdAt, order.updatedAt);
    const orderId = Number(info.lastInsertRowid);
    for (const [name, qty] of order.lines) {
      const item = itemId(name);
      insertLine.run(orderId, item.id, qty, item.unit);
    }
  }

  const low = db.prepare(`SELECT COUNT(*) AS c FROM items WHERE quantity < safety_stock`).get() as { c: number };
  const potato = db.prepare(`SELECT quantity FROM items WHERE name = '土豆'`).get() as { quantity: number };
  if (low.c !== 5 || potato.quantity !== 180) {
    throw new Error(`种子数据不平衡：预警 ${low.c}，土豆 ${potato.quantity}`);
  }
}

function likePattern(keyword: string) {
  return `%${keyword.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

export function countLowStock() {
  const row = getDb().prepare(`SELECT COUNT(*) AS c FROM items WHERE quantity < safety_stock`).get() as { c: number };
  return row.c;
}

export function listItems(filter: { q?: string; category?: string; lowOnly?: boolean }) {
  const where: string[] = [];
  const params: unknown[] = [];
  const keyword = filter.q?.trim();
  if (keyword) {
    where.push(`name LIKE ? ESCAPE '\\'`);
    params.push(likePattern(keyword));
  }
  if (filter.category) {
    where.push(`category = ?`);
    params.push(filter.category);
  }
  if (filter.lowOnly) where.push(`quantity < safety_stock`);
  const sql = `
    SELECT * FROM items
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY CASE category WHEN '蔬菜' THEN 1 WHEN '肉类' THEN 2 WHEN '干货' THEN 3 ELSE 4 END, name
  `;
  return getDb().prepare(sql).all(...params) as Item[];
}

export function getItem(id: number) {
  return getDb().prepare(`SELECT * FROM items WHERE id = ?`).get(id) as Item | undefined;
}

export function createItem(input: ItemInput) {
  const now = nowStamp();
  const info = getDb()
    .prepare(
      `INSERT INTO items (name, category, spec, unit, quantity, location, safety_stock, batch, expiry_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(input.name, input.category, input.spec, input.unit, input.quantity, input.location, input.safetyStock, input.batch, input.expiryDate, now, now);
  return Number(info.lastInsertRowid);
}

export function updateItem(id: number, input: ItemInput) {
  const result = getDb()
    .prepare(
      `UPDATE items
       SET name = ?, category = ?, spec = ?, unit = ?, quantity = ?, location = ?, safety_stock = ?, batch = ?, expiry_date = ?, updated_at = ?
       WHERE id = ?`,
    )
    .run(input.name, input.category, input.spec, input.unit, input.quantity, input.location, input.safetyStock, input.batch, input.expiryDate, nowStamp(), id);
  if (result.changes !== 1) throw new InputError("找不到这个品项");
}

export function listMovements(limit = 80) {
  return getDb()
    .prepare(
      `SELECT m.*, i.name AS item_name, i.unit AS item_unit
       FROM stock_movements m
       JOIN items i ON i.id = m.item_id
       ORDER BY m.created_at DESC, m.id DESC
       LIMIT ?`,
    )
    .all(limit) as Movement[];
}

export function recordMovement(input: { itemId: number; type: "in" | "out"; quantity: number; note: string }) {
  const db = getDb();
  const run = db.transaction(() => {
    const item = db.prepare(`SELECT id, name, unit, quantity FROM items WHERE id = ?`).get(input.itemId) as Pick<Item, "id" | "name" | "unit" | "quantity"> | undefined;
    if (!item) throw new InputError("找不到这个品项");
    const delta = input.type === "in" ? input.quantity : -input.quantity;
    if (input.type === "out" && item.quantity + 1e-9 < input.quantity) {
      throw new InputError(`出库 ${formatQty(input.quantity)} ${item.unit} 超过当前库存（现有 ${formatQty(item.quantity)} ${item.unit}），不能把库存减成负数`);
    }
    const now = nowStamp();
    const result = db
      .prepare(
        `UPDATE items
         SET quantity = round(quantity + ?, 3), updated_at = ?
         WHERE id = ? AND round(quantity + ?, 3) >= 0`,
      )
      .run(delta, now, item.id, delta);
    if (result.changes !== 1) {
      throw new InputError(`出库数量超过当前库存（现有 ${formatQty(item.quantity)} ${item.unit}），不能把库存减成负数`);
    }
    db.prepare(`INSERT INTO stock_movements (item_id, quantity, type, note, created_at) VALUES (?, ?, ?, ?, ?)`).run(item.id, input.quantity, input.type, input.note, now);
  });
  run();
}

export function listCustomers() {
  return getDb().prepare(`SELECT * FROM customers ORDER BY name`).all() as Customer[];
}

export function getCustomer(id: number) {
  return getDb().prepare(`SELECT * FROM customers WHERE id = ?`).get(id) as Customer | undefined;
}

export function createCustomer(input: CustomerInput) {
  const now = nowStamp();
  const info = getDb().prepare(`INSERT INTO customers (name, contact, phone, address, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`).run(input.name, input.contact, input.phone, input.address, now, now);
  return Number(info.lastInsertRowid);
}

export function updateCustomer(id: number, input: CustomerInput) {
  const result = getDb().prepare(`UPDATE customers SET name = ?, contact = ?, phone = ?, address = ?, updated_at = ? WHERE id = ?`).run(input.name, input.contact, input.phone, input.address, nowStamp(), id);
  if (result.changes !== 1) throw new InputError("找不到这个客户");
}

function attachLines(orders: Omit<Order, "lines">[]) {
  const lines = getDb()
    .prepare(
      `SELECT l.*, i.name AS item_name
       FROM order_lines l
       JOIN items i ON i.id = l.item_id
       ORDER BY l.id`,
    )
    .all() as OrderLine[];
  const grouped = new Map<number, OrderLine[]>();
  for (const line of lines) {
    const list = grouped.get(line.order_id) ?? [];
    list.push(line);
    grouped.set(line.order_id, list);
  }
  return orders.map((order) => ({ ...order, lines: grouped.get(order.id) ?? [] }));
}

const orderSelect = `
  SELECT o.*, c.name AS customer_name, c.contact, c.phone, c.address
  FROM orders o
  JOIN customers c ON c.id = o.customer_id
`;

export function listOrders(status?: string) {
  const db = getDb();
  const rows = (
    status
      ? db.prepare(`${orderSelect} WHERE o.status = ? ORDER BY o.ordered_at DESC, o.id DESC`).all(status)
      : db.prepare(`${orderSelect} ORDER BY o.ordered_at DESC, o.id DESC`).all()
  ) as Omit<Order, "lines">[];
  return attachLines(rows);
}

export function getOrder(id: number) {
  const row = getDb().prepare(`${orderSelect} WHERE o.id = ?`).get(id) as Omit<Order, "lines"> | undefined;
  if (!row) return undefined;
  return attachLines([row])[0];
}

export function createOrder(input: {
  customerId: number;
  orderedAt: string;
  expectedDeliveryDate: string;
  note: string;
  lines: { itemId: number; quantity: number; unit: string }[];
}) {
  const db = getDb();
  const run = db.transaction(() => {
    const customer = db.prepare(`SELECT id FROM customers WHERE id = ?`).get(input.customerId) as { id: number } | undefined;
    if (!customer) throw new InputError("请选择客户");
    const day = input.orderedAt.replace(/-/g, "");
    const prefix = `SO-${day}-`;
    const latest = db.prepare(`SELECT order_no FROM orders WHERE order_no LIKE ? ORDER BY order_no DESC LIMIT 1`).get(`${prefix}%`) as { order_no: string } | undefined;
    const seq = latest ? Number(latest.order_no.slice(prefix.length)) + 1 : 1;
    const orderNo = `${prefix}${String(seq).padStart(3, "0")}`;
    const now = nowStamp();
    const info = db
      .prepare(
        `INSERT INTO orders (order_no, customer_id, ordered_at, expected_delivery_date, status, note, source, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'recorded', ?, 'manual', ?, ?)`,
      )
      .run(orderNo, input.customerId, input.orderedAt, input.expectedDeliveryDate, input.note, now, now);
    const orderId = Number(info.lastInsertRowid);
    const insertLine = db.prepare(`INSERT INTO order_lines (order_id, item_id, quantity, unit) VALUES (?, ?, ?, ?)`);
    for (const line of input.lines) {
      const item = db.prepare(`SELECT id FROM items WHERE id = ?`).get(line.itemId) as { id: number } | undefined;
      if (!item) throw new InputError("明细里有不存在的品项");
      insertLine.run(orderId, line.itemId, round3(line.quantity), line.unit);
    }
    return orderId;
  });
  return run();
}

export function updateOrderStatus(id: number, status: OrderStatus) {
  const result = getDb().prepare(`UPDATE orders SET status = ?, updated_at = ? WHERE id = ?`).run(status, nowStamp(), id);
  if (result.changes !== 1) throw new InputError("找不到这张订单");
}

export function getDashboard() {
  const db = getDb();
  const itemCount = (db.prepare(`SELECT COUNT(*) AS c FROM items`).get() as { c: number }).c;
  const lowCount = countLowStock();
  const start = `${addDays(todayStamp(), -6)}T00:00:00`;
  const recentMovements = (db.prepare(`SELECT COUNT(*) AS c FROM stock_movements WHERE created_at >= ?`).get(start) as { c: number }).c;
  const openOrders = (db.prepare(`SELECT COUNT(*) AS c FROM orders WHERE status IN ('recorded', 'prepared')`).get() as { c: number }).c;
  const lowItems = db.prepare(`SELECT * FROM items WHERE quantity < safety_stock ORDER BY (safety_stock - quantity) DESC, name LIMIT 8`).all() as Item[];
  const open = listOrders().filter((order) => order.status === "recorded" || order.status === "prepared");
  return { itemCount, lowCount, recentMovements, openOrders, lowItems, openOrdersList: open };
}
