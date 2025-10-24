import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <section className="rounded-3xl bg-gradient-to-br from-brand-50 via-white to-brand-100 px-6 py-20 text-center shadow-lg dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 dark:shadow-none md:px-16">
      <div className="mx-auto max-w-3xl space-y-6">
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-600 shadow-md dark:bg-slate-900 dark:text-brand-300">
          Litecoin Cloud Mining
        </span>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white md:text-5xl">
          Earn daily Litecoin rewards with automated cloud mining contracts.
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-300">
          Simple deposit and withdrawal flows, transparent mining packages, and an intuitive admin
          panel to keep everything under control.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild>
            <Link href="/register">Get Started</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
