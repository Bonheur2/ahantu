import { clearLocation, saveLocation } from "@/lib/people";

// Public: called from the recipient's consent page. The secret token is the credential.
export async function POST(req, { params }) {
  const { token } = await params;
  const b = await req.json().catch(() => null);
  const ok =
    b && typeof b.latitude === "number" && typeof b.longitude === "number" &&
    b.latitude >= -90 && b.latitude <= 90 && b.longitude >= -180 && b.longitude <= 180;
  if (!ok) return Response.json({ error: "invalid location" }, { status: 400 });
  const accuracy = typeof b.accuracyMeters === "number" ? b.accuracyMeters : null;
  const saved = await saveLocation(token, { latitude: b.latitude, longitude: b.longitude, accuracy });
  if (!saved) return Response.json({ error: "expired" }, { status: 410 });
  return Response.json({ status: "shared" });
}

export async function DELETE(_req, { params }) {
  await clearLocation((await params).token);
  return Response.json({ status: "stopped" });
}
