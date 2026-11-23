import { listPeople } from "@/lib/people";
import { getSettings } from "@/lib/settings";
import PageHeader from "@/components/PageHeader";
import PeopleTable from "@/components/PeopleTable";
import AddPersonButton from "@/components/AddPersonButton";

export const metadata = { title: "People - Locate" };

export default async function PeoplePage() {
  const [people, settings] = await Promise.all([listPeople(), getSettings()]);
  return (
    <>
      <PageHeader title="People" subtitle="Everyone you can request a location from.">
        <AddPersonButton />
      </PageHeader>
      <PeopleTable people={people} baseUrl={settings.baseUrl} />
    </>
  );
}
