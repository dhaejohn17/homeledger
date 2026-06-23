import { NextRequest } from "next/server";
import { auth } from "@/auth";
import {
  getActiveWallet,
  getDashboardData,
  getBudgetsWithSpend,
  getGoals,
} from "@/lib/data";
import { streamChat, OllamaError, ollamaModel, type ChatMessage } from "@/lib/ollama";
import { formatPeso } from "@/lib/format";

export const runtime = "nodejs";
export const maxDuration = 120;

function peso(n: number) {
  return formatPeso(n, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/** Builds a compact, current snapshot of the active wallet for the model. */
async function buildContext(walletId: string, walletName: string): Promise<string> {
  const [data, budgets, goals] = await Promise.all([
    getDashboardData(walletId),
    getBudgetsWithSpend(walletId),
    getGoals(walletId),
  ]);

  const lines: string[] = [];
  lines.push(`Wallet: ${walletName}`);
  lines.push(`Total balance across all accounts: ${peso(data.totalBalance)} (${data.accountCount} accounts)`);
  lines.push(`This month — income: ${peso(data.monthlyIncome)}, expenses: ${peso(data.monthlyExpenses)}, savings rate: ${Math.round(data.savingsRate * 100)}%`);

  if (data.categoryBreakdown.length) {
    const top = data.categoryBreakdown
      .slice(0, 6)
      .map((c) => `${c.name} ${peso(c.value)}`)
      .join(", ");
    lines.push(`Top spending categories this month: ${top}`);
  }

  if (budgets.length) {
    const b = budgets
      .map(
        (x) =>
          `${x.categoryName}: spent ${peso(x.spent)} of ${peso(x.amount)} (${Math.round(x.pct * 100)}%)`,
      )
      .join("; ");
    lines.push(`Budgets: ${b}`);
  }

  if (goals.length) {
    const g = goals
      .map((x) => `${x.name}: ${peso(x.currentAmount)} / ${peso(x.targetAmount)}`)
      .join("; ");
    lines.push(`Savings goals: ${g}`);
  }

  if (data.monthlyFlow.length) {
    const flow = data.monthlyFlow
      .map((m) => `${m.name}(+${Math.round(m.income)}/-${Math.round(m.expense)})`)
      .join(" ");
    lines.push(`6-month income/expense flow in pesos: ${flow}`);
  }

  return lines.join("\n");
}

const SYSTEM_BASE = `You are HomeLedger's built-in finance assistant for a household in the Philippines.
You help the user understand their spending, budgets, and savings using the data snapshot provided.
Guidelines:
- All amounts are in Philippine pesos (₱). Use ₱ and comma-grouped figures.
- Be concise, warm, and practical. Prefer short paragraphs or tight bullet lists.
- Ground every number in the snapshot. If something isn't in the snapshot, say you don't have that detail rather than inventing it.
- You give general budgeting guidance, not licensed financial advice; keep suggestions sensible and low-risk.
- When useful, reference local context (GCash, Maya, BPI, BDO, Meralco, Grab, etc.).`;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let incoming: ChatMessage[] = [];
  try {
    const body = await req.json();
    if (Array.isArray(body?.messages)) {
      incoming = body.messages
        .filter(
          (m: unknown): m is ChatMessage =>
            !!m &&
            typeof (m as ChatMessage).content === "string" &&
            ["user", "assistant"].includes((m as ChatMessage).role),
        )
        .slice(-12);
    }
  } catch {
    /* fall through to empty */
  }

  if (incoming.length === 0) {
    return new Response(JSON.stringify({ error: "No message provided." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const wallet = await getActiveWallet(session.user.id);
  const context = wallet
    ? await buildContext(wallet.id, wallet.name)
    : "The user has not created a wallet yet.";

  const messages: ChatMessage[] = [
    { role: "system", content: `${SYSTEM_BASE}\n\nCURRENT SNAPSHOT:\n${context}` },
    ...incoming,
  ];

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of streamChat(messages)) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (err) {
        const msg =
          err instanceof OllamaError
            ? err.message
            : `The assistant is unavailable right now. Make sure Ollama is running and the "${ollamaModel}" model is pulled.`;
        controller.enqueue(encoder.encode(`\u26a0\ufe0f ${msg}`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
