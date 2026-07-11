import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { inr, firstOfMonth } from "@/lib/format";
import { toast } from "sonner";
import { AlertTriangle, PiggyBank } from "lucide-react";

export const Route = createFileRoute("/_authenticated/budgets")({
  head: () => ({ meta: [{ title: "Budgets — Paisa" }] }),
  component: BudgetsPage,
});

function BudgetsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const month = firstOfMonth();
  const [amount, setAmount] = useState("");

  const { data: budget } = useQuery({
    queryKey: ["budget", user?.id, month],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .eq("month", month)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: txns = [] } = useQuery({
    queryKey: ["budget-txns", user?.id, month],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("amount,kind,occurred_on")
        .gte("occurred_on", month);
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (budget) setAmount(String(budget.amount));
  }, [budget]);

  const spent = txns
    .filter((t) => t.kind === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const target = Number(budget?.amount ?? 0);
  const pct = target > 0 ? Math.min(100, (spent / target) * 100) : 0;

  const save = async () => {
    if (!user) return;
    const n = Number(amount);
    if (!n || n <= 0) return toast.error("Enter a positive amount");
    const { error } = await supabase
      .from("budgets")
      .upsert(
        { user_id: user.id, month, amount: n },
        { onConflict: "user_id,month" },
      );
    if (error) return toast.error(error.message);
    toast.success("Budget saved");
    qc.invalidateQueries({ queryKey: ["budget"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Budgets</h1>
        <p className="text-sm text-muted-foreground">
          Set your monthly spending cap. We'll warn you at 80% and 100%.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PiggyBank className="h-4 w-4" />
            {new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="grid gap-1.5">
              <Label htmlFor="amt">Monthly budget (₹)</Label>
              <Input
                id="amt"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 25000"
              />
            </div>
            <Button onClick={save}>Save</Button>
          </div>

          {target > 0 && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Spent this month</span>
                  <span className="font-medium">
                    {inr(spent)} / {inr(target)}
                  </span>
                </div>
                <Progress value={pct} className="h-2" />
                <p className="text-xs text-muted-foreground">{pct.toFixed(0)}% used</p>
              </div>
              {pct >= 100 ? (
                <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4" /> You've reached your monthly budget.
                </div>
              ) : pct >= 80 ? (
                <div className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4" /> You've used over 80% of your budget.
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}