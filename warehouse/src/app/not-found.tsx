import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card">
      <h1>没有这一页</h1>
      <p>老板，地址可能写错了。</p>
      <Link className="btn primary" href="/">
        回首页
      </Link>
    </div>
  );
}
