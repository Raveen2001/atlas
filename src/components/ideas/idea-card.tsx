import { Pin, PinOff, ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import type { Idea } from "@/types/ideas";
import { STATUS_CONFIG } from "@/types/ideas";

interface IdeaCardProps {
  idea: Idea;
  onEdit: () => void;
  onTogglePin: () => void;
  expanded: boolean;
  onExpand: () => void;
}

export function IdeaCard({
  idea,
  onEdit,
  onTogglePin,
  expanded,
  onExpand,
}: IdeaCardProps) {
  const statusConfig = STATUS_CONFIG[idea.status];

  return (
    <Card className="overflow-hidden">
      <div className="flex gap-3 p-3">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onExpand}>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">{idea.title}</p>
            <span
              className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-white ${statusConfig.color}`}
            >
              {statusConfig.label}
            </span>
          </div>
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

        <div className="flex flex-col items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin();
            }}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {idea.pinned ? (
              <Pin className="h-4 w-4 text-primary" />
            ) : (
              <PinOff className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onExpand}
            className="text-muted-foreground hover:text-foreground"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </Card>
  );
}
