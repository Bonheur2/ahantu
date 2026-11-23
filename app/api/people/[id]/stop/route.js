import { clearLocationById } from "@/lib/people";

export async function POST(_req, { params }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return Response.json({ error: "invalid id" }, { status: 400 });
  await clearLocationById(id);
  return Response.json({ status: "stopped" });
}
