"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { registerUser, type ActionResult } from "@/actions/auth";

const initial: ActionResult = { ok: false };

export default function RegisterPage() {
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);

  // Wrap the action so a successful registration logs the user straight in.
  const [state, action, pending] = useActionState(
    async (prev: ActionResult, formData: FormData): Promise<ActionResult> => {
      const result = await registerUser(prev, formData);
      if (result.ok) {
        setSigningIn(true);
        await signIn("credentials", {
          email: String(formData.get("email")).toLowerCase(),
          password: String(formData.get("password")),
          redirect: false,
        });
        router.push("/dashboard");
        router.refresh();
      }
      return result;
    },
    initial,
  );

  const busy = pending || signingIn;

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-[var(--shadow-card)]">
          <h1 className="font-display text-2xl font-semibold text-ink">Create your account</h1>
          <p className="mt-1 text-sm text-ink-muted">
            We&apos;ll set up a personal wallet to get you started.
          </p>

          <form action={action} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" name="name" autoComplete="name" placeholder="Maria Santos" required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                required
              />
            </div>

            {state.error && <p className="text-sm text-negative">{state.error}</p>}

            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {signingIn ? "Signing you in…" : "Create account"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
