"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="card">
      <h1>页面没有打开</h1>
      <p>老板，这里出了点问题。可以重试一次。</p>
      <button className="btn primary" type="button" onClick={reset}>
        重试
      </button>
    </div>
  );
}
