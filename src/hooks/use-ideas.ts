import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import * as api from "@/lib/ideas-api";
import type { Idea, IdeaFormData } from "@/types/ideas";

export function useIdeas() {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.fetchIdeas(user.id);
      setIdeas(data);
    } catch (e) {
      toast.error("Failed to load ideas");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const createIdea = useCallback(
    async (formData: IdeaFormData) => {
      if (!user) return;
      try {
        await api.createIdea(user.id, formData);
        await fetchAll();
        toast.success("Idea saved");
      } catch (e) {
        toast.error("Failed to save idea");
        console.error(e);
      }
    },
    [user, fetchAll],
  );

  const updateIdea = useCallback(
    async (ideaId: string, formData: IdeaFormData) => {
      if (!user) return;
      try {
        await api.updateIdea(ideaId, formData);
        await fetchAll();
        toast.success("Idea updated");
      } catch (e) {
        toast.error("Failed to update idea");
        console.error(e);
      }
    },
    [user, fetchAll],
  );

  const deleteIdea = useCallback(async (ideaId: string) => {
    try {
      await api.deleteIdea(ideaId);
      setIdeas((prev) => prev.filter((i) => i.id !== ideaId));
      toast.success("Idea deleted");
    } catch (e) {
      toast.error("Failed to delete idea");
      console.error(e);
    }
  }, []);

  const togglePin = useCallback(
    async (ideaId: string, pinned: boolean) => {
      setIdeas((prev) =>
        prev.map((i) => (i.id === ideaId ? { ...i, pinned } : i)),
      );
      try {
        await api.togglePin(ideaId, pinned);
        await fetchAll();
      } catch (e) {
        await fetchAll();
        toast.error("Failed to pin idea");
        console.error(e);
      }
    },
    [fetchAll],
  );

  return {
    ideas,
    loading,
    createIdea,
    updateIdea,
    deleteIdea,
    togglePin,
  };
}
