"use client";

import * as React from "react";
import { useActionState } from "react";
import { Plus } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { createGoal, type ActionResult } from "@/actions/finance";

const initial: ActionResult = { ok: false };

export function GoalDialog() {
  const [open, setOpen] = React.useState(false);
  const [state, formAction] = useActionState(createGoal, initial);

  React.useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state]);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> New goal
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Create a savings goal"
        description="Set a target to save toward — a gadget, a trip, an emergency fund."
      >
        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="g-name">Goal</Label>
            <Input id="g-name" name="name" placeholder="e.g. Emergency Fund" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="g-target">Target (₱)</Label>
              <Input id="g-target" name="targetAmount" type="number" step="0.01" min="0.01" placeholder="0.00" required />
            </div>
            <div>
              <Label htmlFor="g-current">Saved so far (₱)</Label>
              <Input id="g-current" name="currentAmount" type="number" step="0.01" min="0" defaultValue="0" />
            </div>
          </div>
          <div>
            <Label htmlFor="g-deadline">Target date (optional)</Label>
            <Input id="g-deadline" name="deadline" type="date" />
          </div>
          {state.error && <p className="text-sm text-negative">{state.error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton>Create goal</SubmitButton>
          </div>
        </form>
      </Dialog>
    </>
  );
}
