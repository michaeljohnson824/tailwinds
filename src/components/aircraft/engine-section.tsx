"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EngineForm } from "@/components/aircraft/engine-form";

type EngineData = {
  id: string;
  make_model: string | null;
  tbo_hours: number | null;
  tsmoh: number | string | null;
  overhaul_cost_estimate: number | string | null;
  last_oil_change_tach: number | string | null;
  oil_change_interval_hours: number | null;
};

export function EngineSection({
  engine,
  createAction,
  updateAction,
}: {
  engine: EngineData | null;
  createAction: (
    prev: { error: string | null },
    formData: FormData,
  ) => Promise<{ error: string | null }>;
  updateAction:
    | ((
        prev: { error: string | null },
        formData: FormData,
      ) => Promise<{ error: string | null }>)
    | null;
}) {
  const [showForm, setShowForm] = useState(false);

  // No engine — show setup prompt or form
  if (!engine) {
    if (!showForm) {
      return (
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-medium">Engine</p>
              <p className="text-xs text-muted-foreground">
                Set up engine tracking for TBO countdown and oil change reminders
              </p>
            </div>
            <Button variant="outline" onClick={() => setShowForm(true)}>
              Set Up Engine
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Set Up Engine</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <EngineForm action={createAction} />
        </CardContent>
      </Card>
    );
  }

  // Engine exists — show edit form toggle
  if (!showForm) {
    return (
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => setShowForm(true)}
        >
          Edit Engine
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Edit Engine</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowForm(false)}
          >
            Cancel
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <EngineForm engine={engine} action={updateAction!} />
      </CardContent>
    </Card>
  );
}
