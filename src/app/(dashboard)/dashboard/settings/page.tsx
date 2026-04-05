import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/queries/profile";
import { isPaidUser } from "@/lib/utils/subscription";
import { SettingsForm } from "@/components/settings/settings-form";

export const metadata: Metadata = { title: "Settings — Tailwinds" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getProfile();
  const paid = isPaidUser(profile);
  const tier = profile?.subscription_tier ?? "free";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <SettingsForm
        profile={profile}
        email={user.email!}
        subscriptionTier={tier}
        isPaid={paid}
      />
    </div>
  );
}
