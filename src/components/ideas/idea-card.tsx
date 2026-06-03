import { Pin, PinOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import type { Idea } from "@/types/ideas";

interface IdeaCardProps {
  idea: Idea;
  onEdit: () => void;
  onTogglePin: () => void;
}

export function IdeaCard({ idea, onEdit, onTogglePin }: IdeaCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="flex gap-3 p-3">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onEdit}>
          <p className="text-sm font-medium">{idea.title}</p>
          {idea.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {idea.description}
            </p>
          )}
          <p className="text-[11px] text-muted-foreground/60 mt-1.5">
            {formatDistanceToNow(new Date(idea.created_at), {
              addSuffix: true,
            })}
          </p>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin();
          }}
          className="shrink-0 self-start text-muted-foreground hover:text-foreground transition-colors"
        >
          {idea.pinned ? (
            <Pin className="h-4 w-4 text-primary" />
          ) : (
            <PinOff className="h-4 w-4" />
          )}
        </button>
      </div>
    </Card>
  );
}
