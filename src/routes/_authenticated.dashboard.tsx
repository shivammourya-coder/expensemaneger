import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TransactionDialog } from "@/components/transaction-dialog";
import { inr, firstOfMonth } from "@/lib/format";
import { getCategoryDef } from "@/lib/categories";
import {
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  TrendingUp,
  Wallet,
  PiggyBank,
  AlertTriangle,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Paisa" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const [addOpen, setAddOpen] = useState(false);

  const { data: txns = [] } = useQuery({
    queryKey: ["dashboard", "transactions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("occurred_on", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: budget } = useQuery({
    queryKey: ["dashboard", "budget", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .eq("month", firstOfMonth())
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const stats = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    let income = 0;
    let expense = 0;
    let monthExpense = 0;
    for (const t of txns) {
      const d = new Date(t.occurred_on);
      const amt = Number(t.amount);
      if (t.kind === "income") income += amt;
      else expense += amt;
      if (d.getFullYear() === y && d.getMonth() === m && t.kind === "expense") {
        monthExpense += amt;
      }
    }
    return { income, expense, monthExpense, balance: income - expense };
  }, [txns]);

  const budgetAmount = Number(budget?.amount ?? 0);
  const budgetPct = budgetAmount > 0 ? Math.min(100, (stats.monthExpense / budgetAmount) * 100) : 0;
  const budgetWarn = budgetAmount > 0 && budgetPct >= 80 && budgetPct < 100;
  const budgetOver = budgetAmount > 0 && stats.monthExpense >= budgetAmount;

  const recent = txns.slice(0, 8);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Quick add
        </Button>
        <TransactionDialog open={addOpen} onOpenChange={setAddOpen} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Balance" value={inr(stats.balance)} icon={Wallet} />
        <StatCard
          label="Income"
          value={inr(stats.income)}
          icon={ArrowUpRight}
          tint="text-emerald-500"
        />
        <StatCard
          label="Expenses"
          value={inr(stats.expense)}
          icon={ArrowDownRight}
          tint="text-rose-500"
        />
        <StatCard
          label="Savings"
          value={inr(Math.max(0, stats.income - stats.expense))}
          icon={TrendingUp}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <PiggyBank className="h-4 w-4" /> Monthly budget
            </CardTitle>
            {budgetAmount > 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {inr(stats.monthExpense)} of {inr(budgetAmount)} spent this month
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">
                No budget set for this month yet.
              </p>
            )}
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/budgets">Manage</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {budgetAmount > 0 && (
            <>
              <Progress value={budgetPct} className="h-2" />
              {(budgetWarn || budgetOver) && (
                <div
                  className={`mt-3 flex items-center gap-2 rounded-md border p-2 text-xs ${
                    budgetOver
                      ? "border-destructive/40 bg-destructive/10 text-destructive"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  }`}
                >
                  <AlertTriangle className="h-4 w-4" />
                  {budgetOver
                    ? "You have reached your monthly budget."
                    : "You have used over 80% of this month's budget."}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent transactions</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link to="/transactions">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No transactions yet. Click "Quick add" to get started.
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {recent.map((t) => {
                const def = getCategoryDef(t.category);
                const Icon = def.icon;
                return (
                  <li key={t.id} className="flex items-center gap-3 py-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{ backgroundColor: def.color + "22", color: def.color }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{t.category}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.note || "—"} · {new Date(t.occurred_on).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        t.kind === "income" ? "text-emerald-500" : "text-rose-500"
                      }`}
                    >
                      {t.kind === "income" ? "+" : "−"}
                      {inr(Number(t.amount))}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tint,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tint?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg bg-accent ${tint ?? "text-primary"}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}