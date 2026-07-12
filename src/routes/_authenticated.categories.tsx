import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { DEFAULT_CATEGORIES, getCategoryDef } from "@/lib/categories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Tag } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/categories")({
  head: () => ({ meta: [{ title: "Categories — Expenses Manager" }] }),
  component: CategoriesPage,
});

const COLORS = ["#10b981", "#3b82f6", "#f97316", "#ec4899", "#a855f7", "#14b8a6", "#ef4444", "#eab308"];

function CategoriesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"income" | "expense">("expense");
  const [color, setColor] = useState(COLORS[0]);

  const { data: custom = [] } = useQuery({
    queryKey: ["categories", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const add = async () => {
    if (!user) return;
    const clean = name.trim();
    if (!clean) return toast.error("Name is required");
    if (clean.length > 40) return toast.error("Name too long");
    const { error } = await supabase
      .from("categories")
      .insert({ user_id: user.id, name: clean, kind, color });
    if (error) return toast.error(error.message);
    toast.success("Category added");
    setName("");
    qc.invalidateQueries({ queryKey: ["categories"] });
  };

  const del = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["categories"] });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
        <p className="text-sm text-muted-foreground">
          Add your own categories on top of the built-in ones.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add custom category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-[1fr_140px_140px_auto] sm:items-end">
            <div className="grid gap-1.5">
              <Label htmlFor="cname">Name</Label>
              <Input
                id="cname"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Gym"
                maxLength={40}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Type</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as "income" | "expense")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-1">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    aria-label={`Pick ${c}`}
                    className={`h-6 w-6 rounded-full ring-offset-2 ring-offset-background transition ${color === c ? "ring-2 ring-primary" : ""}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <Button onClick={add}>Add</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Default</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {DEFAULT_CATEGORIES.map((c) => (
              <Row key={c.name} color={c.color} name={c.name} kind={c.kind} Icon={c.icon} />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Custom</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {custom.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                You haven't added any custom categories.
              </p>
            )}
            {custom.map((c) => {
              const def = getCategoryDef(c.name);
              return (
                <Row
                  key={c.id}
                  color={c.color ?? "#10b981"}
                  name={c.name}
                  kind={c.kind}
                  Icon={def.icon || Tag}
                  onDelete={() => del(c.id)}
                />
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({
  color,
  name,
  kind,
  Icon,
  onDelete,
}: {
  color: string;
  name: string;
  kind: "income" | "expense";
  Icon: React.ComponentType<{ className?: string }>;
  onDelete?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/60 p-2">
      <div
        className="flex h-8 w-8 items-center justify-center rounded-md"
        style={{ backgroundColor: color + "22", color }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs text-muted-foreground capitalize">{kind}</p>
      </div>
      {onDelete && (
        <Button size="icon" variant="ghost" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}