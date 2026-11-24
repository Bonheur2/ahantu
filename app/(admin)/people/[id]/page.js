import { notFound } from "next/navigation";
import { getPersonById } from "@/lib/people";
import { getSettings } from "@/lib/settings";
import PersonDetail from "@/components/PersonDetail";

export const metadata = { title: "Person details - Locate" };

export default async function PersonPage({ params }) {
  const id = Number((await params).id);
  const person = Number.isInteger(id) ? await getPersonById(id) : null;
  if (!person) notFound();
  const settings = await getSettings();
  return <PersonDetail person={person} baseUrl={settings.baseUrl} mapsKey={process.env.GOOGLE_MAPS_BROWSER_KEY || process.env.GOOGLE_MAPS_API_KEY || ""} />;
}
