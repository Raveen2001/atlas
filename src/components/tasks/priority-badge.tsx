import type { TaskPriority } from "@/types/tasks"

const config: Record<TaskPriority, { label: string; className: string }> = {
  high: {
    label: "High",
    className: "bg-red-100 text-red-700",
  },
  medium: {
    label: "Medium",
    className: "bg-amber-100 text-amber-700",
  },
  low: {
    label: "Low",
    className: "bg-gray-100 text-gray-600",
  },
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const { label, className } = config[priority]
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  )
}
