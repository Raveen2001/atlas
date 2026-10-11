import { useState, useEffect } from "react";
import { Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { CUSTOM_CATEGORY_COLORS, RATING_OPTIONS } from "@/types/activities";
import type {
  ActivityRating,
  CustomCategory,
  CustomCategoryFormData,
} from "@/types/activities";

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: CustomCategory | null;
  onSave: (data: CustomCategoryFormData) => Promise<void>;
  onDelete?: (categoryId: string) => Promise<void>;
}

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  onSave,
  onDelete,
}: CategoryDialogProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(CUSTOM_CATEGORY_COLORS[0]);
  const [rating, setRating] = useState<ActivityRating>("neutral");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(category?.name ?? "");
    setColor(category?.color ?? CUSTOM_CATEGORY_COLORS[0]);
    setRating(category?.default_rating ?? "neutral");
  }, [category, open]);

  const canSave = name.trim().length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await onSave({ name: name.trim(), color, default_rating: rating });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!category || !onDelete) return;
    if (
      !confirm(
        `Delete "${category.name}"? Activities in it will move to Other.`,
      )
    ) {
      return;
    }
    await onDelete(category.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{category ? "Edit category" : "New category"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Name</label>
            <Input
              placeholder="e.g., Side project, Reading, Gaming"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Color</label>
            <div className="flex flex-wrap gap-2">
              {CUSTOM_CATEGORY_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="flex h-7 w-7 items-center justify-center rounded-full transition-shadow"
                  style={{
                    backgroundColor: c,
                    boxShadow:
                      color === c
                        ? `0 0 0 2px var(--background), 0 0 0 4px ${c}`
                        : undefined,
                  }}
                  aria-label={`Color ${c}`}
                >
                  {color === c && <Check className="h-3.5 w-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Usually counts as</label>
            <SegmentedControl
              options={RATING_OPTIONS}
              value={rating}
              onChange={setRating}
            />
          </div>
        </div>

        <DialogFooter>
          {category && onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="mr-auto"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          )}
          <Button onClick={handleSave} disabled={!canSave} size="sm">
            {saving ? "Saving..." : category ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
