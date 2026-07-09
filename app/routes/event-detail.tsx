import { Form, Link, useNavigation } from "react-router";
import type { Route } from "./+types/event-detail";
import { Button } from "../components/Button";
import { OpsHeader } from "../components/Mpl";
import {
  addDocument,
  addMember,
  getEventDetail,
  removeDocument,
  removeMember,
  setEventStatus,
  setMemberStatus,
} from "../lib/events.server";
import {
  EVENT_STATUSES,
  isValidRole,
  isValidStatus,
  ONBOARDING,
  ROLE_META,
  ROLES,
  statusIndex,
  type EventDetail,
  type EventStatus,
  type MemberRow,
  type OnboardingStatus,
  type ResourceRow,
  type Role,
} from "../lib/events";

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: `${loaderData?.detail.event.name ?? "Event"} · MPL Ops` }];
}

export async function loader({ params }: Route.LoaderArgs) {
  const id = Number(params.eventId);
  const detail = Number.isFinite(id) ? await getEventDetail(id) : null;
  if (!detail) throw new Response("Event not found", { status: 404 });
  return { detail };
}

export async function action({ request, params }: Route.ActionArgs) {
  const eventId = Number(params.eventId);
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");

  switch (intent) {
    case "set-status": {
      const status = form.get("status");
      if (isValidStatus(status)) {
        await setMemberStatus(Number(form.get("memberId")), status);
      }
      return { ok: true };
    }
    case "add-member": {
      const role = form.get("role");
      const name = String(form.get("name") ?? "").trim();
      if (isValidRole(role) && name) {
        await addMember({
          eventId,
          role,
          name,
          detail: String(form.get("detail") ?? "").trim(),
          email: String(form.get("email") ?? "").trim(),
        });
      }
      return { ok: true };
    }
    case "remove-member": {
      await removeMember(Number(form.get("memberId")));
      return { ok: true };
    }
    case "add-document": {
      const title = String(form.get("title") ?? "").trim();
      if (title) {
        await addDocument({
          eventId,
          title,
          url: String(form.get("url") ?? "").trim(),
        });
      }
      return { ok: true };
    }
    case "remove-document": {
      await removeDocument(Number(form.get("documentId")));
      return { ok: true };
    }
    case "set-event-status": {
      const status = form.get("status");
      if (EVENT_STATUSES.includes(status as EventStatus)) {
        await setEventStatus(eventId, status as EventStatus);
      }
      return { ok: true };
    }
    default:
      return { ok: false };
  }
}

// Single-color progress: reached stages take the current status' color.
const STATUS_COLOR: Record<
  OnboardingStatus,
  { bar: string; text: string; ring: string }
> = {
  invited: { bar: "bg-zinc-500", text: "text-zinc-400", ring: "ring-zinc-500/40" },
  confirmed: { bar: "bg-sky-500", text: "text-sky-400", ring: "ring-sky-500/40" },
  onboarding: {
    bar: "bg-amber-500",
    text: "text-amber-400",
    ring: "ring-amber-500/40",
  },
  ready: {
    bar: "bg-emerald-500",
    text: "text-emerald-400",
    ring: "ring-emerald-500/40",
  },
};

const ROLE_ACCENT: Record<Role, string> = {
  sponsor: "text-amber-400",
  speaker: "text-primary",
  champion: "text-emerald-400",
};

export default function EventDetailPage({
  loaderData,
}: Route.ComponentProps) {
  const { detail } = loaderData;
  const { event } = detail;

  const total = ROLES.reduce((n, r) => n + detail.members[r].length, 0);
  const ready = ROLES.reduce(
    (n, r) => n + detail.members[r].filter((m) => m.onboarding === "ready").length,
    0,
  );

  return (
    <div className="min-h-screen bg-background">
      <OpsHeader section={event.name} />

      <main className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
        <Link
          to="/events"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← All events
        </Link>

        {/* Event header */}
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {event.name}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {[event.city, event.venue].filter(Boolean).join(" · ") ||
                "Location TBD"}
              {event.event_date &&
                ` · ${new Date(event.event_date).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}`}
            </p>
          </div>
          <EventStatusControl status={event.status} />
        </div>

        {/* Summary strip */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ROLES.map((role) => {
            const members = detail.members[role];
            const meta = ROLE_META[role];
            const enough = members.length >= meta.min;
            return (
              <Stat
                key={role}
                label={meta.plural}
                value={`${members.length}`}
                sub={`target ${meta.min}–${meta.max}`}
                warn={!enough}
              />
            );
          })}
          <Stat
            label="Onboarding ready"
            value={`${ready}/${total}`}
            sub={`${total ? Math.round((ready / total) * 100) : 0}% complete`}
          />
        </div>

        {/* Role sections */}
        <div className="mt-10 flex flex-col gap-10">
          {ROLES.map((role) => (
            <RoleSection
              key={role}
              role={role}
              members={detail.members[role]}
              resources={detail.resources[role]}
            />
          ))}
        </div>

        <DocumentsPanel detail={detail} />
      </main>
    </div>
  );
}

function EventStatusControl({ status }: { status: EventStatus }) {
  return (
    <Form method="post" className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
      <input type="hidden" name="intent" value="set-event-status" />
      {EVENT_STATUSES.map((s) => (
        <button
          key={s}
          name="status"
          value={s}
          className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
            s === status
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {s}
        </button>
      ))}
    </Form>
  );
}

function Stat({
  label,
  value,
  sub,
  warn,
}: {
  label: string;
  value: string;
  sub: string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div
        className={`mt-1 text-2xl font-semibold ${warn ? "text-amber-400" : "text-foreground"}`}
      >
        {value}
      </div>
      <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

function RoleSection({
  role,
  members,
  resources,
}: {
  role: Role;
  members: MemberRow[];
  resources: ResourceRow[];
}) {
  const meta = ROLE_META[role];
  const enough = members.length >= meta.min;

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-3">
          <h2 className={`text-xl font-bold ${ROLE_ACCENT[role]}`}>
            {meta.plural}
          </h2>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
              enough
                ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/30"
                : "bg-amber-500/10 text-amber-400 ring-amber-500/30"
            }`}
          >
            {members.length} / {meta.min}–{meta.max}
            {!enough && ` · need ${meta.min - members.length} more`}
          </span>
        </div>
        {resources.length > 0 && <ResourcesMenu resources={resources} />}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{meta.blurb}</p>

      <div className="mt-4 flex flex-col gap-3">
        {members.map((m) => (
          <MemberCard key={m.id} member={m} />
        ))}
        {members.length === 0 && (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No {meta.plural.toLowerCase()} yet.
          </p>
        )}
      </div>

      <AddMemberForm role={role} />
    </section>
  );
}

function MemberCard({ member }: { member: MemberRow }) {
  const current = statusIndex(member.onboarding);
  const color = STATUS_COLOR[member.onboarding];

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">{member.name}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${color.text} ${color.ring}`}
            >
              {member.onboarding}
            </span>
          </div>
          {member.detail && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {member.detail}
            </p>
          )}
          {member.email && (
            <a
              href={`mailto:${member.email}`}
              className="mt-0.5 inline-block text-xs text-muted-foreground hover:text-primary"
            >
              {member.email}
            </a>
          )}
        </div>
        <Form method="post">
          <input type="hidden" name="intent" value="remove-member" />
          <input type="hidden" name="memberId" value={member.id} />
          <button
            className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-destructive"
            aria-label={`Remove ${member.name}`}
          >
            Remove
          </button>
        </Form>
      </div>

      {/* Onboarding stepper — click any stage to set it */}
      <Form method="post" className="mt-4">
        <input type="hidden" name="intent" value="set-status" />
        <input type="hidden" name="memberId" value={member.id} />
        <div className="grid grid-cols-4 gap-1.5">
          {ONBOARDING.map((stage, i) => {
            const reached = i <= current;
            return (
              <button
                key={stage.key}
                name="status"
                value={stage.key}
                title={stage.hint}
                className="group/stage text-left"
              >
                <span
                  className={`block h-1.5 rounded-full transition-colors ${
                    reached ? color.bar : "bg-muted"
                  }`}
                />
                <span
                  className={`mt-1.5 block text-[11px] font-medium transition-colors ${
                    i === current
                      ? color.text
                      : "text-muted-foreground group-hover/stage:text-foreground"
                  }`}
                >
                  {stage.label}
                </span>
              </button>
            );
          })}
        </div>
      </Form>
    </div>
  );
}

function ResourcesMenu({ resources }: { resources: ResourceRow[] }) {
  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <svg
          viewBox="0 0 20 20"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path
            d="M4 3.5h8l4 4V16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z"
            strokeLinejoin="round"
          />
          <path d="M11.5 3.5V8H16" strokeLinejoin="round" />
        </svg>
        Onboarding docs ({resources.length})
      </summary>
      <div className="absolute right-0 z-10 mt-2 w-72 rounded-xl border border-border bg-popover p-2 shadow-lg">
        <ul className="flex flex-col">
          {resources.map((r) => (
            <li key={r.id}>
              <a
                href={r.url || "#"}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"
              >
                {r.title}
                <span aria-hidden className="text-muted-foreground">
                  ↗
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}

function AddMemberForm({ role }: { role: Role }) {
  const nav = useNavigation();
  const busy = nav.state !== "idle";
  const meta = ROLE_META[role];
  const detailPlaceholder =
    role === "sponsor"
      ? "Tier (e.g. Gold sponsor)"
      : role === "speaker"
        ? "Title & talk topic"
        : "Focus area";

  return (
    <Form
      method="post"
      className="mt-3 grid gap-2 rounded-xl border border-dashed border-border p-3 sm:grid-cols-[1fr_1.3fr_1fr_auto] sm:items-center"
    >
      <input type="hidden" name="intent" value="add-member" />
      <input type="hidden" name="role" value={role} />
      <input
        name="name"
        required
        placeholder={`Add ${meta.label.toLowerCase()} name`}
        className={inputCls}
      />
      <input name="detail" placeholder={detailPlaceholder} className={inputCls} />
      <input
        name="email"
        type="email"
        placeholder="email@example.com"
        className={inputCls}
      />
      <Button type="submit" variant="outline" size="sm" disabled={busy}>
        Add
      </Button>
    </Form>
  );
}

function DocumentsPanel({ detail }: { detail: EventDetail }) {
  const nav = useNavigation();
  const busy = nav.state !== "idle";

  return (
    <section className="mt-12">
      <h2 className="border-b border-border pb-3 text-xl font-bold text-foreground">
        Event documentation
      </h2>
      <div className="mt-4 flex flex-col gap-2">
        {detail.documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3"
          >
            <a
              href={doc.url || "#"}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-foreground hover:text-primary"
            >
              {doc.title}
              <span aria-hidden className="ml-1.5 text-muted-foreground">
                ↗
              </span>
            </a>
            <Form method="post">
              <input type="hidden" name="intent" value="remove-document" />
              <input type="hidden" name="documentId" value={doc.id} />
              <button className="text-xs text-muted-foreground transition-colors hover:text-destructive">
                Remove
              </button>
            </Form>
          </div>
        ))}
        {detail.documents.length === 0 && (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No documents linked yet.
          </p>
        )}
      </div>

      <Form
        method="post"
        className="mt-3 grid gap-2 rounded-xl border border-dashed border-border p-3 sm:grid-cols-[1fr_1.5fr_auto] sm:items-center"
      >
        <input type="hidden" name="intent" value="add-document" />
        <input name="title" required placeholder="Document title" className={inputCls} />
        <input name="url" placeholder="https://…" className={inputCls} />
        <Button type="submit" variant="outline" size="sm" disabled={busy}>
          Add doc
        </Button>
      </Form>
    </section>
  );
}

const inputCls =
  "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
