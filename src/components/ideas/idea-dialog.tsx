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
import type { Idea, IdeaFormData } from "@/types/ideas";

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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (idea) {
      setTitle(idea.title);
      setDescription(idea.description ?? "");
    } else {
      setTitle("");
      setDescription("");
    }
  }, [idea, open]);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave({ title: title.trim(), description: description.trim() });
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
