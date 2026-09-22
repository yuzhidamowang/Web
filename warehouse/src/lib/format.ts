export function round3(value: number) {
  return Math.round(value * 1000) / 1000;
}

export function parseQuantity(raw: string, options: { allowZero?: boolean } = {}) {
  const text = raw.trim();
  if (!text) return null;
  const value = Number(text);
  if (!Number.isFinite(value)) return null;
  const rounded = round3(value);
  if (options.allowZero ? rounded < 0 : rounded <= 0) return null;
  if (rounded > 1_000_000) return null;
  return rounded;
}

export function formatQty(value: number) {
  return new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 3 }).format(value);
}

export function formatWhen(stamp: string) {
  return stamp.replace("T", " ").slice(0, 16);
}

export function todayStamp() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai" }).format(new Date());
}

export function addDays(isoDate: string, days: number) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function nowStamp() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  return `${pick("year")}-${pick("month")}-${pick("day")}T${pick("hour")}:${pick("minute")}:${pick("second")}`;
}

export function greeting() {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Shanghai",
      hour: "numeric",
      hourCycle: "h23",
    }).format(new Date()),
  );
  if (hour < 11) return "老板，早";
  if (hour < 14) return "老板，中午好";
  if (hour < 18) return "老板，下午好";
  return "老板，晚上好";
}

export function expiryHint(date: string, today: string) {
  if (!date) return null;
  if (date < today) return "已过期";
  if (date <= addDays(today, 7)) return "临期";
  return null;
}
