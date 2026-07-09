import routeConfig from "../routes";
import {
  CATEGORY_ORDER,
  prettifyTitle,
  TOOL_META,
  type Tool,
} from "./tools";

// Route config entries are plain objects: { file, path?, index?, children? }.
type Entry = {
  file: string;
  path?: string;
  index?: boolean;
  children?: Entry[];
};

function joinPath(base: string, seg: string): string {
  const b = base.replace(/\/+$/, "");
  const s = seg.replace(/^\/+/, "");
  if (!s) return b || "/";
  return `${b}/${s}`.replace(/\/{2,}/g, "/");
}

function flatten(
  entries: Entry[],
  base = "",
): { path: string; file: string }[] {
  const out: { path: string; file: string }[] = [];
  for (const e of entries) {
    const full = e.index ? base || "/" : joinPath(base, e.path ?? "");
    out.push({ path: full, file: e.file });
    if (e.children?.length) out.push(...flatten(e.children, full));
  }
  return out;
}

// A page is anything that isn't an API endpoint or a dynamic/splat route
// (those aren't directly linkable without params).
function isListablePage(path: string, file: string): boolean {
  if (path === "/api" || path.startsWith("/api/")) return false;
  if (/^routes\/api[./]/.test(file)) return false;
  if (path.includes(":") || path.includes("*")) return false;
  return true;
}

/**
 * Discover every navigable page from the app's route config. Newly added
 * routes appear here automatically; enrich them in TOOL_META when you want a
 * custom title/description/icon.
 */
export function listTools(): Tool[] {
  const seen = new Set<string>();
  const tools: Tool[] = [];

  for (const { path, file } of flatten(routeConfig as Entry[])) {
    if (!isListablePage(path, file) || seen.has(path)) continue;
    seen.add(path);

    const meta = TOOL_META[path] ?? {};
    tools.push({
      path,
      file,
      title: meta.title ?? prettifyTitle(path, file),
      description: meta.description ?? "",
      category: meta.category ?? "Internal tools",
      icon: meta.icon ?? "page",
    });
  }

  tools.sort((a, b) => {
    const c =
      CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
    return c !== 0 ? c : a.title.localeCompare(b.title);
  });

  return tools;
}
