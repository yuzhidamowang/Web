import { CATEGORIES, UNITS } from "@/lib/constants";
import type { Item } from "@/lib/types";
import { SubmitButton } from "./SubmitButton";

export function ItemForm({ action, item }: { action: (formData: FormData) => Promise<void>; item?: Item }) {
  return (
    <form action={action} className="card" autoComplete="off">
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <div className="form-grid">
        <label className="field">
          <span>名称</span>
          <input name="name" required maxLength={40} defaultValue={item?.name ?? ""} placeholder="例如：土豆" />
        </label>
        <label className="field">
          <span>类别</span>
          <select name="category" required defaultValue={item?.category ?? "蔬菜"}>
            {CATEGORIES.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>规格</span>
          <input name="spec" maxLength={40} defaultValue={item?.spec ?? ""} placeholder="例如：中号、1.8升" />
        </label>
        <label className="field">
          <span>单位</span>
          <select name="unit" required defaultValue={item?.unit ?? "斤"}>
            {UNITS.map((unit) => (
              <option key={unit}>{unit}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>当前数量</span>
          <input name="quantity" required type="number" min="0" step="0.001" defaultValue={item?.quantity ?? 0} />
          <p className="hint">建档或盘点修正时改这里。日常收货、发货请走出入库，那边会留流水。</p>
        </label>
        <label className="field">
          <span>安全库存</span>
          <input name="safety_stock" required type="number" min="0" step="0.001" defaultValue={item?.safety_stock ?? 0} />
        </label>
        <label className="field">
          <span>库位</span>
          <input name="location" maxLength={40} defaultValue={item?.location ?? ""} placeholder="例如：A-01" />
        </label>
        <label className="field">
          <span>批次</span>
          <input name="batch" maxLength={40} defaultValue={item?.batch ?? ""} placeholder="例如：CG20260922-01" />
        </label>
        <label className="field">
          <span>保质期</span>
          <input name="expiry_date" type="date" defaultValue={item?.expiry_date ?? ""} />
        </label>
      </div>
      <div className="form-actions">
        <SubmitButton>{item ? "保存修改" : "新增品项"}</SubmitButton>
        <a className="btn ghost" href="/inventory">
          返回库存
        </a>
      </div>
    </form>
  );
}
