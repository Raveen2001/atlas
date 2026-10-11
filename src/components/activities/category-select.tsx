import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryDialog } from "@/components/activities/category-dialog";
import type {
  ActivityCategory,
  CategoryOption,
  CustomCategory,
  CustomCategoryFormData,
} from "@/types/activities";

const NEW_CATEGORY = "__new__";

interface CategorySelectProps {
  value: ActivityCategory;
  options: CategoryOption[];
  onChange: (value: ActivityCategory) => void;
  onCreateCategory: (
    data: CustomCategoryFormData,
  ) => Promise<CustomCategory | null>;
  className?: string;
}

export function CategorySelect({
  value,
  options,
  onChange,
  onCreateCategory,
  className,
}: CategorySelectProps) {
  const [creating, setCreating] = useState(false);

  const labels = useMemo(
    () => ({
      ...Object.fromEntries(options.map((o) => [o.value, o.label])),
      [NEW_CATEGORY]: "New category…",
    }),
    [options],
  );

  return (
    <>
      <Select
        value={value}
        items={labels}
        onValueChange={(v) => {
          if (v === NEW_CATEGORY) {
            setCreating(true);
          } else if (v) {
            onChange(v as ActivityCategory);
          }
        }}
      >
        <SelectTrigger className={className}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              <opt.icon className="h-4 w-4" style={{ color: opt.color }} />
              {opt.label}
            </SelectItem>
          ))}
          <SelectSeparator />
          <SelectItem value={NEW_CATEGORY}>
            <Plus className="h-4 w-4" />
            New category…
          </SelectItem>
        </SelectContent>
      </Select>

      <CategoryDialog
        open={creating}
        onOpenChange={setCreating}
        category={null}
        onSave={async (data) => {
          const created = await onCreateCategory(data);
          if (created) onChange(created.id);
        }}
      />
    </>
  );
}
