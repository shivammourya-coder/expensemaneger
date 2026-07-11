import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { DEFAULT_CATEGORIES } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

const schema = z.object({
  amount: z.number().positive("Amount must be greater than zero"),
  kind: z.enum(["income", "expense"]),
  category: z.string().min(1, "Pick a category"),
  occurred_on: z.string().min(1, "Pick a date"),
  note: z.string().max(500).optional().nullable(),
});

export type EditingTxn = {
  id: string;
  amount: number;
  kind: "income" | "expense";
  category: string;
  occurred_on: string;
  note: string | null;
};

export function TransactionDialog({
  trigger,
  editing,
  onDone,
  open,
  onOpenChange,
}: {
  trigger?: ReactNode;
  editing?: EditingTxn | null;
  onDone?: () => void;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setOpen = (o: boolean) => (isControlled ? onOpenChange?.(o) : setInternalOpen(o));

  const [kind, setKind] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [occurredOn, setOccurredOn] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: customCats = [] } = useQuery({
    queryKey: ["categories", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("name,kind")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (editing) {
      setKind(editing.kind);
      setAmount(String(editing.amount));
      setCategory(editing.category);
      setOccurredOn(editing.occurred_on);
      setNote(editing.note ?? "");
    } else if (isOpen) {
      setKind("expense");
      setAmount("");
      setCategory("");
      setOccurredOn(new Date().toISOString().slice(0, 10));
      setNote("");
    }
  }, [editing, isOpen]);

  const categoriesForKind = [
    ...DEFAULT_CATEGORIES.filter((c) => c.kind === kind).map((c) => c.name),
    ...customCats.filter((c) => c.kind === kind).map((c) => c.name),
  ];

  const submit = async () => {
    if (!user) return;
    const parsed = schema.safeParse({
      amount: Number(amount),
      kind,
      category,
      occurred_on: occurredOn,
      note: note || null,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check your inputs");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase
          .from("transactions")
          .update(parsed.data)
          .eq("id", editing.id);
        if (error) throw error;
        toast.success("Transaction updated");
      } else {
        const { error } = await supabase
          .from("transactions")
          .insert({ ...parsed.data, user_id: user.id });
        if (error) throw error;
        toast.success("Transaction added");
      }
      await qc.invalidateQueries({ queryKey: ["transactions"] });
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
      setOpen(false);
      onDone?.();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit transaction" : "New transaction"}</DialogTitle>
          <DialogDescription>
            Record your income or expense to keep your finances up to date.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Tabs value={kind} onValueChange={(v) => setKind(v as "income" | "expense")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="expense">Expense</TabsTrigger>
              <TabsTrigger value="income">Income</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="grid gap-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {categoriesForKind.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={occurredOn}
              onChange={(e) => setOccurredOn(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="What was this for?"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : editing ? "Save changes" : "Add transaction"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}