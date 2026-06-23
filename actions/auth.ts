"use server";

import { hash } from "bcryptjs";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { DEFAULT_ACCOUNTS, DEFAULT_CATEGORIES } from "@/lib/constants";

const registerSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(80),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters."),
});

export type ActionResult = { ok: boolean; error?: string };

export async function registerUser(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid details." };
  }

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return { ok: false, error: "An account with this email already exists." };
  }

  const passwordHash = await hash(password, 10);

  // Create the user with a ready-to-use personal wallet, accounts and categories.
  await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      passwordHash,
      ownedWallets: {
        create: {
          name: "Personal",
          type: "PERSONAL",
          accounts: { create: DEFAULT_ACCOUNTS.map((a) => ({ ...a, balance: 0 })) },
          categories: { create: DEFAULT_CATEGORIES },
        },
      },
    },
  });

  return { ok: true };
}
