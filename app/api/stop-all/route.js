import { clearAllLocations } from "@/lib/people";

export async function POST() {
  await clearAllLocations();
  return Response.json({ status: "stopped" });
}
