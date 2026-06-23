import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-fg">
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" aria-hidden>
          <path
            d="M5 3.5h11.5A1.5 1.5 0 0 1 18 5v14a1.5 1.5 0 0 1-1.5 1.5H5z"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path d="M5 3.5v17" stroke="currentColor" strokeWidth="1.6" />
          <path d="M9 8.5h5M9 12h5M9 15.5h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </span>
      <span className="font-display text-xl font-semibold tracking-tight text-ink">HomeLedger</span>
    </Link>
  );
}
