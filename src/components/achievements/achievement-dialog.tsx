import { useState, useEffect, useRef } from "react"
import { format } from "date-fns"
import { CalendarIcon, Trash2, Upload, X, Play, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useAuth } from "@/hooks/use-auth"
import {
  uploadAchievementMedia,
  deleteAchievementMedia,
} from "@/lib/achievements-api"
import type {
  Achievement,
  AchievementFormData,
  AchievementMedia,
} from "@/types/achievements"

interface AchievementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  achievement: Achievement | null
  onSave: (data: AchievementFormData) => Promise<void>
  onDelete?: (achievement: Achievement) => Promise<void>
}

const MAX_FILE_BYTES = 50 * 1024 * 1024 // 50 MB

export function AchievementDialog({
  open,
  onOpenChange,
  achievement,
  onSave,
  onDelete,
}: AchievementDialogProps) {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [achievedDate, setAchievedDate] = useState<Date>(new Date())
  const [media, setMedia] = useState<AchievementMedia[]>([])
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Track media added in THIS edit session so we can clean up if the user cancels
  const sessionUploadsRef = useRef<AchievementMedia[]>([])
  // Track media the user removed so we can delete from storage on save
  const removedRef = useRef<AchievementMedia[]>([])

  useEffect(() => {
    if (!open) return
    sessionUploadsRef.current = []
    removedRef.current = []
    if (achievement) {
      setTitle(achievement.title)
      setDescription(achievement.description ?? "")
      setAchievedDate(new Date(`${achievement.achieved_date}T00:00:00`))
      setMedia(achievement.media)
    } else {
      setTitle("")
      setDescription("")
      setAchievedDate(new Date())
      setMedia([])
    }
  }, [achievement, open])

  const handleFiles = async (files: FileList | null) => {
    if (!files || !user) return
    setUploading(true)
    try {
      const uploads = await Promise.all(
        Array.from(files).map(async (file) => {
          if (file.size > MAX_FILE_BYTES) {
            toast.error(`${file.name} is over 50MB`)
            return null
          }
          if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
            toast.error(`${file.name} is not an image or video`)
            return null
          }
          try {
            return await uploadAchievementMedia(user.id, file)
          } catch (e) {
            console.error(e)
            toast.error(`Failed to upload ${file.name}`)
            return null
          }
        }),
      )
      const ok = uploads.filter((m): m is AchievementMedia => m !== null)
      sessionUploadsRef.current.push(...ok)
      setMedia((prev) => [...prev, ...ok])
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleRemoveMedia = (m: AchievementMedia) => {
    setMedia((prev) => prev.filter((x) => x.path !== m.path))
    // If this item was uploaded in this session, drop it from session uploads;
    // it's safe to delete immediately since it never persisted.
    const wasSession = sessionUploadsRef.current.find((u) => u.path === m.path)
    if (wasSession) {
      sessionUploadsRef.current = sessionUploadsRef.current.filter(
        (u) => u.path !== m.path,
      )
      deleteAchievementMedia([m.path]).catch((e) => console.error(e))
    } else {
      removedRef.current.push(m)
    }
  }

  const handleCancel = () => {
    // Discard uploads added this session
    const orphans = sessionUploadsRef.current.map((m) => m.path)
    if (orphans.length > 0) {
      deleteAchievementMedia(orphans).catch((e) => console.error(e))
    }
    onOpenChange(false)
  }

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        achieved_date: format(achievedDate, "yyyy-MM-dd"),
        media,
      })
      // Persisted — now safely delete media the user removed
      const toRemove = removedRef.current.map((m) => m.path)
      if (toRemove.length > 0) {
        deleteAchievementMedia(toRemove).catch((e) => console.error(e))
      }
      sessionUploadsRef.current = []
      removedRef.current = []
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!achievement || !onDelete) return
    await onDelete(achievement)
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleCancel()
        else onOpenChange(o)
      }}
    >
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {achievement ? "Edit Achievement" : "New Achievement"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Title</label>
            <Input
              placeholder="What did you achieve?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Details</label>
            <Textarea
              placeholder="The story, the feeling, the why..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Date</label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    className="w-full justify-start font-normal"
                  />
                }
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(achievedDate, "PPP")}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={achievedDate}
                  onSelect={(date) => {
                    if (date) setAchievedDate(date)
                    setCalendarOpen(false)
                  }}
                  disabled={{ after: new Date() }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Photos &amp; Videos</label>

            {media.length > 0 && (
              <div className="grid grid-cols-3 gap-1.5">
                {media.map((m) => (
                  <div
                    key={m.path}
                    className="relative aspect-square overflow-hidden rounded-md bg-muted"
                  >
                    {m.type === "image" ? (
                      <img
                        src={m.url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <>
                        <video
                          src={m.url}
                          className="h-full w-full object-cover"
                          preload="metadata"
                          muted
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                          <Play className="h-5 w-5 text-white fill-white" />
                        </div>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia(m)}
                      className="absolute top-1 right-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-1" />
                  Add photos or videos
                </>
              )}
            </Button>
            <p className="text-[11px] text-muted-foreground">
              Up to 50MB per file
            </p>
          </div>
        </div>

        <DialogFooter>
          {achievement && onDelete && (
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
            disabled={!title.trim() || saving || uploading}
            size="sm"
          >
            {saving ? "Saving..." : achievement ? "Update" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
