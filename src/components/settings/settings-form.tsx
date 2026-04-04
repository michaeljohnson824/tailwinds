"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { updateProfile } from "@/lib/actions/profile";
import { signOut } from "@/lib/actions/auth";

type ProfileData = {
  display_name: string | null;
  medical_class: number | null;
  medical_expiration: string | null;
  flight_review_date: string | null;
} | null;

export function SettingsForm({
  profile,
  email,
}: {
  profile: ProfileData;
  email: string;
}) {
  const [state, formAction, pending] = useActionState(updateProfile, {
    error: null,
  });

  return (
    <div className="space-y-6 max-w-lg">
      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="grid gap-4">
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input value={email} disabled className="bg-muted/50" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                name="displayName"
                defaultValue={profile?.display_name ?? ""}
              />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="medicalClass">Medical Class</Label>
                <select
                  id="medicalClass"
                  name="medicalClass"
                  defaultValue={profile?.medical_class ?? ""}
                  className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                >
                  <option value="">Not set</option>
                  <option value="1">Class 1</option>
                  <option value="2">Class 2</option>
                  <option value="3">Class 3</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="medicalExpiration">Medical Expiration</Label>
                <Input
                  id="medicalExpiration"
                  name="medicalExpiration"
                  type="date"
                  defaultValue={profile?.medical_expiration ?? ""}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="flightReviewDate">Last Flight Review</Label>
              <Input
                id="flightReviewDate"
                name="flightReviewDate"
                type="date"
                defaultValue={profile?.flight_review_date ?? ""}
              />
            </div>

            {state.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
            {state.error === null && pending === false && (
              <p className="text-sm text-success hidden" id="save-success">
                Saved
              </p>
            )}

            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Data */}
      <Card>
        <CardHeader>
          <CardTitle>Data</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button
            variant="outline"
            render={<a href="/api/export" download />}
            nativeButton={false}
          >
            Export Logbook CSV
          </Button>
          <Button
            variant="outline"
            render={<a href="/dashboard/import" />}
            nativeButton={false}
          >
            Import CSV
          </Button>
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={signOut}>
            <Button variant="outline" className="text-destructive hover:text-destructive">
              Sign Out
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
