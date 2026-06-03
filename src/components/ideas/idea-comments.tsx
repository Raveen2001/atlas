import { useState, useEffect, useCallback } from "react";
import { Send, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import * as api from "@/lib/ideas-api";
import type { IdeaComment } from "@/types/ideas";

interface IdeaCommentsProps {
  ideaId: string;
}

export function IdeaComments({ ideaId }: IdeaCommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<IdeaComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const data = await api.fetchIdeaComments(ideaId);
      setComments(data);
    } catch (e) {
      console.error(e);
    }
  }, [ideaId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSend = async () => {
    if (!newComment.trim() || !user) return;
    setSending(true);
    try {
      await api.addIdeaComment(ideaId, user.id, newComment.trim());
      setNewComment("");
      await fetchComments();
    } catch (e) {
      toast.error("Failed to add comment");
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await api.deleteIdeaComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (e) {
      toast.error("Failed to delete comment");
      console.error(e);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Comments
      </h3>

      {comments.length > 0 && (
        <div className="space-y-2">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="group flex gap-2 text-sm"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm">{comment.content}</p>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                  {formatDistanceToNow(new Date(comment.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(comment.id)}
                className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newComment.trim()) {
              e.preventDefault();
              handleSend();
            }
          }}
          className="text-sm"
        />
        <Button
          size="icon"
          variant="ghost"
          onClick={handleSend}
          disabled={!newComment.trim() || sending}
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
