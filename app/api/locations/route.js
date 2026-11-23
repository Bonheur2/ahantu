import { listPeople } from "@/lib/people";
export const dynamic = "force-dynamic";

export async function GET() {
  const people = await listPeople();
  return Response.json({ people: people.map(p => ({ id: p.id, location: p.location })) });
}
