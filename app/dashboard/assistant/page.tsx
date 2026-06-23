import { requireUserId, getActiveWallet } from "@/lib/data";
import { AssistantChat } from "@/components/assistant/assistant-chat";

export const dynamic = "force-dynamic";

export default async function AssistantPage() {
  const userId = await requireUserId();
  const wallet = await getActiveWallet(userId);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">AI Assistant</h1>
        <p className="mt-1 text-sm text-ink-muted">
          A private finance companion that reads your wallet and runs entirely on your machine.
        </p>
      </div>
      <AssistantChat walletName={wallet?.name ?? null} />
    </div>
  );
}
