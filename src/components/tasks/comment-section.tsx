import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTaskComments } from "@/hooks/use-task-comments"

interface CommentSectionProps {
  taskId: string
}

export function CommentSection({ taskId }: CommentSectionProps) {
  const { comments, loading, addComment, deleteComment } =
    useTaskComments(taskId)
  const [content, setContent] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    await addComment(content.trim())
    setContent("")
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">Comments</h4>

      {loading && (
        <p className="text-xs text-muted-foreground">Loading...</p>
      )}

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="group flex items-start gap-2 rounded-md bg-muted/50 p-2"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm">{comment.content}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDistanceToNow(new Date(comment.created_at), {
                  addSuffix: true,
                })}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => deleteComment(comment.id)}
              className="opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        {!loading && comments.length === 0 && (
          <p className="text-xs text-muted-foreground">No comments yet</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          placeholder="Add a comment..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="h-8 text-sm"
        />
        <Button type="submit" size="sm" disabled={!content.trim()}>
          Add
        </Button>
      </form>
    </div>
  )
}
