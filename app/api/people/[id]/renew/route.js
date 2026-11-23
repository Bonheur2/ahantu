import { renewLink } from "@/lib/people";

export async function POST(_req, { params }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return Response.json({ error: "invalid id" }, { status: 400 });
  const person = await renewLink(id);
  if (!person) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({ person });
}
