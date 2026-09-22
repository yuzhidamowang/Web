import type { Customer } from "@/lib/types";
import { SubmitButton } from "./SubmitButton";

export function CustomerForm({ action, customer }: { action: (formData: FormData) => Promise<void>; customer?: Customer }) {
  return (
    <form action={action} className="card" autoComplete="off">
      {customer ? <input type="hidden" name="id" value={customer.id} /> : null}
      <div className="form-grid">
        <label className="field">
          <span>客户名称</span>
          <input name="name" required maxLength={40} defaultValue={customer?.name ?? ""} placeholder="例如：城南小食堂" />
        </label>
        <label className="field">
          <span>联系人</span>
          <input name="contact" maxLength={40} defaultValue={customer?.contact ?? ""} placeholder="例如：李阿姨" />
        </label>
        <label className="field">
          <span>电话</span>
          <input name="phone" maxLength={30} defaultValue={customer?.phone ?? ""} placeholder="例如：13812340001" />
        </label>
        <label className="field span-2">
          <span>地址</span>
          <input name="address" maxLength={120} defaultValue={customer?.address ?? ""} placeholder="街道、门牌，方便配送" />
        </label>
      </div>
      <div className="form-actions">
        <SubmitButton>{customer ? "保存修改" : "新增客户"}</SubmitButton>
        <a className="btn ghost" href="/customers">
          返回客户
        </a>
      </div>
    </form>
  );
}
