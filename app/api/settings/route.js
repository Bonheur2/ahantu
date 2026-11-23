import { getSettings, updateSettings } from "@/lib/settings";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ settings: await getSettings() });
}

export async function PUT(req) {
  const body = await req.json().catch(() => ({}));
  const result = await updateSettings(body);
  if (result.error) return Response.json({ error: result.error }, { status: 400 });
  return Response.json(result);
}
