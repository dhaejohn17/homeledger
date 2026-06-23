import { User, Wallet as WalletIcon, Palette, Bot, ScanLine } from "lucide-react";
import { requireUserId, getCurrentUser, getActiveWallet } from "@/lib/data";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { ollamaModel } from "@/lib/ollama";
import { ACCOUNT_TYPE_LABELS } from "@/lib/constants";
import { formatPeso } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const userId = await requireUserId();
  const [user, wallet] = await Promise.all([getCurrentUser(), getActiveWallet(userId)]);

  return (
    <div className="space-y-7">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Settings</h1>
        <p className="mt-1 text-sm text-ink-muted">Your profile and how HomeLedger behaves.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <User className="h-4 w-4 text-ink-faint" />
          </CardHeader>
          <CardBody className="space-y-3">
            <Row label="Name" value={user?.name || "—"} />
            <Row label="Email" value={user?.email || "—"} />
            <Row
              label="Member since"
              value={
                user?.createdAt
                  ? new Intl.DateTimeFormat("en-PH", { dateStyle: "long" }).format(user.createdAt)
                  : "—"
              }
            />
          </CardBody>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <Palette className="h-4 w-4 text-ink-faint" />
          </CardHeader>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink">Theme</p>
                <p className="text-sm text-ink-muted">Switch between the light and dark ledger.</p>
              </div>
              <ThemeToggle />
            </div>
          </CardBody>
        </Card>

        {/* Active wallet */}
        <Card>
          <CardHeader>
            <CardTitle>Active wallet</CardTitle>
            <WalletIcon className="h-4 w-4 text-ink-faint" />
          </CardHeader>
          <CardBody>
            {wallet ? (
              <div className="space-y-3">
                <Row label="Name" value={wallet.name} />
                <Row label="Type" value={wallet.type === "SHARED" ? "Shared" : "Personal"} />
                <Row label="Accounts" value={String(wallet.accounts.length)} />
                <div className="border-t border-line pt-3">
                  <ul className="space-y-2">
                    {wallet.accounts.map((a) => (
                      <li key={a.id} className="flex items-center justify-between text-sm">
                        <span className="text-ink-muted">
                          {a.name}{" "}
                          <span className="text-ink-faint">· {ACCOUNT_TYPE_LABELS[a.type]}</span>
                        </span>
                        <span className="tnum text-ink">{formatPeso(a.balance)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-sm text-ink-muted">No wallet selected.</p>
            )}
          </CardBody>
        </Card>

        {/* Local AI */}
        <Card>
          <CardHeader>
            <CardTitle>Local AI &amp; OCR</CardTitle>
            <Bot className="h-4 w-4 text-ink-faint" />
          </CardHeader>
          <CardBody className="space-y-3">
            <Row label="Assistant model" value={ollamaModel} mono />
            <Row label="Provider" value="Ollama (on-device)" />
            <div className="flex items-start gap-2 rounded-lg bg-surface-2/50 p-3 text-sm text-ink-muted">
              <ScanLine className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" />
              <span>
                Receipt text is extracted on-device with Tesseract, then structured by your local
                model. Change the model anytime by setting <code className="text-ink">OLLAMA_MODEL</code> in{" "}
                <code className="text-ink">.env</code>.
              </span>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className={`text-sm font-medium text-ink ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}
