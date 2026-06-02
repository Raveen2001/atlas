import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { TagBadge } from "./tag-badge"
import type { Tag } from "@/types/tasks"

interface TagInputProps {
  selectedIds: string[]
  onChange: (ids: string[]) => void
  tags: Tag[]
  onCreateTag: (name: string) => Promise<Tag | null>
}

export function TagInput({
  selectedIds,
  onChange,
  tags,
  onCreateTag,
}: TagInputProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const filtered = tags.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()),
  )
  const exactMatch = tags.some(
    (t) => t.name.toLowerCase() === search.trim().toLowerCase(),
  )
  const selectedTags = tags.filter((t) => selectedIds.includes(t.id))

  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((i) => i !== id)
        : [...selectedIds, id],
    )
  }

  const handleCreate = async () => {
    if (!search.trim()) return
    const tag = await onCreateTag(search.trim())
    if (tag) {
      onChange([...selectedIds, tag.id])
      setSearch("")
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {selectedTags.map((tag) => (
          <TagBadge
            key={tag.id}
            name={tag.name}
            color={tag.color}
            onRemove={() => toggle(tag.id)}
          />
        ))}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={<Button variant="ghost" size="xs" />}
          >
            <Plus className="h-3 w-3 mr-1" />
            Tag
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="start">
            <Input
              placeholder="Search or create..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-2 h-8 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && search.trim() && !exactMatch) {
                  e.preventDefault()
                  handleCreate()
                }
              }}
            />
            <div className="max-h-32 overflow-y-auto space-y-0.5">
              {filtered.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggle(tag.id)}
                  className={`flex w-full items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted ${
                    selectedIds.includes(tag.id) ? "bg-muted" : ""
                  }`}
                >
                  <TagBadge name={tag.name} color={tag.color} />
                </button>
              ))}
              {search.trim() && !exactMatch && (
                <button
                  type="button"
                  onClick={handleCreate}
                  className="flex w-full items-center gap-2 rounded px-2 py-1 text-sm text-muted-foreground hover:bg-muted"
                >
                  <Plus className="h-3 w-3" />
                  Create "{search.trim()}"
                </button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
