// Shared, client-safe types + UI constants for the MPL events ops tool.
// (No DB imports here so this can be used inside components. All queries live
// in events.server.ts.)

export type Role = "sponsor" | "speaker" | "champion";
export type OnboardingStatus = "invited" | "confirmed" | "onboarding" | "ready";
export type EventStatus = "planning" | "confirmed" | "complete";

export const ROLES: Role[] = ["sponsor", "speaker", "champion"];

export const ROLE_META: Record<
  Role,
  { label: string; plural: string; min: number; max: number; blurb: string }
> = {
  sponsor: {
    label: "Sponsor",
    plural: "Sponsors",
    min: 4,
    max: 8,
    blurb: "Funding partners — 4 to 8 per event.",
  },
  speaker: {
    label: "Speaker",
    plural: "Speakers",
    min: 5,
    max: 10,
    blurb: "HR leaders on stage — 5 to 10 per event.",
  },
  champion: {
    label: "Local Champion",
    plural: "Local Champions",
    min: 4,
    max: 5,
    blurb: "On-the-ground hosts — 4 to 5 per event.",
  },
};

export const ONBOARDING: {
  key: OnboardingStatus;
  label: string;
  hint: string;
}[] = [
  { key: "invited", label: "Invited", hint: "Outreach sent, awaiting reply" },
  { key: "confirmed", label: "Confirmed", hint: "Committed to participate" },
  {
    key: "onboarding",
    label: "Onboarding",
    hint: "Collecting materials & details",
  },
  { key: "ready", label: "Ready", hint: "Fully onboarded" },
];

export const EVENT_STATUSES: EventStatus[] = [
  "planning",
  "confirmed",
  "complete",
];

export function statusIndex(s: OnboardingStatus): number {
  return ONBOARDING.findIndex((x) => x.key === s);
}

export function isValidRole(v: unknown): v is Role {
  return typeof v === "string" && (ROLES as string[]).includes(v);
}

export function isValidStatus(v: unknown): v is OnboardingStatus {
  return (
    typeof v === "string" && ONBOARDING.some((s) => s.key === v)
  );
}

// ---- Row + view types ------------------------------------------------------

export type EventRow = {
  id: number;
  name: string;
  city: string;
  venue: string;
  event_date: string | null;
  status: EventStatus;
  created_at: string;
};

export type MemberRow = {
  id: number;
  event_id: number;
  role: Role;
  name: string;
  detail: string;
  email: string;
  onboarding: OnboardingStatus;
  created_at: string;
};

export type DocumentRow = {
  id: number;
  event_id: number;
  title: string;
  url: string;
  created_at: string;
};

export type ResourceRow = {
  id: number;
  role: Role;
  title: string;
  url: string;
  sort: number;
};

export type RoleCount = { role: Role; total: number; ready: number };

export type EventSummary = EventRow & {
  roleCounts: Record<Role, RoleCount>;
  total: number;
  ready: number;
};

export type EventDetail = {
  event: EventRow;
  members: Record<Role, MemberRow[]>;
  documents: DocumentRow[];
  resources: Record<Role, ResourceRow[]>;
};

export function emptyRoleMap<T>(make: () => T): Record<Role, T> {
  return {
    sponsor: make(),
    speaker: make(),
    champion: make(),
  };
}
