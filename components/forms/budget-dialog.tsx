"use client";

import * as React from "react";
import { useActionState } from "react";
import { Plus } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { createBudget, type ActionResult } from "@/actions/finance";

type Category = { id: string; name: string; type: string };
const initial: ActionResult = { ok: false };

export function BudgetDialog({ categories }: { categories: Category[] }) {
  const [open, setOpen] = React.useState(false);
  const [state, formAction] = useActionState(createBudget, initial);
  const expenseCats = categories.filter((c) => c.type === "EXPENSE");

  React.useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> New budget
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Create a budget"
        description="Set a spending limit for a category over a period."
      >
        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="b-cat">Category</Label>
            <Select id="b-cat" name="categoryId" defaultValue="">
              <option value="">Overall spending</option>
              {expenseCats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="b-amount">Limit (₱)</Label>
              <Input id="b-amount" name="amount" type="number" step="0.01" min="0.01" placeholder="0.00" required />
            </div>
            <div>
              <Label htmlFor="b-period">Period</Label>
              <Select id="b-period" name="period" defaultValue="MONTHLY">
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </Select>
            </div>
          </div>
          {state.error && <p className="text-sm text-negative">{state.error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton>Create budget</SubmitButton>
          </div>
        </form>
      </Dialog>
    </>
  );
}
