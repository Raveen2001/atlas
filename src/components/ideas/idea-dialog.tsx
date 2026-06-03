import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Idea, IdeaFormData, IdeaStatus } from "@/types/ideas";
import { STATUS_CONFIG, IDEA_STATUSES } from "@/types/ideas";

interface IdeaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  idea: Idea | null;
  onSave: (data: IdeaFormData) => Promise<void>;
  onDelete?: (ideaId: string) => Promise<void>;
}

export function IdeaDialog({
  open,
  onOpenChange,
  idea,
  onSave,
  onDelete,
}: IdeaDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<IdeaStatus>("new");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (idea) {
      setTitle(idea.title);
      setDescription(idea.description ?? "");
      setStatus(idea.status);
    } else {
      setTitle("");
      setDescription("");
      setStatus("new");
    }
  }, [idea, open]);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        status,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!idea || !onDelete) return;
    await onDelete(idea.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{idea ? "Edit Idea" : "New Idea"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Title</label>
            <Input
              placeholder="What's on your mind?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && title.trim()) {
                  e.preventDefault();
                  handleSave();
                }
              }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Details</label>
            <Textarea
              placeholder="Expand on the idea..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Status</label>
            <div className="flex flex-wrap gap-2">
              {IDEA_STATUSES.map((s) => {
                const config = STATUS_CONFIG[s];
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      status === s
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${config.color}`}
                    />
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          {idea && onDelete && (
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
          <Button
            onClick={handleSave}
            disabled={!title.trim() || saving}
            size="sm"
          >
            {saving ? "Saving..." : idea ? "Update" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
