import { getPersonByToken } from "@/lib/people";
import { getSettings } from "@/lib/settings";
import ShareClient from "./ShareClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Location consent", robots: { index: false } };

export default async function SharePage({ params }) {
  const { token } = await params;
  const person = await getPersonByToken(token);
  if (!person) {
    return (
      <main style={{ padding: 40 }}>
        <h1>Sharing link expired</h1>
        <p>Ask the sender for a new link.</p>
      </main>
    );
  }
  const { orgName } = await getSettings();
  return <ShareClient token={token} name={person.name} orgName={orgName} />;
}
