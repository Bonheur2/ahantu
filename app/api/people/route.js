import { createPerson, listPeople } from "@/lib/people";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ people: await listPeople() });
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim().slice(0, 50);
  const memberNo = String(body.memberNo ?? "").trim().slice(0, 30);
  if (!name) {
    return Response.json({ error: "A name is required." }, { status: 400 });
  }
  return Response.json({ person: await createPerson({ name, memberNo }) }, { status: 201 });
}
