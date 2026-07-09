import { Link } from "react-router";

const YELLOW = "#ffce1f";

// Radial "starburst" logo mark rendered as evenly spaced dots.
export function MplMark({ className = "h-9 w-9" }: { className?: string }) {
  const rings = [
    { r: 3, count: 1 },
    { r: 9, count: 8 },
    { r: 15, count: 16 },
  ];
  const dots: { x: number; y: number; s: number }[] = [];
  for (const ring of rings) {
    if (ring.count === 1) {
      dots.push({ x: 24, y: 24, s: 2.6 });
      continue;
    }
    for (let i = 0; i < ring.count; i++) {
      const a = (i / ring.count) * Math.PI * 2;
      dots.push({
        x: 24 + Math.cos(a) * ring.r,
        y: 24 + Math.sin(a) * ring.r,
        s: ring.r > 12 ? 1.5 : 1.9,
      });
    }
  }
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.s} fill={YELLOW} />
      ))}
    </svg>
  );
}

// Internal ops-tool header: MPL mark + wordmark on an MPL-blue bar, with a
// small section label. Used across the /events ops pages.
export function OpsHeader({ section }: { section?: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#2b34c8]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link to="/events" className="flex items-center gap-2.5 text-white">
          <MplMark className="h-8 w-8" />
          <span className="text-xl font-extrabold tracking-tight font-[Poppins,sans-serif]">
            MPL
          </span>
          <span className="ml-1 rounded bg-white/15 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white/90">
            Ops
          </span>
        </Link>
        <div className="flex items-center gap-5 text-sm font-medium text-white/80">
          {section && <span className="hidden sm:inline">{section}</span>}
          <Link to="/admin" className="transition-opacity hover:opacity-70">
            Admin
          </Link>
          <Link to="/" className="transition-opacity hover:opacity-70">
            View site
          </Link>
        </div>
      </div>
    </header>
  );
}
