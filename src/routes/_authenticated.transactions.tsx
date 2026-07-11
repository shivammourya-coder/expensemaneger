import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { DEFAULT_CATEGORIES, getCategoryDef } from "@/lib/categories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Download, FileText, Search } from "lucide-react";
import { TransactionDialog, type EditingTxn } from "@/components/transaction-dialog";
import { inr } from "@/lib/format";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const Route = createFileRoute("/_authenticated/transactions")({
  head: () => ({ meta: [{ title: "Transactions — Paisa" }] }),
  component: TransactionsPage,
});

type Sort = "newest" | "oldest" | "highest" | "lowest";

function TransactionsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState<Sort>("newest");
  const [editing, setEditing] = useState<EditingTxn | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const { data: txns = [] } = useQuery({
    queryKey: ["transactions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("transactions").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: customCats = [] } = useQuery({
    queryKey: ["categories", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("name");
      if (error) throw error;
      return data;
    },
  });

  const allCategoryNames = useMemo(
    () => [...new Set([...DEFAULT_CATEGORIES.map((c) => c.name), ...customCats.map((c) => c.name)])],
    [customCats],
  );

  const filtered = useMemo(() => {
    let list = txns.slice();
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter(
        (t) =>
          t.category.toLowerCase().includes(s) ||
          (t.note ?? "").toLowerCase().includes(s),
      );
    }
    if (cat !== "all") list = list.filter((t) => t.category === cat);
    if (from) list = list.filter((t) => t.occurred_on >= from);
    if (to) list = list.filter((t) => t.occurred_on <= to);
    list.sort((a, b) => {
      if (sort === "newest") return b.occurred_on.localeCompare(a.occurred_on);
      if (sort === "oldest") return a.occurred_on.localeCompare(b.occurred_on);
      if (sort === "highest") return Number(b.amount) - Number(a.amount);
      return Number(a.amount) - Number(b.amount);
    });
    return list;
  }, [txns, q, cat, from, to, sort]);

  const del = async (id: string) => {
    if (!confirm("Delete this transaction?")) return;
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["transactions"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const exportCSV = () => {
    const rows = [
      ["Date", "Type", "Category", "Amount", "Note"],
      ...filtered.map((t) => [
        t.occurred_on,
        t.kind,
        t.category,
        String(t.amount),
        (t.note ?? "").replace(/\n/g, " "),
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Paisa — Transactions", 14, 16);
    doc.setFontSize(10);
    doc.text(`Exported ${new Date().toLocaleString()}`, 14, 22);
    autoTable(doc, {
      startY: 28,
      head: [["Date", "Type", "Category", "Amount (INR)", "Note"]],
      body: filtered.map((t) => [
        t.occurred_on,
        t.kind,
        t.category,
        Number(t.amount).toFixed(2),
        t.note ?? "",
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [16, 185, 129] },
    });
    doc.save(`transactions-${Date.now()}.pdf`);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} of {txns.length} transactions
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportPDF} className="gap-2">
            <FileText className="h-4 w-4" /> PDF
          </Button>
          <Button onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> New
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-5">
            <div className="relative md:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search category or note"
                className="pl-9"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Select value={cat} onValueChange={setCat}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {allCategoryNames.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
              <SelectTrigger className="md:col-span-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Sort: Newest first</SelectItem>
                <SelectItem value="oldest">Sort: Oldest first</SelectItem>
                <SelectItem value="highest">Sort: Highest amount</SelectItem>
                <SelectItem value="lowest">Sort: Lowest amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    No transactions match your filters.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((t) => {
                const def = getCategoryDef(t.category);
                const Icon = def.icon;
                return (
                  <TableRow key={t.id}>
                    <TableCell>{new Date(t.occurred_on).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="flex h-7 w-7 items-center justify-center rounded-md"
                          style={{ backgroundColor: def.color + "22", color: def.color }}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <span>{t.category}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[240px] truncate text-muted-foreground">
                      {t.note || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.kind === "income" ? "default" : "secondary"}>
                        {t.kind}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        t.kind === "income" ? "text-emerald-500" : "text-rose-500"
                      }`}
                    >
                      {t.kind === "income" ? "+" : "−"}
                      {inr(Number(t.amount))}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            setEditing({
                              id: t.id,
                              amount: Number(t.amount),
                              kind: t.kind,
                              category: t.category,
                              occurred_on: t.occurred_on,
                              note: t.note,
                            })
                          }
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => del(t.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <TransactionDialog open={addOpen} onOpenChange={setAddOpen} />
      <TransactionDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        editing={editing}
      />
    </div>
  );
}