interface DateSeparatorProps {
  date: Date
}

export function DateSeparator({ date }: DateSeparatorProps) {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  let label = date.toLocaleDateString()
  if (date.toDateString() === today.toDateString()) {
    label = 'Today'
  } else if (date.toDateString() === yesterday.toDateString()) {
    label = 'Yesterday'
  }

  return (
    <div className="flex items-center justify-center my-4">
      <div className="px-3 py-1 bg-gray-200 rounded-full text-xs text-gray-600">
        {label}
      </div>
    </div>
  )
}
