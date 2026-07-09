// Client-safe types + metadata for the /admin tools index.
//
// The tool LIST is discovered automatically from app/routes.ts (see
// tools.server.ts) — add a route there and it shows up on /admin with no extra
// step. This file only holds optional enrichment (nicer title, description,
// icon, category) keyed by path, plus the fallbacks used when a page has no
// entry here yet.

export type ToolCategory = "Internal tools" | "Public site" | "Demos" | "Admin";

export type Tool = {
  path: string;
  title: string;
  description: string;
  category: ToolCategory;
  icon: ToolIcon;
  file: string;
};

export type ToolIcon =
  | "calendar"
  | "globe"
  | "database"
  | "plug"
  | "grid"
  | "page";

export const CATEGORY_ORDER: ToolCategory[] = [
  "Internal tools",
  "Public site",
  "Demos",
  "Admin",
];

// Optional per-path enrichment. Anything not listed still appears on /admin
// using the fallbacks below.
export const TOOL_META: Record<
  string,
  Partial<Pick<Tool, "title" | "description" | "category" | "icon">>
> = {
  "/": {
    title: "MPL Website",
    description: "Public marketing site — homepage and above-the-fold hero.",
    category: "Public site",
    icon: "globe",
  },
  "/events": {
    title: "Events Ops",
    description:
      "Run each event: sponsors, speakers, and local champions with onboarding status and documentation.",
    category: "Internal tools",
    icon: "calendar",
  },
  "/admin": {
    title: "Admin",
    description: "This page — index of every tool in the app.",
    category: "Admin",
    icon: "grid",
  },
  "/db-demo": {
    title: "Postgres Demo",
    description: "Template demo: notes stored in Postgres via loader/action.",
    category: "Demos",
    icon: "database",
  },
  "/api-demo": {
    title: "API Demo",
    description: "Template demo: fetching from JSON API routes.",
    category: "Demos",
    icon: "plug",
  },
};

// Turn a route file / path into a readable title when there's no metadata,
// e.g. "routes/team-settings.tsx" → "Team Settings".
export function prettifyTitle(path: string, file: string): string {
  const base =
    file
      .replace(/^routes\//, "")
      .replace(/\.[jt]sx?$/, "")
      .replace(/[._-]/g, " ")
      .trim() || path.replace(/^\//, "");
  return base
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
