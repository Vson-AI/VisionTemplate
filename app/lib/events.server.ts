import { pool } from "./db.server";
import {
  emptyRoleMap,
  ROLES,
  type DocumentRow,
  type EventDetail,
  type EventRow,
  type EventStatus,
  type EventSummary,
  type MemberRow,
  type OnboardingStatus,
  type ResourceRow,
  type Role,
  type RoleCount,
} from "./events";

// event_date is stored as DATE; format to YYYY-MM-DD so it round-trips as a
// plain string without timezone surprises.
const EVENT_COLS =
  "id, name, city, venue, to_char(event_date, 'YYYY-MM-DD') AS event_date, status, created_at";

export async function listEventSummaries(): Promise<EventSummary[]> {
  const { rows: events } = await pool.query<EventRow>(
    `SELECT ${EVENT_COLS} FROM events ORDER BY event_date IS NULL, event_date, id`,
  );

  const { rows: counts } = await pool.query<{
    event_id: number;
    role: Role;
    total: number;
    ready: number;
  }>(
    `SELECT event_id, role,
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE onboarding = 'ready')::int AS ready
       FROM event_members
      GROUP BY event_id, role`,
  );

  const byEvent = new Map<number, Record<Role, RoleCount>>();
  for (const e of events) {
    const map = emptyRoleMap<RoleCount>(() => ({
      role: "sponsor",
      total: 0,
      ready: 0,
    }));
    for (const role of ROLES) map[role] = { role, total: 0, ready: 0 };
    byEvent.set(e.id, map);
  }
  for (const c of counts) {
    const map = byEvent.get(c.event_id);
    if (map) map[c.role] = { role: c.role, total: c.total, ready: c.ready };
  }

  return events.map((e) => {
    const roleCounts = byEvent.get(e.id)!;
    const total = ROLES.reduce((n, r) => n + roleCounts[r].total, 0);
    const ready = ROLES.reduce((n, r) => n + roleCounts[r].ready, 0);
    return { ...e, roleCounts, total, ready };
  });
}

export async function getEventDetail(id: number): Promise<EventDetail | null> {
  const { rows: eventRows } = await pool.query<EventRow>(
    `SELECT ${EVENT_COLS} FROM events WHERE id = $1`,
    [id],
  );
  const event = eventRows[0];
  if (!event) return null;

  const { rows: memberRows } = await pool.query<MemberRow>(
    `SELECT id, event_id, role, name, detail, email, onboarding, created_at
       FROM event_members
      WHERE event_id = $1
      ORDER BY created_at, id`,
    [id],
  );

  const { rows: documents } = await pool.query<DocumentRow>(
    `SELECT id, event_id, title, url, created_at
       FROM event_documents
      WHERE event_id = $1
      ORDER BY created_at, id`,
    [id],
  );

  const { rows: resourceRows } = await pool.query<ResourceRow>(
    `SELECT id, role, title, url, sort FROM role_resources ORDER BY role, sort, id`,
  );

  const members = emptyRoleMap<MemberRow[]>(() => []);
  for (const m of memberRows) members[m.role]?.push(m);

  const resources = emptyRoleMap<ResourceRow[]>(() => []);
  for (const r of resourceRows) resources[r.role]?.push(r);

  return { event, members, documents, resources };
}

export async function createEvent(input: {
  name: string;
  city: string;
  venue: string;
  eventDate: string | null;
}): Promise<EventRow> {
  const { rows } = await pool.query<EventRow>(
    `INSERT INTO events (name, city, venue, event_date)
     VALUES ($1, $2, $3, NULLIF($4, '')::date)
     RETURNING ${EVENT_COLS}`,
    [input.name, input.city, input.venue, input.eventDate ?? ""],
  );
  return rows[0];
}

export async function setEventStatus(
  id: number,
  status: EventStatus,
): Promise<void> {
  await pool.query(`UPDATE events SET status = $2 WHERE id = $1`, [id, status]);
}

export async function deleteEvent(id: number): Promise<void> {
  await pool.query(`DELETE FROM events WHERE id = $1`, [id]);
}

export async function addMember(input: {
  eventId: number;
  role: Role;
  name: string;
  detail: string;
  email: string;
}): Promise<MemberRow> {
  const { rows } = await pool.query<MemberRow>(
    `INSERT INTO event_members (event_id, role, name, detail, email)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, event_id, role, name, detail, email, onboarding, created_at`,
    [input.eventId, input.role, input.name, input.detail, input.email],
  );
  return rows[0];
}

export async function setMemberStatus(
  id: number,
  onboarding: OnboardingStatus,
): Promise<void> {
  await pool.query(`UPDATE event_members SET onboarding = $2 WHERE id = $1`, [
    id,
    onboarding,
  ]);
}

export async function removeMember(id: number): Promise<void> {
  await pool.query(`DELETE FROM event_members WHERE id = $1`, [id]);
}

export async function addDocument(input: {
  eventId: number;
  title: string;
  url: string;
}): Promise<DocumentRow> {
  const { rows } = await pool.query<DocumentRow>(
    `INSERT INTO event_documents (event_id, title, url)
     VALUES ($1, $2, $3)
     RETURNING id, event_id, title, url, created_at`,
    [input.eventId, input.title, input.url],
  );
  return rows[0];
}

export async function removeDocument(id: number): Promise<void> {
  await pool.query(`DELETE FROM event_documents WHERE id = $1`, [id]);
}
