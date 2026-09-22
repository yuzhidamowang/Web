export function PageHeader({ eyebrow, title, lede, action }: { eyebrow: string; title: string; lede?: string; action?: React.ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {lede ? <p className="lede">{lede}</p> : null}
      </div>
      {action}
    </div>
  );
}
