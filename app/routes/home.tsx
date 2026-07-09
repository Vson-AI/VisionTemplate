import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Modern People Leader" },
    {
      name: "description",
      content: "Podcast, Newsletter, & Academy for HR Leaders.",
    },
  ];
}

const NAV = [
  "Our Story",
  "Podcast",
  "Academy",
  "Sponsors",
  "Events",
  "Newsletter",
];

// MPL brand palette
const BLUE = "#2b34c8"; // deep royal background
const BLUE_ARC = "#3b46d8"; // lighter arc / spotlight
const YELLOW = "#ffce1f"; // CTA + logo mark

// Radial "starburst" logo mark rendered as evenly spaced dots.
function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
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

export default function Home() {
  return (
    <div
      className="relative min-h-screen w-full overflow-hidden font-[Poppins,sans-serif]"
      style={{ backgroundColor: BLUE }}
    >
      {/* Lighter spotlight arc behind the hero */}
      <div
        className="pointer-events-none absolute left-1/2 top-[-58%] -z-0 aspect-square w-[150%] -translate-x-1/2 rounded-full sm:w-[125%] lg:w-[92%]"
        style={{ backgroundColor: BLUE_ARC }}
      />

      {/* Header */}
      <header className="relative z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-8 lg:px-10">
          <a
            href="/"
            className="flex items-center gap-3 text-3xl font-extrabold tracking-tight text-white"
          >
            <LogoMark />
            MPL
          </a>

          <nav className="hidden items-center gap-9 md:flex">
            {NAV.map((item) => (
              <a
                key={item}
                href="/"
                className="text-[17px] font-semibold text-white/95 transition-opacity hover:opacity-70"
              >
                {item}
              </a>
            ))}
          </nav>

          <button
            className="flex flex-col gap-1.5 md:hidden"
            aria-label="Open menu"
          >
            <span className="h-0.5 w-6 bg-white" />
            <span className="h-0.5 w-6 bg-white" />
            <span className="h-0.5 w-6 bg-white" />
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 pb-40 pt-16 text-center sm:pt-20">
        <p className="mb-7 text-sm font-bold uppercase tracking-[0.12em] text-white sm:text-base">
          Podcast, Newsletter, &amp; Academy for HR Leaders
        </p>

        <h1 className="text-[13vw] font-extrabold leading-[0.98] tracking-tight text-white sm:text-6xl lg:text-[5.5rem]">
          Helping HR Leaders Build the Future of Work
        </h1>

        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/90 sm:text-xl">
          We&rsquo;ve learned from the best so you can lead like the best. Now
          we&rsquo;re sharing those lessons&mdash;through our podcast, events,
          and Academy&mdash;to help you shape what&rsquo;s next for HR and work.
        </p>

        <a
          href="/"
          className="mt-11 inline-flex items-center justify-center rounded-md px-9 py-4 text-lg font-semibold text-black shadow-[4px_4px_0_rgba(0,0,0,0.25)] transition-transform hover:-translate-y-0.5 active:translate-y-0"
          style={{ backgroundColor: YELLOW }}
        >
          Listen to podcast
        </a>
      </section>
    </div>
  );
}
