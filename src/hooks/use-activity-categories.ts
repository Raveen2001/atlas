import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import * as api from "@/lib/activities-api";
import {
  PRESET_CATEGORIES,
  buildCategoryLookup,
  toCategoryOption,
} from "@/types/activities";
import type {
  CustomCategory,
  CustomCategoryFormData,
} from "@/types/activities";

export function useActivityCategories() {
  const { user } = useAuth();
  const [custom, setCustom] = useState<CustomCategory[]>([]);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    try {
      setCustom(await api.fetchCustomCategories(user.id));
    } catch (e) {
      toast.error("Failed to load categories");
      console.error(e);
    }
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const createCategory = useCallback(
    async (formData: CustomCategoryFormData) => {
      if (!user) return null;
      try {
        const created = await api.createCustomCategory(user.id, formData);
        setCustom((prev) => [...prev, created]);
        toast.success("Category created");
        return created;
      } catch (e) {
        toast.error("Failed to create category");
        console.error(e);
        return null;
      }
    },
    [user],
  );

  const updateCategory = useCallback(
    async (categoryId: string, formData: CustomCategoryFormData) => {
      try {
        await api.updateCustomCategory(categoryId, formData);
        await fetchAll();
        toast.success("Category updated");
      } catch (e) {
        toast.error("Failed to update category");
        console.error(e);
      }
    },
    [fetchAll],
  );

  const deleteCategory = useCallback(async (categoryId: string) => {
    try {
      await api.deleteCustomCategory(categoryId);
      setCustom((prev) => prev.filter((c) => c.id !== categoryId));
      toast.success("Category deleted");
    } catch (e) {
      toast.error("Failed to delete category");
      console.error(e);
    }
  }, []);

  const options = useMemo(
    () => [...PRESET_CATEGORIES, ...custom.map(toCategoryOption)],
    [custom],
  );
  const getCategory = useMemo(() => buildCategoryLookup(options), [options]);

  return {
    custom,
    options,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}
