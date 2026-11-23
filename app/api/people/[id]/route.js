import { deletePerson, getPersonById, updatePerson } from "@/lib/people";

function parseId(params) {
  const id = Number(params.id);
  return Number.isInteger(id) ? id : null;
}

export async function GET(_req, { params }) {
  const id = parseId(await params);
  const person = id && (await getPersonById(id));
  if (!person) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({ person });
}

export async function PATCH(req, { params }) {
  const id = parseId(await params);
  if (!id) return Response.json({ error: "invalid id" }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim().slice(0, 50);
  const memberNo = String(body.memberNo ?? "").trim().slice(0, 30);
  if (!name || !memberNo) {
    return Response.json({ error: "Name and member number are required." }, { status: 400 });
  }
  const person = await updatePerson(id, { name, memberNo });
  if (!person) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({ person });
}

export async function DELETE(_req, { params }) {
  const id = parseId(await params);
  if (!id) return Response.json({ error: "invalid id" }, { status: 400 });
  await deletePerson(id);
  return Response.json({ status: "deleted" });
}
