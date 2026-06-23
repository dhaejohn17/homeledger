"use client";

import * as React from "react";
import { useActionState } from "react";
import { Plus } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { createAccount, type ActionResult } from "@/actions/finance";

const initial: ActionResult = { ok: false };

export function AccountDialog() {
  const [open, setOpen] = React.useState(false);
  const [state, formAction] = useActionState(createAccount, initial);

  React.useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state]);

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Add account
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Add an account"
        description="Add a cash stash, bank account, or e-wallet to the current wallet."
      >
        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="a-name">Name</Label>
            <Input id="a-name" name="name" placeholder="e.g. BPI Savings" required />
          </div>
          <div>
            <Label htmlFor="a-type">Type</Label>
            <Select id="a-type" name="type" defaultValue="BANK">
              <option value="CASH">Cash</option>
              <option value="BANK">Bank</option>
              <option value="EWALLET">E-Wallet (GCash, Maya)</option>
              <option value="SAVINGS">Savings</option>
              <option value="CREDIT_CARD">Credit Card</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="a-balance">Opening balance (₱)</Label>
            <Input id="a-balance" name="balance" type="number" step="0.01" defaultValue="0" />
          </div>
          {state.error && <p className="text-sm text-negative">{state.error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton>Add account</SubmitButton>
          </div>
        </form>
      </Dialog>
    </>
  );
}
