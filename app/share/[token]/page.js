import { getPersonByToken } from "@/lib/people";
import { getSettings } from "@/lib/settings";
import LinkExpired from "@/components/LinkExpired";
import ShareClient from "./ShareClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Location sharing", robots: { index: false } };

export default async function SharePage({ params }) {
  const { token } = await params;
  const [person, { orgName }] = await Promise.all([getPersonByToken(token), getSettings()]);
  if (!person) return <LinkExpired orgName={orgName} />;
  return <ShareClient token={token} name={person.name} orgName={orgName} />;
}
