# HomeLedger

A household finance app for the Philippines — wallets, accounts, transactions, budgets, savings goals, receipt scanning, and a private AI assistant. Built with Next.js 15, Prisma, PostgreSQL, Auth.js v5, and a local Ollama model.

Everything runs locally. Postgres lives in Docker; the app and your AI model run on your machine. No financial data leaves your computer.

---

## Quick start

You'll need **Node.js 18.18+**, **Docker**, and **Ollama** installed.

### 1. Start the database

```bash
docker compose up -d
```

This runs Postgres only (port 5432) with a persistent volume. Nothing else is containerized.

### 2. Configure environment

```bash
cp .env.example .env
npx auth secret        # writes a strong AUTH_SECRET into .env
```

The default `DATABASE_URL` already matches the Docker credentials, so you usually don't need to touch it.

### 3. Make sure your AI model is available

The assistant and receipt structuring use a local Ollama model. The default is `llama3:latest` (fast and light). If you don't have it:

```bash
ollama pull llama3:latest
```

Want sharper reasoning? Pull and point `OLLAMA_MODEL` in `.env` at something heavier, e.g. `qwen3:14b`. No code changes needed.

### 4. Install, set up the schema, and seed

```bash
npm install
npm run setup          # prisma generate + db push + seed demo data
```

### 5. Run

```bash
npm run dev
```

Open **http://localhost:3000**.

**Demo login:** `demo@homeledger.app` / `demo1234` — comes preloaded with a shared "Household Fund" wallet, five Philippine accounts (BPI, BDO, GCash, Maya, Cash), five months of transactions, budgets, and savings goals. Or register a fresh account from the landing page.

---

## Useful scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run setup` | Generate client, push schema, seed (first-time setup) |
| `npm run db:push` | Sync the Prisma schema to the database |
| `npm run db:seed` | (Re)seed the demo data |
| `npm run db:reset` | Wipe the database and reseed from scratch |
| `npm run db:studio` | Open Prisma Studio to inspect data |

---

## How it works

**Auth** — Auth.js v5 with a Credentials provider, bcrypt-hashed passwords, and JWT sessions. Registering creates your user plus a ready-to-use wallet, default accounts, and a full Philippine category set, then signs you in.

**Data** — Reads happen in server components through a scoped data-access layer (`lib/data.ts`); every query is filtered to the signed-in user and the active wallet (tracked via a cookie). Writes go through Server Actions (`actions/`). Account balances are updated atomically alongside each transaction inside a Prisma `$transaction`.

**Receipts** — Upload a photo → `tesseract.js` extracts the text on-device → your local Ollama model structures it into merchant, date, total, and a suggested category (with a regex fallback if Ollama is offline). You review and confirm, and it's logged as an expense with the receipt attached.

**Assistant** — Chats stream from your local model. Each request is grounded in a fresh snapshot of your active wallet (balances, this-month income/expense, top categories, budgets, goals), so answers reflect your real numbers. If Ollama isn't running, you get a clear message instead of a crash.

---

## Project structure

```
app/
  (auth)/            login + register
  dashboard/         overview, wallets, transactions, budgets, receipts, reports, assistant, settings
  api/               auth, receipts/scan, assistant
actions/             server actions (auth, finance)
components/          ui primitives, forms, layout, dashboard charts, assistant
lib/                 prisma, data access, ollama client, ocr, formatting, constants
prisma/              schema + seed
```

---

## Tech

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind v4 · Prisma 6 · PostgreSQL 16 · Auth.js v5 · tesseract.js · Ollama · Recharts.

---

## Notes & limitations

- Receipt scanning accepts images (JPG/PNG), not PDFs.
- Transfers record one transaction on the source account and move the balance to the destination; deleting a transfer reverses the source side only.
- The assistant gives general budgeting guidance, not licensed financial advice.
- First receipt scan in a session is slower while `tesseract.js` initializes its worker.
