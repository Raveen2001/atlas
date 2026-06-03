import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IdeaCard } from "@/components/ideas/idea-card";
import { IdeaDialog } from "@/components/ideas/idea-dialog";
import { useIdeas } from "@/hooks/use-ideas";
import type { Idea, IdeaFormData } from "@/types/ideas";

export function IdeasPage() {
  const { ideas, loading, createIdea, updateIdea, deleteIdea, togglePin } =
    useIdeas();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);

  const handleSave = async (data: IdeaFormData) => {
    if (editingIdea) {
      await updateIdea(editingIdea.id, data);
    } else {
      await createIdea(data);
    }
  };

  const openCreate = () => {
    setEditingIdea(null);
    setDialogOpen(true);
  };

  const openEdit = (idea: Idea) => {
    setEditingIdea(idea);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const pinned = ideas.filter((i) => i.pinned);
  const unpinned = ideas.filter((i) => !i.pinned);

  return (
    <>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Ideas</h1>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            New Idea
          </Button>
        </div>

        {pinned.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Pinned
            </h2>
            <div className="space-y-2">
              {pinned.map((idea) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  onEdit={() => openEdit(idea)}
                  onTogglePin={() => togglePin(idea.id, false)}
                />
              ))}
            </div>
          </div>
        )}

        {unpinned.length > 0 && (
          <div className="space-y-3">
            {pinned.length > 0 && (
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                All
              </h2>
            )}
            <div className="space-y-2">
              {unpinned.map((idea) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  onEdit={() => openEdit(idea)}
                  onTogglePin={() => togglePin(idea.id, true)}
                />
              ))}
            </div>
          </div>
        )}

        {ideas.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm mb-4">
              No ideas yet. Capture what's on your mind.
            </p>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" />
              Jot down your first idea
            </Button>
          </div>
        )}
      </div>

      <IdeaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        idea={editingIdea}
        onSave={handleSave}
        onDelete={editingIdea ? deleteIdea : undefined}
      />
    </>
  );
}
