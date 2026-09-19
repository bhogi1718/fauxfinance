import type { Metadata } from "next";
import { DangerZone, PasswordForm, ProfileForm } from "@/components/settings/settings-forms";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser("/settings");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Your account and your sandbox.</p>
      </div>
      <ProfileForm name={user.name} email={user.email} />
      <PasswordForm />
      <DangerZone />
    </div>
  );
}
