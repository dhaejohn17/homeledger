import prisma from "@/lib/prisma";

/** Throws if the user can't access the wallet. Returns the wallet id. */
export async function assertWalletAccess(userId: string, walletId: string): Promise<string> {
  const wallet = await prisma.wallet.findFirst({
    where: { id: walletId, OR: [{ ownerId: userId }, { members: { some: { userId } } }] },
    select: { id: true },
  });
  if (!wallet) throw new Error("Wallet not found or access denied.");
  return wallet.id;
}

/** Throws if the user can't access the account. Returns { id, walletId }. */
export async function assertAccountAccess(userId: string, accountId: string) {
  const account = await prisma.account.findFirst({
    where: {
      id: accountId,
      wallet: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] },
    },
    select: { id: true, walletId: true },
  });
  if (!account) throw new Error("Account not found or access denied.");
  return account;
}
