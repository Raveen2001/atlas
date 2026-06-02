import { X } from "lucide-react"
import { getTagStyle } from "@/lib/tag-colors"

interface TagBadgeProps {
  name: string
  color: string
  onRemove?: () => void
}

export function TagBadge({ name, color, onRemove }: TagBadgeProps) {
  const style = getTagStyle(color)

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {name}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="hover:opacity-70"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  )
}
