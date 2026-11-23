import { query } from "@/lib/db";
import { LIFETIME_OPTIONS, getSettings } from "@/lib/settings";
import SettingsForm from "@/components/SettingsForm";

export const metadata = { title: "Settings - Locate" };

export default async function SettingsPage() {
  const settings = await getSettings();
  const status = {
    database: await query("select 1").then(() => true, () => false),
    geocoding: Boolean(process.env.GOOGLE_MAPS_API_KEY),
    adminPassword: Boolean(process.env.ADMIN_PASSWORD),
  };
  return <SettingsForm settings={settings} options={LIFETIME_OPTIONS} status={status} />;
}
