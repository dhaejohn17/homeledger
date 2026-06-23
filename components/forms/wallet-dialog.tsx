"use client";

import * as React from "react";
import { useActionState } from "react";
import { Plus } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { createWallet, type ActionResult } from "@/actions/finance";

const initial: ActionResult = { ok: false };

export function WalletDialog() {
  const [open, setOpen] = React.useState(false);
  const [state, formAction] = useActionState(createWallet, initial);

  React.useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Create wallet
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Create a wallet"
        description="A wallet groups accounts, categories, budgets and goals. New wallets start with Cash and GCash accounts."
      >
        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="w-name">Name</Label>
            <Input id="w-name" name="name" placeholder="e.g. Household Fund" required />
          </div>
          <div>
            <Label htmlFor="w-type">Type</Label>
            <Select id="w-type" name="type" defaultValue="PERSONAL">
              <option value="PERSONAL">Personal — only you</option>
              <option value="SHARED">Shared — for the household</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="w-desc">Description (optional)</Label>
            <Textarea id="w-desc" name="description" placeholder="What's this wallet for?" maxLength={160} />
          </div>
          {state.error && <p className="text-sm text-negative">{state.error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton>Create wallet</SubmitButton>
          </div>
        </form>
      </Dialog>
    </>
  );
}
