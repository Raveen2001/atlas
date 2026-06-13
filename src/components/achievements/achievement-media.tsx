import { useState } from "react"
import { X, Play } from "lucide-react"
import type { AchievementMedia } from "@/types/achievements"

interface AchievementMediaGridProps {
  media: AchievementMedia[]
}

export function AchievementMediaGrid({ media }: AchievementMediaGridProps) {
  const [lightbox, setLightbox] = useState<AchievementMedia | null>(null)

  if (media.length === 0) return null

  return (
    <>
      <div className="grid grid-cols-3 gap-1.5">
        {media.map((m) => (
          <button
            key={m.path}
            type="button"
            onClick={() => setLightbox(m)}
            className="relative aspect-square overflow-hidden rounded-md bg-muted hover:opacity-90 transition-opacity"
          >
            {m.type === "image" ? (
              <img
                src={m.url}
                alt=""
                loading="lazy"
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
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Play className="h-5 w-5 text-white fill-white" />
                </div>
              </>
            )}
          </button>
        ))}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white"
            onClick={() => setLightbox(null)}
          >
            <X className="h-6 w-6" />
          </button>
          <div
            className="max-h-full max-w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {lightbox.type === "image" ? (
              <img
                src={lightbox.url}
                alt=""
                className="max-h-[90vh] max-w-full object-contain"
              />
            ) : (
              <video
                src={lightbox.url}
                controls
                autoPlay
                className="max-h-[90vh] max-w-full"
              />
            )}
          </div>
        </div>
      )}
    </>
  )
}
