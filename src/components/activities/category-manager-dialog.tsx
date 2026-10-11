import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CategoryDialog } from "@/components/activities/category-dialog";
import { PRESET_CATEGORIES, RATING_OPTIONS } from "@/types/activities";
import type {
  CustomCategory,
  CustomCategoryFormData,
} from "@/types/activities";

interface CategoryManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  custom: CustomCategory[];
  onCreate: (data: CustomCategoryFormData) => Promise<unknown>;
  onUpdate: (categoryId: string, data: CustomCategoryFormData) => Promise<void>;
  onDelete: (categoryId: string) => Promise<void>;
}

const RATING_LABELS = Object.fromEntries(
  RATING_OPTIONS.map((r) => [r.value, r.label]),
);

export function CategoryManagerDialog({
  open,
  onOpenChange,
  custom,
  onCreate,
  onUpdate,
  onDelete,
}: CategoryManagerDialogProps) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<CustomCategory | null>(null);

  const openEditor = (category: CustomCategory | null) => {
    setEditing(category);
    setEditorOpen(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Categories</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Your categories
              </h3>
              <Button size="sm" variant="outline" onClick={() => openEditor(null)}>
                <Plus className="h-4 w-4 mr-1" />
                New
              </Button>
            </div>
            {custom.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No custom categories yet.
              </p>
            ) : (
              custom.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => openEditor(c)}
                  className="flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50"
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {RATING_LABELS[c.default_rating]}
                  </span>
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              ))
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Built-in
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_CATEGORIES.map((p) => (
                <span
                  key={p.value}
                  className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground"
                >
                  <p.icon className="h-3 w-3" style={{ color: p.color }} />
                  {p.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <CategoryDialog
          open={editorOpen}
          onOpenChange={setEditorOpen}
          category={editing}
          onSave={async (data) => {
            if (editing) {
              await onUpdate(editing.id, data);
            } else {
              await onCreate(data);
            }
          }}
          onDelete={editing ? onDelete : undefined}
        />
      </DialogContent>
    </Dialog>
  );
}
