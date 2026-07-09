import { Form, Link, useNavigation } from "react-router";
import type { Route } from "./+types/events";
import { Button } from "../components/Button";
import { OpsHeader } from "../components/Mpl";
import { createEvent, listEventSummaries } from "../lib/events.server";
import {
  ROLE_META,
  ROLES,
  type EventStatus,
  type EventSummary,
} from "../lib/events";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Events · MPL Ops" }];
}

export async function loader(_: Route.LoaderArgs) {
  const events = await listEventSummaries();
  return { events };
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const name = String(form.get("name") ?? "").trim();
  if (!name) return { error: "Event name is required" };
  await createEvent({
    name,
    city: String(form.get("city") ?? "").trim(),
    venue: String(form.get("venue") ?? "").trim(),
    eventDate: String(form.get("event_date") ?? "").trim() || null,
  });
  return { ok: true };
}

const STATUS_BADGE: Record<EventStatus, string> = {
  planning: "bg-amber-500/15 text-amber-400 ring-amber-500/30",
  confirmed: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30",
  complete: "bg-zinc-500/15 text-zinc-400 ring-zinc-500/30",
};

export default function Events({ loaderData, actionData }: Route.ComponentProps) {
  const nav = useNavigation();
  const busy = nav.state !== "idle";

  return (
    <div className="min-h-screen bg-background">
      <OpsHeader section="All events" />

      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Events
            </h1>
            <p className="mt-1 text-muted-foreground">
              Track sponsors, speakers, and local champions — and their
              onboarding — for every MPL event.
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            {loaderData.events.length} event
            {loaderData.events.length === 1 ? "" : "s"}
          </div>
        </div>

        {/* New event */}
        <Form
          method="post"
          className="mt-8 grid gap-3 rounded-xl border border-border bg-card p-5 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-end"
        >
          <Field label="Event name" required>
            <input
              name="name"
              required
              placeholder="MPL Live: Chicago"
              className={inputCls}
            />
          </Field>
          <Field label="City">
            <input name="city" placeholder="Chicago, IL" className={inputCls} />
          </Field>
          <Field label="Venue">
            <input name="venue" placeholder="1871" className={inputCls} />
          </Field>
          <div className="flex items-end gap-3">
            <Field label="Date">
              <input name="event_date" type="date" className={inputCls} />
            </Field>
            <Button type="submit" disabled={busy} className="h-10">
              {busy ? "Adding…" : "Add event"}
            </Button>
          </div>
          {actionData && "error" in actionData && actionData.error && (
            <p className="text-sm text-destructive sm:col-span-full">
              {actionData.error}
            </p>
          )}
        </Form>

        {/* Event list */}
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {loaderData.events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
          {loaderData.events.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground lg:col-span-2">
              No events yet — add one above.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function EventCard({ event }: { event: EventSummary }) {
  const pct = event.total ? Math.round((event.ready / event.total) * 100) : 0;
  return (
    <Link
      to={`/events/${event.id}`}
      className="card-lift group block rounded-xl border border-border bg-card p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground group-hover:text-primary">
            {event.name}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {[event.city, event.venue].filter(Boolean).join(" · ") ||
              "Location TBD"}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset ${STATUS_BADGE[event.status]}`}
        >
          {event.status}
        </span>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        {event.event_date
          ? new Date(event.event_date).toLocaleDateString(undefined, {
              weekday: "short",
              month: "long",
              day: "numeric",
              year: "numeric",
            })
          : "Date TBD"}
      </p>

      {/* Per-role staffing vs target */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        {ROLES.map((role) => {
          const c = event.roleCounts[role];
          const meta = ROLE_META[role];
          const enough = c.total >= meta.min;
          return (
            <div
              key={role}
              className="rounded-lg border border-border bg-background/40 p-3"
            >
              <div className="text-xs font-medium text-muted-foreground">
                {meta.plural}
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span
                  className={`text-xl font-semibold ${enough ? "text-foreground" : "text-amber-400"}`}
                >
                  {c.total}
                </span>
                <span className="text-xs text-muted-foreground">
                  / {meta.min}–{meta.max}
                </span>
              </div>
              <div className="mt-1 text-xs text-emerald-400">
                {c.ready} ready
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall onboarding progress */}
      <div className="mt-5">
        <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
          <span>Onboarding</span>
          <span>
            {event.ready}/{event.total} ready · {pct}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </Link>
  );
}

const inputCls =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </span>
      {children}
    </label>
  );
}
