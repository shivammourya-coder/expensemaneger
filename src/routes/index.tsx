import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Wallet,
  PiggyBank,
  BarChart3,
  Tags,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/site-footer";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg text-primary-foreground"
            style={{ background: "var(--gradient-brand)" }}
          >
            <Wallet className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Expenses Manager</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost">
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button asChild>
            <Link to="/auth">Get started</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-6 pt-12 pb-24 md:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              Smart personal finance, quietly powerful
            </span>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight md:text-6xl">
              Track every rupee.{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "var(--gradient-brand)" }}
              >
                Stay in control.
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
              Expenses Manager is a clean, modern expense tracker for students and professionals.
              Log transactions, set budgets, watch analytics update in real time — and
              export whenever you need.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link to="/auth">
                  Start tracking free <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#features">See features</a>
              </Button>
            </div>
          </div>

          <div
            className="mx-auto mt-16 grid max-w-5xl gap-4 rounded-2xl border border-border bg-card/60 p-6 shadow-[var(--shadow-soft)] backdrop-blur md:grid-cols-3"
            id="features"
          >
            {[
              {
                icon: BarChart3,
                title: "Live analytics",
                desc: "Monthly bar chart, category pie chart, income vs expense, weekly trends.",
              },
              {
                icon: PiggyBank,
                title: "Smart budgets",
                desc: "Set a monthly budget and get warnings at 80% and 100% usage.",
              },
              {
                icon: Tags,
                title: "Rich categories",
                desc: "10 built-in categories plus your own custom ones with colors.",
              },
              {
                icon: ShieldCheck,
                title: "Private by default",
                desc: "Row-level security means only you can see your data.",
              },
              {
                icon: Wallet,
                title: "Fast entry",
                desc: "Quick-add drawer, keyboard-friendly, works on mobile.",
              },
              {
                icon: ArrowRight,
                title: "Export anywhere",
                desc: "One-click CSV or PDF for taxes, reports and spreadsheets.",
              },
            ].map((f) => (
              <div key={f.title} className="rounded-xl border border-border/60 bg-background/40 p-5">
                <f.icon className="h-5 w-5 text-primary" />
                <h3 className="mt-3 text-sm font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
