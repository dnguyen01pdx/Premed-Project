/**
 * The top of every tool page (Dashboard, Planner, Primary, Secondaries,
 * Interviews). Same kicker + big caps headline as the homepage's "Stop 01"
 * rows, so moving from the pitch into a tool doesn't feel like changing sites.
 */
export function TopoRule() {
  return (
    <div aria-hidden="true" className="mt-6 flex items-center gap-2">
      <span className="h-[3px] w-16 bg-coral-pop" />
      <span className="h-[3px] flex-1 bg-navy-900/10" />
    </div>
  );
}

export function ToolHeader({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="anim-rise">
      <p className="kicker">{kicker}</p>
      <h1 className="mt-2 text-5xl leading-[0.9] sm:text-6xl">{title}</h1>
      {children && (
        <div className="mt-4 max-w-2xl leading-relaxed text-muted">
          {children}
        </div>
      )}
      <TopoRule />
    </header>
  );
}
