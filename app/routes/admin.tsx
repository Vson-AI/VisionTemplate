import { Link } from "react-router";
import type { Route } from "./+types/admin";
import { OpsHeader } from "../components/Mpl";
import { listTools } from "../lib/tools.server";
import { CATEGORY_ORDER, type Tool, type ToolIcon } from "../lib/tools";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Admin · MPL Ops" }];
}

export async function loader(_: Route.LoaderArgs) {
  return { tools: listTools() };
}

export default function Admin({ loaderData }: Route.ComponentProps) {
  const { tools } = loaderData;
  const byCategory = CATEGORY_ORDER.map((category) => ({
    category,
    items: tools.filter((t) => t.category === category),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="min-h-screen bg-background">
      <OpsHeader section="Admin" />

      <main className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Admin
            </h1>
            <p className="mt-1 max-w-2xl text-muted-foreground">
              Every tool and page in the app. This list is generated from the
              route config, so any new page shows up here automatically.
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            {tools.length} page{tools.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-10">
          {byCategory.map(({ category, items }) => (
            <section key={category}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {category}
              </h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((tool) => (
                  <ToolCard key={tool.path} tool={tool} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}

function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link
      to={tool.path}
      className="card-lift group flex flex-col rounded-xl border border-border bg-card p-5"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Icon name={tool.icon} />
        </span>
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-foreground group-hover:text-primary">
            {tool.title}
          </h3>
          <code className="text-xs text-muted-foreground">{tool.path}</code>
        </div>
      </div>
      {tool.description && (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {tool.description}
        </p>
      )}
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
        Open <span aria-hidden>→</span>
      </span>
    </Link>
  );
}

function Icon({ name }: { name: ToolIcon }) {
  const common = {
    className: "h-5 w-5",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "calendar":
      return (
        <svg {...common}>
          <rect x="3" y="4.5" width="18" height="16" rx="2" />
          <path d="M3 9h18M8 2.5v4M16 2.5v4" />
        </svg>
      );
    case "globe":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />
        </svg>
      );
    case "database":
      return (
        <svg {...common}>
          <ellipse cx="12" cy="5.5" rx="7" ry="2.8" />
          <path d="M5 5.5v13c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-13M5 12c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8" />
        </svg>
      );
    case "plug":
      return (
        <svg {...common}>
          <path d="M9 2v6M15 2v6M6 8h12v3a6 6 0 0 1-12 0V8ZM12 17v5" />
        </svg>
      );
    case "grid":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
          <path d="M13 3v5h5" />
        </svg>
      );
  }
}
