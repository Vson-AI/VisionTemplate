import type { Route } from "./+types/api.notes";
import { createNote, listNotes } from "../lib/db.server";

// GET /api/notes — list all notes as JSON
export async function loader(_: Route.LoaderArgs) {
  const notes = await listNotes();
  return Response.json({ notes });
}

// POST /api/notes — create a note ({ title, content })
export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }
  const body = await request.json();
  if (!body?.title || typeof body.title !== "string") {
    return Response.json({ error: "title is required" }, { status: 400 });
  }
  const note = await createNote(body.title, body.content ?? "");
  return Response.json({ note }, { status: 201 });
}
