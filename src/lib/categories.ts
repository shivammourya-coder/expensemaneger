import {
  UtensilsCrossed,
  ShoppingBag,
  Plane,
  Receipt,
  Film,
  GraduationCap,
  HeartPulse,
  Wallet,
  Briefcase,
  Tag,
  type LucideIcon,
} from "lucide-react";

export type CategoryKind = "income" | "expense";

export type CategoryDef = {
  name: string;
  kind: CategoryKind;
  icon: LucideIcon;
  color: string;
};

export const DEFAULT_CATEGORIES: CategoryDef[] = [
  { name: "Food", kind: "expense", icon: UtensilsCrossed, color: "#f97316" },
  { name: "Shopping", kind: "expense", icon: ShoppingBag, color: "#ec4899" },
  { name: "Travel", kind: "expense", icon: Plane, color: "#3b82f6" },
  { name: "Bills", kind: "expense", icon: Receipt, color: "#ef4444" },
  { name: "Entertainment", kind: "expense", icon: Film, color: "#a855f7" },
  { name: "Education", kind: "expense", icon: GraduationCap, color: "#0ea5e9" },
  { name: "Health", kind: "expense", icon: HeartPulse, color: "#14b8a6" },
  { name: "Other", kind: "expense", icon: Tag, color: "#64748b" },
  { name: "Salary", kind: "income", icon: Wallet, color: "#10b981" },
  { name: "Freelancing", kind: "income", icon: Briefcase, color: "#22c55e" },
];

export function getCategoryDef(name: string): CategoryDef {
  return (
    DEFAULT_CATEGORIES.find((c) => c.name === name) ?? {
      name,
      kind: "expense",
      icon: Tag,
      color: "#64748b",
    }
  );
}